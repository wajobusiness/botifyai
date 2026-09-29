import 'package:flutter/material.dart';
import 'biometric_service.dart';
import '../storage/secure_storage_service.dart';
import '../database/local_database_service.dart';

class SessionSecurityManager with WidgetsBindingObserver {
  static final SessionSecurityManager _instance = SessionSecurityManager._internal();
  factory SessionSecurityManager({
    BiometricService? biometricService,
    SecureStorageService? secureStorage,
    LocalDatabaseService? localDatabase,
  }) {
    if (biometricService != null) _instance._biometricService = biometricService;
    if (secureStorage != null) _instance._secureStorage = secureStorage;
    if (localDatabase != null) _instance._localDatabase = localDatabase;
    return _instance;
  }

  SessionSecurityManager._internal()
      : _biometricService = BiometricService(),
        _secureStorage = SecureStorageService(),
        _localDatabase = LocalDatabaseService();

  late BiometricService _biometricService;
  late SecureStorageService _secureStorage;
  late LocalDatabaseService _localDatabase;

  DateTime? _lastPausedAt;
  static const int _sessionTimeoutSeconds = 300; // 5 minutes

  VoidCallback? onSessionLocked;

  void startListening({VoidCallback? onLock}) {
    onSessionLocked = onLock;
    WidgetsBinding.instance.addObserver(this);
  }

  void stopListening() {
    WidgetsBinding.instance.removeObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _lastPausedAt = DateTime.now();
      debugPrint('App entered background at $_lastPausedAt');
    } else if (state == AppLifecycleState.resumed) {
      if (_lastPausedAt != null) {
        final elapsed = DateTime.now().difference(_lastPausedAt!).inSeconds;
        debugPrint('App resumed after $elapsed seconds.');
        if (elapsed >= _sessionTimeoutSeconds) {
          _handleSessionTimeout();
        }
        _lastPausedAt = null;
      }
    }
  }

  Future<void> _handleSessionTimeout() async {
    debugPrint('Session timeout reached (>5m). Enforcing biometric re-authentication...');
    final isBiometricEnrolled = await _biometricService.isBiometricEnrolled();
    if (isBiometricEnrolled) {
      final authenticated = await _biometricService.authenticateWithBiometrics(
        reason: 'BotifyAI session locked due to inactivity. Please authenticate to continue.',
      );
      if (!authenticated) {
        onSessionLocked?.call();
      }
    } else {
      onSessionLocked?.call();
    }
  }

  /// Zero-leakage session termination: Purges hardware-backed keys and all local cache
  Future<void> purgeSession() async {
    debugPrint('Zero-leakage purgeSession: clearing hardware tokens and database...');
    await _secureStorage.clear();
    await _localDatabase.clearAll();
  }
}
