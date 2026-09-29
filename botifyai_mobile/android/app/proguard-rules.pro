# Flutter & Dart ProGuard Rules
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.**  { *; }

# Google / Firebase Rules
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Pusher Channels Rules
-keep class com.pusher.client.** { *; }
-keep class com.pusher.channels_flutter.** { *; }

# Biometrics
-keep class androidx.biometric.** { *; }

# Local Notifications
-keep class com.dexterous.flutterlocalnotifications.** { *; }
