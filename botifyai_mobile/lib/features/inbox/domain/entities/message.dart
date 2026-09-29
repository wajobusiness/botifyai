import 'package:equatable/equatable.dart';

enum MessageDirection { inBound, outBound }

enum MessageType {
  text,
  template,
  image,
  video,
  audio,
  document,
  note,
  event,
}

enum MessageDeliveryStatus {
  pending,
  sent,
  delivered,
  read,
  failed,
}

class Message extends Equatable {
  final int? id;
  final String localId; // Used for optimistic UI matching
  final int? conversationId;
  final String conversationUuid;
  final MessageDirection direction;
  final String channel;
  final MessageType type;
  final String body;
  final String? attachmentUrl;
  final String? attachmentType;
  final String? attachmentName;
  final int? attachmentSize;
  final MessageDeliveryStatus status;
  final String sentBy; // 'customer', 'agent', 'bot', 'system'
  final String? senderName;
  final String? senderAvatar;
  final Map<String, dynamic>? metadata;
  final DateTime sentAt;
  final bool isNote;
  final bool isOptimistic;

  const Message({
    this.id,
    required this.localId,
    this.conversationId,
    required this.conversationUuid,
    required this.direction,
    this.channel = 'whatsapp',
    this.type = MessageType.text,
    required this.body,
    this.attachmentUrl,
    this.attachmentType,
    this.attachmentName,
    this.attachmentSize,
    this.status = MessageDeliveryStatus.delivered,
    required this.sentBy,
    this.senderName,
    this.senderAvatar,
    this.metadata,
    required this.sentAt,
    this.isNote = false,
    this.isOptimistic = false,
  });

  bool get isInbound => direction == MessageDirection.inBound;
  bool get isOutbound => direction == MessageDirection.outBound;

  Message copyWith({
    int? id,
    String? localId,
    int? conversationId,
    String? conversationUuid,
    MessageDirection? direction,
    String? channel,
    MessageType? type,
    String? body,
    String? attachmentUrl,
    String? attachmentType,
    String? attachmentName,
    int? attachmentSize,
    MessageDeliveryStatus? status,
    String? sentBy,
    String? senderName,
    String? senderAvatar,
    Map<String, dynamic>? metadata,
    DateTime? sentAt,
    bool? isNote,
    bool? isOptimistic,
  }) {
    return Message(
      id: id ?? this.id,
      localId: localId ?? this.localId,
      conversationId: conversationId ?? this.conversationId,
      conversationUuid: conversationUuid ?? this.conversationUuid,
      direction: direction ?? this.direction,
      channel: channel ?? this.channel,
      type: type ?? this.type,
      body: body ?? this.body,
      attachmentUrl: attachmentUrl ?? this.attachmentUrl,
      attachmentType: attachmentType ?? this.attachmentType,
      attachmentName: attachmentName ?? this.attachmentName,
      attachmentSize: attachmentSize ?? this.attachmentSize,
      status: status ?? this.status,
      sentBy: sentBy ?? this.sentBy,
      senderName: senderName ?? this.senderName,
      senderAvatar: senderAvatar ?? this.senderAvatar,
      metadata: metadata ?? this.metadata,
      sentAt: sentAt ?? this.sentAt,
      isNote: isNote ?? this.isNote,
      isOptimistic: isOptimistic ?? this.isOptimistic,
    );
  }

  @override
  List<Object?> get props => [
        id,
        localId,
        conversationId,
        conversationUuid,
        direction,
        channel,
        type,
        body,
        attachmentUrl,
        attachmentType,
        attachmentName,
        attachmentSize,
        status,
        sentBy,
        senderName,
        senderAvatar,
        metadata,
        sentAt,
        isNote,
        isOptimistic,
      ];
}
