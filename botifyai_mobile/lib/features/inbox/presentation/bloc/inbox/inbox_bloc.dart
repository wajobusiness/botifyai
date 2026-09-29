import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/realtime/pusher_service.dart';
import '../../../domain/entities/conversation.dart';
import '../../../domain/entities/inbox_setup.dart';
import '../../../domain/repositories/inbox_repository.dart';
import '../../data/models/message_model.dart';
import 'inbox_event.dart';
import 'inbox_state.dart';

class InboxBloc extends Bloc<InboxEvent, InboxState> {
  final InboxRepository repository;
  final PusherService pusherService;
  StreamSubscription<PusherRealtimeEvent>? _pusherSubscription;

  InboxBloc({
    required this.repository,
    required this.pusherService,
  }) : super(InboxInitial()) {
    on<FetchInboxSetupEvent>(_onFetchInboxSetup);
    on<LoadConversationsEvent>(_onLoadConversations);
    on<ChangeFolderEvent>(_onChangeFolder);
    on<ChangeChannelFilterEvent>(_onChangeChannelFilter);
    on<SearchQueryChangedEvent>(_onSearchQueryChanged);
    on<ClearSearchEvent>(_onClearSearch);
    on<RealtimeMessageReceivedEvent>(_onRealtimeMessageReceived);
    on<RealtimeConversationUpdatedEvent>(_onRealtimeConversationUpdated);

    _listenToPusherEvents();
  }

  void _listenToPusherEvents() {
    _pusherSubscription = pusherService.eventStream.listen((event) {
      if (event.eventName == 'message.created' || event.eventName == 'MessageReceived') {
        try {
          final msgData = event.data['message'] is Map<String, dynamic>
              ? event.data['message'] as Map<String, dynamic>
              : event.data;
          final conversationUuid = event.data['conversation_uuid']?.toString() ??
              event.data['conversation']?['uuid']?.toString() ??
              msgData['conversation_uuid']?.toString() ??
              '';

          if (conversationUuid.isNotEmpty) {
            final message = MessageModel.fromJson(msgData, conversationUuid: conversationUuid);
            add(RealtimeMessageReceivedEvent(
              message: message,
              conversationUuid: conversationUuid,
            ));
          }
        } catch (_) {}
      }
    });
  }

  Future<void> _onFetchInboxSetup(
    FetchInboxSetupEvent event,
    Emitter<InboxState> emit,
  ) async {
    try {
      final setup = await repository.getInboxSetup();
      if (state is InboxLoaded) {
        emit((state as InboxLoaded).copyWith(setup: setup));
      } else {
        add(const LoadConversationsEvent());
      }
    } catch (_) {
      // If setup fails, still try loading conversations
      if (state is! InboxLoaded) {
        add(const LoadConversationsEvent());
      }
    }
  }

  Future<void> _onLoadConversations(
    LoadConversationsEvent event,
    Emitter<InboxState> emit,
  ) async {
    final currentState = state;
    InboxSetup? existingSetup;
    String folder = 'mine';
    String? channel;
    String search = '';
    List<Conversation> currentList = [];
    int pageToFetch = 1;

    if (currentState is InboxLoaded) {
      existingSetup = currentState.setup;
      folder = currentState.currentFolder;
      channel = currentState.currentChannel;
      search = currentState.searchQuery;

      if (event.isLoadMore) {
        if (currentState.isLoadingMore || !currentState.hasMore) return;
        emit(currentState.copyWith(isLoadingMore: true));
        pageToFetch = currentState.currentPage + 1;
        currentList = currentState.conversations;
      } else if (event.isRefresh) {
        emit(currentState.copyWith(isRefreshing: true));
        pageToFetch = 1;
      } else {
        emit(InboxLoading());
      }
    } else {
      emit(InboxLoading());
    }

    try {
      final paginated = await repository.getConversations(
        folder: folder,
        channel: channel,
        search: search.isNotEmpty ? search : null,
        page: pageToFetch,
      );

      final updatedList = event.isLoadMore
          ? [...currentList, ...paginated.data]
          : paginated.data;

      // Also try fetching setup if not present
      InboxSetup? setup = existingSetup;
      if (setup == null) {
        try {
          setup = await repository.getInboxSetup();
        } catch (_) {}
      }

      emit(InboxLoaded(
        conversations: updatedList,
        setup: setup,
        currentFolder: folder,
        currentChannel: channel,
        searchQuery: search,
        isRefreshing: false,
        isLoadingMore: false,
        hasMore: paginated.hasMore,
        currentPage: paginated.currentPage,
        totalCount: paginated.total,
      ));
    } catch (e) {
      if (currentState is InboxLoaded && (event.isRefresh || event.isLoadMore)) {
        emit(currentState.copyWith(
          isRefreshing: false,
          isLoadingMore: false,
        ));
      } else {
        emit(InboxError(e.toString().replaceAll('Exception: ', '')));
      }
    }
  }

