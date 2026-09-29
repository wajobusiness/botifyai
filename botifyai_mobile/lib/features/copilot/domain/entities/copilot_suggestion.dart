import 'package:equatable/equatable.dart';

class CopilotSuggestion extends Equatable {
  final String suggestedText;
  final double confidenceScore;
  final List<String> sourcesUsed;
  final String instruction; // 'draft_reply', 'summarize', 'custom'
  final List<String> summaryBullets;

  const CopilotSuggestion({
    required this.suggestedText,
    this.confidenceScore = 0.95,
    this.sourcesUsed = const [],
    this.instruction = 'draft_reply',
    this.summaryBullets = const [],
  });

  @override
  List<Object?> get props => [
        suggestedText,
        confidenceScore,
        sourcesUsed,
        instruction,
        summaryBullets,
      ];
}
