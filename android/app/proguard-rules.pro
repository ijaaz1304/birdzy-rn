# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native / SoLoader – avoid NoClassDefFoundError in release
-keep class com.facebook.soloader.** { *; }
-keep class com.facebook.react.** { *; }

# Firebase Crashlytics ProGuard rules
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception
-keep class com.google.firebase.crashlytics.** { *; }
-dontwarn com.google.firebase.crashlytics.**

# Google Sign-In / Play Services Auth (required for release minifyEnabled)
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.android.gms.** { *; }
-keep class com.reactnativegooglesignin.** { *; }
-keep class com.google.android.libraries.identity.googleid.** { *; }
-dontwarn com.google.android.gms.**

# Android embedded photo picker
-keep class androidx.photopicker.** { *; }
-keep class android.widget.photopicker.** { *; }
