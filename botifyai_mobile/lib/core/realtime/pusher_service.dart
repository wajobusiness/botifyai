import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:pusher_channels_flutter/pusher_channels_flutter.dart';
import '../storage/secure_storage_service.dart';

/// Event model representing real-time WebSocket payloads
class PusherRealtimeEvent {
  final String channelName;
  final String eventName;
  final Map<String, dynamic> data;

  const PusherRealtimeEvent({
    required this.channelName,
    required this.eventName,
    required this.data,
  });

  @override
  String toString() => 'PusherRealtimeEvent(channel: $channelName, event: $eventName, data: $data)';
}

class PusherService {
  static final PusherService _instance = PusherService._internal();
  factory PusherService() => _instance;
  PusherService._internal();

  /// Constructor for unit testing / mocking
  PusherService.test();

  PusherChannelsFlutter? _pusher;
  PusherChannelsFlutter get _pusherInstance =>
      _pusher ??= PusherChannelsFlutter.getInstance();

  final StreamController<PusherRealtimeEvent> _eventStreamController =
      StreamController<PusherRealtimeEvent>.broadcast();

  Stream<PusherRealtimeEvent> get eventStream => _eventStreamController.stream;

  bool _isInitialized = false;
  bool _isConnected = false;
  String? _currentWorkspaceId;

  bool get isConnected => _isConnected;

  /// Initialize Pusher connection for the active workspace
  Future<void> init({
    required String workspaceId,
    String? customApiKey,
    String? customCluster,
  }) async {
    if (kIsWeb) {
      debugPrint('PusherService: Realtime WebSockets running in simulated mode for Web.');
      _isConnected = true;
      _isInitialized = true;
      return;
    }

    if (_isInitialized && _currentWorkspaceId == workspaceId && _isConnected) {
      return;
    }

    _currentWorkspaceId = workspaceId;
    final token = await SecureStorageService().getToken();

    final apiKey = customApiKey ?? 'botifyai_key';
    final cluster = customCluster ?? 'mt1';

    try {
      await _pusherInstance.init(
        apiKey: apiKey,
        cluster: cluster,
        authEndpoint: 'https://botifyai.cloud/broadcasting/auth',
        authParams: {
          'headers': {
            if (token != null) 'Authorization': 'Bearer $token',
            'X-Workspace-Id': workspaceId,
            'Accept': 'application/json',
          }
        },
        onConnectionStateChange: _onConnectionStateChange,
        onError: _onError,
        onSubscriptionSucceeded: _onSubscriptionSucceeded,
        onEvent: _onEvent,
        onSubscriptionError: _onSubscriptionError,
        onDecryptionFailure: (event, reason) {
          debugPrint('Pusher Decryption Failure: $event, $reason');
        },
        onMemberAdded: (channelName, member) {},
        onMemberRemoved: (channelName, member) {},
        onAuthorizer: null,
      );

      await _pusherInstance.connect();
      _isInitialized = true;

      // Subscribe to private workspace channel
      final workspaceChannel = 'private-workspace.$workspaceId';
      await _pusherInstance.subscribe(channelName: workspaceChannel);
      debugPrint('Pusher subscribed to channel: $workspaceChannel');
    } catch (e) {
      debugPrint('Pusher Initialization Error: $e');
    }
  }

  void _onConnectionStateChange(dynamic currentState, dynamic previousState) {
    debugPrint('Pusher Connection: $previousState -> $currentState');
    _isConnected = currentState.toString().toLowerCase().contains('connected');
  }

  void _onError(String message, int? code, dynamic error) {
    debugPrint('Pusher Error: $message (code: $code) $error');
  }

  void _onSubscriptionSucceeded(String channelName, dynamic data) {
    debugPrint('Pusher Subscription Succeeded for: $channelName');
  }

  void _onSubscriptionError(String message, dynamic error) {
    debugPrint('Pusher Subscription Error: $message $error');
  }

  void _onEvent(PusherEvent event) {
    debugPrint('Pusher Event Received: ${event.eventName} on ${event.channelName}');
    try {
      Map<String, dynamic> parsedData = {};
      if (event.data is String && (event.data as String).isNotEmpty) {
        final decoded = jsonDecode(event.data as String);
        if (decoded is Map<String, dynamic>) {
          parsedData = decoded;
        } else {
          parsedData = {'data': decoded};
        }
      } else if (event.data is Map<String, dynamic>) {
        parsedData = event.data as Map<String, dynamic>;
      }

      _eventStreamController.add(
        PusherRealtimeEvent(
          channelName: event.channelName,
          eventName: event.eventName,
          data: parsedData,
        ),
      );
    } catch (e) {
      debugPrint('Error parsing Pusher event data: $e');
    }
  }

  /// Subscribe to a specific conversation channel if needed
  Future<void> subscribeToConversation(String conversationUuid) async {
    if (kIsWeb || !_isInitialized) return;
    try {
      final channelName = 'private-conversation.$conversationUuid';
      await _pusherInstance.subscribe(channelName: channelName);
    } catch (e) {
      debugPrint('Error subscribing to conversation: $e');
    }
  }

  /// Unsubscribe from a conversation channel
  Future<void> unsubscribeFromConversation(String conversationUuid) async {
    if (kIsWeb || !_isInitialized) return;
    try {
      final channelName = 'private-conversation.$conversationUuid';
      await _pusherInstance.unsubscribe(channelName: channelName);
    } catch (e) {
      debugPrint('Error unsubscribing from conversation: $e');
    }
  }

  /// Disconnect and cleanup
  Future<void> disconnect() async {
    if (kIsWeb) {
      _isConnected = false;
      _isInitialized = false;
      _currentWorkspaceId = null;
      return;
    }
    try {
      if (_currentWorkspaceId != null) {
        await _pusherInstance.unsubscribe(channelName: 'private-workspace.$_currentWorkspaceId');
      }
      await _pusherInstance.disconnect();
      _isConnected = false;
      _isInitialized = false;
      _currentWorkspaceId = null;
    } catch (e) {
      debugPrint('Error disconnecting Pusher: $e');
    }
  }
}
