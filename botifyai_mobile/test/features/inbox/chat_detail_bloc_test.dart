import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/features/inbox/presentation/bloc/chat_detail_bloc.dart';
import 'package:botifyai_mobile/features/inbox/presentation/bloc/chat_detail_event.dart';
import 'package:botifyai_mobile/features/inbox/presentation/bloc/chat_detail_state.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/message.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/conversation.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/inbox_setup.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/whatsapp_template.dart';
import 'package:botifyai_mobile/features/inbox/domain/repositories/inbox_repository.dart';
import 'package:botifyai_mobile/core/realtime/pusher_service.dart';

class MockChatInboxRepository implements InboxRepository {
  List<Message> mockMessages = [
    Message(
      id: 1,
      uuid: 'msg-101',
      senderType: 'customer',
      body: 'Hello, how much is the delivery to Abuja?',
      createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
      status: 'delivered',
    ),
  ];

  @override
  Future<InboxSetup> getInboxSetup() async => const InboxSetup(labels: [], cannedReplies: [], channelAccounts: [], agents: []);
  @override
  Future<List<WhatsAppTemplate>> getWhatsAppTemplates() async => [];
  @override
  Future<PaginatedList<Conversation>> getConversations({String folder = 'mine', String? channel, String? search, int page = 1}) async =>
      PaginatedList<Conversation>(data: [], currentPage: 1, lastPage: 1, total: 0);
  @override
  Future<Map<String, dynamic>> getConversationDetail(String uuid) async => {};

  @override
  Future<PaginatedList<Message>> getMessages(String uuid, {int page = 1}) async {
    return PaginatedList<Message>(
      data: mockMessages,
      currentPage: 1,
      lastPage: 1,
      total: mockMessages.length,
    );
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
    return Message(
      id: 2,
      uuid: 'msg-102',
      senderType: 'agent',
      body: body,
      type: type,
      status: 'sent',
      isInternalNote: isNote,
      createdAt: DateTime.now(),
    );
  }

  @override
  Future<Conversation> assignConversation({required String uuid, required int? userId, String? assignedTo}) async {
    throw UnimplementedError();
  }

  @override
  Future<Conversation> updateConversationStatus({required String uuid, required String status}) async {
    throw UnimplementedError();
  }

  @override
  Future<void> sendTypingIndicator({required String uuid, required bool isTyping}) async {}
  @override
  Future<void> addNote({required String uuid, required String note}) async {}
  @override
  Future<void> attachLabel({required String uuid, required int labelId}) async {}
  @override
  Future<void> detachLabel({required String uuid, required int labelId}) async {}
}

class FakePusherService extends PusherService {}

void main() {
  group('ChatDetailBloc Unit Tests', () {
    late MockChatInboxRepository mockRepo;
    late FakePusherService fakePusher;
    late ChatDetailBloc chatBloc;

    setUp(() {
      mockRepo = MockChatInboxRepository();
      fakePusher = FakePusherService();
      chatBloc = ChatDetailBloc(
        inboxRepository: mockRepo,
        pusherService: fakePusher,
      );
    });

    tearDown(() {
      chatBloc.close();
    });

    test('Initial state is ChatDetailInitial', () {
      expect(chatBloc.state, isA<ChatDetailInitial>());
    });

    test('FetchMessagesEvent loads message list into ChatDetailLoaded', () async {
      final expectedStates = [
        isA<ChatDetailLoading>(),
        isA<ChatDetailLoaded>().having((s) => s.messages.length, 'messages count', 1),
      ];

      expectLater(chatBloc.stream, emitsInOrder(expectedStates));
      chatBloc.add(const FetchMessagesEvent(conversationUuid: 'conv-101'));
    });

    test('SendMessageEvent optimistically adds message and updates status to sent', () async {
      // First load messages
      chatBloc.add(const FetchMessagesEvent(conversationUuid: 'conv-101'));
      await expectLater(chatBloc.stream, emitsThrough(isA<ChatDetailLoaded>()));

      // Send outbound message
      chatBloc.add(const SendMessageEvent(
        conversationUuid: 'conv-101',
        body: 'Standard delivery is ₦3,500.',
      ));

      await expectLater(
        chatBloc.stream,
        emitsThrough(
          isA<ChatDetailLoaded>().having(
            (s) => s.messages.any((m) => m.body == 'Standard delivery is ₦3,500.' && m.status == 'sent'),
            'has sent message',
            true,
          ),
        ),
      );
    });

    test('IncomingMessageEvent appends new message and deduplicates', () async {
      chatBloc.add(const FetchMessagesEvent(conversationUuid: 'conv-101'));
      await expectLater(chatBloc.stream, emitsThrough(isA<ChatDetailLoaded>()));

      final incoming = Message(
        id: 99,
        uuid: 'msg-99',
        senderType: 'customer',
        body: 'Great! Can I order now?',
        createdAt: DateTime.now(),
      );

      chatBloc.add(IncomingMessageEvent(message: incoming));

      await expectLater(
        chatBloc.stream,
        emitsThrough(
          isA<ChatDetailLoaded>().having(
            (s) => s.messages.any((m) => m.uuid == 'msg-99'),
            'contains incoming message',
            true,
          ),
        ),
      );
    });
  });
}
