import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/security/biometric_service.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../../domain/repositories/auth_repository.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository _authRepository;
  final SecureStorageService _secureStorage;
  final BiometricService _biometricService;

  AuthBloc({
    required AuthRepository authRepository,
    required SecureStorageService secureStorage,
    required BiometricService biometricService,
  })  : _authRepository = authRepository,
        _secureStorage = secureStorage,
        _biometricService = biometricService,
        super(AuthInitialState()) {
    on<CheckAuthStatusEvent>(_onCheckAuthStatus);
    on<LoginSubmittedEvent>(_onLoginSubmitted);
    on<BiometricLoginEvent>(_onBiometricLogin);
    on<LogoutEvent>(_onLogout);
    on<SwitchWorkspaceEvent>(_onSwitchWorkspace);
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatusEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoadingState());

    try {
      final user = await _authRepository.checkAuthStatus();
      if (user != null) {
        emit(AuthenticatedState(user));
      } else {
        final savedEmail = await _secureStorage.getSavedEmail();
        final biometricsAvailable = await _biometricService.isBiometricsAvailable();
        emit(UnauthenticatedState(
          savedEmail: savedEmail,
          biometricsAvailable: biometricsAvailable,
        ));
      }
    } catch (_) {
      final savedEmail = await _secureStorage.getSavedEmail();
      emit(UnauthenticatedState(savedEmail: savedEmail));
    }
  }

  Future<void> _onLoginSubmitted(
    LoginSubmittedEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoadingState());

    try {
      final user = await _authRepository.login(
        email: event.email.trim(),
        password: event.password,
        deviceName: event.deviceName,
      );
      emit(AuthenticatedState(user));
    } on ValidationFailure catch (e) {
      emit(AuthErrorState(e.message, errors: e.errors));
    } on Failure catch (e) {
      emit(AuthErrorState(e.message));
    } catch (e) {
      emit(AuthErrorState('An unexpected error occurred: ${e.toString()}'));
    }
  }

  Future<void> _onBiometricLogin(
    BiometricLoginEvent event,
    Emitter<AuthState> emit,
  ) async {
    final authenticated = await _biometricService.authenticate(
      reason: 'Sign in to BotifyAI using Biometrics',
    );

    if (authenticated) {
      add(CheckAuthStatusEvent());
    }
  }

  Future<void> _onLogout(
    LogoutEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoadingState());
    await _authRepository.logout();
    final savedEmail = await _secureStorage.getSavedEmail();
    final biometricsAvailable = await _biometricService.isBiometricsAvailable();
    emit(UnauthenticatedState(
      savedEmail: savedEmail,
      biometricsAvailable: biometricsAvailable,
    ));
  }

  Future<void> _onSwitchWorkspace(
    SwitchWorkspaceEvent event,
    Emitter<AuthState> emit,
  ) async {
    await _authRepository.switchWorkspace(event.workspaceId);
    // Reload active profile
    add(CheckAuthStatusEvent());
  }
}
