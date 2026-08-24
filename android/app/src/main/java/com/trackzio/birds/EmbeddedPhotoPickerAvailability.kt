package com.trackzio.birds

import android.os.Build
import android.os.ext.SdkExtensions

object EmbeddedPhotoPickerAvailability {
  fun isAvailable(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      return false
    }

    return try {
      SdkExtensions.getExtensionVersion(Build.VERSION_CODES.UPSIDE_DOWN_CAKE) >= 15
    } catch (_: Throwable) {
      false
    }
  }
}
