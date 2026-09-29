import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_typography.dart';

enum BotifyButtonVariant { primary, secondary, outline, danger, ghost }

class BotifyButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final BotifyButtonVariant variant;
  final bool isLoading;
  final IconData? icon;
  final double? width;
  final double height;

  const BotifyButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.variant = BotifyButtonVariant.primary,
    this.isLoading = false,
    this.icon,
    this.width,
    this.height = 48,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Color backgroundColor;
    Color foregroundColor;
    BorderSide? borderSide;

    switch (variant) {
      case BotifyButtonVariant.primary:
        backgroundColor = isDark ? AppColors.brandPrimaryLight : AppColors.brandPrimary;
        foregroundColor = Colors.white;
        break;
      case BotifyButtonVariant.secondary:
        backgroundColor = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
        foregroundColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
        borderSide = BorderSide(color: isDark ? AppColors.borderDark : AppColors.borderLight);
        break;
      case BotifyButtonVariant.outline:
        backgroundColor = Colors.transparent;
        foregroundColor = isDark ? AppColors.textPrimaryDark : AppColors.brandPrimary;
        borderSide = BorderSide(color: isDark ? AppColors.borderDark : AppColors.brandPrimary);
        break;
      case BotifyButtonVariant.danger:
        backgroundColor = AppColors.error;
        foregroundColor = Colors.white;
        break;
      case BotifyButtonVariant.ghost:
        backgroundColor = Colors.transparent;
        foregroundColor = isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight;
        break;
    }

    return SizedBox(
      width: width ?? double.infinity,
      height: height,
      child: Material(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(10),
        shape: borderSide != null
            ? RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: borderSide,
              )
            : RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          borderRadius: BorderRadius.circular(10),
          child: Center(
            child: isLoading
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.2,
                      valueColor: AlwaysStoppedAnimation<Color>(foregroundColor),
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (icon != null) ...[
                        Icon(icon, size: 18, color: foregroundColor),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        text,
                        style: AppTypography.buttonText(color: foregroundColor),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
