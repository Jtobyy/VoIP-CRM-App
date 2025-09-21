import Foundation
import React
import linphonesw
import AVFoundation

@objc(LinphoneModule)
class LinphoneModule: RCTEventEmitter {

  private var core: Core?
  private var coreDelegate: LinphoneCoreDelegate?
  
  override static func requiresMainQueueSetup() -> Bool { true }
  override func supportedEvents() -> [String]! {
    return ["RegistrationChanged", "CallIncoming", "CallState", "CallEnded"]
  }
  
  private func startAudioSession() {
    let s = AVAudioSession.sharedInstance()
    try? s.setCategory(.playAndRecord, options: [.allowBluetooth, .defaultToSpeaker])
    try? s.setMode(.voiceChat)
    try? s.setActive(true)
  }
  
  private var toneEngine: AVAudioEngine?
  private var toneNode: AVAudioSourceNode?

  private let dtmfMap: [String:(Double,Double)] = [
    "1": (697,1209), "2": (697,1336), "3": (697,1477),
    "4": (770,1209), "5": (770,1336), "6": (770,1477),
    "7": (852,1209), "8": (852,1336), "9": (852,1477),
    "*": (941,1209), "0": (941,1336), "#": (941,1477)
  ]

  @objc(playKeyTone:)
  func playKeyTone(_ digit: NSString) {
    let d = String(digit)
    guard let (f1, f2) = dtmfMap[d] else { return }

    // lazy engine creation
    if toneEngine == nil { toneEngine = AVAudioEngine() }

    // tear down previous node if any (avoid overlap)
    if let node = toneNode {
      node.removeTap(onBus: 0)
      toneEngine?.detach(node)
      toneNode = nil
    }

    let sr = 48000.0 // match your call sample rate; 44.1k also fine
    var t: Double = 0
    let dt = 1.0 / sr
    let amp: Float = 0.18 // gentle UI click
    let twoPi = 2.0 * Double.pi

    let node = AVAudioSourceNode { _, _, frameCount, audioBufferList -> OSStatus in
      let abl = UnsafeMutableAudioBufferListPointer(audioBufferList)
      for frame in 0..<Int(frameCount) {
        let sample = sin(twoPi * f1 * t) + sin(twoPi * f2 * t)
        t += dt
        let v = Float(sample * 0.5) * amp
        for buf in abl {
          let ptr = buf.mData!.assumingMemoryBound(to: Float.self)
          ptr[frame] = v
        }
      }
      return noErr
    }

    let format = AVAudioFormat(standardFormatWithSampleRate: sr, channels: 1)!
    toneEngine?.attach(node)
    toneEngine?.connect(node, to: toneEngine!.mainMixerNode, format: format)

    do {
      if !(toneEngine?.isRunning ?? false) { try toneEngine?.start() }
    } catch {
      NSLog("DTMF: engine start failed \(error)")
      return
    }

    toneNode = node

    DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) { [weak self] in
      guard let self = self else { return }
      if let n = self.toneNode {
        self.toneEngine?.disconnectNodeInput(n)
        self.toneEngine?.detach(n)
        self.toneNode = nil
      }
    }
  }
  
  // MARK: - Bridge API
  
  @objc(init:)
  func `init`(_ cfg: NSDictionary?) {
    if core != nil { return }
    startAudioSession()
    
    let f = Factory.Instance
    do {
      core = try f.createCore(configPath: nil, factoryConfigPath: nil, systemContext: nil)
      
      let delegate = LinphoneCoreDelegate(module: self)
      coreDelegate = delegate
      core?.addDelegate(delegate: delegate)
      try core?.start()
    } catch {
      NSLog("Linphone: createCore/start failed: \(error)")
    }
  }
  
  deinit {
    if let d = coreDelegate { core?.removeDelegate(delegate: d) }
  }
  
  @objc(register:)
  func register(_ acc: NSDictionary) {
    guard let core = core else { return }
    
    let username = acc["username"] as? String ?? ""
    let password = acc["password"] as? String ?? ""
    let domain   = acc["domain"]   as? String ?? ""
    let transport = (acc["transport"] as? String)?.lowercased()
    
    do {
      let auth = try Factory.Instance.createAuthInfo(
        username: username, userid: nil, passwd: password,
        ha1: nil, realm: nil, domain: domain
      )
      core.addAuthInfo(info: auth)
      
      let identity = "sip:\(username)@\(domain)"
      guard let idAddr = try? Factory.Instance.createAddress(addr: identity) else { return }
      
      let proxy: ProxyConfig = try core.createProxyConfig()
      
      do {
        try proxy.setIdentityaddress(newValue: idAddr)
      } catch {
        print("An error occurred when setting identity: \(error)")
      }
      
      
      var server = "sip:\(domain)"
      if let t = transport { server += ";transport=\(t)" }
      
      try proxy.setServeraddr(newValue: server)
      proxy.registerEnabled = true
      
      try core.addProxyConfig(config: proxy)
      core.defaultProxyConfig = proxy
      
    } catch {
      NSLog("Linphone: register() failed: \(error)")
    }
  }
  
  @objc(call:)
  func call(_ sipUri: String) {
    guard let core = core,
          let addr = try? Factory.Instance.createAddress(addr: sipUri) else { return }
    _ = core.inviteAddress(addr: addr)
  }
  
  @objc(answer)
  func answer() {
    do {
      try core?.currentCall?.accept()
    } catch {
      NSLog("Linphone: answer() failed: \(error)")
    }
  }
  
  @objc(decline:)
  func decline(_ reasonStr: NSString?) {
    guard let call = core?.currentCall else {
      NSLog("Linphone: decline() — no active call")
      return
    }

    // Map a friendly string to Linphone Reason
    let r: Reason
    switch (reasonStr as String?)?.lowercased() {
    case "busy", "486":
      r = .Busy                      // 486 Busy Here
    case "notacceptable", "406":
      r = .NotAcceptable             // 406 Not Acceptable
    case "temporarilyunavailable", "480":
      r = .TemporarilyUnavailable    // 480 Temporarily Unavailable
    default:
      r = .Declined                  // 603 Decline (default)
    }

    do {
      try call.decline(reason: r)
    } catch {
      NSLog("Linphone: decline() failed: \(error)")
    }
  }

  @objc(hangup)
  func hangup() {
    do {
      try core?.currentCall?.terminate()
    } catch {
      NSLog("Linphone: hangup() failed: \(error)")
    }
  }
  
  @objc(mute:)
  func mute(_ on: Bool) { core?.micEnabled = !on }
  
  @objc(speaker:)
  func speaker(_ on: Bool) {
    let s = AVAudioSession.sharedInstance()
    try? s.overrideOutputAudioPort(on ? .speaker : .none)
  }
  
  @objc(sendDtmf:)
  func sendDtmf(_ d: String) {
    do {
      guard let byte = d.utf8.first else { return }
      let ch = CChar(bitPattern: byte)
      try core?.currentCall?.sendDtmf(dtmf: ch)
    } catch {
      print("Linphone: sendDtmf() failed: \(error)")
    }
  }

  @objc(hold)
  func hold() {
    do { try core?.currentCall?.pause() } catch {
      print("Linphone: hold() failed: \(error)")
    }
  }

  @objc(resume)
  func resume() {
    do {
      print("Resuming Call")
      try core?.currentCall?.resume();
    } catch {
      print("Linphone: resume() failed: \(error)")
    }
  }

  @objc(setRegisterEnabled:)
  func setRegisterEnabled(_ on: Bool) {
    guard let core = core, let proxy = core.defaultProxyConfig else { return }
    do {
      // some builds have a setter method, others a property; try both
      proxy.registerEnabled = on
      try? core.refreshRegisters() // nudge re-registration
    } catch {
      NSLog("Linphone: setRegisterEnabled(\(on)) failed: \(error)")
    }
  }
}

