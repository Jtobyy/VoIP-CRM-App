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
import org.linphone.core.MediaDirection
import com.facebook.react.ReactActivity
import com.nativetalkbusiness.voice.Compatibility
import android.net.Uri
import android.app.Service.STOP_FOREGROUND_REMOVE
import com.nativetalkbusiness.voice.Utils

/**
 * Process-wide owner of Linphone Core. No React dependency.
 * Services and the RN module both talk to this.
 */
object CoreManager {
    // Core bits
    private var core: Core? = null
    private var listener: CoreListener? = null

    private val callNotificationsMap: HashMap<String, Notifiable> = HashMap()
    private val notificationsMap = HashMap<Int, Notification>()

    private const val INCOMING_CALL_ID = 1
    const val INTENT_ANSWER_CALL_NOTIF_CODE = 2
    const val INTENT_DECLINE_CALL_NOTIF_CODE = 3

    const val ACTION_ANSWER_CALL = "com.nativetalkbusiness.ACTION_ANSWER"
    const val ACTION_DECLINE_CALL = "com.nativetalkbusiness.ACTION_DECLINE"
    
    private var callServiceForegroundNotificationPublished = false
    private var currentInCallServiceNotificationId = -1
    private var inCallServiceForegroundNotificationPublished = false

    private var callService: CallService? = null
    private var waitForInCallServiceForegroundToStopIt = false


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
                        val notifiable = getNotifiableForCall(call)
                        if (notifiable.notificationId == currentInCallServiceNotificationId) {
                            Log.i(
                                "CoreManager", "Update foreground service type in case video was enabled/disabled since last time"
                            )
                            startInCallForegroundService(call)
                        }
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

