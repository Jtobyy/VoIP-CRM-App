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
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import android.Manifest
import android.content.pm.PackageManager
import androidx.annotation.AnyThread
import androidx.annotation.MainThread
import androidx.annotation.WorkerThread
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.nativetalkbusiness.R
import com.nativetalkbusiness.MainActivity
import org.linphone.core.AudioDevice
import org.linphone.core.Call
import org.linphone.core.Core
import org.linphone.core.CoreListener
import org.linphone.core.CoreListenerStub
import org.linphone.core.Factory
import org.linphone.core.LogCollectionState
import org.linphone.core.Reason
import com.facebook.react.ReactActivity
import com.nativetalkbusiness.voice.Compatibility
import android.net.Uri
import android.app.Service.STOP_FOREGROUND_REMOVE


/**
 * Process-wide owner of Linphone Core. No React dependency.
 * Services and the RN module both talk to this.
 */
object CoreManager {
    // Core bits
    private var core: Core? = null
    private var listener: CoreListener? = null
    private var phoneAccountHandle: PhoneAccountHandle? = null

    private val callNotificationsMap: HashMap<String, Notifiable> = HashMap()
    private val notificationsMap = HashMap<Int, Notification>()

    private const val INCOMING_CALL_ID = 1
    const val INTENT_ANSWER_CALL_NOTIF_CODE = 2
    const val INTENT_DECLINE_CALL_NOTIF_CODE = 3

    const val ACTION_ANSWER_CALL = "com.nativetalkbusiness.ACTION_ANSWER"
    const val ACTION_DECLINE_CALL = "com.nativetalkbusiness.ACTION_DECLINE"
    
    private var callServiceForegroundNotificationPublished = false
    private var callService: CallService? = null

    // RN emitter (when RN is up)
    @Volatile
    private var reactContext: ReactApplicationContext? = null

    private lateinit var notificationManager: NotificationManagerCompat
    private lateinit var context: Context

