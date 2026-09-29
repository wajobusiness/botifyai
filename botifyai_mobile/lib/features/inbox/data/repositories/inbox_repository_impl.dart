import 'package:flutter/foundation.dart';
import '../../domain/entities/conversation.dart';
import '../../domain/entities/inbox_setup.dart';
import '../../domain/entities/message.dart';
import '../../domain/entities/whatsapp_template.dart';
import '../../domain/repositories/inbox_repository.dart';
import '../datasources/inbox_remote_data_source.dart';
import '../../../../core/database/cached_conversation.dart';
import '../../../../core/database/cached_message.dart';
import '../../../../core/database/local_database_service.dart';
import '../../../../core/sync/offline_sync_queue.dart';

class InboxRepositoryImpl implements InboxRepository {
  final InboxRemoteDataSource remoteDataSource;
  final LocalDatabaseService localDatabase;
  final OfflineSyncQueue offlineSyncQueue;

  InboxRepositoryImpl({
    required this.remoteDataSource,
    LocalDatabaseService? localDatabase,
    OfflineSyncQueue? offlineSyncQueue,
  })  : localDatabase = localDatabase ?? LocalDatabaseService(),
        offlineSyncQueue = offlineSyncQueue ?? OfflineSyncQueue();

  @override
  Future<InboxSetup> getInboxSetup() async {
    return await remoteDataSource.getInboxSetup();
  }

  @override
  Future<List<WhatsAppTemplate>> getWhatsAppTemplates() async {
    return await remoteDataSource.getWhatsAppTemplates();
  }

  @override
  Future<PaginatedList<Conversation>> getConversations({
    String folder = 'mine',
    String? channel,
    String? search,
    int page = 1,
  }) async {
    try {
      final remoteList = await remoteDataSource.getConversations(
        folder: folder,
        channel: channel,
        search: search,
        page: page,
      );

      // Cache page 1 locally for instant startup & offline viewing
      if (page == 1 && (search == null || search.isEmpty)) {
        final cached = remoteList.data
            .map((c) => CachedConversation.fromDomain(c))
            .toList();
        await localDatabase.saveConversations(
          workspaceId: '1',
          conversations: cached,
        );
      }

      return remoteList;
    } catch (e) {
      debugPrint('InboxRepositoryImpl getConversations error (falling back to cache): $e');
      if (page == 1) {
        final cached = await localDatabase.getConversations(
          workspaceId: '1',
          folder: folder,
          query: search,
        );
        if (cached.isNotEmpty) {
          final domainList = cached.map((c) => c.toDomain()).toList();
          return PaginatedList<Conversation>(
            data: domainList,
            currentPage: 1,
            lastPage: 1,
            total: domainList.length,
          );
        }
      }
      rethrow;
    }
  }

  @override
  Future<Map<String, dynamic>> getConversationDetail(String uuid) async {
    return await remoteDataSource.getConversationDetail(uuid);
  }

  @override
  Future<PaginatedList<Message>> getMessages(String uuid, {int page = 1}) async {
    try {
      final remoteList = await remoteDataSource.getMessages(uuid, page: page);

      if (page == 1) {
        final cached = remoteList.data
            .map((m) => CachedMessage.fromDomain(m, conversationUuid: uuid))
            .toList();
        await localDatabase.saveMessages(
          conversationUuid: uuid,
          messages: cached,
        );
      }

      return remoteList;
    } catch (e) {
      debugPrint('InboxRepositoryImpl getMessages error (falling back to cache): $e');
      if (page == 1) {
        final cached = await localDatabase.getMessages(conversationUuid: uuid);
        if (cached.isNotEmpty) {
          final domainList = cached.map((m) => m.toDomain()).toList();
          return PaginatedList<Message>(
            data: domainList,
            currentPage: 1,
            lastPage: 1,
            total: domainList.length,
          );
        }
      }
      rethrow;
    }
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
    try {
      final sentMessage = await remoteDataSource.sendMessage(
        uuid: uuid,
        body: body,
        type: type,
        attachment: attachment,
        payload: payload,
        isNote: isNote,
      );

      // Append to local database
      await localDatabase.appendMessage(
        conversationUuid: uuid,
        message: CachedMessage.fromDomain(sentMessage, conversationUuid: uuid),
      );

      return sentMessage;
    } catch (e) {
      debugPrint('InboxRepositoryImpl sendMessage error (enqueuing for offline sync): $e');

      // Create offline pending message
      final tempUuid = 'offline_${DateTime.now().millisecondsSinceEpoch}';
      final offlineCached = CachedMessage(
        id: 0,
        uuid: tempUuid,
        conversationUuid: uuid,
        senderType: 'agent',
        senderName: 'You',
        type: type,
        body: body,
        status: 'pending_sync',
        isInternalNote: isNote,
        createdAt: DateTime.now().toIso8601String(),
      );

      // Enqueue to offline sync queue and local message list
      await offlineSyncQueue.enqueue(
        workspaceId: '1',
        message: offlineCached,
      );
      await localDatabase.appendMessage(
        conversationUuid: uuid,
        message: offlineCached,
      );

      return offlineCached.toDomain();
    }
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
