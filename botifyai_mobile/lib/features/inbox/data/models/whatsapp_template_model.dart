import '../../domain/entities/whatsapp_template.dart';

class WhatsAppTemplateModel extends WhatsAppTemplate {
  const WhatsAppTemplateModel({
    required super.id,
    required super.name,
    super.category = 'UTILITY',
    super.language = 'en',
    super.headerText,
    required super.bodyText,
    super.footerText,
    super.buttons = const [],
    super.parameterNames = const [],
  });

  factory WhatsAppTemplateModel.fromJson(Map<String, dynamic> json) {
    final body = json['body_text']?.toString() ??
        json['body']?.toString() ??
        json['content']?.toString() ??
        '';

    // Extract placeholders like {{1}}, {{name}}, {{order_id}}
    final regExp = RegExp(r'\{\{([0-9a-zA-Z_]+)\}\}');
    final matches = regExp.allMatches(body);
    final Set<String> params = {};
    for (final match in matches) {
      if (match.groupCount >= 1) {
        params.add(match.group(1)!);
      }
    }

    final buttonsList = (json['buttons'] as List<dynamic>?)
            ?.map((e) => e is Map ? (e['text']?.toString() ?? '') : e.toString())
            .toList() ??
        [];

    return WhatsAppTemplateModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name']?.toString() ?? 'Template',
      category: json['category']?.toString() ?? 'UTILITY',
      language: json['language']?.toString() ?? 'en',
      headerText: json['header_text']?.toString() ?? json['header']?.toString(),
      bodyText: body,
      footerText: json['footer_text']?.toString() ?? json['footer']?.toString(),
      buttons: buttonsList,
      parameterNames: params.toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'category': category,
        'language': language,
        'header_text': headerText,
        'body_text': bodyText,
        'footer_text': footerText,
        'buttons': buttons,
        'parameter_names': parameterNames,
      };
}
