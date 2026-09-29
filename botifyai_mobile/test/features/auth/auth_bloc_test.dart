import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:botifyai_mobile/features/auth/presentation/bloc/auth_event.dart';
import 'package:botifyai_mobile/features/auth/presentation/bloc/auth_state.dart';
import 'package:botifyai_mobile/features/auth/domain/entities/user.dart';
import 'package:botifyai_mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:botifyai_mobile/core/storage/secure_storage_service.dart';
import 'package:botifyai_mobile/core/security/biometric_service.dart';

class MockAuthRepository implements AuthRepository {
  bool shouldSucceed = true;
  User mockUser = const User(
    id: 1,
    name: 'Alex Johnson',
    email: 'alex@botifyai.cloud',
    role: 'client',
    workspaceId: 1,
  );

  @override
  Future<User> login({
    required String email,
    required String password,
    String? deviceName,
  }) async {
    if (shouldSucceed) {
      return mockUser;
    } else {
      throw Exception('Invalid credentials');
    }
  }

  @override
  Future<User?> checkAuthStatus() async {
    return shouldSucceed ? mockUser : null;
  }

  @override
  Future<void> logout() async {}

  @override
  Future<void> switchWorkspace(int workspaceId) async {}
}

class FakeSecureStorageService extends SecureStorageService {
  String? token;
  String? email;
  @override
  Future<String?> getToken() async => token;
  @override
  Future<void> saveToken(String val) async => token = val;
  @override
  Future<String?> getSavedEmail() async => email;
  @override
  Future<void> saveEmail(String val) async => email = val;
  @override
  Future<void> clear() async => token = null;
  @override
  Future<void> clearSession() async => token = null;
}

class FakeBiometricService extends BiometricService {
  @override
  Future<bool> isBiometricsAvailable() async => true;
  @override
  Future<bool> isBiometricEnrolled() async => true;
  @override
  Future<bool> authenticateWithBiometrics({String reason = 'Authenticate to access BotifyAI'}) async => true;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

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

    test('Initial state is AuthInitialState', () {
      expect(authBloc.state, isA<AuthInitialState>());
    });

    test('Emits [AuthLoadingState, AuthenticatedState] when login succeeds', () async {
      mockAuthRepository.shouldSucceed = true;

      final expectedStates = [
        isA<AuthLoadingState>(),
        isA<AuthenticatedState>().having((s) => s.user.email, 'email', 'alex@botifyai.cloud'),
      ];

      expectLater(authBloc.stream, emitsInOrder(expectedStates));

      authBloc.add(const LoginSubmittedEvent(
        email: 'alex@botifyai.cloud',
        password: 'password123',
      ));
    });

    test('Emits [AuthLoadingState, AuthErrorState] when login fails', () async {
      mockAuthRepository.shouldSucceed = false;

      final expectedStates = [
        isA<AuthLoadingState>(),
        isA<AuthErrorState>(),
      ];

      expectLater(authBloc.stream, emitsInOrder(expectedStates));

      authBloc.add(const LoginSubmittedEvent(
        email: 'wrong@botifyai.cloud',
        password: 'wrongpassword',
      ));
    });

    test('Emits [AuthLoadingState, UnauthenticatedState] on LogoutEvent', () async {
      final expectedStates = [
        isA<AuthLoadingState>(),
        isA<UnauthenticatedState>(),
      ];

      expectLater(authBloc.stream, emitsInOrder(expectedStates));
      authBloc.add(LogoutEvent());
    });
  });
}
