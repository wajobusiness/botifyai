import '../../domain/entities/conversation.dart';
import '../../domain/entities/inbox_setup.dart';
import '../../domain/entities/message.dart';
import '../../domain/repositories/inbox_repository.dart';
import '../datasources/inbox_remote_data_source.dart';

class InboxRepositoryImpl implements InboxRepository {
  final InboxRemoteDataSource remoteDataSource;

  InboxRepositoryImpl({required this.remoteDataSource});

  @override
  Future<InboxSetup> getInboxSetup() async {
    return await remoteDataSource.getInboxSetup();
  }

  @override
  Future<PaginatedList<Conversation>> getConversations({
    String folder = 'mine',
    String? channel,
    String? search,
    int page = 1,
  }) async {
    return await remoteDataSource.getConversations(
      folder: folder,
      channel: channel,
      search: search,
      page: page,
    );
  }

  @override
  Future<Map<String, dynamic>> getConversationDetail(String uuid) async {
    return await remoteDataSource.getConversationDetail(uuid);
  }

  @override
  Future<PaginatedList<Message>> getMessages(String uuid, {int page = 1}) async {
    return await remoteDataSource.getMessages(uuid, page: page);
  }

  @override
  Future<Message> sendMessage({
    required String uuid,
    required String body,
    String type = 'text',
    dynamic attachment,
    Map<String, dynamic>? payload,
    bool isNote = false,
  }) async {
    return await remoteDataSource.sendMessage(
      uuid: uuid,
      body: body,
      type: type,
      attachment: attachment,
      payload: payload,
      isNote: isNote,
    );
  }

  @override
  Future<Conversation> assignConversation({
    required String uuid,
    required int? userId,
    String? assignedTo,
  }) async {
    return await remoteDataSource.assignConversation(
      uuid: uuid,
      userId: userId,
      assignedTo: assignedTo,
    );
  }

  @override
  Future<Conversation> updateConversationStatus({
    required String uuid,
    required String status,
  }) async {
    return await remoteDataSource.updateConversationStatus(
      uuid: uuid,
      status: status,
    );
  }

  @override
  Future<void> sendTypingIndicator({
    required String uuid,
    required bool isTyping,
  }) async {
    await remoteDataSource.sendTypingIndicator(
      uuid: uuid,
      isTyping: isTyping,
    );
  }

  @override
  Future<void> addNote({
    required String uuid,
    required String note,
  }) async {
    await remoteDataSource.addNote(uuid: uuid, note: note);
  }

  @override
  Future<void> attachLabel({
    required String uuid,
    required int labelId,
  }) async {
    await remoteDataSource.attachLabel(uuid: uuid, labelId: labelId);
  }

  @override
  Future<void> detachLabel({
    required String uuid,
    required int labelId,
  }) async {
    await remoteDataSource.detachLabel(uuid: uuid, labelId: labelId);
  }
}
