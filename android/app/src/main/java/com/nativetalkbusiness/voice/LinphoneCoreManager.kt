package com.nativetalkbusiness.voice

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.telecom.DisconnectCause
import android.telecom.PhoneAccount
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.Person
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.nativetalkbusiness.R
import org.linphone.core.AudioDevice
import org.linphone.core.Call
import org.linphone.core.Core
import org.linphone.core.CoreListener
import org.linphone.core.CoreListenerStub
import org.linphone.core.Factory
import org.linphone.core.LogCollectionState
import org.linphone.core.Reason


/**
 * Process-wide owner of Linphone Core. No React dependency.
 * Services and the RN module both talk to this.
 */
object LinphoneCoreManager {
    // Core bits
    private var core: Core? = null
    private var listener: CoreListener? = null
    private var phoneAccountHandle: PhoneAccountHandle? = null


    // Optional RN emitter (when RN is up)
    @Volatile
    private var reactContext: ReactApplicationContext? = null
    @Volatile
    private var backgroundService: LinphoneBackgroundService? = null


    // === Public surface for native & RN ===
    @Synchronized
    fun ensureStarted(context: Context) {
        if (core != null) return

        createNotificationChannel(context)
        registerPhoneAccount(context)

        val f = Factory.instance()
        f.setLogCollectionPath(context.filesDir.absolutePath)
        f.enableLogCollection(LogCollectionState.Enabled)

        core = f.createCore(null, null, context)

        listener = object : CoreListenerStub() {

            override fun onRegistrationStateChanged(
                c: Core,
                proxy: org.linphone.core.ProxyConfig,
                state: org.linphone.core.RegistrationState,
                message: String
            ) {
                emit("RegistrationChanged", Arguments.createMap().apply {
                    putString("state", state.toString()); putString("message", message)
                })
                Log.d("LinphoneModule", "Registration Changed - State: $state, Message: $message");
            }

            override fun onCallStateChanged(c: Core, call: Call, state: Call.State, message: String) {
                Log.d("LinphoneModule", "Starting listener");

                emit("CallState", Arguments.createMap().apply {
                    putString("state", state.toString()); putString("message", message)
                })

                when (state) {
                    Call.State.IncomingReceived, Call.State.IncomingEarlyMedia, Call.State.PushIncomingReceived -> {
                        val addr = call.remoteAddress
                        val disp = addr?.displayName ?: ""
                        val user = addr?.username ?: ""
                        val uri = addr?.asStringUriOnly() ?: addr?.asString() ?: ""

                        Log.d("LinphoneModule", "Incoming Call - State: $state, From: $disp, User: $user, URI: $uri")

                        val context = reactContext ?: backgroundService
                        if (context != null) {
                            reportIncomingCall(context, call)
                        } else {
                            Log.e("LinphoneModule", "No context available for incoming call!")
                        }

                        emit("CallIncoming", Arguments.createMap().apply {
                            putString("from", if (disp.isNotEmpty() && disp.lowercase() != "anonymous") disp else user)
                            putString("displayName", disp)
                            putString("username", user)
                            putString("uri", uri)
                        })
                    }

                    Call.State.Connected, Call.State.StreamsRunning -> {
                        val context = reactContext ?: backgroundService
                        if (context != null) {
                            val intent = Intent(context, CallService::class.java)
                            intent.putExtra("callState", "Ongoing")
                            context.startForegroundService(intent)
                        }
                    }

                    Call.State.End, Call.State.Released, Call.State.Error -> {
                        Log.d("LinphoneModule", "Call Ended or Error - State: $state")

                        val context = reactContext ?: backgroundService
                        if (context != null) {
                            val intent = Intent(context, CallService::class.java)
                            context.stopService(intent)
                        }

                        VoiceConnectionService.currentConnection?.setDisconnected(DisconnectCause(DisconnectCause.REMOTE))
                        VoiceConnectionService.currentConnection?.destroy()
                        VoiceConnectionService.currentConnection = null

                        emit("CallEnded", Arguments.createMap())
                    }

                    else -> {
                        Log.d("LinphoneModule", "Other State - $state")
                    }
                }
            }
        }
        core!!.addListener(listener)

        core!!.start()
    }

