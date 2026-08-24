import UIKit
import GoogleSignIn
import React

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }
    (UIApplication.shared.delegate as? AppDelegate)?.window?.windowScene = windowScene

    if let url = connectionOptions.urlContexts.first?.url {
      forwardDeepLinkURL(url)
    }
    if let userActivity = connectionOptions.userActivities.first {
      forwardUserActivity(userActivity)
    }
  }

  func scene(
    _ scene: UIScene,
    openURLContexts URLContexts: Set<UIOpenURLContext>
  ) {
    guard let url = URLContexts.first?.url else { return }
    forwardDeepLinkURL(url)
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    forwardUserActivity(userActivity)
  }

  private func forwardDeepLinkURL(_ url: URL) {
    if GIDSignIn.sharedInstance.handle(url) {
      return
    }
    _ = RCTLinkingManager.application(
      UIApplication.shared,
      open: url,
      options: [:]
    )
  }

  private func forwardUserActivity(_ userActivity: NSUserActivity) {
    _ = RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }
}
