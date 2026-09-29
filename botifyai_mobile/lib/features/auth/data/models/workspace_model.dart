import '../../domain/entities/workspace.dart';

class WorkspaceModel extends Workspace {
  const WorkspaceModel({
    required super.id,
    required super.name,
    super.slug,
  });

  factory WorkspaceModel.fromJson(Map<String, dynamic> json) {
    return WorkspaceModel(
      id: json['id'] as int,
      name: json['name'] as String? ?? 'Untitled Workspace',
      slug: json['slug'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
    };
  }
}
