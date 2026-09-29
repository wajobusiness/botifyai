import '../../domain/entities/user.dart';

abstract class AuthRepository {
  Future<User> login({
    required String email,
    required String password,
    String? deviceName,
  });

  Future<User?> checkAuthStatus();

  Future<void> logout();

  Future<void> switchWorkspace(int workspaceId);
}
