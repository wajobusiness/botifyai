import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:botifyai_mobile/app/theme/app_colors.dart';
import 'package:botifyai_mobile/app/theme/app_typography.dart';

class CopilotKeyboardBar extends StatelessWidget {
  final VoidCallback onAiDraft;
  final VoidCallback onSummarize;
  final VoidCallback onShortcuts;
  final VoidCallback onTemplates;
  final bool isGenerating;

  const CopilotKeyboardBar({
    super.key,
    required this.onAiDraft,
    required this.onSummarize,
    required this.onShortcuts,
    required this.onTemplates,
    this.isGenerating = false,
  });

  Widget _buildPill({
    required BuildContext context,
    required String label,
    required IconData icon,
    required VoidCallback onTap,
    Color? accentColor,
    bool isSpecial = false,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = accentColor ?? AppColors.primary;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isGenerating ? null : onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: isSpecial
                  ? (isDark
                      ? AppColors.aiAccent.withOpacity(0.15)
                      : AppColors.aiAccent.withOpacity(0.2))
                  : (isDark ? AppColors.darkSurface : AppColors.lightSurface),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isSpecial
                    ? AppColors.aiAccent
                    : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                width: isSpecial ? 1.2 : 0.8,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  icon,
                  size: 13,
                  color: isSpecial
                      ? (isDark ? AppColors.aiAccent : AppColors.primary)
                      : primaryColor,
                ),
                const SizedBox(width: 5),
                Text(
                  label,
                  style: AppTypography.caption(
                    fontWeight: isSpecial ? FontWeight.w700 : FontWeight.w600,
                    fontSize: 11,
                    color: isSpecial
                        ? (isDark ? Colors.white : AppColors.primaryDark)
                        : (isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 38,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: ListView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        children: [
          _buildPill(
            context: context,
            label: isGenerating ? 'Generating...' : '✨ AI Draft',
            icon: LucideIcons.sparkles,
            onTap: onAiDraft,
            isSpecial: true,
          ),
          _buildPill(
            context: context,
            label: '📝 Summarize',
            icon: LucideIcons.fileText,
            onTap: onSummarize,
          ),
          _buildPill(
            context: context,
            label: '⚡ /shortcuts',
            icon: LucideIcons.zap,
            onTap: onShortcuts,
          ),
          _buildPill(
            context: context,
            label: '📋 Templates',
            icon: LucideIcons.layoutTemplate,
            onTap: onTemplates,
          ),
        ],
      ),
    );
  }
}
