import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../shared/widgets/botify_app_bar.dart';
import '../../../../shared/widgets/botify_button.dart';
import '../../../../shared/widgets/botify_card.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_event.dart';
import '../../../auth/presentation/bloc/auth_state.dart';

class HubScreen extends StatelessWidget {
  const HubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: const BotifyAppBar(
        showWorkspaceSelector: false,
        title: 'Hub & Settings',
      ),
      body: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          String userName = 'Agent';
          String userEmail = '';
          String userRole = 'Client Administrator';
          String workspaceName = 'Primary Workspace';

          if (state is AuthenticatedState) {
            userName = state.user.name;
            userEmail = state.user.email;
            userRole = state.user.clientRole ?? state.user.role;
            workspaceName = state.user.workspace?.name ?? 'Workspace';
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // User Profile Card
              BotifyCard(
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: AppColors.brandPrimary.withOpacity(0.15),
                      child: Text(
                        userName.isNotEmpty ? userName[0].toUpperCase() : 'A',
                        style: AppTypography.headingMedium(color: AppColors.brandPrimary),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            userName,
                            style: AppTypography.headingSmall(
                              color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            userEmail,
                            style: AppTypography.bodySmall(
                              color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.brandPrimary.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              userRole.toUpperCase(),
                              style: AppTypography.caption(
                                color: AppColors.brandPrimary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Operational Cards
              Text(
                'WORKSPACE',
                style: AppTypography.caption(
                  color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              BotifyCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(LucideIcons.building2, size: 20, color: AppColors.brandPrimary),
                      title: Text(workspaceName, style: AppTypography.bodyMedium()),
                      subtitle: const Text('Active Workspace'),
                      trailing: const Icon(LucideIcons.chevronRight, size: 18),
                      onTap: () {},
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(LucideIcons.zap, size: 20, color: AppColors.aiAccentDark),
                      title: Text('AI Runs & Limits', style: AppTypography.bodyMedium()),
                      subtitle: const Text('Telemetry & Usage Quotas'),
                      trailing: const Icon(LucideIcons.chevronRight, size: 18),
                      onTap: () {},
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              Text(
                'PREFERENCES',
                style: AppTypography.caption(
                  color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              BotifyCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(LucideIcons.fingerprint, size: 20, color: AppColors.info),
                      title: Text('Biometric Security', style: AppTypography.bodyMedium()),
                      subtitle: const Text('FaceID / Fingerprint Lock'),
                      trailing: Switch.adaptive(
                        value: true,
                        activeColor: AppColors.brandPrimary,
                        onChanged: (val) {},
                      ),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(LucideIcons.moon, size: 20, color: AppColors.warning),
                      title: Text('Dark Mode', style: AppTypography.bodyMedium()),
                      trailing: Switch.adaptive(
                        value: isDark,
                        activeColor: AppColors.brandPrimary,
                        onChanged: (val) {},
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Sign Out Button
              BotifyButton(
                text: 'Sign Out',
                variant: BotifyButtonVariant.danger,
                icon: LucideIcons.logOut,
                onPressed: () {
                  context.read<AuthBloc>().add(LogoutEvent());
                },
              ),
            ],
          );
        },
      ),
    );
  }
}
