import '../../../../core/storage/secure_storage_service.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final SecureStorageService _secureStorage;

  AuthRepositoryImpl({
    required AuthRemoteDataSource remoteDataSource,
    required SecureStorageService secureStorage,
  })  : _remoteDataSource = remoteDataSource,
        _secureStorage = secureStorage;

  @override
  Future<User> login({
    required String email,
    required String password,
    String? deviceName,
  }) async {
    final result = await _remoteDataSource.login(
      email: email,
      password: password,
      deviceName: deviceName,
    );

    final token = result['token'] as String;
    final user = result['user'] as User;

    // Persist Sanctum bearer token in encrypted storage
    await _secureStorage.saveToken(token);
    await _secureStorage.saveEmail(email);

    if (user.workspaceId != null) {
      await _secureStorage.saveActiveWorkspaceId(user.workspaceId!);
    }

    return user;
  }

  @override
  Future<User?> checkAuthStatus() async {
    final token = await _secureStorage.getToken();
    if (token == null || token.isEmpty) {
      return null;
    }

    try {
      final user = await _remoteDataSource.getProfile();
      if (user.workspaceId != null) {
        await _secureStorage.saveActiveWorkspaceId(user.workspaceId!);
      }
      return user;
    } catch (_) {
      // If profile fetch fails (e.g. 401), session is invalid
      await _secureStorage.clearSession();
      return null;
    }
  }

  @override
  Future<void> logout() async {
    try {
      await _remoteDataSource.logout();
    } catch (_) {
      // Ignore network errors on logout
    } finally {
      await _secureStorage.clearSession();
    }
  }

  @override
  Future<void> switchWorkspace(int workspaceId) async {
    await _secureStorage.saveActiveWorkspaceId(workspaceId);
  }
}