    @MainThread
    private fun createNotificationChannel(context: Context) {
        val name = "Incoming Calls"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel("incoming_calls", name, NotificationManagerCompat.IMPORTANCE_HIGH).apply {
                description = name
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
    // @MainThread
    // private fun createIncomingCallNotificationChannelWithoutRingtone() {
    //     val id = context.getString(R.string.notification_channel_without_ringtone_incoming_call_id)
    //     val name = context.getString(R.string.notification_channel_incoming_call_name)

    //     val channel = NotificationChannel(id, name, NotificationManager.IMPORTANCE_HIGH).apply {
    //         description = name
    //         lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    //         setShowBadge(false)
    //     }
    //     notificationManager.createNotificationChannel(channel)
    // }


    private fun registerPhoneAccount(context: Context) {
        if (phoneAccountHandle != null) return
        val componentName = android.content.ComponentName(context, VoiceConnectionService::class.java)
        phoneAccountHandle = PhoneAccountHandle(componentName, "LinphoneAccount")

        val telecomManager = context.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
        val phoneAccount = PhoneAccount.Builder(phoneAccountHandle, "Nativetalk")
            .setCapabilities(
                PhoneAccount.CAPABILITY_CALL_PROVIDER or
                        PhoneAccount.CAPABILITY_SUPPORTS_TRANSACTIONAL_OPERATIONS or
                        PhoneAccount.CAPABILITY_SELF_MANAGED
            )
            .setSupportedUriSchemes(listOf(PhoneAccount.SCHEME_SIP, PhoneAccount.SCHEME_TEL))
            .build()

        try {
            telecomManager.registerPhoneAccount(phoneAccount)
            Log.d("LinphoneCoreManager", "PhoneAccount registered successfully with TRANSACTIONAL_OPERATIONS")
        } catch (e: SecurityException) {
            Log.e("LinphoneCoreManager", "SecurityException registering PhoneAccount: ${e.message}")
        }
    }

    private fun showCallNotification(call: Call, context: Context, callerName: String) {
        // Fallback notification if addNewIncomingCall fails
        val intent = Intent(context, CallService::class.java)
        intent.putExtra("callState", "Incoming")
        intent.putExtra("callerName", callerName)
        context.startForegroundService(intent)
    }

    private fun reportIncomingCall(context: Context, call: Call) {
        Log.d("LinphoneCoreManager", "Creating CallStyle heads-up notification")

        val context = if (context is LinphoneBackgroundService) {
            context.applicationContext
        } else {
            context
        }
        if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) {
            Log.e("LinphoneCoreManager", "Notification permission not granted!")
            return
        }

        val addr = call.remoteAddress
        val callerNumber = addr?.username ?: addr?.asStringUriOnly() ?: "Unknown"
        val callerName = addr?.displayName?.takeIf { it.isNotEmpty() } ?: callerNumber

        // Create pending intents for answer/decline actions
        val answerIntent = Intent(context, CallActionReceiver::class.java).apply {
            action = CallActionReceiver.ACTION_ANSWER_CALL
            putExtra(CallActionReceiver.EXTRA_CALL_ID, callerNumber)
        }
        val answerPendingIntent = PendingIntent.getBroadcast(
            context, 1, answerIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val declineIntent = Intent(context, CallActionReceiver::class.java).apply {
            action = CallActionReceiver.ACTION_DECLINE_CALL
            putExtra(CallActionReceiver.EXTRA_CALL_ID, callerNumber)
        }
        val declinePendingIntent = PendingIntent.getBroadcast(
            context, 2, declineIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Create the caller Person object
        val caller = Person.Builder()
            .setName(callerName)
            .setImportant(true)
            .build()

        // Create CallStyle notification
        val callStyle = NotificationCompat.CallStyle.forIncomingCall(
            caller,
            declinePendingIntent,
            answerPendingIntent
        )

        // Main app intent when notification is tapped
        val mainIntent = Intent(context, com.nativetalkbusiness.MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        val mainPendingIntent = PendingIntent.getActivity(
            context, 0, mainIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, "incoming_calls")
            .setSmallIcon(R.drawable.ic_stat_call) // Make sure this icon exists
            .setStyle(callStyle)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(mainPendingIntent)
            .setFullScreenIntent(mainPendingIntent, true)
            .build()

        val notificationManager = NotificationManagerCompat.from(context)
        try {
            notificationManager.notify("incoming_call", 100, notification)
            Log.d("LinphoneCoreManager", "CallStyle notification shown successfully")
        } catch (e: Exception) {
            Log.e("LinphoneCoreManager", "Failed to show CallStyle notification: ${e.message}")
        }
    }

    fun attachReactEmitter(rc: ReactApplicationContext?) {
        reactContext = rc
    }

    fun register(username: String, password: String, domain: String, transport: String?) {
        val c = core ?: return
        try {
            val auth = Factory.instance().createAuthInfo(username, null, password, null, null, domain)
            c.addAuthInfo(auth)

            val id = Factory.instance().createAddress("sip:$username@$domain") ?: return
            val proxy = c.createProxyConfig().apply {
                identityAddress = id
                var server = "sip:$domain"
                if (!transport.isNullOrEmpty()) server += ";transport=${transport.lowercase()}"
                serverAddr = server
                isRegisterEnabled = true
            }
            c.addProxyConfig(proxy)
            c.defaultProxyConfig = proxy
        } catch (_: Exception) {
        }
    }

    fun call(sipUri: String) {
        val c = core ?: return
        try {
            val addr = Factory.instance().createAddress(sipUri) ?: return
            val params = c.createCallParams(null) ?: return
            c.inviteAddressWithParams(addr, params)
        } catch (_: Exception) {
        }
    }

    fun answer() {
        try {
            core?.currentCall?.accept()
        } catch (_: Exception) {
        }
    }

    fun decline(reason: Reason = Reason.Declined) {
        val call = core?.currentCall ?: return
        try {
            when (call.state) {
                Call.State.IncomingReceived, Call.State.IncomingEarlyMedia -> call.decline(reason)
                else -> call.terminate()
            }
        } catch (_: Exception) {
        }
    }

    fun end() {
        val call = core?.currentCall ?: return
        try {
            when (call.state) {
                Call.State.IncomingReceived, Call.State.IncomingEarlyMedia -> call.decline(Reason.Declined)
                else -> call.terminate()
            }
        } catch (_: Exception) {
        }
    }

    fun mute(on: Boolean) {
        core?.isMicEnabled = !on
    }

    fun speaker(on: Boolean) {
        val c = core ?: return
        val dev = c.audioDevices?.let { devices ->
            if (on) devices.firstOrNull { it.type == AudioDevice.Type.Speaker }
            else devices.firstOrNull { it.type == AudioDevice.Type.Earpiece }
        }
        if (dev != null) c.outputAudioDevice = dev
    }

    fun sendDtmf(d: String) {
        try {
            val b = d.encodeToByteArray().firstOrNull() ?: return
            core?.currentCall?.sendDtmf(b.toInt().toChar())
        } catch (_: Exception) {
        }
    }

    fun hold() {
        try {
            core?.currentCall?.pause()
        } catch (_: Exception) {
        }
    }

    fun resume() {
        try {
            core?.currentCall?.resume()
        } catch (_: Exception) {
        }
    }

    fun setRegisterEnabled(on: Boolean) {
        val c = core ?: return
        val proxy = c.defaultProxyConfig ?: return
        try {
            proxy.isRegisterEnabled = on; c.refreshRegisters()
        } catch (_: Exception) {
        }
    }

    @Synchronized
    fun stop() {
        try {
            listener?.let { core?.removeListener(it) }
            core?.stop()
        } catch (_: Exception) {
        }
        core = null
    }

    private fun emit(event: String, body: com.facebook.react.bridge.WritableMap) {
        val rc = reactContext ?: return
        rc.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(event, body)
    }
}
