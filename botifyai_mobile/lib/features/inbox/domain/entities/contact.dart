import 'package:equatable/equatable.dart';

class Contact extends Equatable {
  final int id;
  final String name;
  final String? phone;
  final String? email;
  final String? avatar;
  final Map<String, dynamic>? customFields;
  final DateTime? createdAt;

  const Contact({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    this.avatar,
    this.customFields,
    this.createdAt,
  });

  @override
  List<Object?> get props => [id, name, phone, email, avatar, customFields, createdAt];
}
