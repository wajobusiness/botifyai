import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/core/database/cached_message.dart';
import 'package:botifyai_mobile/core/database/local_database_service.dart';
import 'package:botifyai_mobile/core/sync/offline_sync_queue.dart';

class InMemoryLocalDatabaseService extends LocalDatabaseService {
  final Map<String, List<CachedMessage>> _inMemoryQueue = {};

  @override
  Future<void> enqueueOfflineMessage({required String workspaceId, required CachedMessage message}) async {
    _inMemoryQueue.putIfAbsent(workspaceId, () => []).add(message);
  }

  @override
  Future<List<CachedMessage>> getOfflineQueue({required String workspaceId}) async {
    return List.from(_inMemoryQueue[workspaceId] ?? []);
  }

  @override
  Future<void> removeOfflineMessage({required String workspaceId, required String messageUuid}) async {
    _inMemoryQueue[workspaceId]?.removeWhere((m) => m.uuid == messageUuid);
  }

  @override
  Future<void> clearOfflineQueue({required String workspaceId}) async {
    _inMemoryQueue.remove(workspaceId);
  }
}

void main() {
  group('OfflineSyncQueue Unit Tests', () {
    late InMemoryLocalDatabaseService fakeDb;
    late OfflineSyncQueue syncQueue;

    setUp(() {
      fakeDb = InMemoryLocalDatabaseService();
      syncQueue = OfflineSyncQueue(databaseService: fakeDb);
    });

    test('Enqueueing messages increments pending count', () async {
      final msg1 = CachedMessage(
        id: 0,
        uuid: 'off-1',
        conversationUuid: 'conv-1',
        senderType: 'agent',
        body: 'First offline message',
        createdAt: DateTime.now().toIso8601String(),
      );

      final msg2 = CachedMessage(
        id: 0,
        uuid: 'off-2',
        conversationUuid: 'conv-1',
        senderType: 'agent',
        body: 'Second offline message',
        createdAt: DateTime.now().toIso8601String(),
      );

      await syncQueue.enqueue(workspaceId: '1', message: msg1);
      await syncQueue.enqueue(workspaceId: '1', message: msg2);

      final count = await syncQueue.getPendingCount(workspaceId: '1');
      expect(count, equals(2));
    });

    test('Process queue flushes all messages on success in FIFO order', () async {
      final msg1 = CachedMessage(
        id: 0,
        uuid: 'off-1',
        conversationUuid: 'conv-1',
        senderType: 'agent',
        body: 'First offline message',
        createdAt: DateTime.now().toIso8601String(),
      );

      final msg2 = CachedMessage(
        id: 0,
        uuid: 'off-2',
        conversationUuid: 'conv-1',
        senderType: 'agent',
        body: 'Second offline message',
        createdAt: DateTime.now().toIso8601String(),
      );

      await syncQueue.enqueue(workspaceId: '1', message: msg1);
      await syncQueue.enqueue(workspaceId: '1', message: msg2);

      final dispatchedList = <String>[];

      await syncQueue.processQueue(
        workspaceId: '1',
        sendFunction: (msg) async {
          dispatchedList.add(msg.uuid);
          return true;
        },
      );

      expect(dispatchedList, equals(['off-1', 'off-2']));
      final remaining = await syncQueue.getPendingCount(workspaceId: '1');
      expect(remaining, equals(0));
    });

    test('Process queue stops and preserves remaining messages if send fails', () async {
      final msg1 = CachedMessage(
        id: 0,
        uuid: 'off-1',
        conversationUuid: 'conv-1',
        senderType: 'agent',
        body: 'First offline message',
        createdAt: DateTime.now().toIso8601String(),
      );

      final msg2 = CachedMessage(
        id: 0,
        uuid: 'off-2',
        conversationUuid: 'conv-1',
        senderType: 'agent',
        body: 'Second offline message',
        createdAt: DateTime.now().toIso8601String(),
      );

      await syncQueue.enqueue(workspaceId: '1', message: msg1);
      await syncQueue.enqueue(workspaceId: '1', message: msg2);

      int attempts = 0;
      await syncQueue.processQueue(
        workspaceId: '1',
        sendFunction: (msg) async {
          attempts++;
          return false; // Network fail
        },
      );

      expect(attempts, equals(1));
      final remaining = await syncQueue.getPendingCount(workspaceId: '1');
      expect(remaining, equals(2));
    });
  });
}
