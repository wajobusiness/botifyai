import '../entities/copilot_suggestion.dart';

abstract class CopilotRepository {
  Future<CopilotSuggestion> generateDraft({
    required String conversationUuid,
    String instruction = 'draft_reply',
    String? customPrompt,
  });

  Future<CopilotSuggestion> summarizeConversation({
    required String conversationUuid,
  });
}
