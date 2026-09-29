import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:botifyai_mobile/features/auth/presentation/bloc/auth_event.dart';
import 'package:botifyai_mobile/features/auth/presentation/bloc/auth_state.dart';
import 'package:botifyai_mobile/features/auth/domain/entities/user.dart';
import 'package:botifyai_mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:botifyai_mobile/core/storage/secure_storage_service.dart';
import 'package:botifyai_mobile/core/security/biometric_service.dart';

// Mock Implementation for AuthRepository
class MockAuthRepository implements AuthRepository {
  bool shouldSucceed = true;
  User mockUser = const User(
    id: 1,
    name: 'Alex Johnson',
    email: 'alex@botifyai.cloud',
    workspaceId: 1,
  );

  @override
  Future<User> login({required String email, required String password}) async {
    if (shouldSucceed) {
      return mockUser;
    } else {
      throw Exception('Invalid credentials');
    }
  }

  @override
  Future<void> logout() async {}

  @override
  Future<User?> getCurrentUser() async {
    return shouldSucceed ? mockUser : null;
  }
}

class FakeSecureStorageService extends SecureStorageService {
  String? token;
  @override
  Future<String?> getAuthToken() async => token;
  @override
  Future<void> setAuthToken(String val) async => token = val;
  @override
  Future<void> clear() async => token = null;
}

class FakeBiometricService extends BiometricService {
  @override
  Future<bool> isBiometricAvailable() async => true;
  @override
  Future<bool> isBiometricEnrolled() async => true;
  @override
  Future<bool> authenticateWithBiometrics({required String reason}) async => true;
}

void main() {
  group('AuthBloc Unit Tests', () {
    late MockAuthRepository mockAuthRepository;
    late FakeSecureStorageService fakeSecureStorage;
    late FakeBiometricService fakeBiometricService;
    late AuthBloc authBloc;

    setUp(() {
      mockAuthRepository = MockAuthRepository();
      fakeSecureStorage = FakeSecureStorageService();
      fakeBiometricService = FakeBiometricService();
      authBloc = AuthBloc(
        authRepository: mockAuthRepository,
        secureStorage: fakeSecureStorage,
        biometricService: fakeBiometricService,
      );
    });

    tearDown(() {
      authBloc.close();
    });

    test('Initial state is AuthInitial', () {
      expect(authBloc.state, isA<AuthInitial>());
    });

    test('Emits [AuthLoading, AuthAuthenticated] when login succeeds', () async {
      mockAuthRepository.shouldSucceed = true;

      final expectedStates = [
        isA<AuthLoading>(),
        isA<AuthAuthenticated>().having((s) => s.user.email, 'email', 'alex@botifyai.cloud'),
      ];

      expectLater(authBloc.stream, emitsInOrder(expectedStates));

      authBloc.add(const LoginSubmittedEvent(
        email: 'alex@botifyai.cloud',
        password: 'password123',
      ));
    });

    test('Emits [AuthLoading, AuthError] when login fails', () async {
      mockAuthRepository.shouldSucceed = false;

      final expectedStates = [
        isA<AuthLoading>(),
        isA<AuthError>(),
      ];

      expectLater(authBloc.stream, emitsInOrder(expectedStates));

      authBloc.add(const LoginSubmittedEvent(
        email: 'wrong@botifyai.cloud',
        password: 'wrongpassword',
      ));
    });

    test('Emits [AuthUnauthenticated] on LogoutEvent', () async {
      final expectedStates = [
        isA<AuthUnauthenticated>(),
      ];

      expectLater(authBloc.stream, emitsInOrder(expectedStates));
      authBloc.add(LogoutEvent());
    });
  });
}
