import 'package:dio/dio.dart';
import '../storage/secure_storage_service.dart';

/// Intercepts outgoing requests to inject Sanctum token & X-Workspace-Id headers
class AuthInterceptor extends Interceptor {
  final SecureStorageService _storageService;
  final void Function()? onUnauthorized;

  AuthInterceptor({
    required SecureStorageService storageService,
    this.onUnauthorized,
  }) : _storageService = storageService;

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // 1. Fetch active Sanctum bearer token from encrypted storage
    final token = await _storageService.getToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    // 2. Fetch active workspace ID
    final workspaceId = await _storageService.getActiveWorkspaceId();
    if (workspaceId != null) {
      options.headers['X-Workspace-Id'] = workspaceId.toString();
    }

    // 3. Set standard JSON headers
    options.headers['Accept'] = 'application/json';

    return handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    // Handle 401 Unauthorized (session expired or revoked)
    if (err.response?.statusCode == 401) {
      await _storageService.clearSession();
      onUnauthorized?.call();
    }

    return handler.next(err);
  }
}
