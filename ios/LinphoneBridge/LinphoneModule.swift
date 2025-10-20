import Foundation
import React
import linphonesw
import AVFoundation

@objc(LinphoneModule)
class LinphoneModule: RCTEventEmitter {

  private var core: Core?
  private var coreDelegate: LinphoneCoreDelegate?
  fileprivate var isEndingCall = false
  private var voipTokenHex: String?
  private var observersInstalled = false

  override static func requiresMainQueueSetup() -> Bool { true }
  override func supportedEvents() -> [String]! {
    return ["RegistrationChanged", "CallIncoming", "CallState", "CallEnded"]
  }
  
  // Helper method to ensure audio session is properly activated
  private func ensureAudioSessionActive() {
      let session = AVAudioSession.sharedInstance()
      
      // Check if session is already active
      guard !session.isOtherAudioPlaying else {
          NSLog("Linphone: Other audio is playing, skipping audio session activation")
          return
      }
      
      do {
          // Only reconfigure if necessary
          if session.category != .playAndRecord {
              try session.setCategory(.playAndRecord, options: [.allowBluetooth, .defaultToSpeaker])
          }
          
          if session.mode != .voiceChat {
              try session.setMode(.voiceChat)
          }
          
          // Always ensure it's active
          if !session.isOtherAudioPlaying {
              try session.setActive(true)
          }
          
          NSLog("Linphone: Audio session ensured active")
      } catch {
          NSLog("Linphone: Failed to ensure audio session active: \(error)")
      }
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
  
  private func stopUiTone() {
    if let node = toneNode {
      toneEngine?.disconnectNodeInput(node)
      toneEngine?.detach(node)
      toneNode = nil
    }
    if let eng = toneEngine, eng.isRunning {
      eng.stop()
    }
    toneEngine = nil
  }

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
  private func installObserversIfNeeded() {
    guard !observersInstalled else { return }
    observersInstalled = true

    NotificationCenter.default.addObserver(forName: .linphoneRegisterVoipToken, object: nil, queue: .main) { [weak self] note in
      guard let self = self,
            let hex = (note.userInfo?["token"] as? String),
            !hex.isEmpty else { return }
      self.registerVoipToken(hex as NSString)
    }

    NotificationCenter.default.addObserver(forName: .linphoneEnsureInit, object: nil, queue: .main) { [weak self] _ in
      self?.`init`([:]) // idempotent
    }
  }
  
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
      core?.pushNotificationEnabled = true
      try core?.start()
    } catch {
      NSLog("Linphone: createCore/start failed: \(error)")
    }
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
      
      let identityUri = "sip:\(username)@\(domain)"
      let identityAddr = try Factory.Instance.createAddress(addr: identityUri)
      
      let serverUri = "sip:\(domain)"
      let serverAddr = try Factory.Instance.createAddress(addr: serverUri)
      if let t = transport {
        switch t {
        case "tls": try serverAddr.setTransport(newValue: .Tls)
        case "tcp": try serverAddr.setTransport(newValue: .Tcp)
        default:    try serverAddr.setTransport(newValue: .Udp)
        }
      }

      let params = try core.createAccountParams()
      try params.setIdentityaddress(newValue: identityAddr)
      try params.setServeraddress(newValue: serverAddr)
      
      params.pushNotificationAllowed = true
      params.registerEnabled = true
      
      if let token = self.voipTokenHex, !token.isEmpty {
        params.pushNotificationConfig?.param = token
      }
      
