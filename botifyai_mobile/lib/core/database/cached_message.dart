import 'dart:convert';
import '../../features/inbox/domain/entities/message.dart';
import '../../features/inbox/data/models/message_model.dart';

class CachedMessage {
  final int id;
  final String uuid;
  final String conversationUuid;
  final String senderType; // 'customer', 'agent', 'bot', 'system'
  final String? senderName;
  final String? senderAvatar;
  final String type; // 'text', 'image', 'audio', 'video', 'document', 'template', 'location'
  final String body;
  final String? attachmentUrl;
  final String? attachmentType;
  final int? attachmentSize;
  final int? attachmentDuration; // in seconds for voice notes
  final String status; // 'pending_sync', 'sending', 'sent', 'delivered', 'read', 'failed'
  final bool isInternalNote;
  final String createdAt;
  final DateTime cachedAt;

  CachedMessage({
    required this.id,
    required this.uuid,
    required this.conversationUuid,
    required this.senderType,
    this.senderName,
    this.senderAvatar,
    this.type = 'text',
    required this.body,
    this.attachmentUrl,
    this.attachmentType,
    this.attachmentSize,
    this.attachmentDuration,
    this.status = 'sent',
    this.isInternalNote = false,
    required this.createdAt,
    DateTime? cachedAt,
  }) : cachedAt = cachedAt ?? DateTime.now();

  factory CachedMessage.fromDomain(Message m, {required String conversationUuid}) {
    return CachedMessage(
      id: m.id ?? 0,
      uuid: m.localId,
      conversationUuid: conversationUuid,
      senderType: m.sentBy,
      senderName: m.senderName,
      senderAvatar: m.senderAvatar,
      type: m.type.name,
      body: m.body,
      attachmentUrl: m.attachmentUrl,
      attachmentType: m.attachmentType,
      attachmentSize: m.attachmentSize,
      attachmentDuration: null,
      status: m.status.name,
      isInternalNote: m.isNote,
      createdAt: m.sentAt.toIso8601String(),
    );
  }

  Message toDomain() {
    return MessageModel.fromJson({
      'id': id,
      'uuid': uuid,
      'local_id': uuid,
      'sender_type': senderType,
      'sent_by': senderType,
      'sender_name': senderName,
      'sender_avatar': senderAvatar,
      'type': type,
      'body': body,
      'attachment_url': attachmentUrl,
      'attachment_type': attachmentType,
      'attachment_size': attachmentSize,
      'attachment_duration': attachmentDuration,
      'status': status,
      'is_internal_note': isInternalNote,
      'is_note': isInternalNote,
      'created_at': createdAt,
      'sent_at': createdAt,
    });
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'uuid': uuid,
      'conversation_uuid': conversationUuid,
      'sender_type': senderType,
      'sender_name': senderName,
      'sender_avatar': senderAvatar,
      'type': type,
      'body': body,
      'attachment_url': attachmentUrl,
      'attachment_type': attachmentType,
      'attachment_size': attachmentSize,
      'attachment_duration': attachmentDuration,
      'status': status,
      'is_internal_note': isInternalNote,
      'created_at': createdAt,
      'cached_at': cachedAt.toIso8601String(),
    };
  }

  factory CachedMessage.fromJson(Map<String, dynamic> json) {
    return CachedMessage(
      id: (json['id'] as num?)?.toInt() ?? 0,
      uuid: json['uuid'] as String? ?? json['local_id'] as String? ?? 'off-${DateTime.now().millisecondsSinceEpoch}',
      conversationUuid: json['conversation_uuid'] as String? ?? '',
      senderType: json['sender_type'] as String? ?? json['sent_by'] as String? ?? 'agent',
      senderName: json['sender_name'] as String?,
      senderAvatar: json['sender_avatar'] as String?,
      type: json['type'] as String? ?? 'text',
      body: json['body'] as String? ?? '',
      attachmentUrl: json['attachment_url'] as String?,
      attachmentType: json['attachment_type'] as String?,
      attachmentSize: (json['attachment_size'] as num?)?.toInt(),
      attachmentDuration: (json['attachment_duration'] as num?)?.toInt(),
      status: json['status'] as String? ?? 'sent',
      isInternalNote: json['is_internal_note'] as bool? ?? json['is_note'] as bool? ?? false,
      createdAt: json['created_at'] as String? ?? json['sent_at'] as String? ?? DateTime.now().toIso8601String(),
      cachedAt: json['cached_at'] != null ? DateTime.parse(json['cached_at'] as String) : null,
    );
  }

  String encode() => jsonEncode(toJson());
  factory CachedMessage.decode(String str) => CachedMessage.fromJson(jsonDecode(str));
}
