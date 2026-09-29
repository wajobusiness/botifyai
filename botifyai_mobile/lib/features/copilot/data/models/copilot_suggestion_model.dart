import '../../domain/entities/copilot_suggestion.dart';

class CopilotSuggestionModel extends CopilotSuggestion {
  const CopilotSuggestionModel({
    required super.suggestedText,
    super.confidenceScore = 0.95,
    super.sourcesUsed = const [],
    super.instruction = 'draft_reply',
    super.summaryBullets = const [],
  });

  factory CopilotSuggestionModel.fromJson(Map<String, dynamic> json, {String instruction = 'draft_reply'}) {
    final sources = (json['sources_used'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        (json['sources'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
        [];

    final bullets = (json['summary_bullets'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        (json['bullets'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
        [];

    double confidence = 0.95;
    if (json['confidence_score'] != null) {
      confidence = (json['confidence_score'] as num).toDouble();
    } else if (json['confidence'] != null) {
      confidence = (json['confidence'] as num).toDouble();
    }

    final suggested = json['suggested_text']?.toString() ??
        json['text']?.toString() ??
        json['draft']?.toString() ??
        json['summary']?.toString() ??
        '';

    return CopilotSuggestionModel(
      suggestedText: suggested,
      confidenceScore: confidence,
      sourcesUsed: sources,
      instruction: json['instruction']?.toString() ?? instruction,
      summaryBullets: bullets,
    );
  }

  Map<String, dynamic> toJson() => {
        'suggested_text': suggestedText,
        'confidence_score': confidenceScore,
        'sources_used': sourcesUsed,
        'instruction': instruction,
        'summary_bullets': summaryBullets,
      };
}
