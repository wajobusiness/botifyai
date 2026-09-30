# Application Package
-keep class cloud.botifyai.companion.** { *; }

# Flutter & Dart ProGuard Rules
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.**  { *; }
-keep class io.flutter.embedding.** { *; }
-dontwarn io.flutter.embedding.**
-dontwarn io.flutter.**

# Google Play Core & Deferred Components
-dontwarn com.google.android.play.core.**
-dontwarn com.google.android.gms.**

# Logging & Network Libraries
-dontwarn org.slf4j.**
-dontwarn okhttp3.**
-dontwarn okio.**

# Google / Firebase Rules
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Pusher Channels Rules
-keep class com.pusher.client.** { *; }
-keep class com.pusher.channels_flutter.** { *; }
-dontwarn com.pusher.**

# Biometrics
-keep class androidx.biometric.** { *; }
-dontwarn androidx.biometric.**

# Local Notifications
-keep class com.dexterous.flutterlocalnotifications.** { *; }
-dontwarn com.dexterous.flutterlocalnotifications.**

# AndroidX & General
-dontwarn androidx.**
