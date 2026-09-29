import 'dart:async';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';

class WhatsAppWindowCountdown extends StatefulWidget {
  final DateTime? lastCustomerMessageAt;
  final bool isWindowOpen;
  final VoidCallback onOpenTemplatePicker;

  const WhatsAppWindowCountdown({
    super.key,
    required this.lastCustomerMessageAt,
    required this.isWindowOpen,
    required this.onOpenTemplatePicker,
  });

  @override
  State<WhatsAppWindowCountdown> createState() => _WhatsAppWindowCountdownState();
}

class _WhatsAppWindowCountdownState extends State<WhatsAppWindowCountdown> {
  Timer? _timer;
  Duration _remaining = Duration.zero;
  bool _isExpired = false;

  @override
  void initState() {
    super.initState();
    _calculateRemaining();
    _timer = Timer.periodic(const Duration(minutes: 1), (_) => _calculateRemaining());
  }

  @override
  void didUpdateWidget(WhatsAppWindowCountdown oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.lastCustomerMessageAt != widget.lastCustomerMessageAt ||
        oldWidget.isWindowOpen != widget.isWindowOpen) {
      _calculateRemaining();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _calculateRemaining() {
    if (widget.lastCustomerMessageAt == null) {
      setState(() {
        _isExpired = !widget.isWindowOpen;
        _remaining = Duration.zero;
      });
      return;
    }

    final deadline = widget.lastCustomerMessageAt!.add(const Duration(hours: 24));
    final diff = deadline.difference(DateTime.now());

    if (diff.isNegative || !widget.isWindowOpen) {
      setState(() {
        _isExpired = true;
        _remaining = Duration.zero;
      });
    } else {
      setState(() {
        _isExpired = false;
        _remaining = diff;
      });
    }
  }

  String _formatRemaining() {
    final hours = _remaining.inHours;
    final mins = _remaining.inMinutes % 60;
    return '${hours}h ${mins}m';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isExpired) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        color: isDark ? const Color(0xFF451A03) : const Color(0xFFFFFBEB),
        child: Row(
          children: [
            const Icon(LucideIcons.alertTriangle, size: 16, color: Color(0xFFD97706)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'WhatsApp 24h session window expired.',
                style: AppTypography.caption(
                  color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            GestureDetector(
              onTap: widget.onOpenTemplatePicker,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFD97706),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'Send Template',
                  style: AppTypography.caption(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    // Active Window Countdown Bar
    final isNearExpiration = _remaining.inHours < 4;
    final dotColor = isNearExpiration ? Colors.amber : const Color(0xFF25D366);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      color: isDark ? AppColors.darkSurface : const Color(0xFFF1F5F9),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: dotColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'WhatsApp Care Window: ${_formatRemaining()} remaining',
            style: AppTypography.caption(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
          const Spacer(),
          GestureDetector(
            onTap: widget.onOpenTemplatePicker,
            child: Text(
              'Use Template',
              style: AppTypography.caption(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
                fontSize: 11,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
