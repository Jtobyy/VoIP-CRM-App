
package com.nativetalkbusiness.voice

import org.linphone.core.Address
import androidx.annotation.WorkerThread
import org.linphone.core.Call
import androidx.annotation.AnyThread


class Utils {
    companion object {
        private const val TAG = "[Linphone Utils]"

        @WorkerThread
        fun getDisplayName(address: Address?): String {
            if (address == null) return "[null]"

            val displayName = address.displayName

            return if (displayName.isNullOrEmpty()) {
                address.username ?: address.asString()
            } else {
                displayName
            }   
        }

        @AnyThread
        fun isCallIncoming(callState: Call.State): Boolean {
            return when (callState) {
                Call.State.IncomingReceived, Call.State.IncomingEarlyMedia -> true
                else -> false
            }
        }

        @AnyThread
        fun isCallOutgoing(callState: Call.State, considerEarlyMedia: Boolean = true): Boolean {
            return when (callState) {
                Call.State.OutgoingInit, Call.State.OutgoingProgress, Call.State.OutgoingRinging -> true
                Call.State.OutgoingEarlyMedia -> considerEarlyMedia
                else -> false
            }
        }

        @AnyThread
        fun isCallPaused(callState: Call.State): Boolean {
            return when (callState) {
                Call.State.Pausing, Call.State.Paused, Call.State.PausedByRemote, Call.State.Resuming -> true
                else -> false
            }
        }

        @AnyThread
        fun isCallEnding(callState: Call.State, considerReleasedAsEnding: Boolean = false): Boolean {
            return when (callState) {
                Call.State.End, Call.State.Error -> true
                Call.State.Released -> considerReleasedAsEnding
                else -> false
            }
        }
    }
}