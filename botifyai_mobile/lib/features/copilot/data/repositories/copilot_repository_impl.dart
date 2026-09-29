import '../../domain/entities/copilot_suggestion.dart';
import '../../domain/repositories/copilot_repository.dart';
import '../datasources/copilot_remote_data_source.dart';

class CopilotRepositoryImpl implements CopilotRepository {
  final CopilotRemoteDataSource remoteDataSource;

  CopilotRepositoryImpl({required this.remoteDataSource});

  @override
  Future<CopilotSuggestion> generateDraft({
    required String conversationUuid,
    String instruction = 'draft_reply',
    String? customPrompt,
  }) async {
    return await remoteDataSource.generateDraft(
      conversationUuid: conversationUuid,
      instruction: instruction,
      customPrompt: customPrompt,
    );
  }

  @override
  Future<CopilotSuggestion> summarizeConversation({
    required String conversationUuid,
  }) async {
    return await remoteDataSource.summarizeConversation(
      conversationUuid: conversationUuid,
    );
  }
}
