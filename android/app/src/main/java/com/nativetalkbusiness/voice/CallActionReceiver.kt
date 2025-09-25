package com.nativetalkbusiness.voice

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class CallActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        Log.d("CallActionReceiver", "Received action: ${intent?.action}")
        
        when (intent?.action) {
            CoreManager.ACTION_ANSWER_CALL -> {
                Log.d("CallActionReceiver", "Answering call")
                CoreManager.answer()
            }
            CoreManager.ACTION_DECLINE_CALL  -> {
                Log.d("CallActionReceiver", "Declining call")
                CoreManager.decline()
            }
        }
    }
}