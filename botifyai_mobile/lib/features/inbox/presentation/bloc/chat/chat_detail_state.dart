import 'package:equatable/equatable.dart';
import '../../../domain/entities/conversation.dart';
import '../../../domain/entities/message.dart';

abstract class ChatDetailState extends Equatable {
  const ChatDetailState();

  @override
  List<Object?> get props => [];
}

class ChatDetailInitial extends ChatDetailState {}

class ChatDetailLoading extends ChatDetailState {}

class ChatDetailLoaded extends ChatDetailState {
  final Conversation conversation;
  final List<Message> messages; // Ordered newest first for inverted ListView
  final bool isOtherTyping;
  final String? typingUserName;
  final bool isSending;
  final bool isLoadingMore;
  final bool hasMoreMessages;
  final int currentPage;
  final bool isNoteMode;
  final String? errorMessage;

  const ChatDetailLoaded({
    required this.conversation,
    required this.messages,
    this.isOtherTyping = false,
    this.typingUserName,
    this.isSending = false,
    this.isLoadingMore = false,
    this.hasMoreMessages = false,
    this.currentPage = 1,
    this.isNoteMode = false,
    this.errorMessage,
  });

  ChatDetailLoaded copyWith({
    Conversation? conversation,
    List<Message>? messages,
    bool? isOtherTyping,
    String? typingUserName,
    bool? isSending,
    bool? isLoadingMore,
    bool? hasMoreMessages,
    int? currentPage,
    bool? isNoteMode,
    String? errorMessage,
  }) {
    return ChatDetailLoaded(
      conversation: conversation ?? this.conversation,
      messages: messages ?? this.messages,
      isOtherTyping: isOtherTyping ?? this.isOtherTyping,
      typingUserName: typingUserName ?? this.typingUserName,
      isSending: isSending ?? this.isSending,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMoreMessages: hasMoreMessages ?? this.hasMoreMessages,
      currentPage: currentPage ?? this.currentPage,
      isNoteMode: isNoteMode ?? this.isNoteMode,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [
        conversation,
        messages,
        isOtherTyping,
        typingUserName,
        isSending,
        isLoadingMore,
        hasMoreMessages,
        currentPage,
        isNoteMode,
        errorMessage,
      ];
}

class ChatDetailError extends ChatDetailState {
  final String message;

  const ChatDetailError(this.message);

  @override
  List<Object?> get props => [message];
}
