import 'package:equatable/equatable.dart';

abstract class CopilotEvent extends Equatable {
  const CopilotEvent();

  @override
  List<Object?> get props => [];
}

class GenerateCopilotDraftEvent extends CopilotEvent {
  final String conversationUuid;
  final String? customPrompt;

  const GenerateCopilotDraftEvent({
    required this.conversationUuid,
    this.customPrompt,
  });

  @override
  List<Object?> get props => [conversationUuid, customPrompt];
}

class SummarizeConversationEvent extends CopilotEvent {
  final String conversationUuid;

  const SummarizeConversationEvent(this.conversationUuid);

  @override
  List<Object?> get props => [conversationUuid];
}

class ResetCopilotStateEvent extends CopilotEvent {}
