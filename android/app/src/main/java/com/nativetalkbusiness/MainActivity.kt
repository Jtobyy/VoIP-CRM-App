package com.nativetalkbusiness

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.os.Bundle
import com.nativetalkbusiness.voice.BackgroundService
import com.nativetalkbusiness.voice.CoreManager
import android.content.Context
import android.provider.Settings
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import android.Manifest
import org.linphone.core.Call
import androidx.activity.result.contract.ActivityResultContracts


class MainActivity : ReactActivity() {
    companion object {
        const val RECORD_AUDIO_PERMISSION_REQUEST_CODE = 100
        var pendingCall: Call? = null
    }

  override fun onCreate(savedInstanceState: Bundle?) {
      super.onCreate(savedInstanceState)
      
      CoreManager.ensureStarted(this)
      BackgroundService.startService(this)
  }

  private fun requestBatteryOptimizationExemption() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val intent = Intent()
        val packageName = packageName
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        if (!pm.isIgnoringBatteryOptimizations(packageName)) {
            intent.action = Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
            intent.data = Uri.parse("package:$packageName")
            startActivity(intent)
        }
    }
  }

//   fun checkAndRequestAudioPermission(call: Call) {
//         pendingCall = call // Store the call for later
//         if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
//             Log.d("MainActivity", "RECORD_AUDIO permission not granted. Requesting it now.")
//             ActivityCompat.requestPermissions(
//                 this,
//                 arrayOf(Manifest.permission.RECORD_AUDIO),
//                 RECORD_AUDIO_PERMISSION_REQUEST_CODE
//             )
//         } else {
//             Log.d("MainActivity", "RECORD_AUDIO permission already granted. Starting service.")
//             CoreManager.startForegroundServiceWithCall(call)
//             pendingCall = null 
//         }
//     }

    private val postNotificationsPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            Log.i("MainActivity", "POST_NOTIFICATIONS permission granted")
        } else {
            Log.w("MainActivity", "POST_NOTIFICATIONS permission denied")
            // Maybe show explanation to user
        }
    }

    private val fullScreenIntentPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            Log.i("MainActivity", "USE_FULL_SCREEN_INTENT permission granted")
        } else {
            Log.w("MainActivity", "USE_FULL_SCREEN_INTENT permission denied")
        }
    }

    private val requestRecordAudioPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            Log.i("[MainActivity]", "RECORD_AUDIO permission has been granted, un-muting microphone")
        } else {
            Log.e("[MainActivity]", "RECORD_AUDIO permission has been denied")
        }
    }
    
    private fun updateMissingPermissionAlert() {
        // Request POST_NOTIFICATIONS on Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) 
                != PackageManager.PERMISSION_GRANTED) {
                postNotificationsPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        // Request USE_FULL_SCREEN_INTENT on Android 14+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.USE_FULL_SCREEN_INTENT) 
                != PackageManager.PERMISSION_GRANTED) {
                fullScreenIntentPermissionLauncher.launch(Manifest.permission.USE_FULL_SCREEN_INTENT)
            }
        }
    }

    // override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
    //     super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    //     if (requestCode == RECORD_AUDIO_PERMISSION_REQUEST_CODE) {
    //         if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
    //             Log.d("MainActivity", "RECORD_AUDIO permission granted. Starting call service.")
    //             pendingCall?.let {
    //                 CoreManager.startForegroundServiceWithCall(it)
    //             }
    //         } else {
    //             Log.w("MainActivity", "RECORD_AUDIO permission denied.")
    //         }
    //         pendingCall = null
    //     }
    // }

    override fun onResume() {
        super.onResume()
        updateMissingPermissionAlert()
    }
    
    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "NativetalkBusiness"

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
