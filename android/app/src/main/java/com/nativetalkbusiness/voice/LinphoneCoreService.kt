package com.nativetalkbusiness.voice

import android.app.*
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.nativetalkbusiness.MainActivity
import com.nativetalkbusiness.R
import com.nativetalkbusiness.linphone.LinphoneModule
import android.util.Log  
/**
 * Foreground service that owns Linphone Core, keeps it registered,
 * and listens for call state to dispatch Incoming/Connected/Ended transitions.
 */
class LinphoneCoreService : Service() {

  private val channelId = "voip_core"

  override fun onCreate() {
    super.onCreate()
    
    try {
      Log.i("LinphoneModule", "Ensuring registration")
      LinphoneBootstrap.ensureStarted(applicationContext)
    } catch (e: Exception) {
      // Handle any startup errors
    }

    // Notification channel
    val mgr = getSystemService(NotificationManager::class.java)
    val ch = NotificationChannel(
      channelId,
      "VoIP service",
      NotificationManager.IMPORTANCE_MIN
    )
    mgr?.createNotificationChannel(ch)

    // Start foreground with a quiet persistent notif
    val pending = PendingIntent.getActivity(
      this, 0, Intent(this, MainActivity::class.java),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val notif = NotificationCompat.Builder(this, channelId)
      .setSmallIcon(R.drawable.ic_stat_call)
      .setContentTitle("VoIP service active")
      .setContentText("Ready to receive calls")
      .setOngoing(true)
      .setContentIntent(pending)
      .build()

    startForeground(9001, notif)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    // Keep running if the process gets cleared
    return START_STICKY
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    // If user swipes app from recents, keep service alive
    startService(Intent(applicationContext, LinphoneCoreService::class.java))
    super.onTaskRemoved(rootIntent)
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onDestroy() {
    super.onDestroy()
  }
}
