import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import '../../app/router.dart';

class NotificationRouter {
  NotificationRouter._();

  static void handleMessage(RemoteMessage message) {
    handlePayloadData(message.data);
  }

  static void handlePayloadString(String payloadStr) {
    debugPrint('Handling local notification payload: $payloadStr');
    // If it is a string representation of map or json
    if (payloadStr.contains('conversation_uuid')) {
      final match = RegExp(r'conversation_uuid:\s*([a-zA-Z0-9_-]+)').firstMatch(payloadStr);
      if (match != null && match.groupCount >= 1) {
        final uuid = match.group(1)!;
        AppRouter.router.push('/inbox/chat/$uuid');
      }
    }
  }

  static void handlePayloadData(Map<String, dynamic> data) {
    debugPrint('Routing notification data: $data');
    final type = data['type']?.toString().toLowerCase();
    final conversationUuid = data['conversation_uuid']?.toString() ??
        data['conversation_id']?.toString();
    final orderId = data['order_id']?.toString();

    if (type == 'conversation_message' || type == 'new_message' || conversationUuid != null) {
      if (conversationUuid != null && conversationUuid.isNotEmpty) {
        AppRouter.router.push('/inbox/chat/$conversationUuid');
      } else {
        AppRouter.router.go('/inbox');
      }
    } else if (type == 'ecommerce_order' || type == 'order_created' || orderId != null) {
      AppRouter.router.go('/commerce');
    } else if (type == 'affiliate_commission') {
      AppRouter.router.go('/hub');
    }
  }
}
