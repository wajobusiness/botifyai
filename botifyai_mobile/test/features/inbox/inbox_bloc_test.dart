import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/features/inbox/presentation/bloc/inbox/inbox_bloc.dart';
import 'package:botifyai_mobile/features/inbox/presentation/bloc/inbox/inbox_event.dart';
import 'package:botifyai_mobile/features/inbox/presentation/bloc/inbox/inbox_state.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/conversation.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/contact.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/inbox_setup.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/message.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/whatsapp_template.dart';
import 'package:botifyai_mobile/features/inbox/domain/repositories/inbox_repository.dart';
import 'package:botifyai_mobile/core/realtime/pusher_service.dart';

class MockInboxRepository implements InboxRepository {
  bool shouldFail = false;

  final sampleConversation = Conversation(
    id: 101,
    uuid: 'conv-101',
    contact: const Contact(id: 1, name: 'Chioma Adebayo', phone: '+2348012345678'),
    channel: 'whatsapp',
    lastMessage: Message(
      id: 1,
      localId: 'msg-1',
      conversationUuid: 'conv-101',
      direction: MessageDirection.inBound,
      sentBy: 'customer',
      body: 'Is this item available in Lagos?',
      sentAt: DateTime.now(),
    ),
    lastMessageAt: DateTime.now(),
    unreadCount: 2,
    status: 'open',
    isWhatsappWindowOpen: true,
  );

  @override
  Future<InboxSetup> getInboxSetup() async {
    return const InboxSetup(labels: [], cannedReplies: [], channelAccounts: [], teamMembers: []);
  }

  @override
  Future<List<WhatsAppTemplate>> getWhatsAppTemplates() async => [];

  @override
  Future<PaginatedList<Conversation>> getConversations({
    String folder = 'mine',
    String? channel,
    String? search,
    int page = 1,
  }) async {
    if (shouldFail) throw Exception('Network error');
    return PaginatedList<Conversation>(
      data: [sampleConversation],
      currentPage: 1,
      lastPage: 1,
      total: 1,
    );
  }

  @override
  Future<Map<String, dynamic>> getConversationDetail(String uuid) async => {};

  @override
  Future<PaginatedList<Message>> getMessages(String uuid, {int page = 1}) async {
    return const PaginatedList<Message>(data: [], currentPage: 1, lastPage: 1, total: 0);
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
      id: 1,
      localId: 'msg-1',
      conversationUuid: uuid,
      direction: MessageDirection.outBound,
      sentBy: 'agent',
      body: body,
      sentAt: DateTime.now(),
    );
  }

  @override
  Future<Conversation> assignConversation({required String uuid, required int? userId, String? assignedTo}) async => sampleConversation;

  @override
  Future<Conversation> updateConversationStatus({required String uuid, required String status}) async => sampleConversation;

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
  group('InboxBloc Unit Tests', () {
    late MockInboxRepository mockRepository;
    late FakePusherService fakePusher;
    late InboxBloc inboxBloc;

    setUp(() {
      mockRepository = MockInboxRepository();
      fakePusher = FakePusherService();
      inboxBloc = InboxBloc(
        repository: mockRepository,
        pusherService: fakePusher,
      );
    });

    tearDown(() {
      inboxBloc.close();
    });

    test('Initial state is InboxInitial', () {
      expect(inboxBloc.state, isA<InboxInitial>());
    });

    test('Emits [InboxLoading, InboxLoaded] when LoadConversationsEvent is triggered', () async {
      final expectedStates = [
        isA<InboxLoading>(),
        isA<InboxLoaded>().having((s) => s.conversations.length, 'conversations length', 1),
      ];

      expectLater(inboxBloc.stream, emitsInOrder(expectedStates));
      inboxBloc.add(const LoadConversationsEvent());
    });

    test('Emits [InboxLoading, InboxError] when repository throws error', () async {
      mockRepository.shouldFail = true;

      final expectedStates = [
        isA<InboxLoading>(),
        isA<InboxError>(),
      ];

      expectLater(inboxBloc.stream, emitsInOrder(expectedStates));
      inboxBloc.add(const LoadConversationsEvent());
    });

    test('ChangeFolderEvent updates active folder filter', () async {
      inboxBloc.add(const ChangeFolderEvent('unassigned'));
      await expectLater(
        inboxBloc.stream,
        emitsThrough(isA<InboxLoaded>().having((s) => s.currentFolder, 'currentFolder', 'unassigned')),
      );
    });
  });
}
