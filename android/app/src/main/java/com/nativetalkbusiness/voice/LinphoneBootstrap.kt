package com.nativetalkbusiness.voice

import android.content.Context
import com.nativetalkbusiness.voice.LinphoneCoreManager

object LinphoneBootstrap {
  private var started = false

  @Synchronized
  fun ensureStarted(ctx: Context) {
    if (started) return
    LinphoneCoreManager.ensureStarted(ctx)
    started = true
  }
}
