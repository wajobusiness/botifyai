import '../entities/conversation.dart';
import '../entities/inbox_setup.dart';
import '../entities/message.dart';

class PaginatedList<T> {
  final List<T> data;
  final int currentPage;
  final int lastPage;
  final int total;

  const PaginatedList({
    required this.data,
    required this.currentPage,
    required this.lastPage,
    required this.total,
  });

  bool get hasMore => currentPage < lastPage;
}

abstract class InboxRepository {
  Future<InboxSetup> getInboxSetup();

  Future<PaginatedList<Conversation>> getConversations({
    String folder = 'mine',
    String? channel,
    String? search,
    int page = 1,
  });

  Future<Map<String, dynamic>> getConversationDetail(String uuid);

  Future<PaginatedList<Message>> getMessages(String uuid, {int page = 1});

  Future<Message> sendMessage({
    required String uuid,
    required String body,
    String type = 'text',
    dynamic attachment,
    Map<String, dynamic>? payload,
    bool isNote = false,
  });

  Future<Conversation> assignConversation({
    required String uuid,
    required int? userId,
    String? assignedTo,
  });

  Future<Conversation> updateConversationStatus({
    required String uuid,
    required String status,
  });

  Future<void> sendTypingIndicator({
    required String uuid,
    required bool isTyping,
  });

  Future<void> addNote({
    required String uuid,
    required String note,
  });

  Future<void> attachLabel({
    required String uuid,
    required int labelId,
  });

  Future<void> detachLabel({
    required String uuid,
    required int labelId,
  });
}
