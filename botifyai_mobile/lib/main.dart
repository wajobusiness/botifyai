import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'app/app.dart';
import 'core/api/api_client.dart';
import 'core/realtime/pusher_service.dart';
import 'core/security/biometric_service.dart';
import 'core/storage/secure_storage_service.dart';
import 'features/auth/data/datasources/auth_remote_data_source.dart';
import 'features/auth/data/repositories/auth_repository_impl.dart';
import 'features/auth/domain/repositories/auth_repository.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/bloc/auth_event.dart';
import 'features/auth/presentation/bloc/auth_state.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations & transparent status bar
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  // Initialize Core Services
  final secureStorage = SecureStorageService();
  final biometricService = BiometricService();
  final apiClient = ApiClient(storageService: secureStorage);
  final pusherService = PusherService();

  // Initialize Repositories
  final authRemoteDataSource = AuthRemoteDataSourceImpl(apiClient: apiClient);
  final authRepository = AuthRepositoryImpl(
    remoteDataSource: authRemoteDataSource,
    secureStorage: secureStorage,
  );

  runApp(
    MultiRepositoryProvider(
      providers: [
        RepositoryProvider<ApiClient>.value(value: apiClient),
        RepositoryProvider<SecureStorageService>.value(value: secureStorage),
        RepositoryProvider<BiometricService>.value(value: biometricService),
        RepositoryProvider<PusherService>.value(value: pusherService),
        RepositoryProvider<AuthRepository>.value(value: authRepository),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider<AuthBloc>(
            create: (context) => AuthBloc(
              authRepository: authRepository,
              secureStorage: secureStorage,
              biometricService: biometricService,
            )..add(CheckAuthStatusEvent()),
          ),
        ],
        child: BlocListener<AuthBloc, AuthState>(
          listener: (context, state) {
            if (state is AuthAuthenticated) {
              // Initialize Pusher for active workspace
              final workspaceId = state.user.workspaceId?.toString() ??
                  state.user.workspace?.id.toString() ??
                  '1';
              pusherService.init(workspaceId: workspaceId);
            } else if (state is AuthUnauthenticated) {
              pusherService.disconnect();
            }
          },
          child: const BotifyApp(),
        ),
      ),
    ),
  );
}
