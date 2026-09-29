import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/features/copilot/presentation/bloc/copilot_bloc.dart';
import 'package:botifyai_mobile/features/copilot/presentation/bloc/copilot_event.dart';
import 'package:botifyai_mobile/features/copilot/presentation/bloc/copilot_state.dart';
import 'package:botifyai_mobile/features/copilot/domain/entities/copilot_suggestion.dart';
import 'package:botifyai_mobile/features/copilot/domain/repositories/copilot_repository.dart';

class MockCopilotRepository implements CopilotRepository {
  bool shouldFail = false;

  final sampleSuggestion = const CopilotSuggestion(
    draftReply: 'Hello Chioma, yes! We have the item in stock with same-day dispatch.',
    confidenceScore: 0.96,
    sentiment: 'positive',
    suggestedAction: 'send_reply',
    sources: ['Inventory Docs (Section 3)'],
  );

  @override
  Future<CopilotSuggestion> generateDraft({
    required String conversationUuid,
    required String instruction,
    String? tone,
  }) async {
    if (shouldFail) throw Exception('Copilot API error');
    return sampleSuggestion;
  }

  @override
  Future<String> summarizeConversation({required String conversationUuid}) async {
    if (shouldFail) throw Exception('Summary error');
    return '• Customer asked about Lagos delivery\n• Agent confirmed price is ₦3,500\n• Customer requested checkout link';
  }

  @override
  Future<List<String>> suggestFollowUpActions({required String conversationUuid}) async {
    return ['Send Payment Link', 'Attach Catalog'];
  }
}

void main() {
  group('CopilotBloc Unit Tests', () {
    late MockCopilotRepository mockRepo;
    late CopilotBloc copilotBloc;

    setUp(() {
      mockRepo = MockCopilotRepository();
      copilotBloc = CopilotBloc(copilotRepository: mockRepo);
    });

    tearDown(() {
      copilotBloc.close();
    });

    test('Initial state is CopilotInitial', () {
      expect(copilotBloc.state, isA<CopilotInitial>());
    });

    test('RequestCopilotDraftEvent emits [CopilotLoading, CopilotLoaded] on success', () async {
      final expectedStates = [
        isA<CopilotLoading>(),
        isA<CopilotLoaded>().having((s) => s.suggestion.confidenceScore, 'confidence', 0.96),
      ];

      expectLater(copilotBloc.stream, emitsInOrder(expectedStates));

      copilotBloc.add(const RequestCopilotDraftEvent(
        conversationUuid: 'conv-101',
        instruction: 'draft_reply',
      ));
    });

    test('SummarizeConversationEvent emits [CopilotLoading, CopilotSummaryLoaded]', () async {
      final expectedStates = [
        isA<CopilotLoading>(),
        isA<CopilotSummaryLoaded>().having((s) => s.summary.contains('Customer asked'), 'summary content', true),
      ];

      expectLater(copilotBloc.stream, emitsInOrder(expectedStates));

      copilotBloc.add(const SummarizeConversationEvent(conversationUuid: 'conv-101'));
    });

    test('ClearCopilotEvent resets state to CopilotInitial', () async {
      copilotBloc.add(const ClearCopilotEvent());
      await expectLater(copilotBloc.stream, emitsThrough(isA<CopilotInitial>()));
    });
  });
}
