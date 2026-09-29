import 'package:dio/dio.dart';
import '../errors/failures.dart';
import '../storage/secure_storage_service.dart';
import 'api_endpoints.dart';
import 'auth_interceptor.dart';

/// Central HTTP API Client configuring Dio, base timeouts, and interceptors
class ApiClient {
  final Dio _dio;
  final SecureStorageService _storageService;

  ApiClient({
    required SecureStorageService storageService,
    String baseUrl = ApiEndpoints.defaultBaseUrl,
    void Function()? onUnauthorized,
  })  : _storageService = storageService,
        _dio = Dio(
          BaseOptions(
            baseUrl: baseUrl,
            connectTimeout: const Duration(seconds: 30),
            receiveTimeout: const Duration(seconds: 30),
            sendTimeout: const Duration(seconds: 30),
            headers: {
              'Accept': 'application/json',
            },
          ),
        ) {
    _dio.interceptors.addAll([
      AuthInterceptor(
        storageService: _storageService,
        onUnauthorized: onUnauthorized,
      ),
      LogInterceptor(
        request: true,
        requestHeader: true,
        requestBody: true,
        responseHeader: false,
        responseBody: true,
        error: true,
      ),
    ]);
  }

  Dio get dio => _dio;

  /// Helper to wrap async Dio calls and convert exceptions to Failure instances
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.get<T>(path, queryParameters: queryParameters, options: options);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.post<T>(path, data: data, queryParameters: queryParameters, options: options);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.patch<T>(path, data: data, queryParameters: queryParameters, options: options);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.delete<T>(path, data: data, queryParameters: queryParameters, options: options);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Failure _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
        return const NetworkFailure('Connection timed out. Please check your internet connection.');

      case DioExceptionType.badResponse:
        final status = error.response?.statusCode;
        final data = error.response?.data;

        if (status == 401) {
          return const AuthFailure('Session expired or invalid credentials.');
        }

        if (status == 422 && data is Map<String, dynamic>) {
          final message = data['message'] as String? ?? 'Validation error.';
          final errors = <String, List<String>>{};
          if (data['errors'] is Map) {
            (data['errors'] as Map).forEach((k, v) {
              if (v is List) {
                errors[k.toString()] = v.map((e) => e.toString()).toList();
              }
            });
          }
          return ValidationFailure(message, errors: errors);
        }

        if (data is Map<String, dynamic> && data.containsKey('message')) {
          return ServerFailure(data['message'].toString(), statusCode: status);
        }

        return ServerFailure('Server returned error code ($status)', statusCode: status);

      default:
        return ServerFailure(error.message ?? 'An unexpected network error occurred.');
    }
  }
}
