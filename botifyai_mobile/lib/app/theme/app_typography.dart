import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// Typography hierarchy for BotifyAI Mobile Application (Stitch Design System)
class AppTypography {
  AppTypography._();

  // Headings — Space Grotesk
  static TextStyle headingLarge({Color? color, FontWeight? fontWeight, double? fontSize}) => GoogleFonts.spaceGrotesk(
        fontSize: fontSize ?? 24,
        fontWeight: fontWeight ?? FontWeight.w700,
        height: 1.25,
        color: color ?? AppColors.textPrimaryLight,
        letterSpacing: -0.5,
      );

  static TextStyle headingMedium({Color? color, FontWeight? fontWeight, double? fontSize}) => GoogleFonts.spaceGrotesk(
        fontSize: fontSize ?? 18,
        fontWeight: fontWeight ?? FontWeight.w600,
        height: 1.33,
        color: color ?? AppColors.textPrimaryLight,
        letterSpacing: -0.25,
      );

  static TextStyle headingSmall({Color? color, FontWeight? fontWeight, double? fontSize}) => GoogleFonts.spaceGrotesk(
        fontSize: fontSize ?? 16,
        fontWeight: fontWeight ?? FontWeight.w600,
        height: 1.38,
        color: color ?? AppColors.textPrimaryLight,
      );

  // Body & Conversational UI — Inter
  static TextStyle bodyLarge({Color? color, FontWeight? fontWeight, double? fontSize}) => GoogleFonts.inter(
        fontSize: fontSize ?? 15,
        fontWeight: fontWeight ?? FontWeight.w400,
        height: 1.45,
        color: color ?? AppColors.textPrimaryLight,
      );

  static TextStyle bodyMedium({Color? color, FontWeight? fontWeight, double? fontSize}) => GoogleFonts.inter(
        fontSize: fontSize ?? 14,
        fontWeight: fontWeight ?? FontWeight.w400,
        height: 1.42,
        color: color ?? AppColors.textPrimaryLight,
      );

  static TextStyle bodyRegular({Color? color, FontWeight? fontWeight, double? fontSize}) => GoogleFonts.inter(
        fontSize: fontSize ?? 14,
        fontWeight: fontWeight ?? FontWeight.w400,
        height: 1.42,
        color: color ?? AppColors.textPrimaryLight,
      );

  static TextStyle bodySmall({Color? color, FontWeight? fontWeight, double? fontSize}) => GoogleFonts.inter(
        fontSize: fontSize ?? 12,
        fontWeight: fontWeight ?? FontWeight.w400,
        height: 1.33,
        color: color ?? AppColors.textSecondaryLight,
      );

  static TextStyle caption({Color? color, FontWeight? fontWeight, double? fontSize}) => GoogleFonts.inter(
        fontSize: fontSize ?? 11,
        fontWeight: fontWeight ?? FontWeight.w500,
        height: 1.27,
        color: color ?? AppColors.textMutedLight,
      );

  static TextStyle buttonText({Color? color, FontWeight? fontWeight, double? fontSize}) => GoogleFonts.inter(
        fontSize: fontSize ?? 14,
        fontWeight: fontWeight ?? FontWeight.w600,
        height: 1.2,
        letterSpacing: 0.1,
        color: color ?? Colors.white,
      );

  static TextStyle monoNumeric({Color? color, FontWeight? fontWeight, double? fontSize}) => GoogleFonts.jetBrainsMono(
        fontSize: fontSize ?? 13,
        fontWeight: fontWeight ?? FontWeight.w500,
        color: color ?? AppColors.textPrimaryLight,
      );
}
