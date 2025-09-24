package com.nativetalkbusiness.linphone

import android.media.AudioManager
import android.media.ToneGenerator
import android.util.Log
import com.facebook.react.bridge.*
import com.nativetalkbusiness.voice.LinphoneCoreManager
import com.facebook.react.modules.core.DeviceEventManagerModule

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
      // Ensure Linphone core is started from the service
      LinphoneCoreManager.ensureStarted(reactContext.applicationContext)
      LinphoneCoreManager.attachReactEmitter(reactContext)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("INIT_FAILED", e)
    }
  }

  @ReactMethod
  fun register(acc: ReadableMap) {
    LinphoneCoreManager.register(
      acc.getString("username") ?: "",
      acc.getString("password") ?: "",
      acc.getString("domain") ?: "",
      acc.getString("transport")
    )
  }

  @ReactMethod fun call(sipUri: String) = LinphoneCoreManager.call(sipUri)
  @ReactMethod fun answer() = LinphoneCoreManager.answer()
  @ReactMethod fun decline(reason: String?) = LinphoneCoreManager.decline()
  @ReactMethod fun end() = LinphoneCoreManager.end()
  @ReactMethod fun hangup() = end()
  @ReactMethod fun mute(on: Boolean) = LinphoneCoreManager.mute(on)
  @ReactMethod fun speaker(on: Boolean) = LinphoneCoreManager.speaker(on)
  @ReactMethod fun sendDtmf(d: String) = LinphoneCoreManager.sendDtmf(d)
  @ReactMethod fun hold() = LinphoneCoreManager.hold()
  @ReactMethod fun resume() = LinphoneCoreManager.resume()
  @ReactMethod fun setRegisterEnabled(on: Boolean) = LinphoneCoreManager.setRegisterEnabled(on)

  @ReactMethod fun addListener(event: String) {}
  @ReactMethod fun removeListeners(count: Int) {}

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
    super.onCatalystInstanceDestroy()
    LinphoneCoreManager.attachReactEmitter(null)
  }
}
