import 'package:dio/dio.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_endpoints.dart';
import '../../../../core/errors/failures.dart';
import '../models/copilot_suggestion_model.dart';

abstract class CopilotRemoteDataSource {
  Future<CopilotSuggestionModel> generateDraft({
    required String conversationUuid,
    String instruction = 'draft_reply',
    String? customPrompt,
  });

  Future<CopilotSuggestionModel> summarizeConversation({
    required String conversationUuid,
  });
}

class CopilotRemoteDataSourceImpl implements CopilotRemoteDataSource {
  final ApiClient apiClient;

  CopilotRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<CopilotSuggestionModel> generateDraft({
    required String conversationUuid,
    String instruction = 'draft_reply',
    String? customPrompt,
  }) async {
    try {
      final response = await apiClient.post(
        ApiEndpoints.copilotDraft,
        data: {
          'conversation_uuid': conversationUuid,
          'instruction': instruction,
          if (customPrompt != null && customPrompt.isNotEmpty)
            'custom_prompt': customPrompt,
        },
      );

      final resData = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};

      return CopilotSuggestionModel.fromJson(resData, instruction: instruction);
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to generate AI Copilot draft',
      );
    }
  }

  @override
  Future<CopilotSuggestionModel> summarizeConversation({
    required String conversationUuid,
  }) async {
    return await generateDraft(
      conversationUuid: conversationUuid,
      instruction: 'summarize',
    );
  }
}
