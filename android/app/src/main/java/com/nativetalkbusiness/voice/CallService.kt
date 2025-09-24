package com.nativetalkbusiness.voice

import android.app.*
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.nativetalkbusiness.MainActivity
import com.nativetalkbusiness.R
import com.nativetalkbusiness.voice.LinphoneCoreManager

class CallService : Service() {
    private val channelId = "calls"
    
    override fun onCreate() {
        super.onCreate()
        val mgr = getSystemService(NotificationManager::class.java)
        val ch = NotificationChannel(channelId, "Calls", NotificationManager.IMPORTANCE_LOW)
        mgr?.createNotificationChannel(ch)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        LinphoneCoreManager.ensureStarted(applicationContext)

        val callState = intent?.getStringExtra("callState") ?: "Idle"

        val serviceType = if (callState == "Incoming") {
            NotificationManager.IMPORTANCE_HIGH
        } else {
            NotificationManager.IMPORTANCE_LOW
        }

        val notification: Notification
        if (callState == "Incoming") {
            val fullScreenIntent = Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            val fullScreenPendingIntent = PendingIntent.getActivity(
                this, 0, fullScreenIntent, PendingIntent.FLAG_IMMUTABLE
            )

            notification = NotificationCompat.Builder(this, channelId)
                .setSmallIcon(R.drawable.ic_stat_call)
                .setContentTitle("Incoming call")
                .setContentText("Tap to answer")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .addAction(0, "Answer", fullScreenPendingIntent) 
                .build()
        } else {
            val pendingIntent = PendingIntent.getActivity(
                this, 0, Intent(this, MainActivity::class.java),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            notification = NotificationCompat.Builder(this, channelId)
                .setSmallIcon(R.drawable.ic_stat_call)
                .setContentTitle("On call")
                .setContentText("Tap to return to the call")
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build()
        }

        startForeground(1001, notification)

        return START_STICKY
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
        // Clean up if necessary
    }
}
