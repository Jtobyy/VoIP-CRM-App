package com.nativetalkbusiness.voice

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class CallActionReceiver : BroadcastReceiver() {
    companion object {
        const val ACTION_ANSWER_CALL = "com.nativetalkbusiness.ACTION_ANSWER"
        const val ACTION_DECLINE_CALL = "com.nativetalkbusiness.ACTION_DECLINE"
        const val EXTRA_CALL_ID = "call_id"
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        Log.d("CallActionReceiver", "Received action: ${intent?.action}")
        
        when (intent?.action) {
            ACTION_ANSWER_CALL -> {
                Log.d("CallActionReceiver", "Answering call")
                LinphoneCoreManager.answer()
            }
            ACTION_DECLINE_CALL -> {
                Log.d("CallActionReceiver", "Declining call")
                LinphoneCoreManager.decline()
            }
        }
    }
}