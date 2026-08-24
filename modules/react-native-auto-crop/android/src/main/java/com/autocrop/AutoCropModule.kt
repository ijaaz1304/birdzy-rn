package com.autocrop

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.ImageDecoder
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenter
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

class AutoCropModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var segmenter: SubjectSegmenter? = null
  private val worker = Executors.newSingleThreadExecutor()
  private val isProcessing = AtomicBoolean(false)

  private val MAX_PIXELS = 4_000_000
  private val JPEG_QUALITY = 92
  private val SEGMENTATION_TIMEOUT_SEC = 60L

  override fun getName(): String = NAME

  @ReactMethod
  fun flattenCutoutOnWhite(imageURI: String, qualityArg: Double, promise: Promise) {
    val quality = (qualityArg * 100).toInt().coerceIn(1, 100)
    worker.execute {
      try {
        val cutout = getImageBitmap(imageURI)
        val flattened =
          Bitmap.createBitmap(cutout.width, cutout.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(flattened)
        canvas.drawColor(android.graphics.Color.WHITE)
        canvas.drawBitmap(cutout, 0f, 0f, null)
        cutout.recycle()
        val savedUri = saveJpeg(flattened, quality)
        flattened.recycle()
        promise.resolve(
          Arguments.createMap().apply {
            putString("uri", savedUri)
            putBoolean("applied", true)
          },
        )
      } catch (t: Throwable) {
        Log.w(TAG, "flattenCutoutOnWhite failed", t)
        promise.reject("AutoCrop", t.message, t)
      }
    }
  }

  @ReactMethod
  fun cropImage(imageURI: String, paddingRatioArg: Double, promise: Promise) {
    val startedAt = System.currentTimeMillis()
    val paddingRatio = paddingRatioArg.toFloat().coerceIn(0f, 0.5f)
    if (!isProcessing.compareAndSet(false, true)) {
      promise.resolve(buildFallback(imageURI, startedAt, "busy", paddingRatio))
      return
    }

    worker.execute {
      try {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
          promise.resolve(buildFallback(imageURI, startedAt, "android_api_below_24", paddingRatio))
          return@execute
        }

        val original = getImageBitmap(imageURI)
        val segmenterClient = segmenter ?: createSegmenter()
        val inputImage = InputImage.fromBitmap(original, 0)
        val latch = CountDownLatch(1)
        var foreground: Bitmap? = null
        var segmentError: String? = null

        segmenterClient.process(inputImage)
          .addOnSuccessListener { result ->
            foreground = result.foregroundBitmap
            latch.countDown()
          }
          .addOnFailureListener { e ->
            segmentError = e.message ?: "segmentation_failed"
            latch.countDown()
          }

        if (!latch.await(SEGMENTATION_TIMEOUT_SEC, TimeUnit.SECONDS)) {
          original.recycle()
          promise.resolve(buildFallback(imageURI, startedAt, "segmentation_timeout", paddingRatio))
          return@execute
        }

        val fg = foreground
        if (fg == null || segmentError != null) {
          original.recycle()
          fg?.recycle()
          promise.resolve(
            buildFallback(imageURI, startedAt, segmentError ?: "no_foreground_bitmap", paddingRatio),
          )
          return@execute
        }

        val bounds = computeForegroundBounds(fg)
        fg.recycle()

        if (bounds == null || !bounds.isValid()) {
          original.recycle()
          promise.resolve(buildFallback(imageURI, startedAt, "no_foreground_pixels", paddingRatio))
          return@execute
        }

        val padded = expandBounds(bounds, original.width, original.height, paddingRatio)
        val cropped = Bitmap.createBitmap(
          original,
          padded.minX,
          padded.minY,
          padded.width(),
          padded.height(),
        )
        original.recycle()

        val savedUri = saveJpeg(cropped)
        cropped.recycle()

        promise.resolve(
          buildSuccess(
            imageURI = savedUri,
            originalUri = imageURI,
            startedAt = startedAt,
            bounds = bounds,
            padded = padded,
            paddingRatio = paddingRatio,
          ),
        )
      } catch (t: Throwable) {
        Log.w(TAG, "cropImage failed", t)
        promise.resolve(buildFallback(imageURI, startedAt, t.message ?: "unknown_error", paddingRatio))
      } finally {
        isProcessing.set(false)
      }
    }
  }

  private fun createSegmenter(): SubjectSegmenter {
    val options = SubjectSegmenterOptions.Builder()
      .enableForegroundBitmap()
      .build()
    val client = SubjectSegmentation.getClient(options)
    segmenter = client
    return client
  }

  private fun getImageBitmap(imageURI: String): Bitmap {
    val uri = Uri.parse(imageURI)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      val source = ImageDecoder.createSource(reactContext.contentResolver, uri)
      val bitmap = ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
        val outWidth = info.size.width
        val outHeight = info.size.height
        val total = outWidth.toLong() * outHeight.toLong()
        if (total > MAX_PIXELS) {
          val scale = Math.sqrt(total.toDouble() / MAX_PIXELS.toDouble())
          val targetWidth = (outWidth / scale).toInt().coerceAtLeast(1)
          val targetHeight = (outHeight / scale).toInt().coerceAtLeast(1)
          decoder.setTargetSize(targetWidth, targetHeight)
        }
        decoder.isMutableRequired = true
        decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
      }
      return bitmap.copy(Bitmap.Config.ARGB_8888, true)
    }

    val inputStream1 = reactContext.contentResolver.openInputStream(uri)
    val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeStream(inputStream1, null, opts)
    inputStream1?.close()

    var inSampleSize = 1
    val rawW = opts.outWidth
    val rawH = opts.outHeight
    if (rawW > 0 && rawH > 0) {
      val total = rawW.toLong() * rawH.toLong()
      if (total > MAX_PIXELS) {
        while (true) {
          val next = inSampleSize * 2
          val scaledW = rawW / next
          val scaledH = rawH / next
          if (scaledW <= 0 || scaledH <= 0) break
          val scaledTotal = scaledW.toLong() * scaledH.toLong()
          if (scaledTotal < MAX_PIXELS) break
          inSampleSize = next
        }
      }
    }

    val opts2 = BitmapFactory.Options().apply {
      inJustDecodeBounds = false
      inPreferredConfig = Bitmap.Config.ARGB_8888
      inSampleSize = inSampleSize
    }
    val inputStream2 = reactContext.contentResolver.openInputStream(uri)
    val decoded = BitmapFactory.decodeStream(inputStream2, null, opts2)
    inputStream2?.close()
    return decoded ?: MediaStore.Images.Media.getBitmap(reactContext.contentResolver, uri)
  }

  private data class Bounds(val minX: Int, val minY: Int, val maxX: Int, val maxY: Int) {
    fun isValid() = maxX >= 0 && maxY >= 0 && minX <= maxX && minY <= maxY
    fun width() = maxX - minX + 1
    fun height() = maxY - minY + 1
  }

  private fun computeForegroundBounds(bitmap: Bitmap): Bounds? {
    val width = bitmap.width
    val height = bitmap.height
    var minX = width
    var minY = height
    var maxX = -1
    var maxY = -1

    for (y in 0 until height) {
      for (x in 0 until width) {
        val alpha = (bitmap.getPixel(x, y) shr 24) and 0xFF
        if (alpha > 0) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }

    return if (maxX == -1 || maxY == -1) null else Bounds(minX, minY, maxX, maxY)
  }

  private fun expandBounds(bounds: Bounds, imageWidth: Int, imageHeight: Int, padding: Float): Bounds {
    val padX = (bounds.width() * padding).toInt()
    val padY = (bounds.height() * padding).toInt()
    val minX = (bounds.minX - padX).coerceIn(0, imageWidth - 1)
    val minY = (bounds.minY - padY).coerceIn(0, imageHeight - 1)
    val maxX = (bounds.maxX + padX).coerceIn(minX, imageWidth - 1)
    val maxY = (bounds.maxY + padY).coerceIn(minY, imageHeight - 1)
    return Bounds(minX, minY, maxX, maxY)
  }

  private fun saveJpeg(bitmap: Bitmap, quality: Int = JPEG_QUALITY): String {
    val file = File(reactContext.cacheDir, "autocrop_${System.currentTimeMillis()}.jpg")
    FileOutputStream(file).use { out ->
      bitmap.compress(Bitmap.CompressFormat.JPEG, quality, out)
    }
    return file.toURI().toString()
  }

  private fun boundsMap(bounds: Bounds): WritableMap =
    Arguments.createMap().apply {
      putInt("x", bounds.minX)
      putInt("y", bounds.minY)
      putInt("width", bounds.width())
      putInt("height", bounds.height())
    }

  private fun buildSuccess(
    imageURI: String,
    originalUri: String,
    startedAt: Long,
    bounds: Bounds,
    padded: Bounds,
    paddingRatio: Float,
  ): WritableMap =
    Arguments.createMap().apply {
      putString("uri", imageURI)
      putString("originalUri", originalUri)
      putBoolean("applied", true)
      putString("reason", "applied")
      putMap("boundingBox", boundsMap(bounds))
      putMap("paddedBoundingBox", boundsMap(padded))
      putDouble("paddingRatio", paddingRatio.toDouble())
      putInt("cropWidth", padded.width())
      putInt("cropHeight", padded.height())
      putDouble("durationMs", (System.currentTimeMillis() - startedAt).toDouble())
    }

  private fun buildFallback(
    originalUri: String,
    startedAt: Long,
    reason: String,
    paddingRatio: Float,
  ): WritableMap =
    Arguments.createMap().apply {
      putString("uri", originalUri)
      putString("originalUri", originalUri)
      putBoolean("applied", false)
      putString("reason", reason)
      putDouble("paddingRatio", paddingRatio.toDouble())
      putDouble("durationMs", (System.currentTimeMillis() - startedAt).toDouble())
    }

  override fun onCatalystInstanceDestroy() {
    super.onCatalystInstanceDestroy()
    try {
      segmenter?.close()
      worker.shutdownNow()
    } catch (_: Exception) {
    }
  }

  companion object {
    const val NAME = "AutoCrop"
    private const val TAG = "AutoCrop"
  }
}