  Future<void> _onChangeFolder(
    ChangeFolderEvent event,
    Emitter<InboxState> emit,
  ) async {
    final currentState = state;
    if (currentState is InboxLoaded) {
      if (currentState.currentFolder == event.folder) return;
      emit(currentState.copyWith(currentFolder: event.folder));
      add(const LoadConversationsEvent());
    } else {
      add(const LoadConversationsEvent());
    }
  }

  Future<void> _onChangeChannelFilter(
    ChangeChannelFilterEvent event,
    Emitter<InboxState> emit,
  ) async {
    final currentState = state;
    if (currentState is InboxLoaded) {
      emit(currentState.copyWith(currentChannel: event.channel));
      add(const LoadConversationsEvent());
    }
  }

  Future<void> _onSearchQueryChanged(
    SearchQueryChangedEvent event,
    Emitter<InboxState> emit,
  ) async {
    final currentState = state;
    if (currentState is InboxLoaded) {
      emit(currentState.copyWith(searchQuery: event.query));
      add(const LoadConversationsEvent());
    }
  }

  Future<void> _onClearSearch(
    ClearSearchEvent event,
    Emitter<InboxState> emit,
  ) async {
    final currentState = state;
    if (currentState is InboxLoaded) {
      emit(currentState.copyWith(searchQuery: ''));
      add(const LoadConversationsEvent());
    }
  }

  void _onRealtimeMessageReceived(
    RealtimeMessageReceivedEvent event,
    Emitter<InboxState> emit,
  ) {
    final currentState = state;
    if (currentState is! InboxLoaded) return;

    final convIndex = currentState.conversations.indexWhere(
      (c) => c.uuid == event.conversationUuid,
    );

    if (convIndex != -1) {
      final existingConv = currentState.conversations[convIndex];
      final updatedConv = existingConv.copyWith(
        lastMessage: event.message,
        lastMessageAt: event.message.sentAt,
        unreadCount: event.message.isInbound
            ? existingConv.unreadCount + 1
            : existingConv.unreadCount,
        lastCustomerMessageAt: event.message.isInbound
            ? event.message.sentAt
            : existingConv.lastCustomerMessageAt,
      );

      final newList = List<Conversation>.from(currentState.conversations);
      newList.removeAt(convIndex);
      newList.insert(0, updatedConv); // Bring conversation to the top!

      emit(currentState.copyWith(conversations: newList));
    } else {
      // If conversation is not in current list, refresh list
      add(const LoadConversationsEvent(isRefresh: true));
    }
  }

  void _onRealtimeConversationUpdated(
    RealtimeConversationUpdatedEvent event,
    Emitter<InboxState> emit,
  ) {
    final currentState = state;
    if (currentState is! InboxLoaded) return;

    final convIndex = currentState.conversations.indexWhere(
      (c) => c.uuid == event.conversation.uuid,
    );

    if (convIndex != -1) {
      final newList = List<Conversation>.from(currentState.conversations);
      newList[convIndex] = event.conversation;
      emit(currentState.copyWith(conversations: newList));
    }
  }

  @override
  Future<void> close() {
    _pusherSubscription?.cancel();
    return super.close();
  }
}
