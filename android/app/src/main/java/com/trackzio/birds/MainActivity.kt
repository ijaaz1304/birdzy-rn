package com.trackzio.birds

import android.os.Bundle
import android.os.Build
import androidx.core.view.WindowInsetsControllerCompat
import androidx.appcompat.app.AppCompatDelegate
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Prevents Android from restoring react-native-screens fragment state, which causes
   * "Screen fragments should never be restored" crash when returning from background.
   * See: https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
    super.onCreate(null)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      window.isNavigationBarContrastEnforced = false
    }
    // Launch artwork is teal; JS updates icon contrast once the screen is ready.
    WindowInsetsControllerCompat(window, window.decorView)
        .isAppearanceLightNavigationBars = false
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Birdzy"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
