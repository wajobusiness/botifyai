import 'package:equatable/equatable.dart';

/// Abstract failure class for strongly-typed error handling
abstract class Failure extends Equatable {
  final String message;
  final int? statusCode;

  const Failure(this.message, {this.statusCode});

  @override
  List<Object?> get props => [message, statusCode];
}

/// Server responded with 4xx or 5xx status code
class ServerFailure extends Failure {
  const ServerFailure(super.message, {super.statusCode});
}

/// Network is unreachable or timed out
class NetworkFailure extends Failure {
  const NetworkFailure([super.message = 'Network connection unavailable. Please check your internet connection.']);
}

/// Authentication failed or token expired (401 / 403)
class AuthFailure extends Failure {
  const AuthFailure([super.message = 'Session expired or credentials invalid. Please sign in again.']);
}

/// Form or field validation failed (422)
class ValidationFailure extends Failure {
  final Map<String, List<String>> errors;

  const ValidationFailure(super.message, {this.errors = const {}});

  @override
  List<Object?> get props => [message, errors];
}

/// Cache failure when reading or writing local database
class CacheFailure extends Failure {
  const CacheFailure([super.message = 'Unable to read or write local data cache.']);
}