// Delegate to handle events and send them to React Native
class LinphoneCoreDelegate: CoreDelegate {
  private weak var module: LinphoneModule?
  
  init(module: LinphoneModule) {
    self.module = module
  }
  
  func onCallStateChanged(core: Core, call: Call, state: Call.State, message: String) {
    module?.sendEvent(withName: "CallState",
                      body: ["state": state.rawValue, "message": message]
    )
    
    switch state {
      case .IncomingReceived:
        print("call remote address is \(call.remoteAddress)")
        print("call remote address as string \(call.remoteAddressAsString)")
        print("call remote contact  \(call.remoteContact)")
        print("call remote contact address \(call.remoteContactAddress)")
        print("call remote remoteUserAgent \(call.remoteUserAgent)")
        print("call remote remoteParams \(call.remoteParams)")
        print("call remote toAddress \(call.toAddress)")

        
        let addr = call.remoteAddress
        let display = addr?.displayName ?? ""
        let username = addr?.username ?? ""                  // user part before @
        let uri = addr?.asStringUriOnly() ?? addr?.asString() ?? ""  // "sip:user@domain"

        // Prefer display name if present and not "anonymous", else the username.
        let short =
          (!display.isEmpty && display.lowercased() != "anonymous")
          ? display
          : username
      
        let from = call.remoteAddress?.asStringUriOnly() ?? ""
        module?.sendEvent(withName: "CallIncoming", body: [
          "from": short,             // <- best short label for UI
          "displayName": display,    // raw display-name
          "username": username,      // user part
          "uri": uri                 // full sip uri
        ])
      
      case .End, .Released, .Error:
        module?.sendEvent(withName: "CallEnded", body: [:])
      default:
        break
   }
  }
  
  func onRegistrationStateChanged(core: Core, proxyConfig: ProxyConfig, state: RegistrationState, message: String) {
    module?.sendEvent(withName: "RegistrationChanged", body: ["state": state.rawValue, "message": message])
  }
  
  func onCallReceived(core: Core, call: Call) {
    module?.sendEvent(withName: "CallIncoming", body: ["message": "Incoming call"])
  }
}

