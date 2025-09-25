
package com.nativetalkbusiness.voice

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.ActivityOptions
import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.util.Patterns
import android.view.View
import androidx.appcompat.app.AppCompatDelegate
import org.linphone.mediastream.Version
import androidx.annotation.RequiresApi
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log



@SuppressLint("NewApi")
class Compatibility {
    companion object {
        private const val TAG = "[Compatibility]"

        const val FOREGROUND_SERVICE_TYPE_PHONE_CALL = 4
        const val FOREGROUND_SERVICE_TYPE_MICROPHONE = 128
        const val FOREGROUND_SERVICE_TYPE_SPECIAL_USE = 1073741824

        fun startServiceForeground(
            service: Service,
            id: Int,
            notification: Notification,
            foregroundServiceType: Int
        ) {
            if (Version.sdkAboveOrEqual(Version.API34_ANDROID_14_UPSIDE_DOWN_CAKE)) {
                Api34Compatibility.startServiceForeground(
                    service,
                    id,
                    notification,
                    foregroundServiceType
                )
            } else {
                Api28Compatibility.startServiceForeground(service, id, notification)
            }
        }

        fun isPostNotificationsPermissionGranted(context: Context): Boolean {
            if (Version.sdkAboveOrEqual(Version.API33_ANDROID_13_TIRAMISU)) {
                return Api33Compatibility.isPostNotificationsPermissionGranted(context)
            }
            return true
        }
    }
}

@RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
class Api34Compatibility {
    companion object {
        private const val TAG = "[API 34 Compatibility]"

        fun startServiceForeground(
            service: Service,
            id: Int,
            notification: Notification,
            foregroundServiceType: Int
        ) {
            try {
                service.startForeground(
                    id,
                    notification,
                    foregroundServiceType
                )
            } catch (e: Exception) {
                Log.e("Api34Compatibility", "Can't start service as foreground! $e")
            }
        }
    }
}

@RequiresApi(Build.VERSION_CODES.TIRAMISU)
class Api33Compatibility {
    companion object {
        fun getAllRequiredPermissionsArray(): Array<String> {
            return arrayOf(
                Manifest.permission.POST_NOTIFICATIONS,
                Manifest.permission.READ_CONTACTS,
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.CAMERA
            )
        }

        fun isPostNotificationsPermissionGranted(context: Context): Boolean {
            return context.checkSelfPermission(
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        }

        fun getPendingIntentActivityOptions(): ActivityOptions {
            val options = ActivityOptions.makeBasic()
            options.isPendingIntentBackgroundActivityLaunchAllowed = true
            return options
        }
    }
}

class Api28Compatibility {
    companion object {
        private const val TAG = "[API 28 Compatibility]"

        fun startServiceForeground(service: Service, id: Int, notification: Notification) {
            try {
                service.startForeground(
                    id,
                    notification
                )
            } catch (e: Exception) {
                Log.e("Api28Compatibility", "Can't start service as foreground! $e")
            }
        }
    }
}
