import 'package:equatable/equatable.dart';

/// Workspace entity
class Workspace extends Equatable {
  final int id;
  final String name;
  final String? slug;

  const Workspace({
    required this.id,
    required this.name,
    this.slug,
  });

  @override
  List<Object?> get props => [id, name, slug];
}
