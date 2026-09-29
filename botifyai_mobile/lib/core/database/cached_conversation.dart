import 'dart:convert';
import '../../features/inbox/domain/entities/conversation.dart';
import '../../features/inbox/data/models/conversation_model.dart';

class CachedConversation {
  final String uuid;
  final String contactName;
  final String? contactAvatar;
  final String? contactPhone;
  final String? contactEmail;
  final String channel;
  final String? channelId;
  final String lastMessageText;
  final String lastMessageTime;
  final String lastMessageDirection;
  final int unreadCount;
  final String status;
  final String? assignedToName;
  final bool isWhatsappWindowOpen;
  final String? lastCustomerMessageAt;
  final List<String> tags;
  final DateTime cachedAt;

  CachedConversation({
    required this.uuid,
    required this.contactName,
    this.contactAvatar,
    this.contactPhone,
    this.contactEmail,
    required this.channel,
    this.channelId,
    required this.lastMessageText,
    required this.lastMessageTime,
    this.lastMessageDirection = 'inbound',
    this.unreadCount = 0,
    required this.status,
    this.assignedToName,
    this.isWhatsappWindowOpen = false,
    this.lastCustomerMessageAt,
    this.tags = const [],
    DateTime? cachedAt,
  }) : cachedAt = cachedAt ?? DateTime.now();

  factory CachedConversation.fromDomain(Conversation c) {
    return CachedConversation(
      uuid: c.uuid,
      contactName: c.contact.name,
      contactAvatar: c.contact.avatar,
      contactPhone: c.contact.phone,
      contactEmail: c.contact.email,
      channel: c.channel,
      channelId: c.channelId,
      lastMessageText: c.lastMessageSnippet,
      lastMessageTime: c.lastMessageAt.toIso8601String(),
      lastMessageDirection: c.lastMessageDirection,
      unreadCount: c.unreadCount,
      status: c.status,
      assignedToName: c.assignedTo?.name,
      isWhatsappWindowOpen: c.isWhatsappWindowOpen,
      lastCustomerMessageAt: c.lastCustomerMessageAt?.toIso8601String(),
      tags: c.tags,
    );
  }

  Conversation toDomain() {
    return ConversationModel.fromJson({
      'uuid': uuid,
      'contact': {
        'id': 0,
        'name': contactName,
        'avatar': contactAvatar,
        'phone': contactPhone,
        'email': contactEmail,
      },
      'channel': channel,
      'channel_id': channelId,
      'last_message_snippet': lastMessageText,
      'last_message_at': lastMessageTime,
      'last_message_direction': lastMessageDirection,
      'unread_count': unreadCount,
      'status': status,
      'assigned_to': assignedToName != null ? {'id': 0, 'name': assignedToName} : null,
      'is_whatsapp_window_open': isWhatsappWindowOpen,
      'last_customer_message_at': lastCustomerMessageAt,
      'tags': tags,
    });
  }

  Map<String, dynamic> toJson() {
    return {
      'uuid': uuid,
      'contact_name': contactName,
      'contact_avatar': contactAvatar,
      'contact_phone': contactPhone,
      'contact_email': contactEmail,
      'channel': channel,
      'channel_id': channelId,
      'last_message_text': lastMessageText,
      'last_message_time': lastMessageTime,
      'last_message_direction': lastMessageDirection,
      'unread_count': unreadCount,
      'status': status,
      'assigned_to_name': assignedToName,
      'is_whatsapp_window_open': isWhatsappWindowOpen,
      'last_customer_message_at': lastCustomerMessageAt,
      'tags': tags,
      'cached_at': cachedAt.toIso8601String(),
    };
  }

  factory CachedConversation.fromJson(Map<String, dynamic> json) {
    return CachedConversation(
      uuid: json['uuid'] as String,
      contactName: json['contact_name'] as String? ?? 'Unknown Contact',
      contactAvatar: json['contact_avatar'] as String?,
      contactPhone: json['contact_phone'] as String?,
      contactEmail: json['contact_email'] as String?,
      channel: json['channel'] as String? ?? 'whatsapp',
      channelId: json['channel_id'] as String?,
      lastMessageText: json['last_message_text'] as String? ?? '',
      lastMessageTime: json['last_message_time'] as String? ?? DateTime.now().toIso8601String(),
      lastMessageDirection: json['last_message_direction'] as String? ?? 'inbound',
      unreadCount: (json['unread_count'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? 'open',
      assignedToName: json['assigned_to_name'] as String?,
      isWhatsappWindowOpen: json['is_whatsapp_window_open'] as bool? ?? false,
      lastCustomerMessageAt: json['last_customer_message_at'] as String?,
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      cachedAt: json['cached_at'] != null ? DateTime.parse(json['cached_at'] as String) : null,
    );
  }

  String encode() => jsonEncode(toJson());
  factory CachedConversation.decode(String str) => CachedConversation.fromJson(jsonDecode(str));
}
