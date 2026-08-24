package com.trackzio.birds;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

import org.json.JSONException;
import org.json.JSONObject;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Meta Install Referrer via Facebook / Instagram / Facebook Lite ContentProviders.
 *
 * <p>Requires {@link BuildConfig#META_INSTALL_REFERRER_DECRYPTION_KEY} (64 hex chars from Meta App
 * Dashboard). Returns {@code null} when the provider has no Meta payload (Play/URL referrers,
 * or JSON without {@code utm_content.source.data+nonce}). Success maps include only Meta fields and
 * {@code decryptedCampaignJson} (Meta-only, no Play strings). Resolves a map with {@code error_reason}
 * only for missing key, decrypt failure, or unexpected errors.
 *
 * <p>Work runs off the UI thread to avoid ANR if {@link android.content.ContentResolver#query} is
 * slow. Meta documents minimum client app versions; we skip the provider if the installed app is
 * older than those majors (parsed from {@link PackageInfo#versionName} first segment).
 *
 * <p>See Meta docs: Meta Install Referrer (direct integration).
 */
public class MetaInstallReferrerModule extends ReactContextBaseJavaModule {

  private static final String TAG = "MetaInstallReferrer";

  /** Meta-documented minimum major version segments (Marketing / versionName prefix). */
  private static final int FB_KATANA_MIN_MAJOR = 428;

  private static final int INSTAGRAM_MIN_MAJOR = 296;

  private static final int FB_LITE_MIN_MAJOR = 411;

  private static final String[] PROJECTION =
      new String[] {"install_referrer", "is_ct", "actual_timestamp"};

  private static final ExecutorService MIR_EXECUTOR = Executors.newSingleThreadExecutor();

  public MetaInstallReferrerModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return "MetaInstallReferrerModule";
  }

  /**
   * Exposes only whether a decryption key is configured in the build (never returns key material to JS).
   */
  @ReactMethod
  public void isDecryptionKeyConfigured(@NonNull final Promise promise) {
    String keyHex = BuildConfig.META_INSTALL_REFERRER_DECRYPTION_KEY;
    boolean ok = keyHex != null && !keyHex.trim().isEmpty();
    try {
      promise.resolve(ok);
    } catch (Exception e) {
      Log.e(TAG, "isDecryptionKeyConfigured: promise error", e);
    }
  }

  @ReactMethod
  public void getMetaReferrer(@NonNull final Promise promise) {
    Log.i(TAG, "MIR: native getMetaReferrer called");
    final ReactApplicationContext ctx = getReactApplicationContext();
    MIR_EXECUTOR.execute(
        () -> {
          try {
            final WritableMap map = tryGetMetaReferrer(ctx);
            ctx.runOnUiQueueThread(
                () -> {
                  try {
                    promise.resolve(map);
                  } catch (Exception e) {
                    Log.e(TAG, "getMetaReferrer: promise resolve failed", e);
                    promise.resolve(mirError("promise_bridge_error"));
                  }
                });
          } catch (Exception e) {
            Log.e(TAG, "getMetaReferrer: executor failure", e);
            ctx.runOnUiQueueThread(() -> promise.resolve(mirError("executor_failure")));
          }
        });
  }

  @NonNull
  private static WritableMap mirError(@NonNull String reason) {
    WritableMap out = Arguments.createMap();
    out.putString("error_reason", reason);
    return out;
  }

  /**
   * Strips non-Meta noise; only fields passed to JS for {@code decryptedCampaignJson} (no Play/outer
   * envelope, no full raw decrypt).
   */
  @NonNull
  private static JSONObject buildMetaOnlyPayload(@NonNull JSONObject decrypted)
      throws JSONException {
    JSONObject o = new JSONObject();
    o.put("campaign_id", decrypted.optString("campaign_id", ""));
    o.put("ad_id", decrypted.optString("ad_id", ""));
    o.put("adgroup_id", decrypted.optString("adgroup_id", ""));
    o.put("campaign_name", decrypted.optString("campaign_name", ""));
    String adgroupName = decrypted.optString("adgroup_name", "");
    if (adgroupName.isEmpty()) {
      adgroupName = decrypted.optString("adset_name", "");
    }
    o.put("adgroup_name", adgroupName);
    o.put("adset_name", decrypted.optString("adset_name", adgroupName));
    o.put("publisher_platform", decrypted.optString("publisher_platform", ""));
    o.put("account_id", decrypted.optString("account_id", ""));
    o.put("adset_id", decrypted.optString("adset_id", ""));
    o.put("campaign_group_id", decrypted.optString("campaign_group_id", ""));
    o.put("campaign_group_name", decrypted.optString("campaign_group_name", ""));
    o.put("ad_objective_name", decrypted.optString("ad_objective_name", ""));
    o.put("platform_position", decrypted.optString("platform_position", ""));
    o.put("is_instagram", decrypted.optBoolean("is_instagram", false));
    o.put("is_an", decrypted.optBoolean("is_an", false));
    return o;
  }

  @Nullable
  private static WritableMap tryGetMetaReferrer(Context context) {
    String keyHex = BuildConfig.META_INSTALL_REFERRER_DECRYPTION_KEY;
    if (keyHex == null || keyHex.trim().isEmpty()) {
      Log.w(TAG, "MIR skip: META_INSTALL_REFERRER_DECRYPTION_KEY missing (set in Gradle/local.properties)");
      Log.w(TAG, "[MIR][RESULT] status: error, error_reason: missing_key");
      return mirError("missing_key");
    }

    String fbAppId = context.getString(R.string.facebook_app_id);
    Uri providerUri = resolveProviderUri(context, fbAppId);
    if (providerUri == null) {
      Log.w(TAG, "MIR skip: no usable InstallReferrer provider (missing or app below min version)");
      Log.w(TAG, "MIR: provider returned null");
      return mirError("no_provider");
    }

    Log.i(TAG, "MIR: provider query started");
    try (Cursor c =
        context.getContentResolver().query(providerUri, PROJECTION, null, null, null)) {
      if (c == null || !c.moveToFirst()) {
        Log.w(TAG, "MIR skip: ContentResolver.query returned null or empty cursor");
        Log.w(TAG, "MIR: provider returned null");
        return mirError("empty_cursor");
      }

      int installIdx = c.getColumnIndex("install_referrer");
      int tsIdx = c.getColumnIndex("actual_timestamp");
      int isCtIdx = c.getColumnIndex("is_ct");
      if (installIdx < 0) {
        Log.w(TAG, "MIR skip: column install_referrer not found");
        return mirError("missing_install_referrer_column");
      }

      String installReferrerRaw = c.getString(installIdx);
      if (installReferrerRaw == null || installReferrerRaw.trim().isEmpty()) {
        Log.w(TAG, "MIR skip: install_referrer column empty");
        Log.i(TAG, "[MIR][RESULT] status: error, error_reason: empty_install_referrer");
        return mirError("empty_install_referrer");
      }

      long actualTimestampSec = tsIdx >= 0 ? c.getLong(tsIdx) : 0L;
      int isCt = isCtIdx >= 0 ? c.getInt(isCtIdx) : -1;

      String ref = installReferrerRaw.trim();
      boolean looksLikeJson =
          ref.length() >= 2 && ref.startsWith("{") && ref.charAt(ref.length() - 1) == '}';

      // No Meta-encrypted path without the utm_content envelope (strict Coinzy-style gate)
      if (!ref.contains("utm_content")) {
        Log.i(
            TAG,
            "MIR: Play-style referrer detected → skipping Meta attribution");
        Log.i(TAG, "[MIR][RESULT] status: empty");
        return null;
      }
      if (!looksLikeJson && ref.contains("&") && ref.indexOf("=") >= 0) {
        Log.i(
            TAG,
            "MIR: Play-style referrer detected → skipping Meta attribution");
        Log.i(TAG, "[MIR][RESULT] status: empty");
        return null;
      }
      if (!looksLikeJson) {
        Log.i(
            TAG,
            "MIR: Non-JSON referrer, skipping Meta parse");
        Log.i(TAG, "[MIR][RESULT] status: empty");
        return null;
      }

      Log.i(TAG, "MIR: JSON payload detected, attempting Meta decode");
      JSONObject outer;
      try {
        outer = unwrapInstallReferrerJson(installReferrerRaw);
      } catch (JSONException e) {
        Log.w(TAG, "MIR: JSON parse failed, treating as no Meta payload", e);
        Log.i(TAG, "[MIR][RESULT] status: empty");
        return null;
      }

      JSONObject utmContent = outer.optJSONObject("utm_content");
      if (utmContent == null) {
        Log.i(TAG, "MIR: No utm_content → not Meta attribution");
        Log.i(TAG, "[MIR][RESULT] status: empty");
        return null;
      }
      JSONObject source = utmContent.optJSONObject("source");
      if (source == null) {
        Log.i(TAG, "MIR: No source object → not Meta attribution");
        Log.i(TAG, "[MIR][RESULT] status: empty");
        return null;
      }

      String dataHex = source.isNull("data") ? "" : source.optString("data", "");
      String nonceHex = source.isNull("nonce") ? "" : source.optString("nonce", "");
      if (dataHex.isEmpty() || nonceHex.isEmpty()) {
        Log.i(TAG, "MIR: Missing data/nonce → not Meta attribution");
        Log.i(TAG, "[MIR][RESULT] status: empty");
        return null;
      }

      String fullDecryptedJson = decryptAesGcmHex(keyHex.trim(), nonceHex.trim(), dataHex.trim());
      if (fullDecryptedJson == null) {
        Log.w(TAG, "[MIR][RESULT] status: error, error_reason: decrypt_failed");
        return mirError("decrypt_failed");
      }
      String campaignIdLog = "";
      String adIdLog = "";
      JSONObject metaOnly;
      try {
        JSONObject decryptedObj = new JSONObject(fullDecryptedJson);
        campaignIdLog = decryptedObj.optString("campaign_id", "");
        adIdLog = decryptedObj.optString("ad_id", "");
        metaOnly = buildMetaOnlyPayload(decryptedObj);
        Log.i(TAG, "MIR: Meta payload successfully decrypted");
        Log.i(
            TAG,
            "MIR decrypt success: campaign_id="
                + campaignIdLog
                + ", adgroup_id="
                + decryptedObj.optString("adgroup_id", "")
                + ", ad_id="
                + adIdLog);
        Log.i(
            TAG,
            "[MIR][RESULT] status: success, campaign_id: "
                + campaignIdLog
                + ", ad_id: "
                + adIdLog);
      } catch (JSONException e) {
        Log.w(TAG, "MIR: decrypted content is not valid JSON — not Meta attribution", e);
        Log.i(TAG, "[MIR][RESULT] status: empty");
        return null;
      }

      String metaJsonString = metaOnly.toString();
      WritableMap out = Arguments.createMap();
      out.putString("decryptedCampaignJson", metaJsonString);
      out.putString("campaign_id", metaOnly.optString("campaign_id", ""));
      out.putString("ad_id", metaOnly.optString("ad_id", ""));
      out.putString("adgroup_id", metaOnly.optString("adgroup_id", ""));
      out.putString("campaign_name", metaOnly.optString("campaign_name", ""));
      out.putString("adgroup_name", metaOnly.optString("adgroup_name", ""));
      out.putString("publisher_platform", metaOnly.optString("publisher_platform", ""));
      out.putString("attribution_source", "meta_provider");
      out.putDouble("actualTimestampSec", (double) actualTimestampSec);
      out.putInt("isClickThrough", isCt);
      return out;
    } catch (Exception e) {
      Log.e(TAG, "MIR: unexpected query/parse error", e);
      Log.w(TAG, "[MIR][RESULT] status: error, error_reason: unexpected_error");
      return mirError("unexpected_error");
    }
  }

  @Nullable
  private static Uri resolveProviderUri(Context context, String fbAppId) {
    PackageManager pm = context.getPackageManager();
    Uri u =
        tryProvider(
            pm,
            fbAppId,
            "com.facebook.katana.provider.InstallReferrerProvider",
            "com.facebook.katana",
            FB_KATANA_MIN_MAJOR);
    if (u != null) {
      return u;
    }
    u =
        tryProvider(
            pm,
            fbAppId,
            "com.instagram.contentprovider.InstallReferrerProvider",
            "com.instagram.android",
            INSTAGRAM_MIN_MAJOR);
    if (u != null) {
      return u;
    }
    return tryProvider(
        pm,
        fbAppId,
        "com.facebook.lite.provider.InstallReferrerProvider",
        "com.facebook.lite",
        FB_LITE_MIN_MAJOR);
  }

  @Nullable
  private static Uri tryProvider(
      PackageManager pm,
      String fbAppId,
      String authority,
      String clientPackage,
      int minMajorVersion) {
    if (pm.resolveContentProvider(authority, 0) == null) {
      return null;
    }
    if (!isPackageVersionAtLeast(pm, clientPackage, minMajorVersion)) {
      return null;
    }
    return Uri.parse("content://" + authority + "/" + fbAppId);
  }

  private static boolean isPackageVersionAtLeast(
      PackageManager pm, String packageName, int minMajor) {
    try {
      PackageInfo info = pm.getPackageInfo(packageName, 0);
      int major = versionNameMajor(info.versionName);
      if (major < minMajor) {
        Log.w(
            TAG,
            "MIR skip: package "
                + packageName
                + " versionName major="
                + major
                + " < required "
                + minMajor);
        return false;
      }
      return true;
    } catch (PackageManager.NameNotFoundException e) {
      Log.w(TAG, "MIR skip: package not installed: " + packageName);
      return false;
    }
  }

  /** First segment of versionName (e.g. 428 from "428.0.0.1"). */
  private static int versionNameMajor(@Nullable String versionName) {
    if (versionName == null || versionName.isEmpty()) {
      return 0;
    }
    int dot = versionName.indexOf('.');
    String head = dot != -1 ? versionName.substring(0, dot) : versionName;
    try {
      return Integer.parseInt(head.replaceAll("[^0-9]", ""));
    } catch (NumberFormatException e) {
      Log.w(TAG, "MIR: could not parse versionName major from: " + versionName);
      return 0;
    }
  }

  /**
   * Meta may return the attribution object at the root, or nested under {@code install_referrer}.
   */
  @NonNull
  private static JSONObject unwrapInstallReferrerJson(String raw) throws JSONException {
    String rawTrimmed = raw.trim();
    JSONObject root;
    try {
      root = new JSONObject(rawTrimmed);
    } catch (JSONException first) {
      try {
        String decoded = URLDecoder.decode(rawTrimmed, StandardCharsets.UTF_8.name());
        root = new JSONObject(decoded);
      } catch (Exception second) {
        throw first;
      }
    }
    if (root.has("utm_content")) {
      return root;
    }
    if (!root.has("install_referrer")) {
      return root;
    }
    Object ir = root.get("install_referrer");
    if (ir instanceof JSONObject) {
      return (JSONObject) ir;
    }
    if (ir instanceof String) {
      return new JSONObject((String) ir);
    }
    return root;
  }

  @Nullable
  private static String decryptAesGcmHex(String keyHex, String nonceHex, String cipherHex) {
    byte[] keyBytes;
    byte[] nonceBytes;
    byte[] cipherBytes;
    try {
      keyBytes = hexToBytes(keyHex);
    } catch (IllegalArgumentException e) {
      Log.w(TAG, "MIR decrypt fail: invalid hex in decryption key", e);
      return null;
    }
    try {
      nonceBytes = hexToBytes(nonceHex);
    } catch (IllegalArgumentException e) {
      Log.w(TAG, "MIR decrypt fail: invalid hex in nonce", e);
      return null;
    }
    try {
      cipherBytes = hexToBytes(cipherHex);
    } catch (IllegalArgumentException e) {
      Log.w(TAG, "MIR decrypt fail: invalid hex in ciphertext (data)", e);
      return null;
    }

    if (keyBytes.length != 32) {
      Log.w(TAG, "MIR decrypt fail: key decodes to " + keyBytes.length + " bytes, need 32 (AES-256)");
      return null;
    }

    try {
      SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
      GCMParameterSpec gcmSpec = new GCMParameterSpec(128, nonceBytes);
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec);
      byte[] plain = cipher.doFinal(cipherBytes);
      return new String(plain, StandardCharsets.UTF_8);
    } catch (Exception e) {
      Log.w(TAG, "MIR decrypt fail: AES-GCM error (bad key/nonce/tag/ciphertext?)", e);
      return null;
    }
  }

  @NonNull
  private static byte[] hexToBytes(String hex) {
    String h = hex.trim();
    int len = h.length();
    if ((len & 1) != 0) {
      throw new IllegalArgumentException("Odd-length hex");
    }
    byte[] out = new byte[len / 2];
    for (int i = 0; i < len; i += 2) {
      int d1 = Character.digit(h.charAt(i), 16);
      int d2 = Character.digit(h.charAt(i + 1), 16);
      if (d1 < 0 || d2 < 0) {
        throw new IllegalArgumentException("Non-hex character");
      }
      out[i / 2] = (byte) ((d1 << 4) + d2);
    }
    return out;
  }
}
