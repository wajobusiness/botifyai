import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../shared/widgets/botify_button.dart';
import '../domain/entities/contact_profile.dart';

class ContactDetailDrawer extends StatelessWidget {
  final ContactProfile profile;
  final VoidCallback? onOpenChat;
  final Function(int labelId)? onAddLabel;
  final Function(int labelId)? onRemoveLabel;

  const ContactDetailDrawer({
    super.key,
    required this.profile,
    this.onOpenChat,
    this.onAddLabel,
    this.onRemoveLabel,
  });

  static void show({
    required BuildContext context,
    required ContactProfile profile,
    VoidCallback? onOpenChat,
    Function(int labelId)? onAddLabel,
    Function(int labelId)? onRemoveLabel,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) {
        return ContactDetailDrawer(
          profile: profile,
          onOpenChat: onOpenChat,
          onAddLabel: onAddLabel,
          onRemoveLabel: onRemoveLabel,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currencyFmt = NumberFormat.currency(
      symbol: profile.currencySymbol,
      decimalDigits: 2,
    );

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkBackground : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag Handle
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: isDark ? Colors.grey[700] : Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              children: [
                Text(
                  'Contact 360 Profile',
                  style: AppTypography.headingSmall.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(LucideIcons.x, size: 20),
                  onPressed: () => Navigator.pop(context),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Profile Overview Header
                  Center(
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 36,
                          backgroundColor: AppColors.primaryLight.withValues(alpha: 0.2),
                          backgroundImage: profile.contact.avatar != null &&
                                  profile.contact.avatar!.isNotEmpty
                              ? CachedNetworkImageProvider(profile.contact.avatar!)
                              : null,
                          child: profile.contact.avatar == null ||
                                  profile.contact.avatar!.isEmpty
                              ? Text(
                                  profile.contact.name.isNotEmpty
                                      ? profile.contact.name[0].toUpperCase()
                                      : '?',
                                  style: AppTypography.headingLarge.copyWith(
                                    color: AppColors.primary,
                                  ),
                                )
                              : null,
                        ),
                        const SizedBox(height: 10),
                        Text(
                          profile.contact.name,
                          style: AppTypography.headingSmall.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (profile.contact.phone != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            profile.contact.phone!,
                            style: AppTypography.bodySmall.copyWith(
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                        ],
                        if (profile.contact.email != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            profile.contact.email!,
                            style: AppTypography.caption.copyWith(
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Lifetime Spend & Order Metrics Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        Column(
                          children: [
                            Text(
                              '${profile.totalOrders}',
                              style: AppTypography.headingMedium.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text('Lifetime Orders', style: AppTypography.caption),
                          ],
                        ),
                        Container(
                          height: 36,
                          width: 1,
                          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                        ),
                        Column(
                          children: [
                            Text(
                              currencyFmt.format(profile.totalSpend),
                              style: AppTypography.headingMedium.copyWith(
                                color: AppColors.success,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text('Total Spend', style: AppTypography.caption),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Tags & Labels Section
                  Text(
                    'Customer Labels & Tags',
                    style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  if (profile.labels.isEmpty)
                    Text(
                      'No tags assigned to this customer.',
                      style: AppTypography.caption.copyWith(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    )
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: profile.labels.map((label) {
                        Color tagColor = AppColors.primary;
                        try {
                          final hex = label.color.replaceAll('#', '');
                          if (hex.length == 6) {
                            tagColor = Color(int.parse('FF$hex', radix: 16));
                          }
                        } catch (_) {}

                        return Chip(
                          label: Text(label.name),
                          backgroundColor: tagColor.withValues(alpha: 0.15),
                          labelStyle: AppTypography.caption.copyWith(
                            color: tagColor,
                            fontWeight: FontWeight.bold,
                          ),
                          side: BorderSide(color: tagColor.withValues(alpha: 0.3)),
                          visualDensity: VisualDensity.compact,
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                        );
                      }).toList(),
                    ),
                  const SizedBox(height: 20),

                  // Internal Notes Section
                  if (profile.notes.isNotEmpty) ...[
                    Text(
                      'Internal Notes',
                      style: AppTypography.bodySmall.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    ...profile.notes.map((noteMap) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF451A03) : const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: const Color(0xFFF59E0B).withValues(alpha: 0.4),
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(LucideIcons.lock, size: 14, color: Color(0xFFD97706)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                noteMap['note']?.toString() ?? noteMap['body']?.toString() ?? '',
                                style: AppTypography.bodySmall.copyWith(
                                  color: isDark ? const Color(0xFFFEF3C7) : const Color(0xFF78350F),
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                    const SizedBox(height: 16),
                  ],

                  // Action: Open Chat
                  if (onOpenChat != null)
                    BotifyButton(
                      text: 'Open WhatsApp Chat',
                      icon: LucideIcons.messageCircle,
                      onPressed: () {
                        Navigator.pop(context);
                        onOpenChat!();
                      },
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
