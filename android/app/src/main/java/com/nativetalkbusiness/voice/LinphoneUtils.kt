
package com.nativetalkbusiness.voice

import org.linphone.core.Address
import androidx.annotation.WorkerThread


class LinphoneUtils {
    companion object {
        private const val TAG = "[Linphone Utils]"

        @WorkerThread
        fun getDisplayName(address: Address?): String {
            if (address == null) return "[null]"

            val displayName = address.displayName

            // Do not return an empty display name
            return if (displayName.isNullOrEmpty()) {
                address.username ?: address.asString()
            } else {
                displayName
            }   
        }
    }
}