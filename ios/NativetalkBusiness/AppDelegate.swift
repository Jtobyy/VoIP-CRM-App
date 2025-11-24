import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import PushKit
import FirebaseCore
import UserNotifications


@main
class AppDelegate: UIResponder, UIApplicationDelegate, PKPushRegistryDelegate, UNUserNotificationCenterDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  
  private var voipRegistry: PKPushRegistry?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseApp.configure()

    UNUserNotificationCenter.current().delegate = self
    UIApplication.shared.registerForRemoteNotifications()

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()
    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "NativetalkBusiness",
      in: window,
      launchOptions: launchOptions
    )
    
    let reg = PKPushRegistry(queue: .main)
    reg.delegate = self
    reg.desiredPushTypes = [.voIP]
    self.voipRegistry = reg

    print("[AppDelegate] didFinishLaunching done")
    return true
  }
  
  func application(_ application: UIApplication,
                   didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let hex = deviceToken.map { String(format: "%02x", $0) }.joined()
    print("[AppDelegate] APNs device token =", hex)
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
      completionHandler([.banner, .list, .sound, .badge])
    }

  func pushRegistry(_ registry: PKPushRegistry,
                    didUpdate pushCredentials: PKPushCredentials,
                    for type: PKPushType) {
      
      if type == .voIP {
          let tokenData = pushCredentials.token
          let token = tokenData.map { String(format: "%02.2hhx", $0) }.joined()
          
          print("========================================")
          print("VoIP Token: \(token)")
          print("========================================")
          
          // Copy this to your clipboard or save it
          // For testing, you can also store it locally
          UserDefaults.standard.set(token, forKey: "voip_token")
          
          // Send to backend (we'll implement this later)
          // sendVoIPTokenToBackend(token: token, username: "e1")
      }
  }
  
  func pushRegistry(_ registry: PKPushRegistry,
                      didReceiveIncomingPushWith payload: PKPushPayload,
                      for type: PKPushType,
                    completion: @escaping () -> Void) {
    print("Registering token 2")

    // Ensure core init happens quickly in background
    NotificationCenter.default.post(name: .linphoneEnsureInit, object: nil, userInfo: nil)
    
    completion()
  }
  
  func pushRegistry(_ registry: PKPushRegistry,
                      didReceiveIncomingPushWith payload: PKPushPayload,
                      for type: PKPushType) {
      NotificationCenter.default.post(name: .linphoneEnsureInit, object: nil, userInfo: nil)
 }
}

extension Notification.Name {
  static let linphoneRegisterVoipToken = Notification.Name("Linphone.RegisterVoipToken")
  static let linphoneEnsureInit        = Notification.Name("Linphone.EnsureInit")
  static let linphoneShowCallKit       = Notification.Name("Linphone.ShowCallKit")
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? { self.bundleURL() }
  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
