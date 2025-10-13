package com.nativetalkbusiness.voice

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.ContactsContract
import android.telephony.PhoneStateListener
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

object TelephonyMonitor {
    private const val TAG = "TelephonyMonitor"

    private var tm: TelephonyManager? = null
    private var rc: ReactApplicationContext? = null
    private var appCtx: Context? = null

    private var cb: TelephonyCallback? = null
    private var oldListener: PhoneStateListener? = null
    
    // Track current call state and pending info
    private var currentCallState = TelephonyManager.CALL_STATE_IDLE
    private var pendingCallNumber: String? = null
    private var pendingCallDirection: String? = null
    private var callStartTime: Long = 0
    
    private val handler = Handler(Looper.getMainLooper())

    fun attachReact(reactContext: ReactApplicationContext) {
        rc = reactContext
        Log.i(TAG, "React context attached")
    }

    fun detachReact() {
        rc = null
        Log.i(TAG, "React context detached")
    }

    fun start(context: Context) {
        try {
            appCtx = context.applicationContext
            tm = context.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager

            if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE)
                != PackageManager.PERMISSION_GRANTED
            ) {
                Log.w(TAG, "READ_PHONE_STATE not granted; cannot register telephony listener.")
                return
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val callback = object : TelephonyCallback(), TelephonyCallback.CallStateListener {
                    override fun onCallStateChanged(state: Int) { 
                        handleCallStateChange(state, null)
                    }
                }
                cb = callback
                tm?.registerTelephonyCallback(context.mainExecutor, callback)
                Log.i(TAG, "Modern TelephonyCallback registered (API 31+)")
            } else {
                @Suppress("DEPRECATION")
                val listener = object : PhoneStateListener() {
                    override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                        // On older APIs (< 29), we can get the number here!
                        handleCallStateChange(state, phoneNumber)
                    }
                }
                oldListener = listener
                @Suppress("DEPRECATION")
                tm?.listen(listener, PhoneStateListener.LISTEN_CALL_STATE)
                Log.i(TAG, "Legacy PhoneStateListener registered (API < 31)")
            }
            
            Log.i(TAG, "Telephony monitoring started successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start telephony monitoring", e)
        }
    }

    fun stop() {
        try {
            handler.removeCallbacksAndMessages(null)
            tm?.let { mgr ->
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    cb?.let { 
                        mgr.unregisterTelephonyCallback(it)
                        Log.i(TAG, "TelephonyCallback unregistered")
                    }
                    cb = null
                } else {
                    @Suppress("DEPRECATION")
                    oldListener?.let { 
                        mgr.listen(it, PhoneStateListener.LISTEN_NONE)
                        Log.i(TAG, "PhoneStateListener unregistered")
                    }
                    oldListener = null
                }
            }
            Log.i(TAG, "Telephony monitoring stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping telephony monitoring", e)
        }
    }

    /**
     * Store pending call info from CallScreeningService
     * This is the key - we store whatever info we get from CallScreeningService
     */
    fun setPendingCallInfo(number: String?, direction: String) {
        pendingCallNumber = number
        pendingCallDirection = direction
        if (!number.isNullOrEmpty()) {
            Log.i(TAG, "Stored pending call: $number ($direction)")
        } else {
            Log.i(TAG, "Stored pending call direction: $direction (no number yet)")
        }
    }

    /**
     * Handle call state changes
     */
    private fun handleCallStateChange(newState: Int, phoneNumber: String?) {
        val previousState = currentCallState
        currentCallState = newState
        
        val stateName = getStateName(newState)
        Log.i(TAG, "Call state: ${getStateName(previousState)} -> $stateName")

        // On older Android versions, phoneNumber might be available
        if (!phoneNumber.isNullOrEmpty() && phoneNumber != pendingCallNumber) {
            Log.i(TAG, "Got number from PhoneStateListener: $phoneNumber")
            pendingCallNumber = phoneNumber
        }

        when (newState) {
            TelephonyManager.CALL_STATE_RINGING -> {
                // Incoming call ringing
                callStartTime = System.currentTimeMillis()
                
                // Emit immediately with whatever info we have
                // emitCallInfo("ringing")
            }
            
            TelephonyManager.CALL_STATE_OFFHOOK -> {
                // Call answered or outgoing call connected
                
                // If we went from IDLE to OFFHOOK, it's an outgoing call
                if (previousState == TelephonyManager.CALL_STATE_IDLE) {
                    pendingCallDirection = "outgoing"
                }
                
                // emitCallInfo("offhook")
            }
            
            TelephonyManager.CALL_STATE_IDLE -> {
                // Call ended
                // emitCallInfo("idle")
                
                // Reset after a delay
                handler.postDelayed({
                    pendingCallNumber = null
                    pendingCallDirection = null
                    callStartTime = 0
                }, 2000)
            }
        }

        // Always emit the state change
        emitState(newState)
    }

    /**
     * Emit call info to React Native
     */
    private fun emitCallInfo(state: String) {
        val number = pendingCallNumber ?: ""
        val direction = pendingCallDirection ?: "unknown"
        
        Log.i(TAG, "Emitting call info - State: $state, Direction: $direction, Number: ${if (number.isEmpty()) "not available" else number}")
        
        // Only lookup contact if we have a number
        val contact = if (number.isNotEmpty()) {
            tryLookupContact(number)
        } else {
            null
        }
        
        val payload = Arguments.createMap().apply {
            putString("number", number)
            putString("direction", direction)
            putString("state", state)
            putBoolean("hasNumber", number.isNotEmpty())
            putDouble("timestamp", System.currentTimeMillis().toDouble())
            if (contact != null) {
                putMap("contact", contact)
            }
        }
        
        emitToReact("TMPhoneCallInfo", payload)
    }

    /**
     * Safely emit events to React Native
     */
    fun emitToReact(event: String, payload: WritableMap) {
        try {
            val ctx = rc
            if (ctx == null) {
                Log.w(TAG, "Cannot emit '$event': React context is null")
                return
            }

            if (!ctx.hasActiveCatalystInstance()) {
                Log.w(TAG, "Cannot emit '$event': No active Catalyst instance")
                return
            }

            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(event, payload)
            
            Log.d(TAG, "Event '$event' emitted to React Native")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to emit event '$event' to React Native", e)
        }
    }

    /**
     * Contact lookup (requires READ_CONTACTS permission)
     */
    fun tryLookupContact(number: String): WritableMap? {
        if (number.isBlank()) return null

        val ctx = appCtx ?: return null

        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.READ_CONTACTS)
            != PackageManager.PERMISSION_GRANTED) {
            Log.d(TAG, "READ_CONTACTS permission not granted")
            return null
        }

        try {
            val uri = Uri.withAppendedPath(
                ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
                Uri.encode(number)
            )
            val cols = arrayOf(
                ContactsContract.PhoneLookup.DISPLAY_NAME,
                ContactsContract.PhoneLookup.PHOTO_THUMBNAIL_URI
            )
            
            ctx.contentResolver.query(uri, cols, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val name = cursor.getString(0)
                    val photo = cursor.getString(1)
                    
                    Log.d(TAG, "Contact found: $name")
                    
                    return Arguments.createMap().apply {
                        putString("name", name)
                        putString("photo", photo)
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error looking up contact for $number", e)
        }
        
        return null
    }

    private fun emitState(state: Int) {
        val stateName = getStateName(state)
        
        try {
            val ctx = rc
            if (ctx == null || !ctx.hasActiveCatalystInstance()) {
                return
            }

            val map = Arguments.createMap().apply {
                putString("state", stateName)
                putInt("code", state)
                putDouble("timestamp", System.currentTimeMillis().toDouble())
            }
            
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("TMPhoneCallState", map)
            
            Log.d(TAG, "TMPhoneCallState event emitted: $stateName")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to emit call state", e)
        }
    }

    private fun getStateName(state: Int): String {
        return when (state) {
            TelephonyManager.CALL_STATE_RINGING -> "ringing"
            TelephonyManager.CALL_STATE_OFFHOOK -> "offhook"
            TelephonyManager.CALL_STATE_IDLE -> "idle"
            else -> "unknown_$state"
        }
    }
}