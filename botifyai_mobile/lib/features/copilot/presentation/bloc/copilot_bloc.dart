import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/repositories/copilot_repository.dart';
import 'copilot_event.dart';
import 'copilot_state.dart';

class CopilotBloc extends Bloc<CopilotEvent, CopilotState> {
  final CopilotRepository repository;

  CopilotBloc({required this.repository}) : super(CopilotInitial()) {
    on<GenerateCopilotDraftEvent>(_onGenerateDraft);
    on<SummarizeConversationEvent>(_onSummarize);
    on<ResetCopilotStateEvent>(_onReset);
  }

  Future<void> _onGenerateDraft(
    GenerateCopilotDraftEvent event,
    Emitter<CopilotState> emit,
  ) async {
    emit(const CopilotGenerating(action: 'draft'));
    try {
      final suggestion = await repository.generateDraft(
        conversationUuid: event.conversationUuid,
        instruction: 'draft_reply',
        customPrompt: event.customPrompt,
      );
      emit(CopilotSuccess(suggestion));
    } catch (e) {
      emit(CopilotError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onSummarize(
    SummarizeConversationEvent event,
    Emitter<CopilotState> emit,
  ) async {
    emit(const CopilotGenerating(action: 'summarize'));
    try {
      final suggestion = await repository.summarizeConversation(
        conversationUuid: event.conversationUuid,
      );
      emit(CopilotSuccess(suggestion));
    } catch (e) {
      emit(CopilotError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  void _onReset(
    ResetCopilotStateEvent event,
    Emitter<CopilotState> emit,
  ) {
    emit(CopilotInitial());
  }
}
