import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import PushKit


@main
class AppDelegate: UIResponder, UIApplicationDelegate, PKPushRegistryDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  
  private var voipRegistry: PKPushRegistry?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
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

    return true
  }

  func pushRegistry(_ registry: PKPushRegistry,
                      didUpdate pushCredentials: PKPushCredentials,
                      for type: PKPushType) {
      // Convert token to lowercase hex
      let hex = pushCredentials.token.map { String(format: "%02x", $0) }.joined()

      print("VoIP token", (hex))

      // Send to LinphoneModule via NotificationCenter
      NotificationCenter.default.post(name: .linphoneRegisterVoipToken,
                                      object: nil,
                                      userInfo: ["token": hex])
    
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
