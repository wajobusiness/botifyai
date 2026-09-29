import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/features/inbox/presentation/bloc/inbox_bloc.dart';
import 'package:botifyai_mobile/features/inbox/presentation/bloc/inbox_event.dart';
import 'package:botifyai_mobile/features/inbox/presentation/bloc/inbox_state.dart';
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
    uuid: 'conv-101',
    contact: const Contact(id: 1, name: 'Chioma Adebayo', phone: '+2348012345678'),
    channel: 'whatsapp',
    lastMessageSnippet: 'Is this item available in Lagos?',
    lastMessageAt: DateTime.now(),
    unreadCount: 2,
    status: 'open',
    isWhatsappWindowOpen: true,
  );

  @override
  Future<InboxSetup> getInboxSetup() async {
    return const InboxSetup(labels: [], cannedReplies: [], channelAccounts: [], agents: []);
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
    return PaginatedList<Message>(data: [], currentPage: 1, lastPage: 1, total: 0);
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
      uuid: 'msg-1',
      senderType: 'agent',
      body: body,
      createdAt: DateTime.now(),
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

class FakePusherService extends PusherService {}

void main() {
  group('InboxBloc Unit Tests', () {
    late MockInboxRepository mockRepository;
    late FakePusherService fakePusher;
    late InboxBloc inboxBloc;

    setUp(() {
      mockRepository = MockInboxRepository();
      fakePusher = FakePusherService();
      inboxBloc = InboxBloc(
        inboxRepository: mockRepository,
        pusherService: fakePusher,
      );
    });

    tearDown(() {
      inboxBloc.close();
    });

    test('Initial state is InboxInitial', () {
      expect(inboxBloc.state, isA<InboxInitial>());
    });

    test('Emits [InboxLoading, InboxLoaded] when FetchConversationsEvent is triggered', () async {
      final expectedStates = [
        isA<InboxLoading>(),
        isA<InboxLoaded>().having((s) => s.conversations.length, 'conversations length', 1),
      ];

      expectLater(inboxBloc.stream, emitsInOrder(expectedStates));
      inboxBloc.add(FetchConversationsEvent());
    });

    test('Emits [InboxLoading, InboxError] when repository throws error', () async {
      mockRepository.shouldFail = true;

      final expectedStates = [
        isA<InboxLoading>(),
        isA<InboxError>(),
      ];

      expectLater(inboxBloc.stream, emitsInOrder(expectedStates));
      inboxBloc.add(FetchConversationsEvent());
    });

    test('FilterFolderChangedEvent updates active folder filter', () async {
      inboxBloc.add(const FilterFolderChangedEvent(folder: 'unassigned'));
      await expectLater(
        inboxBloc.stream,
        emitsThrough(isA<InboxLoaded>().having((s) => s.selectedFolder, 'selectedFolder', 'unassigned')),
      );
    });
  });
}
