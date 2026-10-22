package com.trackzio.birds

import android.graphics.Color
import android.os.Build
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.view.Window
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.views.modal.ReactModalHostView
import java.util.WeakHashMap

/** Screen content supplies the navigation background, including React Native dialogs. */
class SystemNavigationBarModule(context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context), LifecycleEventListener {
  @Volatile private var darkIcons = false
  private val observedWindows =
      WeakHashMap<Window, ViewTreeObserver.OnWindowFocusChangeListener>()

  init {
    context.addLifecycleEventListener(this)
  }

  override fun getName() = "SystemNavigationBar"

  @ReactMethod
  fun setDarkIcons(value: Boolean) {
    darkIcons = value
    applyAppearance()
  }

  private fun applyAppearance() {
    val activity = reactApplicationContext.currentActivity ?: return
    activity.runOnUiThread {
      if (!activity.isFinishing && !activity.isDestroyed) {
        configureWindow(activity.window)
        configureDialogs(activity.window.decorView)
      }
    }
  }

  @Suppress("DEPRECATION")
  private fun configureWindow(window: Window) {
    window.navigationBarColor = Color.TRANSPARENT
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      window.navigationBarDividerColor = Color.TRANSPARENT
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      window.isNavigationBarContrastEnforced = false
    }
    WindowInsetsControllerCompat(window, window.decorView)
        .isAppearanceLightNavigationBars = darkIcons

    if (!observedWindows.containsKey(window)) {
      // Opening a dialog changes focus after RN configures that dialog's window.
      // Reapply there too: RN otherwise enables its own three-button scrim.
      val listener = ViewTreeObserver.OnWindowFocusChangeListener {
        reactApplicationContext.currentActivity?.window?.decorView?.post {
          applyAppearance()
        }
      }
      observedWindows[window] = listener
      window.decorView.viewTreeObserver.addOnWindowFocusChangeListener(listener)
    }
  }

  private fun configureDialogs(view: View) {
    if (view is ReactModalHostView) {
      view.dialog?.window?.let { dialogWindow ->
        configureWindow(dialogWindow)
        configureDialogs(dialogWindow.decorView)
      }
    }
    if (view is ViewGroup) {
      for (index in 0 until view.childCount) configureDialogs(view.getChildAt(index))
    }
  }

  override fun onHostResume() = applyAppearance()
  override fun onHostPause() = Unit
  override fun onHostDestroy() = clearObservers()

  private fun clearObservers() {
    reactApplicationContext.runOnUiQueueThread {
      observedWindows.forEach { (window, listener) ->
        val observer = window.decorView.viewTreeObserver
        if (observer.isAlive) observer.removeOnWindowFocusChangeListener(listener)
      }
      observedWindows.clear()
    }
  }

  override fun invalidate() {
    reactApplicationContext.removeLifecycleEventListener(this)
    clearObservers()
    super.invalidate()
  }
}
