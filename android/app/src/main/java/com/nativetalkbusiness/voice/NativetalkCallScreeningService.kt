package com.nativetalkbusiness.voice

import android.net.Uri
import android.telecom.Call
import android.telecom.CallScreeningService
import android.util.Log
import com.facebook.react.bridge.Arguments
import android.os.Build

class NativetalkCallScreeningService : CallScreeningService() {
    companion object {
        private const val TAG = "NativetalkCSS"
    }

    override fun onScreenCall(details: Call.Details) {
        try {
            Log.i(TAG, "Call Screening started")

            // Try multiple ways to get the phone number
            var number = extractPhoneNumber(details)
            val isIncoming = details.callDirection == Call.Details.DIRECTION_INCOMING
            val ts = System.currentTimeMillis()

            // Log the call details BEFORE creating the payload
            Log.i(TAG, "onScreenCall - Number: '$number', Direction: ${if (isIncoming) "incoming" else "outgoing"}")
            
            // Additional debug info
            Log.d(TAG, "Handle: ${details.handle}")
            Log.d(TAG, "Caller Display Name: ${details.callerDisplayName}")
            Log.d(TAG, "Presentation: ${details.callerDisplayNamePresentation}")

            // Optional contact lookup (only works if we have a number)
            val contact = if (number.isNotEmpty()) {
                TelephonyMonitor.tryLookupContact(number)
            } else {
                null
            }
            
            if (contact != null) {
                Log.i(TAG, "Contact found for number: $number")
            }

            // Create the payload
            val payload = Arguments.createMap().apply {
                putString("direction", if (isIncoming) "incoming" else "outgoing")
                putString("number", number)
                putString("callerName", details.callerDisplayName ?: "")
                putDouble("timestamp", ts.toDouble())
                putInt("presentation", details.callerDisplayNamePresentation)
                if (contact != null) {
                    putMap("contact", contact)
                }
            }

            // Emit to React Native
            TelephonyMonitor.emitToReact("TMPhoneCallInfo", payload)
            
            // Log success AFTER emitting
            Log.i(TAG, "TMPhoneCallInfo event emitted successfully for number: $number")
            
            // Allow the call to proceed normally
            val response = CallResponse.Builder()
                .setDisallowCall(false)
                .setRejectCall(false)
                .setSkipCallLog(false)
                .setSkipNotification(false)
                .build()
            
            respondToCall(details, response)
            
        } catch (t: Throwable) {
            Log.e(TAG, "onScreenCall failed for call", t)
            
            // Always respond to avoid blocking the call
            val defaultResponse = CallResponse.Builder()
                .setDisallowCall(false)
                .setRejectCall(false)
                .build()
            
            respondToCall(details, defaultResponse)
        }
    }

    /**
     * Try multiple methods to extract the phone number
     */
    private fun extractPhoneNumber(details: Call.Details): String {
        // Method 1: Try handle (works for outgoing, sometimes for incoming)
        val handle = details.handle
        if (handle != null) {
            val number = handle.schemeSpecificPart
            if (!number.isNullOrEmpty()) {
                Log.d(TAG, "Got number from handle: $number")
                return number
            }
        }

        // Method 2: Try caller display name (sometimes contains the number)
        val displayName = details.callerDisplayName
        if (!displayName.isNullOrEmpty()) {
            // Check if display name is actually a phone number
            val cleaned = displayName.replace(Regex("[^0-9+]"), "")
            if (cleaned.length >= 10) {
                Log.d(TAG, "Got number from caller display name: $cleaned")
                return cleaned
            }
        }

        // Method 3: Try extras
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val extras = details.extras
            if (extras != null) {
                // Some manufacturers put the number in extras
                val extraNumber = extras.getString("android.telecom.extra.CALL_SUBJECT")
                    ?: extras.getString("call_number")
                    ?: extras.getString("phone_number")
                
                if (!extraNumber.isNullOrEmpty()) {
                    Log.d(TAG, "Got number from extras: $extraNumber")
                    return extraNumber
                }
            }
        }

        Log.w(TAG, "Could not extract phone number from call details")
        return ""
    }
}