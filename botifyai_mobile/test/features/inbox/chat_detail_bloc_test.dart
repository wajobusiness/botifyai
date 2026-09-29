import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/features/inbox/presentation/bloc/chat/chat_detail_bloc.dart';
import 'package:botifyai_mobile/features/inbox/presentation/bloc/chat/chat_detail_event.dart';
import 'package:botifyai_mobile/features/inbox/presentation/bloc/chat/chat_detail_state.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/message.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/conversation.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/contact.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/inbox_setup.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/whatsapp_template.dart';
import 'package:botifyai_mobile/features/inbox/domain/repositories/inbox_repository.dart';
import 'package:botifyai_mobile/core/realtime/pusher_service.dart';

class MockChatInboxRepository implements InboxRepository {
  final Conversation sampleConv = const Conversation(
    id: 101,
    uuid: 'conv-101',
    contact: Contact(id: 1, name: 'Chioma Adebayo', phone: '+2348012345678'),
    channel: 'whatsapp',
    status: 'open',
    isWhatsappWindowOpen: true,
  );

  List<Message> mockMessages = [
    Message(
      id: 1,
      localId: 'msg-101',
      conversationUuid: 'conv-101',
      direction: MessageDirection.inBound,
      sentBy: 'customer',
      body: 'Hello, how much is the delivery to Abuja?',
      sentAt: DateTime.now().subtract(const Duration(minutes: 5)),
      status: MessageDeliveryStatus.delivered,
    ),
  ];

  @override
  Future<InboxSetup> getInboxSetup() async => const InboxSetup(labels: [], cannedReplies: [], channelAccounts: [], teamMembers: []);
  @override
  Future<List<WhatsAppTemplate>> getWhatsAppTemplates() async => [];
  @override
  Future<PaginatedList<Conversation>> getConversations({String folder = 'mine', String? channel, String? search, int page = 1}) async =>
      PaginatedList<Conversation>(data: [], currentPage: 1, lastPage: 1, total: 0);
  
  @override
  Future<Map<String, dynamic>> getConversationDetail(String uuid) async => {
    'conversation': sampleConv,
    'messages': mockMessages,
  };

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
      localId: 'msg-102',
      conversationUuid: uuid,
      direction: MessageDirection.outBound,
      sentBy: 'agent',
      body: body,
      type: isNote ? MessageType.note : MessageType.text,
      status: MessageDeliveryStatus.sent,
      isNote: isNote,
      sentAt: DateTime.now(),
    );
  }

  @override
  Future<Conversation> assignConversation({required String uuid, required int? userId, String? assignedTo}) async {
    return sampleConv;
  }

  @override
  Future<Conversation> updateConversationStatus({required String uuid, required String status}) async {
    return sampleConv;
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

class FakePusherService extends PusherService {
  FakePusherService() : super.test();
}

void main() {
  group('ChatDetailBloc Unit Tests', () {
    late MockChatInboxRepository mockRepo;
    late FakePusherService fakePusher;
    late ChatDetailBloc chatBloc;

    setUp(() {
      mockRepo = MockChatInboxRepository();
      fakePusher = FakePusherService();
      chatBloc = ChatDetailBloc(
        repository: mockRepo,
        pusherService: fakePusher,
      );
    });

    tearDown(() {
      chatBloc.close();
    });

    test('Initial state is ChatDetailInitial', () {
      expect(chatBloc.state, isA<ChatDetailInitial>());
    });

    test('LoadChatDetailEvent loads message list into ChatDetailLoaded', () async {
      final expectedStates = [
        isA<ChatDetailLoading>(),
        isA<ChatDetailLoaded>().having((s) => s.messages.length, 'messages count', 1),
      ];

      expectLater(chatBloc.stream, emitsInOrder(expectedStates));
      chatBloc.add(const LoadChatDetailEvent('conv-101'));
    });

    test('SendTextMessageEvent optimistically adds message and updates status to sent', () async {
      // First load messages
      chatBloc.add(const LoadChatDetailEvent('conv-101'));
      await expectLater(chatBloc.stream, emitsThrough(isA<ChatDetailLoaded>()));

      // Send outbound message
      chatBloc.add(const SendTextMessageEvent(
        text: 'Standard delivery is ₦3,500.',
      ));

      await expectLater(
        chatBloc.stream,
        emitsThrough(
          isA<ChatDetailLoaded>().having(
            (s) => s.messages.any((m) => m.body == 'Standard delivery is ₦3,500.' && m.status == MessageDeliveryStatus.sent),
            'has sent message',
            true,
          ),
        ),
      );
    });

    test('InboundMessageReceivedChatEvent appends new message and deduplicates', () async {
      chatBloc.add(const LoadChatDetailEvent('conv-101'));
      await expectLater(chatBloc.stream, emitsThrough(isA<ChatDetailLoaded>()));

      final incoming = Message(
        id: 99,
        localId: 'msg-99',
        conversationUuid: 'conv-101',
        direction: MessageDirection.inBound,
        sentBy: 'customer',
        body: 'Great! Can I order now?',
        sentAt: DateTime.now(),
      );

      chatBloc.add(InboundMessageReceivedChatEvent(incoming));

      await expectLater(
        chatBloc.stream,
        emitsThrough(
          isA<ChatDetailLoaded>().having(
            (s) => s.messages.any((m) => m.localId == 'msg-99'),
            'contains incoming message',
            true,
          ),
        ),
      );
    });
  });
}
