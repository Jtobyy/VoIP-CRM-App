import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import PushKit
import CallKit
import AVFoundation
import FirebaseCore
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, PKPushRegistryDelegate, UNUserNotificationCenterDelegate, CXProviderDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  
  private var voipRegistry: PKPushRegistry?
  private var callKitProvider: CXProvider?
  private var isReactNativeInitialized = false
  private var launchOptionsForDeferred: [UIApplication.LaunchOptionsKey: Any]?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    
    print("[AppDelegate] 🚀 didFinishLaunchingWithOptions START")
    
    // Store launch options for later use
    self.launchOptionsForDeferred = launchOptions

    // ====== CRITICAL: CallKit + PushKit FIRST (lightweight) ======
    configureCallKitAndPushKit()
    
    // ====== Defer React Native initialization ======
    // This gives PKPushRegistry time to deliver any pending VoIP push
    // If app is launched from VoIP push, the push handler will fire first
    print("[AppDelegate] ⏱️ Deferring React Native init by 0.2 seconds...")
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
      if !self.isReactNativeInitialized {
        print("[AppDelegate] ⚛️ Timer expired - initializing React Native now")
        self.initializeFirebaseAndReactNative(launchOptions: launchOptions)
      } else {
        print("[AppDelegate] ✅ React Native already initialized by VoIP handler")
      }
    }

    return true
  }
  
  // MARK: - Setup helpers

  private func configureCallKitAndPushKit() {
    print("[AppDelegate] ⚙️ Configuring CallKit + PushKit...")
    
    let config = CXProviderConfiguration(localizedName: "NativeTalk")
    config.supportsVideo = false
    config.maximumCallsPerCallGroup = 1
    config.supportedHandleTypes = [.phoneNumber, .generic]

    self.callKitProvider = CXProvider(configuration: config)
    self.callKitProvider?.setDelegate(self, queue: nil)

    let reg = PKPushRegistry(queue: .main)
    reg.delegate = self
    reg.desiredPushTypes = [.voIP]
    self.voipRegistry = reg

    print("[AppDelegate] ✅ CallKit + PushKit configured")
  }

  private func initializeFirebaseAndReactNative(launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
    guard !isReactNativeInitialized else {
      print("[AppDelegate] ⚠️ React Native already initialized")
      return
    }
    
    print("[AppDelegate] 🔥 Initializing Firebase...")
    FirebaseApp.configure()
    
    print("[AppDelegate] 🔔 Registering for notifications...")
    UNUserNotificationCenter.current().delegate = self
    UIApplication.shared.registerForRemoteNotifications()
    
    print("[AppDelegate] ⚛️ Initializing React Native...")
    startReactNative(launchOptions: launchOptions)
    
    isReactNativeInitialized = true
    print("[AppDelegate] ✅ Full initialization complete")
  }

  private func startReactNative(launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
    guard reactNativeFactory == nil else {
      print("[AppDelegate] ⚠️ React Native factory already exists")
      return
    }

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()
    reactNativeDelegate = delegate
    reactNativeFactory = factory

    let window = UIWindow(frame: UIScreen.main.bounds)
    self.window = window

    factory.startReactNative(
      withModuleName: "NativetalkBusiness",
      in: window,
      launchOptions: launchOptions
    )

    window.makeKeyAndVisible()
    print("[AppDelegate] ✅ React Native window initialized")
  }
  
  // MARK: - APNs (normal push)

  func application(_ application: UIApplication,
                   didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let hex = deviceToken.map { String(format: "%02x", $0) }.joined()
    print("[AppDelegate] 📱 APNs device token:", hex)
  }

  func userNotificationCenter(_ center: UNUserNotificationCenter,
                              willPresent notification: UNNotification,
                              withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    print("[AppDelegate] 🔔 Notification will present")
    completionHandler([.banner, .list, .sound, .badge])
  }

  // MARK: - PushKit Delegate (VoIP token)

  func pushRegistry(_ registry: PKPushRegistry,
                    didUpdate pushCredentials: PKPushCredentials,
                    for type: PKPushType) {
    guard type == .voIP else { return }

    let tokenData = pushCredentials.token
    let token = tokenData.map { String(format: "%02.2hhx", $0) }.joined()
    
    print("========================================")
    print("🎫 VoIP Token: \(token)")
    print("========================================")
    
    UserDefaults.standard.set(token, forKey: "voip_token")
  }
  
  // MARK: - Incoming VoIP push (CRITICAL)

  func pushRegistry(_ registry: PKPushRegistry,
                    didReceiveIncomingPushWith payload: PKPushPayload,
                    for type: PKPushType,
                    completion: @escaping () -> Void) {
    
    print("[PushKit] 🚨 didReceiveIncomingPush CALLED")
    print("[PushKit] 📦 Payload:", payload.dictionaryPayload)
    
    guard type == .voIP else {
      print("[PushKit] ❌ Not VoIP type")
      completion()
      return
    }
    
    guard let provider = self.callKitProvider else {
      print("[PushKit] ❌ No CallKit provider!")
      completion()
      return
    }

    let dict = payload.dictionaryPayload
    
    // Extract call data
    let callData = dict["call_data"] as? [String: Any]
    let callIdString = (callData?["call_id"] as? String)
      ?? (dict["call_id"] as? String)
      ?? UUID().uuidString

    let caller = (callData?["caller"] as? String)
      ?? (dict["caller"] as? String)
      ?? "Unknown Caller"

    let callUUID = UUID(uuidString: callIdString) ?? UUID()

    print("[PushKit] 📞 Incoming call - Caller: \(caller), ID: \(callUUID.uuidString)")

    let update = CXCallUpdate()
    update.remoteHandle = CXHandle(type: .phoneNumber, value: caller)
    update.hasVideo = false
    update.localizedCallerName = caller

    // CRITICAL: Report to CallKit IMMEDIATELY (synchronously in this function)
    print("[PushKit] 📢 Reporting to CallKit NOW...")
    provider.reportNewIncomingCall(with: callUUID, update: update) { error in
      if let error = error {
        print("[PushKit] ❌ CallKit report error:", error.localizedDescription)
        completion()
        return
      }

      print("[PushKit] ✅ CallKit report SUCCESS")
      
      // Now initialize React Native if not already done
      if !self.isReactNativeInitialized {
        print("[PushKit] 🔄 Initializing React Native NOW (from VoIP handler)...")
        self.initializeFirebaseAndReactNative(launchOptions: self.launchOptionsForDeferred)
        
        // Give React Native a moment to initialize before posting notification
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
          print("[PushKit] 📡 Posting Linphone notification...")
          NotificationCenter.default.post(
            name: .linphoneEnsureInit,
            object: nil,
            userInfo: ["callId": callUUID.uuidString, "caller": caller]
          )
        }
      } else {
        // React Native already initialized
        print("[PushKit] 📡 Posting Linphone notification (RN already running)...")
        NotificationCenter.default.post(
          name: .linphoneEnsureInit,
          object: nil,
          userInfo: ["callId": callUUID.uuidString, "caller": caller]
        )
      }

      completion()
    }
  }

  // MARK: - CallKit Delegate
  
  func providerDidReset(_ provider: CXProvider) {
    print("[CallKit] 🔄 Provider reset")
  }
  
  func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    print("[CallKit] ✅ User answered call:", action.callUUID.uuidString)
    
    NotificationCenter.default.post(
      name: .linphoneAnswerCall,
      object: nil,
      userInfo: ["callId": action.callUUID.uuidString]
    )
    
    action.fulfill()
  }
  
  func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
    print("[CallKit] ❌ User ended call:", action.callUUID.uuidString)
    
    NotificationCenter.default.post(
      name: .linphoneEndCall,
      object: nil,
      userInfo: ["callId": action.callUUID.uuidString]
    )
    
    action.fulfill()
  }
  
  func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
    print("[CallKit] 🔊 Audio session activated")
  }
  
  func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
    print("[CallKit] 🔇 Audio session deactivated")
  }
}

// MARK: - Notifications

extension Notification.Name {
  static let linphoneRegisterVoipToken = Notification.Name("Linphone.RegisterVoipToken")
  static let linphoneEnsureInit        = Notification.Name("Linphone.EnsureInit")
  static let linphoneShowCallKit       = Notification.Name("Linphone.ShowCallKit")
  static let linphoneAnswerCall        = Notification.Name("Linphone.AnswerCall")
  static let linphoneEndCall           = Notification.Name("Linphone.EndCall")
}

// MARK: - React Native delegate

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
