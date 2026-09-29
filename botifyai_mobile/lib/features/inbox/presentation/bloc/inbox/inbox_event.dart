import 'package:equatable/equatable.dart';
import '../../../domain/entities/conversation.dart';
import '../../../domain/entities/message.dart';

abstract class InboxEvent extends Equatable {
  const InboxEvent();

  @override
  List<Object?> get props => [];
}

class FetchInboxSetupEvent extends InboxEvent {}

class LoadConversationsEvent extends InboxEvent {
  final bool isRefresh;
  final bool isLoadMore;

  const LoadConversationsEvent({
    this.isRefresh = false,
    this.isLoadMore = false,
  });

  @override
  List<Object?> get props => [isRefresh, isLoadMore];
}

class ChangeFolderEvent extends InboxEvent {
  final String folder; // 'mine', 'unassigned', 'all', 'resolved', 'snoozed'

  const ChangeFolderEvent(this.folder);

  @override
  List<Object?> get props => [folder];
}

class ChangeChannelFilterEvent extends InboxEvent {
  final String? channel; // 'all', 'whatsapp', 'instagram', 'messenger', 'webchat'

  const ChangeChannelFilterEvent(this.channel);

  @override
  List<Object?> get props => [channel];
}

class SearchQueryChangedEvent extends InboxEvent {
  final String query;

  const SearchQueryChangedEvent(this.query);

  @override
  List<Object?> get props => [query];
}

class ClearSearchEvent extends InboxEvent {}

class RealtimeMessageReceivedEvent extends InboxEvent {
  final Message message;
  final String conversationUuid;

  const RealtimeMessageReceivedEvent({
    required this.message,
    required this.conversationUuid,
  });

  @override
  List<Object?> get props => [message, conversationUuid];
}

class RealtimeConversationUpdatedEvent extends InboxEvent {
  final Conversation conversation;

  const RealtimeConversationUpdatedEvent(this.conversation);

  @override
  List<Object?> get props => [conversation];
}
