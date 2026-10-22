package com.trackzio.birds

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class SystemNavigationBarPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
      listOf(SystemNavigationBarModule(context))

  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> =
      emptyList()
}
