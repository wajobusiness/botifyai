import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'cached_conversation.dart';
import 'cached_message.dart';

class LocalDatabaseService {
  static final LocalDatabaseService _instance = LocalDatabaseService._internal();
  factory LocalDatabaseService() => _instance;
  LocalDatabaseService._internal();
  LocalDatabaseService.test();

  static const String _conversationsKeyPrefix = 'botify_cached_conversations_';
  static const String _messagesKeyPrefix = 'botify_cached_messages_';
  static const String _offlineQueueKeyPrefix = 'botify_offline_queue_';

  SharedPreferences? _prefs;

  Future<SharedPreferences> _getPrefs() async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  // ==========================================
  // CONVERSATION CACHE
  // ==========================================

  /// Save or replace list of conversations for a workspace
  Future<void> saveConversations({
    required String workspaceId,
    required List<CachedConversation> conversations,
  }) async {
    try {
      final prefs = await _getPrefs();
      final key = '$_conversationsKeyPrefix$workspaceId';
      final jsonList = conversations.map((c) => c.toJson()).toList();
      await prefs.setString(key, jsonEncode(jsonList));
    } catch (e) {
      debugPrint('LocalDatabaseService saveConversations error: $e');
    }
  }

  /// Get cached conversations for a workspace
  Future<List<CachedConversation>> getConversations({
    required String workspaceId,
    String? folder,
    String? query,
  }) async {
    try {
      final prefs = await _getPrefs();
      final key = '$_conversationsKeyPrefix$workspaceId';
      final raw = prefs.getString(key);
      if (raw == null || raw.isEmpty) return [];

      final List<dynamic> jsonList = jsonDecode(raw);
      var items = jsonList.map((j) => CachedConversation.fromJson(j as Map<String, dynamic>)).toList();

      if (folder != null && folder.isNotEmpty && folder != 'all') {
        if (folder == 'unassigned') {
          items = items.where((c) => c.assignedToName == null || c.assignedToName!.isEmpty).toList();
        } else if (folder == 'resolved') {
          items = items.where((c) => c.status == 'resolved' || c.status == 'closed').toList();
        } else if (folder == 'snoozed') {
          items = items.where((c) => c.status == 'snoozed').toList();
        }
      }

      if (query != null && query.isNotEmpty) {
        final lower = query.toLowerCase();
        items = items.where((c) {
          return c.contactName.toLowerCase().contains(lower) ||
              c.lastMessageText.toLowerCase().contains(lower) ||
              (c.contactPhone != null && c.contactPhone!.contains(lower));
        }).toList();
      }

      return items;
    } catch (e) {
      debugPrint('LocalDatabaseService getConversations error: $e');
      return [];
    }
  }

  /// Upsert single conversation
  Future<void> upsertConversation({
    required String workspaceId,
    required CachedConversation conversation,
  }) async {
    try {
      final list = await getConversations(workspaceId: workspaceId);
      final index = list.indexWhere((c) => c.uuid == conversation.uuid);
      if (index >= 0) {
        list[index] = conversation;
      } else {
        list.insert(0, conversation);
      }
      await saveConversations(workspaceId: workspaceId, conversations: list);
    } catch (e) {
      debugPrint('LocalDatabaseService upsertConversation error: $e');
    }
  }

  // ==========================================
  // MESSAGE CACHE
  // ==========================================

  /// Save messages for a conversation
  Future<void> saveMessages({
    required String conversationUuid,
    required List<CachedMessage> messages,
  }) async {
    try {
      final prefs = await _getPrefs();
      final key = '$_messagesKeyPrefix$conversationUuid';
      final jsonList = messages.map((m) => m.toJson()).toList();
      await prefs.setString(key, jsonEncode(jsonList));
    } catch (e) {
      debugPrint('LocalDatabaseService saveMessages error: $e');
    }
  }

