import 'package:equatable/equatable.dart';

class WhatsAppTemplate extends Equatable {
  final int id;
  final String name;
  final String category; // 'MARKETING', 'UTILITY', 'AUTHENTICATION'
  final String language;
  final String? headerText;
  final String bodyText;
  final String? footerText;
  final List<String> buttons;
  final List<String> parameterNames; // Extracted variable placeholders e.g. {{1}}, {{2}}

  const WhatsAppTemplate({
    required this.id,
    required this.name,
    this.category = 'UTILITY',
    this.language = 'en',
    this.headerText,
    required this.bodyText,
    this.footerText,
    this.buttons = const [],
    this.parameterNames = const [],
  });

  /// Interpolates {{1}}, {{2}}, etc. with provided values map
  String interpolate(Map<String, String> values) {
    String formatted = bodyText;
    values.forEach((key, value) {
      formatted = formatted.replaceAll('{{$key}}', value);
    });
    return formatted;
  }

  @override
  List<Object?> get props => [
        id,
        name,
        category,
        language,
        headerText,
        bodyText,
        footerText,
        buttons,
        parameterNames,
      ];
}
