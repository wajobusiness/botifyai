import '../../domain/entities/contact.dart';

class ContactModel extends Contact {
  const ContactModel({
    required super.id,
    required super.name,
    super.phone,
    super.email,
    super.avatar,
    super.customFields,
    super.createdAt,
  });

  factory ContactModel.fromJson(Map<String, dynamic> json) {
    return ContactModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name']?.toString() ?? json['phone']?.toString() ?? 'Unknown Contact',
      phone: json['phone']?.toString(),
      email: json['email']?.toString(),
      avatar: json['avatar']?.toString() ?? json['profile_pic_url']?.toString(),
      customFields: json['custom_fields'] is Map<String, dynamic>
          ? json['custom_fields'] as Map<String, dynamic>
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'email': email,
      'avatar': avatar,
      'custom_fields': customFields,
      'created_at': createdAt?.toIso8601String(),
    };
  }
}