      let account = try core.createAccount(params: params)
      try core.addAccount(account: account)
      core.defaultAccount = account
    } catch {
      NSLog("Linphone: register() failed: \(error)")
    }
  }

  @objc(getRegistrationStatus:rejecter:)
  func getRegistrationStatus(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard let core = core else {
      reject("NO_CORE", "Core not initialized", nil)
      return
    }
    
    guard let proxyConfig = core.defaultProxyConfig else {
      reject("NO_PROXY", "No default proxy config", nil)
      return
    }
    
    let addr = proxyConfig.identityAddress
    
    // Get diagnostic message from error info
    let diag: String = {
        do {
          if let phrase = proxyConfig.errorInfo?.phrase, !phrase.isEmpty {
            return phrase
          }
          return proxyConfig.errorInfo.debugDescription
        } catch {
          return ""
        }
    }()
    
    // Convert RegistrationState to string (matches your Kotlin implementation)
    let stateString: String = {
      switch proxyConfig.state {
      case .None:
        return "none"
      case .Progress:
        return "progress"
      case .Ok:
        return "ok"
      case .Cleared:
        return "cleared"
      case .Failed:
        return "failed"
      @unknown default:
        return "unknown"
      }
    }()
    
    let result: [String: Any] = [
      "state": stateString,
      "message": diag,
      "username": addr?.username ?? "",
      "domain": addr?.domain ?? "",
      "displayName": addr?.displayName ?? ""
    ]
    
    resolve(result)
  }
  
  @objc(registerVoipToken:)
  func registerVoipToken(_ tokenHex: NSString) {
    self.voipTokenHex = tokenHex as String
    print("Getting VoIP token")

    // If the core/account already exists, update params now and refresh registers
    guard let core = core, let account = core.defaultAccount else { return }
    do {
      // Clone current params, set the push param, re-apply
      if let newParams = account.params?.clone() {
        newParams.pushNotificationConfig?.param = self.voipTokenHex
        account.params = newParams
        try core.refreshRegisters()
        print("Linphone: applied VoIP token and refreshed registers")
      }
    } catch {
      print("Linphone: updating push token failed: \(error)")
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
    stopUiTone()
    ensureAudioSessionActive()

    guard let call = core?.currentCall else {
      NSLog("Linphone: decline() — no active call")
      return
    }

    // Map friendly string to Linphone Reason
    let r: Reason
    switch (reasonStr as String?)?.lowercased() {
    case "busy", "486":                     r = .Busy
    case "notacceptable", "406":            r = .NotAcceptable
    case "temporarilyunavailable", "480":   r = .TemporarilyUnavailable
    default:                                r = .Declined
    }

    // Only use decline for actual incoming states; otherwise terminate
    switch call.state {
    case .IncomingReceived, .IncomingEarlyMedia, .PushIncomingReceived:
      print("Linphone: declining call now")

      do { try call.accept(); try call.terminate()}
      catch { NSLog("Linphone: decline() failed: \(error)") }
    default:
      do { try call.terminate() }
      catch { NSLog("Linphone: terminate() (fallback from decline) failed: \(error)") }
    }
  }

  @objc(end)
  func end() {
    guard let call = core?.currentCall, !isEndingCall else { return }
    isEndingCall = true
    do {
      switch call.state {
      case .IncomingReceived, .PushIncomingReceived, .IncomingEarlyMedia:
        try call.decline(reason: .Declined) // or .Busy if you prefer
      default:
        try call.terminate()
      }
    } catch {
      isEndingCall = false
      NSLog("Linphone: end() failed: \(error)")
    }
  }
  
  @objc(hangup)
  func hangup() { end() }
  
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

  private func sipUserPart(_ uri: String) -> String {
    // "sip:100@domain" -> "100"
    if let at = uri.firstIndex(of: "@") {
      let start = uri.hasPrefix("sip:") ? uri.index(uri.startIndex, offsetBy: 4) : uri.startIndex
      return String(uri[start..<at])
    }
    // "sip:100" or "100"
    return uri.replacingOccurrences(of: "sip:", with: "")
  }

  private func mmss(_ seconds: Int) -> String {
    let m = seconds / 60
    let s = seconds % 60
    return String(format: "%02d:%02d", m, s)
  }

  private func guessCallType(direction: String, called: String, mySipUser: String?) -> String {
    // Heuristics: tweak to your business rules
    if called.count <= 3 { return "LOCAL" }
    if direction == "inbound", let me = mySipUser, called == me { return "DID" }
    return "STANDARD"
  }

  private func dispositionFor(status: String) -> String {
    // Map Linphone-ish statuses to your PBX wording (best-effort)
    let s = status.lowercased()
    if s.contains("success") || s.contains("ok") { return "NORMAL_CLEARING [16]" }
    if s.contains("missed")                       { return "NO_USER_RESPONSE [18]" }
    if s.contains("aborted") || s.contains("declined") || s.contains("cancel") {
      return "ORIGINATOR_CANCEL [487]"
    }
    if s.contains("busy")                         { return "USER_BUSY [17]" }
    if s.contains("notacceptable")                { return "NOT_ACCEPTABLE [406]" }
    if s.contains("temporarily")                  { return "TEMPORARILY_UNAVAILABLE [480]" }
    // Fallback
    return "NORMAL_CLEARING [16]"
  }
  
  @objc(getCallLogs:rejecter:)
  func getCallLogs(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard let logs = core?.callLogs else {
      resolve([])
      return
    }

    let df = ISO8601DateFormatter()

    // Try to get current account username for sip_user/call_type inference
    var mySipUser: String? = nil
    if let me = core?.defaultAccount?.params?.identityAddress?.username, !me.isEmpty {
      mySipUser = me
    }

    var items: [[String: Any]] = []

    for (idx, log) in logs.enumerated() {
      let fromRaw = log.fromAddress?.asStringUriOnly() ?? log.fromAddress?.asString() ?? ""
      let toRaw   = log.toAddress?.asStringUriOnly()   ?? log.toAddress?.asString()   ?? ""

      let fromNum = sipUserPart(fromRaw)
      let toNum   = sipUserPart(toRaw)

      // Direction
      let direction: String = {
        let s = String(describing: log.dir).lowercased()
        if s.contains("incoming") { return "inbound" }
        if s.contains("outgoing") { return "outbound" }
        return s // unknown/other
      }()

      // startDate is time_t (seconds since epoch)
      let startISO: String = {
        let seconds = TimeInterval(log.startDate)
        return df.string(from: Date(timeIntervalSince1970: seconds))
      }()

      // Caller ID "Name <number>" — we don't always have a display name, so use the number
      // If you have display names elsewhere, inject them here.
      let callerID = "\(fromNum) <\(fromNum)>"

      // Choose called_number:
      // - Server examples for outbound use dialed PSTN ("called_number": '0813...')
      // - For inbound, examples vary; we'll use the "to" user part consistently.
      let calledNumber = toNum

      // Type guess
      let callType = guessCallType(direction: direction, called: calledNumber, mySipUser: mySipUser)

      // Disposition map
      let disp = dispositionFor(status: String(describing: log.status))

      // Duration MM:SS
      let durationStr = mmss(Int(log.duration))

      // Destination: "Local" for LOCAL type, else ""
      let destination = (callType == "LOCAL") ? "Local" : ""

      // sip_user: your account username if known
      let sipUser = mySipUser ?? ""

      // ID: stable-ish hash from callId, fallback to index
      let idVal: Int = {
        if let cid = log.callId {
          return abs(cid.hashValue) // not perfect across launches, but stable per build/run
        }
        return 100000 + idx
      }()

      items.append([
        "id": idVal,
        "call_start": startISO,
        "call_type": callType,                 // "LOCAL" | "DID" | "STANDARD"
        "caller_id": callerID,                 // "Name <number>" best-effort
        "call_direction": direction,           // "inbound" | "outbound"
        "called_number": calledNumber,         // user part of "to"
        "disposition": disp,                   // mapped text + code
        "debit": "0.0000 NGN",                 // device doesn't know billing
        "duration": durationStr,               // "MM:SS"
        "destination": destination,            // "" or "Local"
        "sip_user": sipUser,                   // your SIP username
        "created_at": startISO,
        "updated_at": startISO
      ])
    }

    resolve(items)
  }
  deinit {
      if let d = coreDelegate { core?.removeDelegate(delegate: d) }

      if let node = toneNode {
        toneEngine?.disconnectNodeInput(node)
        toneEngine?.detach(node)
      }
      toneNode = nil
      toneEngine?.stop()
      toneEngine = nil
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
      case .IncomingReceived, .PushIncomingReceived, .IncomingEarlyMedia:

      let addr = call.remoteAddress
      let display = addr?.displayName ?? ""
      let username = addr?.username ?? ""                           // user part before @
      let uri = addr?.asStringUriOnly() ?? addr?.asString() ?? ""   // "sip:user@domain"
    
      // Prefer display name if present and not "anonymous", else the username.
      let short = (!display.isEmpty && display.lowercased() != "anonymous") ? display : username

      module?.sendEvent(withName: "CallIncoming", body: [
            "from": short,            // short label for UI
            "displayName": display,   // raw display-name
            "username": username,     // user part
            "uri": uri                // full sip uri
      ])
    
    case .End, .Released, .Error:
      module?.isEndingCall = false   // reset guard once call is finished
      module?.sendEvent(withName: "CallEnded", body: [:])
  
      default:
        break
   }
  }
  
  func onRegistrationStateChanged(core: Core, proxyConfig: ProxyConfig, state: RegistrationState, message: String) {
    module?.sendEvent(withName: "RegistrationChanged", body: ["state": state.rawValue, "message": message])
  }
}