  /// Get messages for a conversation
  Future<List<CachedMessage>> getMessages({
    required String conversationUuid,
  }) async {
    try {
      final prefs = await _getPrefs();
      final key = '$_messagesKeyPrefix$conversationUuid';
      final raw = prefs.getString(key);
      if (raw == null || raw.isEmpty) return [];

      final List<dynamic> jsonList = jsonDecode(raw);
      return jsonList.map((j) => CachedMessage.fromJson(j as Map<String, dynamic>)).toList();
    } catch (e) {
      debugPrint('LocalDatabaseService getMessages error: $e');
      return [];
    }
  }

  /// Append or update message in a conversation
  Future<void> appendMessage({
    required String conversationUuid,
    required CachedMessage message,
  }) async {
    try {
      final list = await getMessages(conversationUuid: conversationUuid);
      final index = list.indexWhere((m) => m.uuid == message.uuid);
      if (index >= 0) {
        list[index] = message;
      } else {
        list.add(message);
      }
      await saveMessages(conversationUuid: conversationUuid, messages: list);
    } catch (e) {
      debugPrint('LocalDatabaseService appendMessage error: $e');
    }
  }

  // ==========================================
  // OFFLINE SYNC QUEUE
  // ==========================================

  /// Enqueue message for background sync when disconnected
  Future<void> enqueueOfflineMessage({
    required String workspaceId,
    required CachedMessage message,
  }) async {
    try {
      final prefs = await _getPrefs();
      final key = '$_offlineQueueKeyPrefix$workspaceId';
      final raw = prefs.getString(key);
      List<dynamic> jsonList = raw != null && raw.isNotEmpty ? jsonDecode(raw) : [];

      jsonList.add(message.toJson());
      await prefs.setString(key, jsonEncode(jsonList));
      debugPrint('Enqueued offline message [${message.uuid}] for workspace $workspaceId');
    } catch (e) {
      debugPrint('LocalDatabaseService enqueueOfflineMessage error: $e');
    }
  }

  /// Get all pending offline messages for a workspace
  Future<List<CachedMessage>> getOfflineQueue({
    required String workspaceId,
  }) async {
    try {
      final prefs = await _getPrefs();
      final key = '$_offlineQueueKeyPrefix$workspaceId';
      final raw = prefs.getString(key);
      if (raw == null || raw.isEmpty) return [];

      final List<dynamic> jsonList = jsonDecode(raw);
      return jsonList.map((j) => CachedMessage.fromJson(j as Map<String, dynamic>)).toList();
    } catch (e) {
      debugPrint('LocalDatabaseService getOfflineQueue error: $e');
      return [];
    }
  }

  /// Remove synced message from queue
  Future<void> removeOfflineMessage({
    required String workspaceId,
    required String messageUuid,
  }) async {
    try {
      final prefs = await _getPrefs();
      final key = '$_offlineQueueKeyPrefix$workspaceId';
      final raw = prefs.getString(key);
      if (raw == null || raw.isEmpty) return;

      final List<dynamic> jsonList = jsonDecode(raw);
      final filtered = jsonList.where((j) => j['uuid'] != messageUuid).toList();
      await prefs.setString(key, jsonEncode(filtered));
    } catch (e) {
      debugPrint('LocalDatabaseService removeOfflineMessage error: $e');
    }
  }

  /// Clear all offline queue for workspace
  Future<void> clearOfflineQueue({required String workspaceId}) async {
    try {
      final prefs = await _getPrefs();
      final key = '$_offlineQueueKeyPrefix$workspaceId';
      await prefs.remove(key);
    } catch (e) {
      debugPrint('LocalDatabaseService clearOfflineQueue error: $e');
    }
  }

  /// Wipe all local database cache on logout
  Future<void> clearAll() async {
    try {
      final prefs = await _getPrefs();
      final keys = prefs.getKeys().where((k) =>
          k.startsWith(_conversationsKeyPrefix) ||
          k.startsWith(_messagesKeyPrefix) ||
          k.startsWith(_offlineQueueKeyPrefix));
      for (final k in keys) {
        await prefs.remove(k);
      }
      debugPrint('Cleared all local database cache.');
    } catch (e) {
      debugPrint('LocalDatabaseService clearAll error: $e');
    }
  }
}
