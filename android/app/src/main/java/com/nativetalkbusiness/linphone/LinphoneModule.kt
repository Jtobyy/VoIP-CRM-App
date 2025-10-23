package com.nativetalkbusiness.linphone

import android.media.AudioManager
import android.media.ToneGenerator
import android.util.Log
import com.facebook.react.bridge.*
import com.nativetalkbusiness.voice.CoreManager
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.content.Intent
import com.nativetalkbusiness.voice.BackgroundService
import com.nativetalkbusiness.voice.CallService
import com.nativetalkbusiness.voice.TelephonyMonitor
import org.linphone.core.ProxyConfig
import org.linphone.core.RegistrationState
import org.linphone.core.Core

private fun regStateToString(s: RegistrationState?): String {
  val stateString = when (s) {
    RegistrationState.None -> "none"
    RegistrationState.Progress -> "progress"
    RegistrationState.Ok -> "ok"
    RegistrationState.Cleared -> "cleared"
    RegistrationState.Failed -> "failed"
    else -> "unknown"
  }
  
  Log.i("LinphoneModule", "Registration state: $stateString")
  Log.i("LinphoneModule", "Registration state: $s")
  return stateString
}

class LinphoneModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

    private var dtmfTone: ToneGenerator? = null

    override fun getName() = "LinphoneModule"

    private fun send(event: String, body: WritableMap) {
      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(event, body)
    }

    // === API exposed to JS ===
    @ReactMethod
    fun init(cfg: ReadableMap?, promise: Promise) {
      Log.i("LinphoneModule", "Ensuring registration")

      try {
        CoreManager.attachReact(reactContext)
        TelephonyMonitor.attachReact(reactContext)
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("INIT_FAILED", e)
      }
    }

    @ReactMethod
    fun startNativeServices() {
      CoreManager.ensureStarted(reactContext)
      BackgroundService.startService(reactContext)
    }

    @ReactMethod
    fun stopNativeServices(logout: Boolean) {
      // Tell background service not to self-restart if we’re logging out
      if (logout) BackgroundService.shouldRestart = false

      // Stop call/fg services
      reactContext.stopService(Intent(reactContext, CallService::class.java))
      BackgroundService.stopService(reactContext)

      // Tear down Linphone core
      CoreManager.stop()
    }

    @ReactMethod
    fun register(acc: ReadableMap) {
      Log.i("LinphoneModule", "Registering with ${acc.getString("username")}, ${acc.getString("password")}, ${acc.getString("domain")}, ${acc.getString("transport")}")
      CoreManager.register(
        acc.getString("username") ?: "",
        acc.getString("password") ?: "",
        acc.getString("domain") ?: "",
        acc.getString("transport") ?: "tcp"
      )
    }
    
    @ReactMethod
    fun getRegistrationStatus(promise: Promise) {
      try {
        val core: Core? = CoreManager.core()
        val pc: ProxyConfig? = core?.defaultProxyConfig
        val addr = pc?.identityAddress

        // Only use fields that exist on your ErrorInfo
        val diag: String = try {
          pc?.errorInfo?.phrase
            ?: pc?.errorInfo?.toString()
            ?: ""
        } catch (_: Throwable) { "" }

        val map = Arguments.createMap().apply {
          putString("state", regStateToString(pc?.state))
          putString("message", diag)
          putString("username", addr?.username ?: "")
          putString("domain", addr?.domain ?: "")
          putString("displayName", addr?.displayName ?: "")
        }
        promise.resolve(map)
      } catch (e: Throwable) {
        promise.reject("E_STATUS", "Failed to read registration status", e)
      }
    }

    @ReactMethod fun call(sipUri: String) = CoreManager.call(sipUri)
    @ReactMethod fun answer() = CoreManager.answer()
    @ReactMethod fun decline(reason: String?) = CoreManager.decline()
    @ReactMethod fun end() = CoreManager.end()
    @ReactMethod fun hangup() = end()
    @ReactMethod fun mute(on: Boolean) = CoreManager.mute(on)
    @ReactMethod fun speaker(on: Boolean) = CoreManager.speaker(on)
    @ReactMethod fun sendDtmf(d: String) = CoreManager.sendDtmf(d)
    @ReactMethod fun hold() = CoreManager.hold()
    @ReactMethod fun resume() = CoreManager.resume()
    @ReactMethod fun setRegisterEnabled(on: Boolean) = CoreManager.setRegisterEnabled(on)

    @ReactMethod fun addListener(event: String) {}
    @ReactMethod fun removeListeners(count: Int) {}

    @ReactMethod
    fun getCallLogs(promise: Promise) {
        try {
            val logs = CoreManager.getCallLogs()
            promise.resolve(logs)
        } catch (e: Exception) {
            Log.e("LinphoneModule", "getCallLogs failed", e)
            promise.reject("GET_CALL_LOGS_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun playKeyTone(d: String) {
      if (dtmfTone == null) {
        dtmfTone = ToneGenerator(AudioManager.STREAM_VOICE_CALL, 60)
      }
      val tone = when (d) {
        "0" -> ToneGenerator.TONE_DTMF_0
        "1" -> ToneGenerator.TONE_DTMF_1
        "2" -> ToneGenerator.TONE_DTMF_2
        "3" -> ToneGenerator.TONE_DTMF_3
        "4" -> ToneGenerator.TONE_DTMF_4
        "5" -> ToneGenerator.TONE_DTMF_5
        "6" -> ToneGenerator.TONE_DTMF_6
        "7" -> ToneGenerator.TONE_DTMF_7
        "8" -> ToneGenerator.TONE_DTMF_8
        "9" -> ToneGenerator.TONE_DTMF_9
        "*" -> ToneGenerator.TONE_DTMF_S
        "#" -> ToneGenerator.TONE_DTMF_P
        else -> ToneGenerator.TONE_PROP_BEEP
      }
      dtmfTone?.startTone(tone, 120)
    }

    override fun onCatalystInstanceDestroy() {
      TelephonyMonitor.detachReact()
      CoreManager.detachReact()
      super.onCatalystInstanceDestroy()
    }
}
