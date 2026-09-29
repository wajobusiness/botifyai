import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../shared/widgets/botify_app_bar.dart';

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  String _selectedFolder = 'mine';

  final List<Map<String, dynamic>> _folders = [
    {'id': 'mine', 'label': 'Mine', 'count': 4},
    {'id': 'unassigned', 'label': 'Unassigned', 'count': 12},
    {'id': 'all', 'label': 'All', 'count': 38},
    {'id': 'resolved', 'label': 'Resolved', 'count': null},
    {'id': 'snoozed', 'label': 'Snoozed', 'count': null},
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: BotifyAppBar(
        onSearchTap: () {},
        onNotificationTap: () {},
        unreadNotificationsCount: 3,
      ),
      body: Column(
        children: [
          // Filter Chips Scroll Bar
          Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _folders.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final folder = _folders[index];
                final isSelected = _selectedFolder == folder['id'];

                return ChoiceChip(
                  label: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(folder['label'] as String),
                      if (folder['count'] != null) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? Colors.white.withOpacity(0.25)
                                : (isDark ? AppColors.borderDark : AppColors.borderLight),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${folder['count']}',
                            style: AppTypography.caption(
                              color: isSelected
                                  ? Colors.white
                                  : (isDark ? AppColors.textSecondaryDark : AppColors.textPrimaryLight),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  selected: isSelected,
                  selectedColor: AppColors.brandPrimary,
                  backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  labelStyle: AppTypography.bodySmall(
                    color: isSelected
                        ? Colors.white
                        : (isDark ? AppColors.textSecondaryDark : AppColors.textPrimaryLight),
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  ),
                  side: BorderSide(
                    color: isSelected
                        ? AppColors.brandPrimary
                        : (isDark ? AppColors.borderDark : AppColors.borderLight),
                  ),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  onSelected: (selected) {
                    if (selected) {
                      setState(() {
                        _selectedFolder = folder['id'] as String;
                      });
                    }
                  },
                );
              },
            ),
          ),
          const Divider(),

          // Empty state placeholder for Sprint 1
          Expanded(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: AppColors.brandPrimary.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        LucideIcons.messageSquare,
                        size: 28,
                        color: AppColors.brandPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Omnichannel Inbox Ready',
                      style: AppTypography.headingSmall(
                        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Live messaging feed, Pusher WebSocket sync, and WhatsApp templates connect in Sprint 2.',
                      textAlign: TextAlign.center,
                      style: AppTypography.bodySmall(
                        color: isDark ? AppColors.textMutedDark : AppColors.textMutedLight,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: AppColors.brandPrimary,
        child: const Icon(LucideIcons.plus, color: Colors.white),
      ),
    );
  }
}
