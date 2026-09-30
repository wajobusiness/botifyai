import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Secure hardware-backed storage service (iOS Keychain & Android EncryptedSharedPreferences)
/// with transparent SharedPreferences fallback on Web environments.
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
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kTokenKey, token);
      return;
    }
    try {
      await _storage.write(key: _kTokenKey, value: token);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kTokenKey, token);
    }
  }

  Future<String?> getToken() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_kTokenKey);
    }
    try {
      return await _storage.read(key: _kTokenKey);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_kTokenKey);
    }
  }

  Future<void> deleteToken() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_kTokenKey);
      return;
    }
    try {
      await _storage.delete(key: _kTokenKey);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_kTokenKey);
    }
  }

  // Active Workspace ID
  Future<void> saveActiveWorkspaceId(int workspaceId) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kActiveWorkspaceIdKey, workspaceId.toString());
      return;
    }
    try {
      await _storage.write(key: _kActiveWorkspaceIdKey, value: workspaceId.toString());
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kActiveWorkspaceIdKey, workspaceId.toString());
    }
  }

  Future<int?> getActiveWorkspaceId() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_kActiveWorkspaceIdKey);
      return raw != null ? int.tryParse(raw) : null;
    }
    try {
      final raw = await _storage.read(key: _kActiveWorkspaceIdKey);
      return raw != null ? int.tryParse(raw) : null;
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_kActiveWorkspaceIdKey);
      return raw != null ? int.tryParse(raw) : null;
    }
  }

  // Remembered Email
  Future<void> saveEmail(String email) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kSavedEmailKey, email);
      return;
    }
    try {
      await _storage.write(key: _kSavedEmailKey, value: email);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kSavedEmailKey, email);
    }
  }

  Future<String?> getSavedEmail() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_kSavedEmailKey);
    }
    try {
      return await _storage.read(key: _kSavedEmailKey);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_kSavedEmailKey);
    }
  }

  // Biometrics Preference
  Future<void> setBiometricsEnabled(bool enabled) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kBiometricsEnabledKey, enabled ? '1' : '0');
      return;
    }
    try {
      await _storage.write(key: _kBiometricsEnabledKey, value: enabled ? '1' : '0');
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kBiometricsEnabledKey, enabled ? '1' : '0');
    }
  }

  Future<bool> isBiometricsEnabled() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_kBiometricsEnabledKey);
      return raw == '1';
    }
    try {
      final raw = await _storage.read(key: _kBiometricsEnabledKey);
      return raw == '1';
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_kBiometricsEnabledKey);
      return raw == '1';
    }
  }

  // Clear all session credentials (used during sign out)
  Future<void> clearSession() async {
    await deleteToken();
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_kActiveWorkspaceIdKey);
      return;
    }
    try {
      await _storage.delete(key: _kActiveWorkspaceIdKey);
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_kActiveWorkspaceIdKey);
    }
  }

  Future<void> clear() async {
    await clearSession();
  }
}
