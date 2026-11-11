import UIKit
import UserNotifications
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
    if let response = connectionOptions.notificationResponse {
      forwardLaunchNotification(response)
    }

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

  // UIKit supplies the notification tap on the connecting scene at cold start.
  private func forwardLaunchNotification(_ response: UNNotificationResponse, attemptsLeft: Int = 8) {
    let center = UNUserNotificationCenter.current()
    if let delegate = center.delegate,
       delegate.responds(to: #selector(UNUserNotificationCenterDelegate.userNotificationCenter(_:didReceive:withCompletionHandler:))) {
      delegate.userNotificationCenter?(center, didReceive: response, withCompletionHandler: {})
    } else if attemptsLeft > 0 {
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { [weak self] in
        self?.forwardLaunchNotification(response, attemptsLeft: attemptsLeft - 1)
      }
    }
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
