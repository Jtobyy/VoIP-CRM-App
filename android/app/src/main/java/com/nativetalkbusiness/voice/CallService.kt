package com.nativetalkbusiness.voice

import android.app.*
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.nativetalkbusiness.MainActivity
import com.nativetalkbusiness.R
import com.nativetalkbusiness.voice.CoreManager
import android.Manifest
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import android.os.Build
import android.net.Uri
import android.content.pm.ServiceInfo
import android.content.pm.PackageManager
import android.util.Log

class CallService : Service() {
    private val channelId = "calls"
    private val notificationManager by lazy { NotificationManagerCompat.from(this) }


    override fun onCreate() {
        super.onCreate()
        Log.i("CallService", "onCreate")

    }

    // private fun buildTypes(phoneCall: Boolean, microphone: Boolean, isIncoming: Boolean = true): Int? {
    //     val has29Plus = Build.VERSION.SDK_INT >= 29
    //     if (!has29Plus) return null
    //     var t = 0
    //     if (phoneCall)   t = t or ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL

    //     if (microphone && !isIncoming) {
    //         t = t or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
    //     }
    //     return t
    //   }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i("CallService", "onStartCommand")
        CoreManager.onCallServiceStarted(this)

        // CoreManager.ensureStarted(applicationContext)
        // Log.i("CallService", "onStartCommand 2")

        // when (intent?.action) {
        //     "ACTION_SHOW_INCOMING" -> {
        //         Log.i("CallService", "onStartCommand 3")
        //         val name = intent.getStringExtra("displayName") ?: "Unknown"
        
        //         val answerPI = PendingIntent.getBroadcast(
        //             this, 1,
        //             Intent(this, CallActionReceiver::class.java).setAction(CoreManager.ACTION_ANSWER_CALL),
        //             PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        //         )
        //         Log.i("CallService", "onStartCommand 4")
        //         val declinePI = PendingIntent.getBroadcast(
        //             this, 2,
        //             Intent(this, CallActionReceiver::class.java).setAction(CoreManager.ACTION_DECLINE_CALL),
        //             PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        //         )
        //         Log.i("CallService", "onStartCommand 5")
        
        //         val person = androidx.core.app.Person.Builder()
        //             .setName(name)
        //             .setImportant(true)
        //             .build()
        
        //         val style = NotificationCompat.CallStyle.forIncomingCall(person, declinePI, answerPI)
        
        //         val fullScreen = PendingIntent.getActivity(
        //             this, 3,
        //             Intent(Intent.ACTION_VIEW, Uri.parse("nativetalk://call/incoming")),
        //             PendingIntent.FLAG_IMMUTABLE
        //         )
        
        //         val notif = NotificationCompat.Builder(this, "incoming_calls")
        //             .setSmallIcon(R.drawable.ic_stat_call)
        //             .setStyle(style) // <-- critical
        //             .setCategory(NotificationCompat.CATEGORY_CALL)
        //             .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
        //             .setPriority(NotificationCompat.PRIORITY_MAX)
        //             .setOngoing(true)
        //             .setFullScreenIntent(fullScreen, true)
        //             .build()
        
        //         Log.i("CallService", "onStartCommand 6")
        //         val hasRecordAudio = ContextCompat.checkSelfPermission(
        //             this, Manifest.permission.RECORD_AUDIO
        //             ) == PackageManager.PERMISSION_GRANTED
        //         Log.i("CallService", "onStartCommand 7")
                
        //         val types = buildTypes(phoneCall = true, microphone = hasRecordAudio, isIncoming = true)

        //         Log.i("CallService", "onStartCommand 8")
        //         if (types != null) {
        //             // API 29+ has the 3-arg overload; on some older 29 devices the flags are ignored harmlessly
        //             Log.i("CallService", "onStartCommand 9")

        //             // startForeground(1001, notif, types)
        //             startForeground(1001, notif)

        //             Log.i("CallService", "onStartCommand 10")

        //         } else {
        //             Log.i("CallService", "onStartCommand 11")

        //             startForeground(1001, notif)
        //             Log.i("CallService", "onStartCommand 12")

        //         }
        //     }
      
        //     "ACTION_SHOW_ONGOING" -> {
        //       val contentPI = PendingIntent.getActivity(
        //         this, 4, Intent(this, com.nativetalkbusiness.MainActivity::class.java),
        //         PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        //       )
        //       val notif = NotificationCompat.Builder(this, "ongoing_calls")
        //         .setSmallIcon(R.drawable.ic_stat_call)
        //         .setContentTitle("On call")
        //         .setContentText("Tap to return")
        //         .setContentIntent(contentPI)
        //         .setOngoing(true)
        //         .build()
        //       startForeground(1001, notif)
        //     }
      
        //     else -> {
        //       // Ensure we are in FGS state quickly if something else started us
        //       val baseline = NotificationCompat.Builder(this, "ongoing_calls")
        //         .setSmallIcon(R.drawable.ic_stat_call)
        //         .setContentTitle("Call service")
        //         .setOngoing(true)
        //         .build()
        //       startForeground(1001, baseline)
        //     }
        // }

        // return START_STICKY
        return super.onStartCommand(intent, flags, startId)
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        // Restart service if it is removed (e.g., app swiped away)
        startService(Intent(applicationContext, CallService::class.java))
        super.onTaskRemoved(rootIntent)
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.i("CallService", "onDestroy")
        // Clean up if necessary
    }
}
