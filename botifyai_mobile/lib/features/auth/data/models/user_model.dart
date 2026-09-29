import '../../domain/entities/user.dart';
import 'workspace_model.dart';

class UserModel extends User {
  const UserModel({
    required super.id,
    required super.name,
    required super.email,
    required super.role,
    super.clientRole,
    super.workspaceId,
    super.avatar,
    super.demoMode = false,
    super.workspace,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int,
      name: json['name'] as String? ?? 'User',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? 'client',
      clientRole: json['client_role'] as String?,
      workspaceId: json['workspace_id'] as int? ?? json['current_workspace_id'] as int?,
      avatar: json['avatar'] as String?,
      demoMode: json['demo_mode'] as bool? ?? false,
      workspace: json['workspace'] != null
          ? WorkspaceModel.fromJson(json['workspace'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'client_role': clientRole,
      'workspace_id': workspaceId,
      'avatar': avatar,
      'demo_mode': demoMode,
      'workspace': workspace != null
          ? (workspace as WorkspaceModel).toJson()
          : null,
    };
  }
}
