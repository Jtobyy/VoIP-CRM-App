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
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i("CallService", "onStartCommand")
        CoreManager.onCallServiceStarted(this)

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
    }
}
