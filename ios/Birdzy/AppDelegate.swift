import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase   // ✅ REQUIRED
import GoogleSignIn
import SDWebImage
import SDWebImageWebPCoder

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

    // 🔥 Firebase initialization (CRITICAL)
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
      print("🔥 Firebase configured")
    } else {
      print("🔥 Firebase already configured")
    }

    // 🔍 Verify plist is bundled (debug safety)
    #if DEBUG
    if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") {
      print("✅ GoogleService-Info.plist found at:", path)
    } else {
      print("❌ GoogleService-Info.plist NOT found in app bundle")
    }
    #endif

    // WebP for FastImage + react-native-webp-format (RN Image / ImageBackground).
    SDImageCodersManager.shared.addCoder(SDImageWebPCoder.shared)
    if #available(iOS 14, *) {
      SDImageCodersManager.shared.addCoder(SDImageAWebPCoder.shared)
    }

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Birdzy",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // Google Sign-In OAuth + deep links (custom scheme + Universal Links fallback)
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    if GIDSignIn.sharedInstance.handle(url) {
      return true
    }
    return RCTLinkingManager.application(app, open: url, options: options)
  }

  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    return RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
  }

  // MARK: - UISceneSession (iOS 13+)
  func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    return UISceneConfiguration(
      name: "Default Configuration",
      sessionRole: connectingSceneSession.role
    )
  }

  func application(
    _ application: UIApplication,
    didDiscardSceneSessions sceneSessions: Set<UISceneSession>
  ) {
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
