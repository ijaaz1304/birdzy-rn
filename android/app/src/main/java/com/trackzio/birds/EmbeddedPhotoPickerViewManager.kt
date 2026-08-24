package com.trackzio.birds

import android.net.Uri
import android.util.Log
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.photopicker.EmbeddedPhotoPickerFeatureInfo
import android.widget.photopicker.EmbeddedPhotoPickerProviderFactory
import android.widget.photopicker.EmbeddedPhotoPickerSession
import androidx.photopicker.EmbeddedPhotoPickerView
import androidx.photopicker.ExperimentalPhotoPickerApi
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter

/**
 * RN wraps native views in touchable parent layers. Keep the container from
 * stealing scroll gestures meant for the embedded picker's SurfaceView.
 */
private class PickerTouchContainer(context: android.content.Context) : FrameLayout(context) {
  override fun onInterceptTouchEvent(event: MotionEvent): Boolean = false
}

@OptIn(ExperimentalPhotoPickerApi::class)
class EmbeddedPhotoPickerViewManager :
  SimpleViewManager<FrameLayout>() {

  private data class PickerHost(
    val picker: EmbeddedPhotoPickerView,
    val listener: EmbeddedPhotoPickerView.EmbeddedPhotoPickerStateChangeListener,
    var session: EmbeddedPhotoPickerSession? = null,
    var maxSelectable: Int = 1,
    var accentColor: Long? = null,
    var appliedMaxSelectable: Int? = null,
    var appliedAccentColor: Long? = null,
    var lastSyncedWidth: Int = 0,
    var lastSyncedHeight: Int = 0,
  ) {
    fun applyFeatureInfo() {
      val nextMax = maxSelectable.coerceAtLeast(1)
      val nextAccent = accentColor
      if (appliedMaxSelectable == nextMax && appliedAccentColor == nextAccent) {
        return
      }
      val builder = EmbeddedPhotoPickerFeatureInfo.Builder()
        .setMaxSelectionLimit(nextMax)
      nextAccent?.let { builder.setAccentColor(it) }
      picker.setEmbeddedPhotoPickerFeatureInfo(builder.build())
      appliedMaxSelectable = nextMax
      appliedAccentColor = nextAccent
    }

    fun syncSessionSize(force: Boolean = false) {
      val session = session ?: return
      val width = picker.width
      val height = picker.height
      if (width <= 0 || height <= 0) return
      if (!force && width == lastSyncedWidth && height == lastSyncedHeight) return
      session.notifyResized(width, height)
      lastSyncedWidth = width
      lastSyncedHeight = height
      if (DEBUG) {
        Log.d(TAG, "notifyResized ${width}x$height")
      }
    }
  }

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): FrameLayout {
    if (DEBUG) {
      Log.d(TAG, "createViewInstance")
    }

    val container = PickerTouchContainer(reactContext).apply {
      layoutParams = ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
      )
      isClickable = false
      isFocusable = false
    }

    if (!EmbeddedPhotoPickerAvailability.isAvailable()) {
      if (DEBUG) {
        Log.w(TAG, "Embedded photo picker unavailable on this device")
      }
      return container
    }

    val picker = EmbeddedPhotoPickerView(reactContext).apply {
      layoutParams = FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT,
      )
      isNestedScrollingEnabled = true
      overScrollMode = View.OVER_SCROLL_IF_CONTENT_SCROLLS
    }

    val hostRef = arrayOfNulls<PickerHost>(1)

    val listener =
      object : EmbeddedPhotoPickerView.EmbeddedPhotoPickerStateChangeListener {
        override fun onSessionOpened(newSession: EmbeddedPhotoPickerSession) {
          hostRef[0]?.session = newSession
          if (DEBUG) {
            Log.d(TAG, "onSessionOpened")
          }
          picker.post { hostRef[0]?.syncSessionSize(force = true) }
        }

        override fun onSessionError(throwable: Throwable) {
          emitEvent(container, EVENT_SESSION_ERROR) {
            putString("message", throwable.message ?: "Embedded photo picker error")
          }
        }

        override fun onUriPermissionGranted(uris: List<Uri>) {
          uris.forEach { uri ->
            emitEvent(container, EVENT_PHOTO_SELECTED) {
              putString("uri", uri.toString())
            }
          }
        }

        override fun onUriPermissionRevoked(uris: List<Uri>) {
          uris.forEach { uri ->
            emitEvent(container, EVENT_PHOTO_DESELECTED) {
              putString("uri", uri.toString())
            }
          }
        }

        override fun onSelectionComplete() = Unit
      }

    picker.setProvider(EmbeddedPhotoPickerProviderFactory.create(reactContext))
    picker.addEmbeddedPhotoPickerStateChangeListener(listener)
    val host = PickerHost(picker, listener)
    hostRef[0] = host
    host.applyFeatureInfo()
    picker.addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
      host.syncSessionSize()
    }
    container.addView(picker)
    container.tag = host
    picker.post { host.syncSessionSize(force = true) }
    return container
  }

  override fun onDropViewInstance(view: FrameLayout) {
    if (DEBUG) {
      Log.d(TAG, "onDropViewInstance")
    }
    val host = view.tag as? PickerHost ?: return
    host.picker.removeEmbeddedPhotoPickerStateChangeListener(host.listener)
    view.tag = null
    super.onDropViewInstance(view)
  }

  @ReactProp(name = "maxSelectable", defaultInt = 1)
  fun setMaxSelectable(view: FrameLayout, maxSelectable: Int) {
    val host = view.tag as? PickerHost ?: return
    if (host.maxSelectable == maxSelectable) return
    host.maxSelectable = maxSelectable
    host.applyFeatureInfo()
  }

  @ReactProp(name = "accentColor", customType = "Color")
  fun setAccentColor(view: FrameLayout, accentColor: Int) {
    val host = view.tag as? PickerHost ?: return
    val nextAccent = accentColor.toLong() and 0xFFFFFFFFL
    if (host.accentColor == nextAccent) return
    host.accentColor = nextAccent
    host.applyFeatureInfo()
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> =
    MapBuilder.builder<String, Any>()
      .put(EVENT_PHOTO_SELECTED, MapBuilder.of("registrationName", "onPhotoSelected"))
      .put(EVENT_PHOTO_DESELECTED, MapBuilder.of("registrationName", "onPhotoDeselected"))
      .put(EVENT_SESSION_ERROR, MapBuilder.of("registrationName", "onSessionError"))
      .build()

  private fun emitEvent(
    view: android.view.View,
    eventName: String,
    block: WritableMap.() -> Unit,
  ) {
    val reactContext = view.context as ReactContext
    val payload = Arguments.createMap().apply(block)
    reactContext
      .getJSModule(RCTEventEmitter::class.java)
      .receiveEvent(view.id, eventName, payload)
  }

  companion object {
    const val REACT_CLASS = "EmbeddedPhotoPickerView"
    private const val TAG = "EmbeddedPhotoPickerVM"
    private val DEBUG = BuildConfig.DEBUG
    private const val EVENT_PHOTO_SELECTED = "photoSelected"
    private const val EVENT_PHOTO_DESELECTED = "photoDeselected"
    private const val EVENT_SESSION_ERROR = "sessionError"
  }
}
