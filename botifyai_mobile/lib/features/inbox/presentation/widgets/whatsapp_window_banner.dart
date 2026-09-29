import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:botifyai_mobile/app/theme/app_typography.dart';

class WhatsAppWindowBanner extends StatelessWidget {
  final bool isWindowOpen;
  final VoidCallback onSelectTemplate;

  const WhatsAppWindowBanner({
    super.key,
    required this.isWindowOpen,
    required this.onSelectTemplate,
  });

  @override
  Widget build(BuildContext context) {
    if (isWindowOpen) return const SizedBox.shrink();

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF451A03) : const Color(0xFFFFFBEB),
        border: Border(
          top: BorderSide(
            color: const Color(0xFFF59E0B).withOpacity(0.3),
            width: 1,
          ),
          bottom: BorderSide(
            color: const Color(0xFFF59E0B).withOpacity(0.3),
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.alertTriangle, size: 18, color: Color(0xFFD97706)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              '24h session window expired. Send an approved template to re-open.',
              style: AppTypography.caption(
                color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: onSelectTemplate,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFD97706),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(6),
              ),
            ),
            child: Text(
              'Templates',
              style: AppTypography.caption(
                fontWeight: FontWeight.w700,
                color: Colors.white,
                fontSize: 11,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
