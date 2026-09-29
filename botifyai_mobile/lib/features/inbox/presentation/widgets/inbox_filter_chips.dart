import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';

class InboxFilterChips extends StatelessWidget {
  final String selectedFolder;
  final String? selectedChannel;
  final Function(String folder) onFolderSelected;
  final Function(String? channel) onChannelSelected;

  const InboxFilterChips({
    super.key,
    required this.selectedFolder,
    this.selectedChannel,
    required this.onFolderSelected,
    required this.onChannelSelected,
  });

  static const List<Map<String, String>> folders = [
    {'id': 'mine', 'label': 'Mine'},
    {'id': 'unassigned', 'label': 'Unassigned'},
    {'id': 'all', 'label': 'All Chats'},
    {'id': 'resolved', 'label': 'Resolved'},
    {'id': 'snoozed', 'label': 'Snoozed'},
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: folders.map((folder) {
          final isSelected = selectedFolder == folder['id'];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              selected: isSelected,
              label: Text(
                folder['label']!,
                style: AppTypography.caption.copyWith(
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  color: isSelected
                      ? Colors.white
                      : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                ),
              ),
              backgroundColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
              selectedColor: AppColors.primary,
              checkmarkColor: Colors.white,
              showCheckmark: false,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: isSelected
                      ? AppColors.primary
                      : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                  width: 1,
                ),
              ),
              onSelected: (_) => onFolderSelected(folder['id']!),
            ),
          );
        }).toList(),
      ),
    );
  }
}
