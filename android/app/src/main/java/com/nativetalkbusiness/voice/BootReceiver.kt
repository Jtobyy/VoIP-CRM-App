package com.nativetalkbusiness.voice

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            Intent.ACTION_PACKAGE_REPLACED,
            "com.nativetalkbusiness.RestartSensor" -> {
                Log.d("BootReceiver", "Received: ${intent.action}")
                
                // Start background service
                LinphoneBackgroundService.startService(context)
            }
        }
    }
}