    // === Public surface for native & RN ===
    @Synchronized
    fun ensureStarted(ctx: Context) {
        if (::context.isInitialized) return
        context = ctx.applicationContext
        notificationManager = NotificationManagerCompat.from(context)

        // registerPhoneAccount()

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
                    Call.State.IncomingReceived, Call.State.IncomingEarlyMedia -> {
                        val addr = call.remoteAddress
                        val disp = addr?.displayName ?: ""
                        val user = addr?.username ?: ""
                        val uri = addr?.asStringUriOnly() ?: addr?.asString() ?: ""

                        Log.d("LinphoneModule", "Incoming Call - State: $state, From: $disp, User: $user, URI: $uri")
                        
                        showCallNotification(call, true)

                        emit("CallIncoming", Arguments.createMap().apply {
                            putString("from", if (disp.isNotEmpty() && disp.lowercase() != "anonymous") disp else user)
                            putString("displayName", disp)
                            putString("username", user)
                            putString("uri", uri)
                        })
                    }

                    Call.State.Connected -> {
                        if (call.dir == Call.Dir.Incoming) {
                            Log.i(
                                "CoreManager", "Connected call was incoming (so it was answered), removing incoming call notification"
                            )
                            stopCallForegroundService()
                        } else {
                            Log.i("CoreManager", "Call is connected")
                            showCallNotification(call, false)
                        }
                    }
                    
                    Call.State.StreamsRunning -> {
                        
                    }

                    Call.State.End, Call.State.Released, Call.State.Error -> {
                        Log.d("CoreManager", "Call Ended or Error - State: $state")
                        stopCallForegroundService()
                        // val intent = Intent(context, CallService::class.java)
                        // context.stopService(intent)

                        // VoiceConnectionService.currentConnection?.setDisconnected(DisconnectCause(DisconnectCause.REMOTE))
                        // VoiceConnectionService.currentConnection?.destroy()
                        // VoiceConnectionService.currentConnection = null

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

    private fun createCallNotificationChannel() {
        val name = "Calls"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel("incoming_calls", name, NotificationManagerCompat.IMPORTANCE_HIGH).apply {
                description = name
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            notificationManager!!.createNotificationChannel(channel)

            notificationManager!!.createNotificationChannel(
                NotificationChannel("ongoing_calls", "Ongoing Calls", NotificationManager.IMPORTANCE_LOW)
                    .apply { lockscreenVisibility = Notification.VISIBILITY_PUBLIC }
            )
        }
    }

    @MainThread
    fun onCallServiceStarted(service: CallService) {
        Log.i("CoreManger", "Call Service has been started")
        callService = service
    }
    // fun startForegroundServiceWithCall(call: Call) {
    //     // This is the correct place to start the service after permission is confirmed
    //     context.startForegroundService(
    //         Intent(context, CallService::class.java).apply {
    //             action = "ACTION_SHOW_INCOMING"
    //             putExtra("displayName", LinphoneUtils.getDisplayName(call.remoteAddress))
    //             putExtra("remoteUri", call.remoteAddress.asStringUriOnly())
    //             putExtra("callId", call.callLog.callId)
    //         }
    //     )
    // }

    fun attachReact(react: ReactApplicationContext) {
        reactContext = react
    }
    fun detachReact() {
        reactContext = null
    }

    // @MainThread
    // private fun createIncomingCallNotificationChannel() {
    //     val name = "Incoming Calls"

    //     if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
    //         val channel = NotificationChannel("incoming_calls", name, NotificationManagerCompat.IMPORTANCE_HIGH).apply {
    //             description = name
    //             lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    //         }

    //         notificationManager?.createNotificationChannel(channel)

    //         notificationManager?.createNotificationChannel(
    //             NotificationChannel("ongoing_calls", "Ongoing Calls", NotificationManager.IMPORTANCE_LOW)
    //                 .apply { lockscreenVisibility = Notification.VISIBILITY_PUBLIC }
    //         )
    //     }
    // }
    
    // private fun registerPhoneAccount() {
    //     if (phoneAccountHandle != null) return
    //     val componentName = android.content.ComponentName(context!!, VoiceConnectionService::class.java)
    //     phoneAccountHandle = PhoneAccountHandle(componentName, "LinphoneAccount")

    //     val telecomManager = context!!.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
    //     val phoneAccount = PhoneAccount.Builder(phoneAccountHandle, "Nativetalk")
    //         .setCapabilities(
    //             PhoneAccount.CAPABILITY_CALL_PROVIDER or
    //                     PhoneAccount.CAPABILITY_SUPPORTS_TRANSACTIONAL_OPERATIONS or
    //                     PhoneAccount.CAPABILITY_SELF_MANAGED
    //         )
    //         .setSupportedUriSchemes(listOf(PhoneAccount.SCHEME_SIP, PhoneAccount.SCHEME_TEL))
    //         .build()

    //     try {
    //         telecomManager.registerPhoneAccount(phoneAccount)
    //         Log.d("CoreManager", "PhoneAccount registered successfully with TRANSACTIONAL_OPERATIONS")
    //     } catch (e: SecurityException) {
    //         Log.e("CoreManager", "SecurityException registering PhoneAccount: ${e.message}")
    //     }
    // }

    class Notifiable(val notificationId: Int) {
        var myself: String? = null

        var localIdentity: String? = null
        var remoteAddress: String? = null
    }

    @WorkerThread
    private fun getNotificationIdForCall(call: Call): Int {
        return call.callLog.startDate.toInt()
    }

    @WorkerThread
    private fun getNotifiableForCall(call: Call): Notifiable {
        val address = call.remoteAddress.asStringUriOnly()
        var notifiable: Notifiable? = callNotificationsMap[address]
        if (notifiable == null) {
            notifiable = Notifiable(getNotificationIdForCall(call))
            notifiable.remoteAddress = address

            callNotificationsMap[address] = notifiable
        }
        return notifiable
    }

    @AnyThread
    fun getCallDeclinePendingIntent(notifiable: Notifiable): PendingIntent {
        val hangupIntent = Intent(context, CallActionReceiver::class.java)
        hangupIntent.apply {
            action = ACTION_DECLINE_CALL
            putExtra("NOTIFICATION_ID", notifiable.notificationId)
            putExtra("REMOTE_ADDRESS", notifiable.remoteAddress)
        }

        return PendingIntent.getBroadcast(
            context,
            INTENT_DECLINE_CALL_NOTIF_CODE,
            hangupIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    @AnyThread
    fun getCallAnswerPendingIntent(notifiable: Notifiable): PendingIntent {
        val answerIntent = Intent(context, CallActionReceiver::class.java)
        answerIntent.apply {
            action = ACTION_ANSWER_CALL
            putExtra("NOTIFICATION_ID", notifiable.notificationId)
            putExtra("REMOTE_ADDRESS", notifiable.remoteAddress)
        }

        return PendingIntent.getBroadcast(
            context,
            INTENT_ANSWER_CALL_NOTIF_CODE,
            answerIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
    
    @WorkerThread
    private fun createCallNotification(
        call: Call,
        notifiable: Notifiable,
        pendingIntent: PendingIntent?,
        isIncoming: Boolean,
    ): Notification {
        Log.i("CoreManager", "createCallNotification")
        val declineIntent = getCallDeclinePendingIntent(notifiable)
        val answerIntent = getCallAnswerPendingIntent(notifiable)
        Log.i("CoreManager", "createCallNotification 2")
        val remoteAddress = call.callLog.remoteAddress
        Log.i("CoreManager", "createCallNotification 3")
        val caller = Person.Builder()
                .setName(LinphoneUtils.getDisplayName(remoteAddress).ifEmpty { "Unknown" })
                .setImportant(false)
                .build()
        val smallIcon = R.drawable.ic_stat_call
        Log.i("CoreManager", "createCallNotification 4")
        val style = if (isIncoming) {
            NotificationCompat.CallStyle.forIncomingCall(
                caller,
                declineIntent,
                answerIntent
            )
        } else {
            NotificationCompat.CallStyle.forOngoingCall(
                caller,
                declineIntent
            )
        }
        Log.i("CoreManager", "createCallNotification 5")
        val channelId = if (isIncoming) "incoming_calls" else "ongoing_calls"
        Log.i("CoreManager", "createCallNotification 6")
        // val channel = notificationManager?.getNotificationChannel(channelId)
        // val importance = channel?.importance ?: NotificationManagerCompat.IMPORTANCE_NONE

        Log.i("CoreManager", "Creating notification for ${if (isIncoming) "[incoming]" else "[outgoing]"}")
        Log.i("CoreManager", "createCallNotification 7")

        val builder = NotificationCompat.Builder(
            context,
            channelId
        ).apply {
            setColorized(true)
            setOnlyAlertOnce(true)
            setStyle(style)
            setSmallIcon(smallIcon)
            setCategory(NotificationCompat.CATEGORY_CALL)
            setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            if (isIncoming) {
                setPriority(NotificationCompat.PRIORITY_MAX)
            } else {
                setPriority(NotificationCompat.PRIORITY_HIGH)
            }
            setWhen(call.callLog.startDate * 1000) // timestamps are in seconds
            setAutoCancel(false)
            setOngoing(true)
            setContentIntent(pendingIntent)
            setFullScreenIntent(pendingIntent, true)
        }
        Log.i("CoreManager", "createCallNotification 8")

        return builder.build()
    }

    fun showIncomingCallForegroundServiceNotification(notification: Notification) {
        Log.i("CoreManager", "Trying to start foreground Service using incoming call notification")
        val service = callService
        if (service != null) {
            Log.i("CoreManager", "showIncomingCallForegroundServiceNotification 1")

            if (Compatibility.isPostNotificationsPermissionGranted(context)) {
                Log.i("CoreManager", "showIncomingCallForegroundServiceNotification 2")
                createCallNotificationChannel()
                Log.i("CoreManager", "showIncomingCallForegroundServiceNotification 3")
                Compatibility.startServiceForeground(
                    callService!!,
                    INCOMING_CALL_ID,
                    notification,
                    Compatibility.FOREGROUND_SERVICE_TYPE_PHONE_CALL
                )
                Log.i("CoreManager", "showIncomingCallForegroundServiceNotification 4")
                // Intent(context, CallService::class.java).apply { 
                //         action = "ACTION_SHOW_INCOMING"
                //         putExtra("displayName", LinphoneUtils.getDisplayName(call.remoteAddress))
                //         putExtra("remoteUri", call.remoteAddress.asStringUriOnly())
                //         putExtra("callId", call.callLog.callId)
                //     }
                // )
            } else {
                Log.e("CoreManager", "Post notifications permission not granted")
            }
        } else {
            Log.w("CoreManager", "Core Foreground Service hasn't started yet...") 
        }
    }

    private fun showCallNotification(call: Call, isIncoming: Boolean) {
        val notifiable = getNotifiableForCall(call)
 
        val callUri = Uri.parse("nativetalk://call/outgoing?callId=${call.callLog.callId}&phone=${call.remoteAddress.asStringUriOnly()}")
        val callNotificationIntent = Intent(Intent.ACTION_VIEW, callUri).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }

        if (isIncoming) {
            Log.i("CoreManager", "showCallNotification 5")
            callNotificationIntent.putExtra("IncomingCall", true)
        } else {
            Log.i("CoreManager", "showCallNotification 6")
            callNotificationIntent.putExtra("ActiveCall", true)
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            callNotificationIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = createCallNotification(
            call,
            notifiable,
            pendingIntent,
            isIncoming,
        )
        if (isIncoming) {
            Log.i("CoreManager", "showCallNotification 9")
            showIncomingCallForegroundServiceNotification(notification)
        } else {
            Log.i("CoreManager", "Not an incoming call")
            // showInCallForegroundServiceNotification(call, notifiable, notification)
        }
    }

    // private fun showInCallForegroundServiceNotification(call: Call, notifiable: Notifiable, notification: Notification) {
    //     val service = callService
    //     if (service == null) {
    //         Log.d("CoreManager", "Core Foreground Service hasn't started yet...")
    //         return
    //     }

    //     var mask = Compatibility.FOREGROUND_SERVICE_TYPE_PHONE_CALL
    //     val callState = call.state
    //     if (!LinphoneUtils.isCallIncoming(callState) && !LinphoneUtils.isCallOutgoing(callState) && !LinphoneUtils.isCallEnding(
    //             callState
    //         )
    //     ) {
    //         if (ActivityCompat.checkSelfPermission(
    //                 context,
    //                 Manifest.permission.RECORD_AUDIO
    //             ) == PackageManager.PERMISSION_GRANTED
    //         ) {
    //             mask = mask or Compatibility.FOREGROUND_SERVICE_TYPE_MICROPHONE
    //             Log.i(
    //                 "$TAG RECORD_AUDIO permission has been granted, adding FOREGROUND_SERVICE_TYPE_MICROPHONE to foreground Service types mask"
    //             )
    //         }
    //         val isSendingVideo = when (call.currentParams.videoDirection) {
    //             MediaDirection.SendRecv, MediaDirection.SendOnly -> true
    //             else -> false
    //         }
    //         if (call.currentParams.isVideoEnabled && isSendingVideo) {
    //             if (ActivityCompat.checkSelfPermission(
    //                     context,
    //                     Manifest.permission.CAMERA
    //                 ) == PackageManager.PERMISSION_GRANTED
    //             ) {
    //                 mask = mask or Compatibility.FOREGROUND_SERVICE_TYPE_CAMERA
    //                 Log.i(
    //                     "$TAG CAMERA permission has been granted, adding FOREGROUND_SERVICE_TYPE_CAMERA to foreground Service types mask"
    //                 )
    //             }
    //         }
    //     }

    //     if (Compatibility.isPostNotificationsPermissionGranted(context)) {
    //         Log.i(
    //             "$TAG Service found, starting it as foreground using notification ID [${notifiable.notificationId}] with type(s) [${foregroundServiceTypeMaskToString(mask)}]($mask)"
    //         )
    //         Compatibility.startServiceForeground(
    //             service,
    //             notifiable.notificationId,
    //             notification,
    //             mask
    //         )
    //         notificationsMap[notifiable.notificationId] = notification
    //         currentInCallServiceNotificationId = notifiable.notificationId
    //         inCallServiceForegroundNotificationPublished = true
    //         Log.i("$TAG Call notification with ID [${notifiable.notificationId}] has been used to start service as foreground")

    //         if (waitForInCallServiceForegroundToStopIt) {
    //             Log.i("$TAG We were waiting for foreground service to be started to stop it, doing it")
    //             stopInCallForegroundService()
    //         }
    //     } else {
    //         Log.e("$TAG POST_NOTIFICATIONS permission isn't granted, don't start foreground service!")
    //     }
    // }

    private fun stopCallForegroundService() {
        val service = callService
        if (service != null) {
            Log.i(
                "CoreManager", "Stopping foreground Service (was using notification ID))"
            )
            service.stopForeground(STOP_FOREGROUND_REMOVE)
            // service.stopSelf()
            callServiceForegroundNotificationPublished = false
        } else {
            Log.w("CoreManager", "Can't stop foreground Service & notif, no Service was found")
        }
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
        val rc = reactContext
        if (rc != null && rc.hasActiveCatalystInstance()) {
          rc.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(event, body)
        } else {
          // RN not ready; just skip (or buffer if you want)
        }
    }
}
