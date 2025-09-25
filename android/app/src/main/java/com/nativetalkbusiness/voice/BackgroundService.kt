package com.nativetalkbusiness.voice

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import com.nativetalkbusiness.R
import com.nativetalkbusiness.voice.CallService
import android.util.Log


class BackgroundService : Service() {
    companion object {
        private const val NOTIFICATION_ID = 1000
        private const val CHANNEL_ID = "nativetalk_background"
        
        fun startService(context: Context) {
            val intent = Intent(context, BackgroundService::class.java)
            context.startForegroundService(intent)
        }
        
        fun stopService(context: Context) {
            val intent = Intent(context, BackgroundService::class.java)
            context.stopService(intent)
        }
    }

    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        
        // Acquire wake lock to keep service alive
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "NativeTalk::BackgroundService"
        )
        wakeLock?.acquire(10*60*1000L /*10 minutes*/)
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)
        
        Log.i("BackgroundService", "CallService about to start")
        applicationContext.startService(Intent(applicationContext, CallService::class.java))
        Log.i("BackgroundService", "Started CallService")

        // Keep the service running in background
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onTaskRemoved(rootIntent: Intent?) {
        // Restart the service when app is swiped away
        val restartServiceIntent = Intent(applicationContext, BackgroundService::class.java)
        val restartPendingIntent = PendingIntent.getService(
            this, 1, restartServiceIntent, PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )
        val alarmService = getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmService.set(
            AlarmManager.ELAPSED_REALTIME,
            android.os.SystemClock.elapsedRealtime() + 1000,
            restartPendingIntent
        )
        super.onTaskRemoved(rootIntent)
    }

    override fun onDestroy() {
        super.onDestroy()
        wakeLock?.release()
        
        // Restart the service
        val broadcastIntent = Intent("com.nativetalkbusiness.RestartSensor")
        sendBroadcast(broadcastIntent)
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Nativetalk Background Service",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Keeps Nativetalk running to receive calls"
            setShowBadge(false)
        }
        
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Native Talk Ready")
            .setContentText("Ready to receive calls")
            .setSmallIcon(R.drawable.ic_stat_call)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}