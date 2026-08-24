package com.trackzio.birds

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class EmbeddedPhotoPickerModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "EmbeddedPhotoPickerModule"

  @ReactMethod
  fun isAvailable(promise: Promise) {
    promise.resolve(EmbeddedPhotoPickerAvailability.isAvailable())
  }
}
