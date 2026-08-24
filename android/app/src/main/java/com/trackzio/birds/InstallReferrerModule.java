package com.trackzio.birds;

import android.util.Log;

import androidx.annotation.NonNull;

import com.android.installreferrer.api.InstallReferrerClient;
import com.android.installreferrer.api.InstallReferrerStateListener;
import com.android.installreferrer.api.ReferrerDetails;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Google Play Install Referrer API bridge.
 *
 * <p>Timestamps are returned in milliseconds for JS consistency. Do NOT multiply again in JS.
 */
public class InstallReferrerModule extends ReactContextBaseJavaModule {

  private static final String TAG = "InstallReferrerModule";

  public InstallReferrerModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return "InstallReferrerModule";
  }

  @ReactMethod
  public void getReferrer(@NonNull final Promise promise) {
    final AtomicBoolean settled = new AtomicBoolean(false);
    InstallReferrerClient referrerClient = null;

    try {
      ReactApplicationContext context = getReactApplicationContext();
      referrerClient = InstallReferrerClient.newBuilder(context).build();
      final InstallReferrerClient client = referrerClient;

      Log.d(TAG, "getReferrer: starting connection");

      client.startConnection(
          new InstallReferrerStateListener() {
            @Override
            public void onInstallReferrerSetupFinished(int responseCode) {
              Log.d(TAG, "onInstallReferrerSetupFinished: code=" + responseCode);
              try {
                if (settled.get()) {
                  return;
                }
                if (responseCode == InstallReferrerClient.InstallReferrerResponse.OK) {
                  ReferrerDetails details = client.getInstallReferrer();
                  String referrer =
                      details.getInstallReferrer() != null ? details.getInstallReferrer() : "";
                  // Timestamps are returned in milliseconds for JS consistency.
                  // Do NOT multiply again in JS.
                  long clickMs = details.getReferrerClickTimestampSeconds() * 1000L;
                  long installMs = details.getInstallBeginTimestampSeconds() * 1000L;

                  Log.d(
                      TAG,
                      "getReferrer: OK, referrerLength="
                          + referrer.length()
                          + ", clickMs="
                          + clickMs
                          + ", installMs="
                          + installMs);

                  WritableMap map = Arguments.createMap();
                  map.putString("installReferrer", referrer);
                  map.putDouble("clickTimestamp", (double) clickMs);
                  map.putDouble("installTimestamp", (double) installMs);

                  if (settled.compareAndSet(false, true)) {
                    promise.resolve(map);
                  }
                } else {
                  String codeStr = String.valueOf(responseCode);
                  Log.d(TAG, "getReferrer: non-OK response, rejecting with code " + codeStr);
                  if (settled.compareAndSet(false, true)) {
                    promise.reject(
                        "REFERRER_ERROR",
                        codeStr,
                        (Throwable) null); // explicit cast: avoids WritableMap vs Throwable overload ambiguity
                  }
                }
              } catch (Exception e) {
                Log.d(TAG, "getReferrer: exception in setup callback", e);
                if (settled.compareAndSet(false, true)) {
                  promise.reject("REFERRER_EXCEPTION", e.getMessage(), e);
                }
              } finally {
                endConnectionSafe(client);
              }
            }

            @Override
            public void onInstallReferrerServiceDisconnected() {
              Log.d(TAG, "onInstallReferrerServiceDisconnected");
              if (settled.compareAndSet(false, true)) {
                endConnectionSafe(client);
                promise.reject(
                    "REFERRER_DISCONNECTED",
                    "Install referrer service disconnected",
                    (Throwable) null);
              }
            }
          });
    } catch (Exception e) {
      Log.d(TAG, "getReferrer: outer exception", e);
      if (referrerClient != null) {
        endConnectionSafe(referrerClient);
      }
      if (settled.compareAndSet(false, true)) {
        promise.reject("REFERRER_EXCEPTION", e.getMessage(), e);
      }
    }
  }

  private static void endConnectionSafe(InstallReferrerClient client) {
    if (client == null) {
      return;
    }
    try {
      client.endConnection();
      Log.d(TAG, "endConnection: done");
    } catch (Exception e) {
      Log.d(TAG, "endConnection: error (ignored)", e);
    }
  }

}
