import '../../domain/entities/message.dart';

class MessageModel extends Message {
  const MessageModel({
    super.id,
    required super.localId,
    super.conversationId,
    required super.conversationUuid,
    required super.direction,
    super.channel = 'whatsapp',
    super.type = MessageType.text,
    required super.body,
    super.attachmentUrl,
    super.attachmentType,
    super.attachmentName,
    super.attachmentSize,
    super.status = MessageDeliveryStatus.delivered,
    required super.sentBy,
    super.senderName,
    super.senderAvatar,
    super.metadata,
    required super.sentAt,
    super.isNote = false,
    super.isOptimistic = false,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json, {String? conversationUuid}) {
    // Determine direction
    final rawDirection = json['direction']?.toString().toLowerCase();
    final direction = rawDirection == 'out' || rawDirection == 'outbound'
        ? MessageDirection.outBound
        : MessageDirection.inBound;

    // Determine type
    final rawType = json['type']?.toString().toLowerCase();
    MessageType type = MessageType.text;
    if (rawType == 'image') {
      type = MessageType.image;
    } else if (rawType == 'video') {
      type = MessageType.video;
    } else if (rawType == 'audio' || rawType == 'voice') {
      type = MessageType.audio;
    } else if (rawType == 'document' || rawType == 'file') {
      type = MessageType.document;
    } else if (rawType == 'template') {
      type = MessageType.template;
    } else if (rawType == 'note' || json['is_note'] == true) {
      type = MessageType.note;
    } else if (rawType == 'event' || rawType == 'system') {
      type = MessageType.event;
    }

    // Determine delivery status
    final rawStatus = json['status']?.toString().toLowerCase();
    MessageDeliveryStatus status = MessageDeliveryStatus.delivered;
    if (rawStatus == 'pending') {
      status = MessageDeliveryStatus.pending;
    } else if (rawStatus == 'sent') {
      status = MessageDeliveryStatus.sent;
    } else if (rawStatus == 'delivered') {
      status = MessageDeliveryStatus.delivered;
    } else if (rawStatus == 'read' || rawStatus == 'seen') {
      status = MessageDeliveryStatus.read;
    } else if (rawStatus == 'failed' || rawStatus == 'error') {
      status = MessageDeliveryStatus.failed;
    }

    final id = json['id'] is int
        ? json['id'] as int
        : int.tryParse(json['id']?.toString() ?? '');

    final localId = json['local_id']?.toString() ?? id?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString();

    // Sent at date
    DateTime sentAt = DateTime.now();
    if (json['sent_at'] != null) {
      sentAt = DateTime.tryParse(json['sent_at'].toString()) ?? sentAt;
    } else if (json['created_at'] != null) {
      sentAt = DateTime.tryParse(json['created_at'].toString()) ?? sentAt;
    }

    return MessageModel(
      id: id,
      localId: localId,
      conversationId: json['conversation_id'] is int
          ? json['conversation_id'] as int
          : int.tryParse(json['conversation_id']?.toString() ?? ''),
      conversationUuid: conversationUuid ?? json['conversation_uuid']?.toString() ?? '',
      direction: direction,
      channel: json['channel']?.toString() ?? 'whatsapp',
      type: type,
      body: json['body']?.toString() ?? json['message']?.toString() ?? json['text']?.toString() ?? '',
      attachmentUrl: json['attachment_url']?.toString() ?? json['media_url']?.toString() ?? json['file_url']?.toString(),
      attachmentType: json['attachment_type']?.toString(),
      attachmentName: json['attachment_name']?.toString() ?? json['file_name']?.toString(),
      attachmentSize: json['attachment_size'] is int ? json['attachment_size'] as int : null,
      status: status,
      sentBy: json['sent_by']?.toString() ?? (direction == MessageDirection.outBound ? 'agent' : 'customer'),
      senderName: json['sender_name']?.toString() ?? json['sender']?['name']?.toString() ?? json['user']?['name']?.toString(),
      senderAvatar: json['sender_avatar']?.toString() ?? json['sender']?['avatar']?.toString() ?? json['user']?['avatar']?.toString(),
      metadata: json['metadata'] is Map<String, dynamic> ? json['metadata'] as Map<String, dynamic> : (json['payload'] is Map<String, dynamic> ? json['payload'] as Map<String, dynamic> : null),
      sentAt: sentAt,
      isNote: json['is_note'] == true || type == MessageType.note,
      isOptimistic: json['is_optimistic'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'local_id': localId,
      'conversation_id': conversationId,
      'conversation_uuid': conversationUuid,
      'direction': direction == MessageDirection.outBound ? 'out' : 'in',
      'channel': channel,
      'type': type.name,
      'body': body,
      'attachment_url': attachmentUrl,
      'attachment_type': attachmentType,
      'attachment_name': attachmentName,
      'attachment_size': attachmentSize,
      'status': status.name,
      'sent_by': sentBy,
      'sender_name': senderName,
      'sender_avatar': senderAvatar,
      'metadata': metadata,
      'sent_at': sentAt.toIso8601String(),
      'is_note': isNote,
      'is_optimistic': isOptimistic,
    };
  }
}
