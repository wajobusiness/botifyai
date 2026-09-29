import 'dart:async';
import 'package:flutter/foundation.dart';
import '../database/cached_message.dart';
import '../database/local_database_service.dart';

enum SyncStatus { idle, syncing, completed, error }

class SyncEvent {
  final SyncStatus status;
  final int pendingCount;
  final String? lastError;

  SyncEvent({
    required this.status,
    required this.pendingCount,
    this.lastError,
  });
}

class OfflineSyncQueue {
  static final OfflineSyncQueue _instance = OfflineSyncQueue._internal();
  factory OfflineSyncQueue({LocalDatabaseService? databaseService}) {
    if (databaseService != null) {
      _instance._databaseService = databaseService;
    }
    return _instance;
  }
  OfflineSyncQueue._internal() : _databaseService = LocalDatabaseService();

  late LocalDatabaseService _databaseService;
  bool _isProcessing = false;

  final _syncEventController = StreamController<SyncEvent>.broadcast();
  Stream<SyncEvent> get syncStream => _syncEventController.stream;

  /// Enqueue an outbound message for offline sync
  Future<void> enqueue({
    required String workspaceId,
    required CachedMessage message,
  }) async {
    await _databaseService.enqueueOfflineMessage(
      workspaceId: workspaceId,
      message: message,
    );
    final count = await getPendingCount(workspaceId: workspaceId);
    _syncEventController.add(
      SyncEvent(status: SyncStatus.idle, pendingCount: count),
    );
  }

  /// Get pending queue count
  Future<int> getPendingCount({required String workspaceId}) async {
    final queue = await _databaseService.getOfflineQueue(workspaceId: workspaceId);
    return queue.length;
  }

  /// Process all queued messages using a dispatch function
  Future<void> processQueue({
    required String workspaceId,
    required Future<bool> Function(CachedMessage message) sendFunction,
  }) async {
    if (_isProcessing) return;
    _isProcessing = true;

    try {
      final queue = await _databaseService.getOfflineQueue(workspaceId: workspaceId);
      if (queue.isEmpty) {
        _isProcessing = false;
        _syncEventController.add(
          SyncEvent(status: SyncStatus.idle, pendingCount: 0),
        );
        return;
      }

      _syncEventController.add(
        SyncEvent(status: SyncStatus.syncing, pendingCount: queue.length),
      );

      debugPrint('Processing ${queue.length} offline messages for workspace $workspaceId...');

      for (final msg in queue) {
        try {
          final success = await sendFunction(msg);
          if (success) {
            await _databaseService.removeOfflineMessage(
              workspaceId: workspaceId,
              messageUuid: msg.uuid,
            );
            debugPrint('Successfully synced offline message: ${msg.uuid}');
          } else {
            debugPrint('Failed to sync offline message: ${msg.uuid} (will retry later)');
            // Break loop to preserve chronological delivery order
            break;
          }
        } catch (e) {
          debugPrint('Error syncing offline message ${msg.uuid}: $e');
          break;
        }
      }

      final remaining = await getPendingCount(workspaceId: workspaceId);
      _syncEventController.add(
        SyncEvent(status: SyncStatus.completed, pendingCount: remaining),
      );
    } catch (e) {
      debugPrint('OfflineSyncQueue processQueue error: $e');
      final remaining = await getPendingCount(workspaceId: workspaceId);
      _syncEventController.add(
        SyncEvent(status: SyncStatus.error, pendingCount: remaining, lastError: e.toString()),
      );
    } finally {
      _isProcessing = false;
    }
  }
}
