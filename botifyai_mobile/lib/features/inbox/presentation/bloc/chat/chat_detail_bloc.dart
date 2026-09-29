import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/realtime/pusher_service.dart';
import '../../../domain/entities/conversation.dart';
import '../../../domain/entities/message.dart';
import '../../../domain/repositories/inbox_repository.dart';
import '../../data/models/message_model.dart';
import 'chat_detail_event.dart';
import 'chat_detail_state.dart';

class ChatDetailBloc extends Bloc<ChatDetailEvent, ChatDetailState> {
  final InboxRepository repository;
  final PusherService pusherService;
  StreamSubscription<PusherRealtimeEvent>? _pusherSubscription;
  Timer? _typingDebounceTimer;
  Timer? _typingIndicatorResetTimer;
  String? _activeConversationUuid;

  ChatDetailBloc({
    required this.repository,
    required this.pusherService,
  }) : super(ChatDetailInitial()) {
    on<LoadChatDetailEvent>(_onLoadChatDetail);
    on<LoadMoreMessagesEvent>(_onLoadMoreMessages);
    on<SendTextMessageEvent>(_onSendTextMessage);
    on<SendAttachmentMessageEvent>(_onSendAttachmentMessage);
    on<RetryMessageEvent>(_onRetryMessage);
    on<InboundMessageReceivedChatEvent>(_onInboundMessageReceived);
    on<TypingIndicatorReceivedChatEvent>(_onTypingIndicatorReceived);
    on<SendUserTypingEvent>(_onSendUserTyping);
    on<ToggleNoteModeEvent>(_onToggleNoteMode);
    on<AssignChatEvent>(_onAssignChat);
    on<UpdateChatStatusEvent>(_onUpdateChatStatus);

    _listenToPusherEvents();
  }

  void _listenToPusherEvents() {
    _pusherSubscription = pusherService.eventStream.listen((event) {
      if (_activeConversationUuid == null) return;

      if (event.eventName == 'message.created' || event.eventName == 'MessageReceived') {
        try {
          final msgData = event.data['message'] is Map<String, dynamic>
              ? event.data['message'] as Map<String, dynamic>
              : event.data;
          final convUuid = event.data['conversation_uuid']?.toString() ??
              event.data['conversation']?['uuid']?.toString() ??
              msgData['conversation_uuid']?.toString() ??
              '';

          if (convUuid == _activeConversationUuid) {
            final message = MessageModel.fromJson(msgData, conversationUuid: _activeConversationUuid);
            add(InboundMessageReceivedChatEvent(message));
          }
        } catch (_) {}
      } else if (event.eventName == 'typing.indicator' || event.eventName == 'TypingChanged') {
        try {
          final convUuid = event.data['conversation_uuid']?.toString() ?? '';
          if (convUuid == _activeConversationUuid) {
            final isTyping = event.data['typing'] == true || event.data['is_typing'] == true;
            final userName = event.data['user_name']?.toString() ?? 'Customer';
            add(TypingIndicatorReceivedChatEvent(isTyping: isTyping, userName: userName));
          }
        } catch (_) {}
      }
    });
  }

