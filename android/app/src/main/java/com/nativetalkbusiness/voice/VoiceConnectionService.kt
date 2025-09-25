
package com.nativetalkbusiness.voice

import android.annotation.SuppressLint
import android.telecom.Connection
import android.telecom.ConnectionRequest
import android.telecom.ConnectionService
import android.telecom.PhoneAccountHandle
import android.util.Log
import com.nativetalkbusiness.voice.CoreManager

class VoiceConnectionService : ConnectionService() {
    companion object {
        const val TAG = "VoiceConnectionService"
        var currentConnection: Connection? = null
    }

    // Correct method signature for incoming connections
    @SuppressLint("MissingPermission")
    override fun onCreateIncomingConnection(
        phoneAccountHandle: PhoneAccountHandle, 
        connectionRequest: ConnectionRequest
    ): Connection? {
        Log.d(TAG, "onCreateIncomingConnection: " + connectionRequest.address)

        // Linphone already has an ongoing call, this service just needs to inform the system
        // that a call is happening.
        val connection = VoiceConnection()
        connection.setAddress(connectionRequest.address, 0)
        connection.setRinging()
        currentConnection = connection

        return connection
    }

    // Outgoing connection method (unchanged)
    override fun onCreateOutgoingConnection(
        phoneAccountHandle: PhoneAccountHandle, 
        connectionRequest: ConnectionRequest
    ): Connection? {
        Log.d(TAG, "onCreateOutgoingConnection: " + connectionRequest.address)
        return null // Assuming Linphone handles outgoing calls directly.
    }

    override fun onCreateOutgoingConnectionFailed(phoneAccountHandle: PhoneAccountHandle?, request: ConnectionRequest?) {
        Log.e(TAG, "onCreateOutgoingConnectionFailed: ${request?.address}")
        super.onCreateOutgoingConnectionFailed(phoneAccountHandle, request)
    }

    override fun onCreateIncomingConnectionFailed(phoneAccountHandle: PhoneAccountHandle?, request: ConnectionRequest?) {
        Log.e(TAG, "onCreateIncomingConnectionFailed: ${request?.address}")
        super.onCreateIncomingConnectionFailed(phoneAccountHandle, request)
    }

    // VoiceConnection class
    class VoiceConnection : Connection() {
        override fun onDisconnect() {
            Log.d(TAG, "onDisconnect")
            CoreManager.decline()
            destroy()
        }

        override fun onAbort() {
            Log.d(TAG, "onAbort")
            CoreManager.decline()
            destroy()
        }

        override fun onReject() {
            Log.d(TAG, "onReject")
            CoreManager.decline()
            destroy()
        }

        override fun onAnswer() {
            Log.d(TAG, "onAnswer")
            CoreManager.answer()
            setActive()
        }
    }
}
