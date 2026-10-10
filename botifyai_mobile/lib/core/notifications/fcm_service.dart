import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import 'notification_router.dart';

/// Top-level background handler for FCM
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('Handling background FCM message: ${message.messageId}');
}

class FcmService {
  static final FcmService _instance = FcmService._internal();
  factory FcmService() => _instance;
  FcmService._internal();

  FirebaseMessaging? _messaging;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  bool _isInitialized = false;

  Future<void> init({required ApiClient apiClient}) async {
    if (kIsWeb || _isInitialized) return;

    try {
      _messaging ??= FirebaseMessaging.instance;
      final messaging = _messaging;
      if (messaging == null) return;

      // Set background messaging handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Request permissions
      final settings = await messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      debugPrint('FCM Permission Status: ${settings.authorizationStatus}');

      // Initialize Local Notifications for foreground display
      const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosSettings = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );

      const initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      await _localNotifications.initialize(
        initSettings,
        onDidReceiveNotificationResponse: (response) {
          if (response.payload != null) {
            NotificationRouter.handlePayloadString(response.payload!);
          }
        },
      );

      // Create Android Notification Channel
      if (Platform.isAndroid) {
        const channel = AndroidNotificationChannel(
          'botifyai_high_importance_channel',
          'BotifyAI Notifications',
          description: 'High priority alerts for live chats and merchant orders',
          importance: Importance.max,
          playSound: true,
        );

        await _localNotifications
            .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
            ?.createNotificationChannel(channel);
      }

      // Foreground message listener
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('FCM Foreground Message: ${message.notification?.title}');
        _showForegroundNotification(message);
      });

      // Background notification tap handler (app open in background)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('FCM Notification Tap (Background): ${message.data}');
        NotificationRouter.handleMessage(message);
      });

      // Cold-start notification check (app launched from terminated state)
      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        debugPrint('FCM Initial Message (Terminated): ${initialMessage.data}');
        NotificationRouter.handleMessage(initialMessage);
      }

      // Retrieve device token & register with backend
      final token = await messaging.getToken();
      if (token != null) {
        debugPrint('FCM Device Token: $token');
        await _registerDeviceToken(apiClient, token);
      }

      // Token refresh listener
      messaging.onTokenRefresh.listen((newToken) {
        _registerDeviceToken(apiClient, newToken);
      });

      _isInitialized = true;
    } catch (e) {
      debugPrint('Error initializing FCM service: $e');
    }
  }

  Future<void> _registerDeviceToken(ApiClient apiClient, String token) async {
    try {
      await apiClient.post(
        ApiEndpoints.registerPushDevice,
        data: {
          'device_token': token,
          'platform': Platform.isIOS ? 'ios' : 'android',
        },
      );
      debugPrint('Successfully registered device token with BotifyAI server.');
    } catch (e) {
      debugPrint('Failed to register device token with backend: $e');
    }
  }

  Future<void> _showForegroundNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    const androidDetails = AndroidNotificationDetails(
      'botifyai_high_importance_channel',
      'BotifyAI Notifications',
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      notification.hashCode,
      notification.title ?? 'BotifyAI Notification',
      notification.body ?? '',
      details,
      payload: message.data.toString(),
    );
  }
}