    fun attachReact(react: ReactApplicationContext) {
        Log.d("CoreManager", "Attaching React Context")
        val call = core?.currentCall

        if (call != null && call.dir == Call.Dir.Incoming) {
            Log.d("CoreManager", "CallServiceForegroundNotificationPublished")

            val addr = call?.remoteAddress
            val disp = addr?.displayName ?: ""
            val user = addr?.username ?: ""
            val uri = addr?.asStringUriOnly() ?: addr?.asString() ?: ""
            Log.d("CoreManager", "Emiting call event")

            emit("CallIncoming", Arguments.createMap().apply {
                putString("from", if (disp.isNotEmpty() && disp.lowercase() != "anonymous") disp else user)
                putString("displayName", disp)
                putString("username", user)
                putString("uri", uri)
            })
        } else {
            Log.d("CoreManager", "No ongoing call")

        }

        reactContext = react
    }
    fun detachReact() {
        Log.d("CoreManager", "Detaching React Context")
        reactContext = null
    }

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
                .setName(Utils.getDisplayName(remoteAddress).ifEmpty { "Unknown" })
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
            if (Compatibility.isPostNotificationsPermissionGranted(context)) {
                createCallNotificationChannel()
                Compatibility.startServiceForeground(
                    callService!!,
                    INCOMING_CALL_ID,
                    notification,
                    Compatibility.FOREGROUND_SERVICE_TYPE_PHONE_CALL
                )
            } else {
                Log.e("CoreManager", "Post notifications permission not granted")
            }
        } else {
            Log.w("CoreManager", "Core Foreground Service hasn't started yet...") 
        }
    }

    private fun showCallNotification(call: Call, isIncoming: Boolean) {
        val notifiable = getNotifiableForCall(call)
        val displayName = Utils.getDisplayName(call.callLog.remoteAddress).ifEmpty { "Unknown" }
        val initials = displayName.take(2).uppercase()
        val phone = call.remoteAddress.asStringUriOnly()

        val path = if (isIncoming) "incoming" else "outgoing"
        val callUri = Uri.parse(
            "nativetalk://call/$path?callId=${call.callLog.callId}" +
            "&phone=${phone}" +
            "&displayName=${Uri.encode(displayName)}" +
            "&initials=${initials}" +
            "&name=${Uri.encode(displayName)}"
        )
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
            showInCallForegroundServiceNotification(call, notifiable, notification)
        }
    }

    private fun showInCallForegroundServiceNotification(call: Call, notifiable: Notifiable, notification: Notification) {
        val service = callService
        if (service == null) {
            Log.d("CoreManager", "Core Foreground Service hasn't started yet...")
            return
        }

        var mask = Compatibility.FOREGROUND_SERVICE_TYPE_PHONE_CALL
        val callState = call.state
        
        if (!Utils.isCallIncoming(callState) && !Utils.isCallOutgoing(callState) && !Utils.isCallEnding(
                callState
            )
        ) {
            if (ActivityCompat.checkSelfPermission(
                    context,
                    Manifest.permission.RECORD_AUDIO
                ) == PackageManager.PERMISSION_GRANTED
            ) {
                mask = mask or Compatibility.FOREGROUND_SERVICE_TYPE_MICROPHONE
                Log.i(
                    "CoreManager", "RECORD_AUDIO permission has been granted, adding FOREGROUND_SERVICE_TYPE_MICROPHONE to foreground Service types mask"
                )
            }
        }

        if (Compatibility.isPostNotificationsPermissionGranted(context)) {
            Log.i(
                "CoreManager", "Service found, starting it as foreground using notification ID [${notifiable.notificationId}]"
            )
            Compatibility.startServiceForeground(
                service,
                notifiable.notificationId,
                notification,
                mask
            )
            notificationsMap[notifiable.notificationId] = notification
            currentInCallServiceNotificationId = notifiable.notificationId
            inCallServiceForegroundNotificationPublished = true
            Log.i("CoreManager", "Call notification with ID [${notifiable.notificationId}] has been used to start service as foreground")

            if (waitForInCallServiceForegroundToStopIt) {
                Log.d("CoreManager", "We were waiting for foreground service to be started to stop it, doing it")
                stopCallForegroundService()
            }
        } else {
            Log.e("CoreManager", "POST_NOTIFICATIONS permission isn't granted, don't start foreground service!")
        }
    }

    @WorkerThread
    private fun startInCallForegroundService(call: Call) {
        if (Utils.isCallIncoming(call.state)) {
            val notification = notificationsMap[INCOMING_CALL_ID]
            if (notification != null) {
                showIncomingCallForegroundServiceNotification(notification)
            } else {
                Log.w(
                    "CoreManager", "Failed to find notification for incoming call with ID [$INCOMING_CALL_ID]"
                )
            }
            return
        }

        Log.i("CoreManager", "Trying to start/update foreground Service using call notification")
        val service = callService
        if (service == null) {
            Log.w("CoreManager", "Core Foreground Service hasn't started yet...")
            return
        }

        val channelId = context.getString(R.string.notification_channel_call_id)
        val channel = notificationManager.getNotificationChannel(channelId)
        val importance = channel?.importance ?: NotificationManagerCompat.IMPORTANCE_NONE
        if (importance == NotificationManagerCompat.IMPORTANCE_NONE) {
            Log.e("CoreManager", "Calls channel has been disabled, can't start foreground service!")
            stopCallForegroundService()
            return
        }

        val notifiable = getNotifiableForCall(call)
        val notificationId = notifiable.notificationId
        val notification = if (notificationsMap.containsKey(notificationId)) {
            notificationsMap[notificationId]
        } else if (notificationsMap.containsKey(INCOMING_CALL_ID)) {
            notificationsMap[INCOMING_CALL_ID]
        } else {
            Log.w("CoreManager", "Failed to find a notification for call [${call.remoteAddress.asStringUriOnly()}] in map")
            null
        }
        if (notification == null) {
            Log.w(
                "CoreManager", "existing notification (ID [$notificationId]) found for current call [${call.remoteAddress.asStringUriOnly()}], aborting"
            )
            stopCallForegroundService()
            return
        }
        Log.i("CoreManager", "Found notification [$notificationId] for current Call")

        showInCallForegroundServiceNotification(call, notifiable, notification)
    }

    private fun stopCallForegroundService() {
        val service = callService
        if (service != null) {
            Log.i(
                "CoreManager", "Stopping foreground Service (was using notification ID))"
            )
            service.stopForeground(STOP_FOREGROUND_REMOVE)
            // service.stopSelf()
            callServiceForegroundNotificationPublished = false
            inCallServiceForegroundNotificationPublished = false
            waitForInCallServiceForegroundToStopIt = false
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
