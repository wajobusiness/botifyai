import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:botifyai_mobile/app/theme/app_colors.dart';
import 'package:botifyai_mobile/app/theme/app_typography.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/contact.dart';

class ContactTile extends StatelessWidget {
  final Contact contact;
  final VoidCallback onTap;
  final VoidCallback? onMessageTap;

  const ContactTile({
    super.key,
    required this.contact,
    required this.onTap,
    this.onMessageTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            // Contact Avatar
            CircleAvatar(
              radius: 22,
              backgroundColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
              backgroundImage: contact.avatar != null && contact.avatar!.isNotEmpty
                  ? CachedNetworkImageProvider(contact.avatar!)
                  : null,
              child: contact.avatar == null || contact.avatar!.isEmpty
                  ? Text(
                      contact.name.isNotEmpty ? contact.name[0].toUpperCase() : '?',
                      style: AppTypography.headingSmall(
                        color: isDark ? Colors.white : AppColors.primary,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 12),

            // Contact Name & Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    contact.name,
                    style: AppTypography.bodyRegular(
                      fontWeight: FontWeight.w600,
                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    contact.phone ?? contact.email ?? 'No contact info',
                    style: AppTypography.caption(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

            // Action: Message Icon
            if (onMessageTap != null)
              IconButton(
                icon: const Icon(LucideIcons.messageCircle, size: 20, color: AppColors.primary),
                onPressed: onMessageTap,
                tooltip: 'Open Chat',
              ),
          ],
        ),
      ),
    );
  }
}
