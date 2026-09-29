import 'package:flutter/material.dart';

/// Design tokens for BotifyAI Mobile Application (Stitch Design System)
class AppColors {
  AppColors._();

  // Primary Brand Colors (Olive Ramp)
  static const Color brandPrimary = Color(0xFF467235); // Anchor brand color
  static const Color brandPrimaryLight = Color(0xFF5E9B48);
  static const Color brandPrimaryDark = Color(0xFF283F24);
  static const Color brandPrimarySubtle = Color(0xFFEBF5E7);

  // Aliases for component convenience
  static const Color primary = brandPrimary;
  static const Color primaryDark = brandPrimaryDark;
  static const Color primaryLight = brandPrimaryLight;
  static const Color primarySubtle = brandPrimarySubtle;

  // AI High-Tech Accent (Electric Lime)
  static const Color aiAccent = Color(0xFFACE601);
  static const Color aiAccentDark = Color(0xFF88B800);
  static const Color aiAccentSubtle = Color(0xFFF6FDE6);

  // Light Mode Surfaces
  static const Color backgroundLight = Color(0xFFFFFFFF);
  static const Color surfaceLight = Color(0xFFF8FAFC);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color borderLight = Color(0xFFE2E8F0);
  static const Color dividerLight = Color(0xFFF1F5F9);

  static const Color lightBackground = backgroundLight;
  static const Color lightSurface = surfaceLight;
  static const Color lightCard = cardLight;
  static const Color lightBorder = borderLight;
  static const Color lightDivider = dividerLight;

  // Dark Mode Surfaces
  static const Color backgroundDark = Color(0xFF0F172A);
  static const Color surfaceDark = Color(0xFF1E293B);
  static const Color cardDark = Color(0xFF1E293B);
  static const Color borderDark = Color(0xFF334155);
  static const Color dividerDark = Color(0xFF1E293B);

  static const Color darkBackground = backgroundDark;
  static const Color darkSurface = surfaceDark;
  static const Color darkCard = cardDark;
  static const Color darkBorder = borderDark;
  static const Color darkDivider = dividerDark;

  // Text Colors
  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textSecondaryLight = Color(0xFF64748B);
  static const Color textMutedLight = Color(0xFF94A3B8);

  static const Color lightTextPrimary = textPrimaryLight;
  static const Color lightTextSecondary = textSecondaryLight;
  static const Color lightTextMuted = textMutedLight;

  static const Color textPrimaryDark = Color(0xFFF8FAFC);
  static const Color textSecondaryDark = Color(0xFF94A3B8);
  static const Color textMutedDark = Color(0xFF64748B);

  static const Color darkTextPrimary = textPrimaryDark;
  static const Color darkTextSecondary = textSecondaryDark;
  static const Color darkTextMuted = textMutedDark;

  // Omnichannel Identity Colors
  static const Color channelWhatsApp = Color(0xFF25D366);
  static const Color channelInstagram = Color(0xFFE1306C);
  static const Color channelMessenger = Color(0xFF0084FF);
  static const Color channelTelegram = Color(0xFF229ED9);
  static const Color channelWebchat = Color(0xFF467235);

  // Semantic Status Colors
  static const Color success = Color(0xFF10B981);
  static const Color successSubtle = Color(0xFFECFDF5);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningSubtle = Color(0xFFFEF3C7);
  static const Color error = Color(0xFFEF4444);
  static const Color errorSubtle = Color(0xFFFEF2F2);
  static const Color info = Color(0xFF3B82F6);
  static const Color infoSubtle = Color(0xFFEFF6FF);

  // Internal Notes (Amber Tint)
  static const Color internalNoteLight = Color(0xFFFFFBEB);
  static const Color internalNoteBorderLight = Color(0xFFFDE68A);
  static const Color internalNoteDark = Color(0xFF451A03);
  static const Color internalNoteBorderDark = Color(0xFF78350F);
}
