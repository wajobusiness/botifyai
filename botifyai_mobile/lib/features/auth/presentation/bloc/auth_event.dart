import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class CheckAuthStatusEvent extends AuthEvent {}

class LoginSubmittedEvent extends AuthEvent {
  final String email;
  final String password;
  final String? deviceName;

  const LoginSubmittedEvent({
    required this.email,
    required this.password,
    this.deviceName,
  });

  @override
  List<Object?> get props => [email, password, deviceName];
}

class BiometricLoginEvent extends AuthEvent {}

class LogoutEvent extends AuthEvent {}

class SwitchWorkspaceEvent extends AuthEvent {
  final int workspaceId;

  const SwitchWorkspaceEvent(this.workspaceId);

  @override
  List<Object?> get props => [workspaceId];
}
