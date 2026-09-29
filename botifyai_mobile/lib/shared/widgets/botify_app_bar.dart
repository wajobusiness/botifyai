import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_typography.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';
import '../../features/auth/presentation/bloc/auth_state.dart';

class BotifyAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final bool showWorkspaceSelector;
  final VoidCallback? onSearchTap;
  final VoidCallback? onNotificationTap;
  final int unreadNotificationsCount;

  const BotifyAppBar({
    super.key,
    this.title,
    this.showWorkspaceSelector = true,
    this.onSearchTap,
    this.onNotificationTap,
    this.unreadNotificationsCount = 0,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AppBar(
      titleSpacing: 16,
      title: showWorkspaceSelector
          ? BlocBuilder<AuthBloc, AuthState>(
              builder: (context, state) {
                String workspaceName = 'BotifyAI';
                if (state is AuthenticatedState) {
                  workspaceName = state.user.workspace?.name ?? state.user.name;
                }

                return InkWell(
                  onTap: () => _showWorkspaceSwitcherModal(context),
                  borderRadius: BorderRadius.circular(8),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 30,
                          height: 30,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                            border: Border.all(
                              color: AppColors.brandPrimaryLight,
                              width: 1,
                            ),
                          ),
                          padding: const EdgeInsets.all(2),
                          child: ClipOval(
                            child: Image.asset(
                              'assets/images/logo.png',
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            workspaceName,
                            style: AppTypography.headingSmall(
                              color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          LucideIcons.chevronDown,
                          size: 16,
                          color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                        ),
                      ],
                    ),
                  ),
                );
              },
            )
          : Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 26,
                  height: 26,
                  margin: const EdgeInsets.only(right: 8),
                  child: Image.asset(
                    'assets/images/logo.png',
                    fit: BoxFit.contain,
                  ),
                ),
                Text(
                  title ?? '',
                  style: AppTypography.headingMedium(
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                  ),
                ),
              ],
            ),
      actions: [
        if (onSearchTap != null)
          IconButton(
            icon: const Icon(LucideIcons.search, size: 20),
            tooltip: 'Search',
            onPressed: onSearchTap,
          ),
        Stack(
          alignment: Alignment.center,
          children: [
            IconButton(
              icon: const Icon(LucideIcons.bell, size: 20),
              tooltip: 'Notifications',
              onPressed: onNotificationTap,
            ),
            if (unreadNotificationsCount > 0)
              Positioned(
                top: 10,
                right: 10,
                child: Container(
                  padding: const EdgeInsets.all(3),
                  decoration: const BoxDecoration(
                    color: AppColors.error,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(minWidth: 8, minHeight: 8),
                ),
              ),
          ],
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  void _showWorkspaceSwitcherModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        final isDark = Theme.of(context).brightness == Brightness.dark;

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Switch Workspace',
                  style: AppTypography.headingMedium(
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                  ),
                ),
                const SizedBox(height: 12),
                ListTile(
                  leading: const Icon(LucideIcons.check, color: AppColors.brandPrimary),
                  title: const Text('Primary Workspace'),
                  subtitle: const Text('Active Client Environment'),
                  onTap: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
