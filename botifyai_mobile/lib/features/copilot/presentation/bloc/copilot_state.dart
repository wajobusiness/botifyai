import 'package:equatable/equatable.dart';
import '../../domain/entities/copilot_suggestion.dart';

abstract class CopilotState extends Equatable {
  const CopilotState();

  @override
  List<Object?> get props => [];
}

class CopilotInitial extends CopilotState {}

class CopilotGenerating extends CopilotState {
  final String action; // 'draft' or 'summarize'

  const CopilotGenerating({this.action = 'draft'});

  @override
  List<Object?> get props => [action];
}

class CopilotSuccess extends CopilotState {
  final CopilotSuggestion suggestion;

  const CopilotSuccess(this.suggestion);

  @override
  List<Object?> get props => [suggestion];
}

class CopilotError extends CopilotState {
  final String message;

  const CopilotError(this.message);

  @override
  List<Object?> get props => [message];
}
