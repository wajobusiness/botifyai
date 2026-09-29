import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../shared/widgets/botify_button.dart';
import '../../../../shared/widgets/botify_card.dart';
import '../../../../shared/widgets/botify_text_field.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final state = context.read<AuthBloc>().state;
    if (state is UnauthenticatedState && state.savedEmail != null) {
      _emailController.text = state.savedEmail!;
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submitLogin() {
    if (_formKey.currentState?.validate() ?? false) {
      context.read<AuthBloc>().add(
            LoginSubmittedEvent(
              email: _emailController.text,
              password: _passwordController.text,
            ),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthenticatedState) {
          context.go('/inbox');
        } else if (state is AuthErrorState) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      },
      builder: (context, state) {
        final isLoading = state is AuthLoadingState;
        final biometricsAvailable =
            state is UnauthenticatedState && state.biometricsAvailable;

        return Scaffold(
          body: SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Header & Brand Logo
                      Center(
                        child: Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: AppColors.brandPrimary,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.bubble_chart_rounded,
                              size: 32,
                              color: AppColors.aiAccent,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Welcome to BotifyAI',
                        textAlign: TextAlign.center,
                        style: AppTypography.headingLarge(
                          color: isDark
                              ? AppColors.textPrimaryDark
                              : AppColors.textPrimaryLight,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Sign in to manage your live chats, store orders, and AI assistants on the go.',
                        textAlign: TextAlign.center,
                        style: AppTypography.bodySmall(
                          color: isDark
                              ? AppColors.textSecondaryDark
                              : AppColors.textSecondaryLight,
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Card Container
                      BotifyCard(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            BotifyTextField(
                              label: 'Email Address',
                              hintText: 'name@example.com',
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              prefixIcon: const Icon(LucideIcons.mail, size: 18),
                              validator: (val) {
                                if (val == null || val.trim().isEmpty) {
                                  return 'Email address is required.';
                                }
                                if (!val.contains('@')) {
                                  return 'Enter a valid email address.';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            BotifyTextField(
                              label: 'Password',
                              hintText: '••••••••',
                              controller: _passwordController,
                              isPassword: true,
                              prefixIcon: const Icon(LucideIcons.lock, size: 18),
                              validator: (val) {
                                if (val == null || val.isEmpty) {
                                  return 'Password is required.';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 24),
                            BotifyButton(
                              text: 'Sign In',
                              isLoading: isLoading,
                              onPressed: _submitLogin,
                            ),
                            if (biometricsAvailable) ...[
                              const SizedBox(height: 12),
                              BotifyButton(
                                text: 'Biometric Sign In',
                                variant: BotifyButtonVariant.secondary,
                                icon: LucideIcons.fingerprint,
                                onPressed: () {
                                  context.read<AuthBloc>().add(BiometricLoginEvent());
                                },
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Footer info
                      Text(
                        'Protected with hardware-encrypted Sanctum token storage.',
                        textAlign: TextAlign.center,
                        style: AppTypography.caption(
                          color: isDark
                              ? AppColors.textMutedDark
                              : AppColors.textMutedLight,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
