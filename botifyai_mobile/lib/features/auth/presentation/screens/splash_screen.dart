import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;
  bool _hasNavigated = false;

  void _navigateTo(String path) {
    if (!_hasNavigated && mounted) {
      _hasNavigated = true;
      context.go(path);
    }
  }

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _scaleAnimation = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutBack),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeIn),
    );

    _animController.forward();

    // Check if Auth state is already resolved
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final state = context.read<AuthBloc>().state;
      if (state is AuthenticatedState) {
        _navigateTo('/inbox');
      } else if (state is UnauthenticatedState) {
        _navigateTo('/login');
      } else {
        context.read<AuthBloc>().add(CheckAuthStatusEvent());
      }
    });

    // Safety timeout: transition after maximum 2 seconds
    Future.delayed(const Duration(milliseconds: 2000), () {
      if (!mounted || _hasNavigated) return;
      final state = context.read<AuthBloc>().state;
      if (state is AuthenticatedState) {
        _navigateTo('/inbox');
      } else {
        _navigateTo('/login');
      }
    });
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthenticatedState) {
          _navigateTo('/inbox');
        } else if (state is UnauthenticatedState || state is AuthErrorState) {
          _navigateTo('/login');
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.brandPrimaryDark,
        body: Center(
          child: AnimatedBuilder(
            animation: _animController,
            builder: (context, child) {
              return FadeTransition(
                opacity: _fadeAnimation,
                child: ScaleTransition(
                  scale: _scaleAnimation,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // BotifyAI Robot Logo with glow & elevation
                      Container(
                        width: 140,
                        height: 140,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.aiAccent.withOpacity(0.45),
                              blurRadius: 36,
                              spreadRadius: 4,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.all(8),
                        child: ClipOval(
                          child: Image.asset(
                            'assets/images/logo.png',
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),

                      Text(
                        'BotifyAI',
                        style: AppTypography.headingLarge(color: Colors.white),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Omnichannel Conversational AI & Commerce',
                        style: AppTypography.bodySmall(color: Colors.white.withOpacity(0.75)),
                      ),
                      const SizedBox(height: 48),

                      const SizedBox(
                        width: 28,
                        height: 28,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          valueColor: AlwaysStoppedAnimation<Color>(AppColors.aiAccent),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
