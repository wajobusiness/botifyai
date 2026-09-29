import 'package:equatable/equatable.dart';
import '../../../domain/entities/message.dart';

abstract class ChatDetailEvent extends Equatable {
  const ChatDetailEvent();

  @override
  List<Object?> get props => [];
}

class LoadChatDetailEvent extends ChatDetailEvent {
  final String conversationUuid;

  const LoadChatDetailEvent(this.conversationUuid);

  @override
  List<Object?> get props => [conversationUuid];
}

class LoadMoreMessagesEvent extends ChatDetailEvent {}

class SendTextMessageEvent extends ChatDetailEvent {
  final String text;
  final bool isNote;

  const SendTextMessageEvent({
    required this.text,
    this.isNote = false,
  });

  @override
  List<Object?> get props => [text, isNote];
}

class SendAttachmentMessageEvent extends ChatDetailEvent {
  final dynamic attachment;
  final String type; // 'image', 'video', 'audio', 'document'
  final String? caption;
  final bool isNote;

  const SendAttachmentMessageEvent({
    required this.attachment,
    required this.type,
    this.caption,
    this.isNote = false,
  });

  @override
  List<Object?> get props => [attachment, type, caption, isNote];
}

class RetryMessageEvent extends ChatDetailEvent {
  final Message message;

  const RetryMessageEvent(this.message);

  @override
  List<Object?> get props => [message];
}

class InboundMessageReceivedChatEvent extends ChatDetailEvent {
  final Message message;

  const InboundMessageReceivedChatEvent(this.message);

  @override
  List<Object?> get props => [message];
}

class TypingIndicatorReceivedChatEvent extends ChatDetailEvent {
  final bool isTyping;
  final String? userName;

  const TypingIndicatorReceivedChatEvent({
    required this.isTyping,
    this.userName,
  });

  @override
  List<Object?> get props => [isTyping, userName];
}

class SendUserTypingEvent extends ChatDetailEvent {
  final bool isTyping;

  const SendUserTypingEvent(this.isTyping);

  @override
  List<Object?> get props => [isTyping];
}

class ToggleNoteModeEvent extends ChatDetailEvent {}

class AssignChatEvent extends ChatDetailEvent {
  final int? userId;
  final String? assignedTo;

  const AssignChatEvent({
    required this.userId,
    this.assignedTo,
  });

  @override
  List<Object?> get props => [userId, assignedTo];
}

class UpdateChatStatusEvent extends ChatDetailEvent {
  final String status;

  const UpdateChatStatusEvent(this.status);

  @override
  List<Object?> get props => [status];
}