  Future<void> _onLoadChatDetail(
    LoadChatDetailEvent event,
    Emitter<ChatDetailState> emit,
  ) async {
    _activeConversationUuid = event.conversationUuid;
    emit(ChatDetailLoading());

    try {
      final detailData = await repository.getConversationDetail(event.conversationUuid);
      final Conversation conversation = detailData['conversation'] as Conversation;
      final List<Message> rawMessages = (detailData['messages'] as List<dynamic>?)
              ?.map((e) => e as Message)
              .toList() ??
          [];

      // Sort newest first (index 0 = most recent) for inverted ListView
      rawMessages.sort((a, b) => b.sentAt.compareTo(a.sentAt));

      emit(ChatDetailLoaded(
        conversation: conversation,
        messages: rawMessages,
        hasMoreMessages: rawMessages.length >= 20,
        currentPage: 1,
      ));

      // Subscribe to conversation Pusher channel
      await pusherService.subscribeToConversation(event.conversationUuid);
    } catch (e) {
      emit(ChatDetailError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onLoadMoreMessages(
    LoadMoreMessagesEvent event,
    Emitter<ChatDetailState> emit,
  ) async {
    final currentState = state;
    if (currentState is! ChatDetailLoaded || currentState.isLoadingMore || !currentState.hasMoreMessages) {
      return;
    }

    emit(currentState.copyWith(isLoadingMore: true));

    try {
      final nextPage = currentState.currentPage + 1;
      final paginated = await repository.getMessages(
        currentState.conversation.uuid,
        page: nextPage,
      );

      final newMessages = List<Message>.from(paginated.data);
      newMessages.sort((a, b) => b.sentAt.compareTo(a.sentAt));

      // Combine existing messages and new historical messages
      final combined = [...currentState.messages, ...newMessages];

      emit(currentState.copyWith(
        messages: combined,
        isLoadingMore: false,
        hasMoreMessages: paginated.hasMore,
        currentPage: nextPage,
      ));
    } catch (_) {
      emit(currentState.copyWith(isLoadingMore: false));
    }
  }

  Future<void> _onSendTextMessage(
    SendTextMessageEvent event,
    Emitter<ChatDetailState> emit,
  ) async {
    final currentState = state;
    if (currentState is! ChatDetailLoaded || event.text.trim().isEmpty) return;

    final localId = 'temp_${DateTime.now().millisecondsSinceEpoch}';
    final isNote = event.isNote || currentState.isNoteMode;

    // Create optimistic message
    final optimisticMessage = Message(
      localId: localId,
      conversationId: currentState.conversation.id,
      conversationUuid: currentState.conversation.uuid,
      direction: MessageDirection.outBound,
      channel: currentState.conversation.channel,
      type: isNote ? MessageType.note : MessageType.text,
      body: event.text.trim(),
      status: MessageDeliveryStatus.pending,
      sentBy: isNote ? 'note' : 'agent',
      sentAt: DateTime.now(),
      isNote: isNote,
      isOptimistic: true,
    );

    // Insert optimistic message at top of list
    final updatedMessages = [optimisticMessage, ...currentState.messages];
    emit(currentState.copyWith(messages: updatedMessages, isSending: true));

    try {
      final confirmedMessage = await repository.sendMessage(
        uuid: currentState.conversation.uuid,
        body: event.text.trim(),
        type: isNote ? 'note' : 'text',
        isNote: isNote,
      );

      final currentLoaded = state as ChatDetailLoaded;
      final index = currentLoaded.messages.indexWhere((m) => m.localId == localId);

      if (index != -1) {
        final confirmedList = List<Message>.from(currentLoaded.messages);
        confirmedList[index] = confirmedMessage.copyWith(
          localId: localId,
          status: MessageDeliveryStatus.sent,
        );
        emit(currentLoaded.copyWith(messages: confirmedList, isSending: false));
      }
    } catch (e) {
      final currentLoaded = state as ChatDetailLoaded;
      final index = currentLoaded.messages.indexWhere((m) => m.localId == localId);

      if (index != -1) {
        final failedList = List<Message>.from(currentLoaded.messages);
        failedList[index] = optimisticMessage.copyWith(
          status: MessageDeliveryStatus.failed,
        );
        emit(currentLoaded.copyWith(
          messages: failedList,
          isSending: false,
          errorMessage: 'Message failed to send. Tap to retry.',
        ));
      }
    }
  }

  Future<void> _onSendAttachmentMessage(
    SendAttachmentMessageEvent event,
    Emitter<ChatDetailState> emit,
  ) async {
    final currentState = state;
    if (currentState is! ChatDetailLoaded) return;

    final localId = 'temp_att_${DateTime.now().millisecondsSinceEpoch}';
    MessageType msgType = MessageType.document;
    if (event.type == 'image') msgType = MessageType.image;
    if (event.type == 'video') msgType = MessageType.video;
    if (event.type == 'audio') msgType = MessageType.audio;

    final optimisticMessage = Message(
      localId: localId,
      conversationId: currentState.conversation.id,
      conversationUuid: currentState.conversation.uuid,
      direction: MessageDirection.outBound,
      channel: currentState.conversation.channel,
      type: msgType,
      body: event.caption ?? '',
      status: MessageDeliveryStatus.pending,
      sentBy: 'agent',
      sentAt: DateTime.now(),
      isNote: event.isNote,
      isOptimistic: true,
    );

    final updatedMessages = [optimisticMessage, ...currentState.messages];
    emit(currentState.copyWith(messages: updatedMessages, isSending: true));

    try {
      final confirmedMessage = await repository.sendMessage(
        uuid: currentState.conversation.uuid,
        body: event.caption ?? '',
        type: event.type,
        attachment: event.attachment,
        isNote: event.isNote,
      );

      final currentLoaded = state as ChatDetailLoaded;
      final index = currentLoaded.messages.indexWhere((m) => m.localId == localId);

      if (index != -1) {
        final confirmedList = List<Message>.from(currentLoaded.messages);
        confirmedList[index] = confirmedMessage.copyWith(
          localId: localId,
          status: MessageDeliveryStatus.sent,
        );
        emit(currentLoaded.copyWith(messages: confirmedList, isSending: false));
      }
    } catch (e) {
      final currentLoaded = state as ChatDetailLoaded;
      final index = currentLoaded.messages.indexWhere((m) => m.localId == localId);

      if (index != -1) {
        final failedList = List<Message>.from(currentLoaded.messages);
        failedList[index] = optimisticMessage.copyWith(
          status: MessageDeliveryStatus.failed,
        );
        emit(currentLoaded.copyWith(messages: failedList, isSending: false));
      }
    }
  }

  Future<void> _onRetryMessage(
    RetryMessageEvent event,
    Emitter<ChatDetailState> emit,
  ) async {
    add(SendTextMessageEvent(text: event.message.body, isNote: event.message.isNote));
  }

  void _onInboundMessageReceived(
    InboundMessageReceivedChatEvent event,
    Emitter<ChatDetailState> emit,
  ) {
    final currentState = state;
    if (currentState is! ChatDetailLoaded) return;

    // Deduplicate by id or localId
    final exists = currentState.messages.any(
      (m) => (m.id != null && m.id == event.message.id) || m.localId == event.message.localId,
    );

    if (!exists) {
      final updatedMessages = [event.message, ...currentState.messages];
      emit(currentState.copyWith(
        messages: updatedMessages,
        isOtherTyping: false,
      ));
    }
  }

  void _onTypingIndicatorReceived(
    TypingIndicatorReceivedChatEvent event,
    Emitter<ChatDetailState> emit,
  ) {
    final currentState = state;
    if (currentState is! ChatDetailLoaded) return;

    _typingIndicatorResetTimer?.cancel();

    if (event.isTyping) {
      emit(currentState.copyWith(
        isOtherTyping: true,
        typingUserName: event.userName,
      ));

      _typingIndicatorResetTimer = Timer(const Duration(seconds: 4), () {
        if (!isClosed && state is ChatDetailLoaded) {
          add(const TypingIndicatorReceivedChatEvent(isTyping: false));
        }
      });
    } else {
      emit(currentState.copyWith(isOtherTyping: false));
    }
  }

  void _onSendUserTyping(
    SendUserTypingEvent event,
    Emitter<ChatDetailState> emit,
  ) {
    if (_activeConversationUuid == null) return;

    _typingDebounceTimer?.cancel();
    _typingDebounceTimer = Timer(const Duration(milliseconds: 300), () {
      repository.sendTypingIndicator(
        uuid: _activeConversationUuid!,
        isTyping: event.isTyping,
      );
    });
  }

  void _onToggleNoteMode(
    ToggleNoteModeEvent event,
    Emitter<ChatDetailState> emit,
  ) {
    final currentState = state;
    if (currentState is ChatDetailLoaded) {
      emit(currentState.copyWith(isNoteMode: !currentState.isNoteMode));
    }
  }

  Future<void> _onAssignChat(
    AssignChatEvent event,
    Emitter<ChatDetailState> emit,
  ) async {
    final currentState = state;
    if (currentState is! ChatDetailLoaded) return;

    try {
      final updatedConv = await repository.assignConversation(
        uuid: currentState.conversation.uuid,
        userId: event.userId,
        assignedTo: event.assignedTo,
      );
      emit(currentState.copyWith(conversation: updatedConv));
    } catch (_) {}
  }

  Future<void> _onUpdateChatStatusEvent(
    UpdateChatStatusEvent event,
    Emitter<ChatDetailState> emit,
  ) async {
    final currentState = state;
    if (currentState is! ChatDetailLoaded) return;

    try {
      final updatedConv = await repository.updateConversationStatus(
        uuid: currentState.conversation.uuid,
        status: event.status,
      );
      emit(currentState.copyWith(conversation: updatedConv));
    } catch (_) {}
  }

  @override
  Future<void> close() {
    if (_activeConversationUuid != null) {
      pusherService.unsubscribeFromConversation(_activeConversationUuid!);
    }
    _pusherSubscription?.cancel();
    _typingDebounceTimer?.cancel();
    _typingIndicatorResetTimer?.cancel();
    return super.close();
  }
}
