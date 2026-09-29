import 'package:equatable/equatable.dart';
import 'workspace.dart';

/// Authenticated User entity
class User extends Equatable {
  final int id;
  final String name;
  final String email;
  final String role;
  final String? clientRole;
  final int? workspaceId;
  final String? avatar;
  final bool demoMode;
  final Workspace? workspace;

  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.clientRole,
    this.workspaceId,
    this.avatar,
    this.demoMode = false,
    this.workspace,
  });

  bool get isAdmin => role == 'admin' || clientRole == 'administrator';
  bool get isMerchant => clientRole == 'administrator' || role == 'client';

  @override
  List<Object?> get props => [
        id,
        name,
        email,
        role,
        clientRole,
        workspaceId,
        avatar,
        demoMode,
        workspace,
      ];
}
