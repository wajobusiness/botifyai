import 'package:equatable/equatable.dart';
import '../../../domain/entities/conversation.dart';
import '../../../domain/entities/inbox_setup.dart';

abstract class InboxState extends Equatable {
  const InboxState();

  @override
  List<Object?> get props => [];
}

class InboxInitial extends InboxState {}

class InboxLoading extends InboxState {}

class InboxLoaded extends InboxState {
  final List<Conversation> conversations;
  final InboxSetup? setup;
  final String currentFolder; // 'mine', 'unassigned', 'all', 'resolved', 'snoozed'
  final String? currentChannel; // 'all', 'whatsapp', 'instagram', 'messenger', 'webchat'
  final String searchQuery;
  final bool isRefreshing;
  final bool isLoadingMore;
  final bool hasMore;
  final int currentPage;
  final int totalCount;

  const InboxLoaded({
    required this.conversations,
    this.setup,
    this.currentFolder = 'mine',
    this.currentChannel,
    this.searchQuery = '',
    this.isRefreshing = false,
    this.isLoadingMore = false,
    this.hasMore = false,
    this.currentPage = 1,
    this.totalCount = 0,
  });

  InboxLoaded copyWith({
    List<Conversation>? conversations,
    InboxSetup? setup,
    String? currentFolder,
    String? currentChannel,
    String? searchQuery,
    bool? isRefreshing,
    bool? isLoadingMore,
    bool? hasMore,
    int? currentPage,
    int? totalCount,
  }) {
    return InboxLoaded(
      conversations: conversations ?? this.conversations,
      setup: setup ?? this.setup,
      currentFolder: currentFolder ?? this.currentFolder,
      currentChannel: currentChannel ?? this.currentChannel,
      searchQuery: searchQuery ?? this.searchQuery,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      totalCount: totalCount ?? this.totalCount,
    );
  }

  @override
  List<Object?> get props => [
        conversations,
        setup,
        currentFolder,
        currentChannel,
        searchQuery,
        isRefreshing,
        isLoadingMore,
        hasMore,
        currentPage,
        totalCount,
      ];
}

class InboxError extends InboxState {
  final String message;

  const InboxError(this.message);

  @override
  List<Object?> get props => [message];
}
