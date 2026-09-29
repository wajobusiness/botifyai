import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure hardware-backed storage service (iOS Keychain & Android EncryptedSharedPreferences)
class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
            );

  static const String _kTokenKey = 'botify_sanctum_token';
  static const String _kActiveWorkspaceIdKey = 'botify_active_workspace_id';
  static const String _kSavedEmailKey = 'botify_saved_email';
  static const String _kBiometricsEnabledKey = 'botify_biometrics_enabled';

  // Sanctum Bearer Token
  Future<void> saveToken(String token) async {
    await _storage.write(key: _kTokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: _kTokenKey);
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: _kTokenKey);
  }

  // Active Workspace ID
  Future<void> saveActiveWorkspaceId(int workspaceId) async {
    await _storage.write(key: _kActiveWorkspaceIdKey, value: workspaceId.toString());
  }

  Future<int?> getActiveWorkspaceId() async {
    final raw = await _storage.read(key: _kActiveWorkspaceIdKey);
    return raw != null ? int.tryParse(raw) : null;
  }

  // Remembered Email
  Future<void> saveEmail(String email) async {
    await _storage.write(key: _kSavedEmailKey, value: email);
  }

  Future<String?> getSavedEmail() async {
    return await _storage.read(key: _kSavedEmailKey);
  }

  // Biometrics Preference
  Future<void> setBiometricsEnabled(bool enabled) async {
    await _storage.write(key: _kBiometricsEnabledKey, value: enabled ? '1' : '0');
  }

  Future<bool> isBiometricsEnabled() async {
    final raw = await _storage.read(key: _kBiometricsEnabledKey);
    return raw == '1';
  }

  // Clear all session credentials (used during sign out)
  Future<void> clearSession() async {
    await _storage.delete(key: _kTokenKey);
    await _storage.delete(key: _kActiveWorkspaceIdKey);
  }
}
