import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/features/copilot/presentation/bloc/copilot_bloc.dart';
import 'package:botifyai_mobile/features/copilot/presentation/bloc/copilot_event.dart';
import 'package:botifyai_mobile/features/copilot/presentation/bloc/copilot_state.dart';
import 'package:botifyai_mobile/features/copilot/domain/entities/copilot_suggestion.dart';
import 'package:botifyai_mobile/features/copilot/domain/repositories/copilot_repository.dart';

class MockCopilotRepository implements CopilotRepository {
  bool shouldFail = false;

  final sampleSuggestion = const CopilotSuggestion(
    suggestedText: 'Hello Chioma, yes! We have the item in stock with same-day dispatch.',
    confidenceScore: 0.96,
    instruction: 'draft_reply',
    sourcesUsed: ['Inventory Docs (Section 3)'],
    summaryBullets: ['Customer asked about Lagos delivery', 'Agent confirmed price is ₦3,500'],
  );

  @override
  Future<CopilotSuggestion> generateDraft({
    required String conversationUuid,
    String instruction = 'draft_reply',
    String? customPrompt,
  }) async {
    if (shouldFail) throw Exception('Copilot API error');
    return sampleSuggestion;
  }

  @override
  Future<CopilotSuggestion> summarizeConversation({required String conversationUuid}) async {
    if (shouldFail) throw Exception('Summary error');
    return sampleSuggestion;
  }
}

void main() {
  group('CopilotBloc Unit Tests', () {
    late MockCopilotRepository mockRepo;
    late CopilotBloc copilotBloc;

    setUp(() {
      mockRepo = MockCopilotRepository();
      copilotBloc = CopilotBloc(repository: mockRepo);
    });

    tearDown(() {
      copilotBloc.close();
    });

    test('Initial state is CopilotInitial', () {
      expect(copilotBloc.state, isA<CopilotInitial>());
    });

    test('GenerateCopilotDraftEvent emits [CopilotGenerating, CopilotSuccess] on success', () async {
      final expectedStates = [
        isA<CopilotGenerating>(),
        isA<CopilotSuccess>().having((s) => s.suggestion.confidenceScore, 'confidence', 0.96),
      ];

      expectLater(copilotBloc.stream, emitsInOrder(expectedStates));

      copilotBloc.add(const GenerateCopilotDraftEvent(
        conversationUuid: 'conv-101',
      ));
    });

    test('SummarizeConversationEvent emits [CopilotGenerating, CopilotSuccess]', () async {
      final expectedStates = [
        isA<CopilotGenerating>(),
        isA<CopilotSuccess>().having((s) => s.suggestion.suggestedText.isNotEmpty, 'has text', true),
      ];

      expectLater(copilotBloc.stream, emitsInOrder(expectedStates));

      copilotBloc.add(const SummarizeConversationEvent('conv-101'));
    });

    test('ResetCopilotStateEvent resets state to CopilotInitial', () async {
      copilotBloc.add(ResetCopilotStateEvent());
      await expectLater(copilotBloc.stream, emitsThrough(isA<CopilotInitial>()));
    });
  });
}

