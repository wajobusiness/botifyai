import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/conversation.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/message.dart';

class ConversationTile extends StatelessWidget {
  final Conversation conversation;
  final VoidCallback onTap;

  const ConversationTile({
    super.key,
    required this.conversation,
    required this.onTap,
  });

  String _formatTimestamp(DateTime? dateTime) {
    if (dateTime == null) return '';
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m';
    } else if (difference.inHours < 24 && dateTime.day == now.day) {
      return DateFormat('HH:mm').format(dateTime);
    } else if (difference.inDays == 1 || (difference.inDays < 2 && dateTime.day == now.day - 1)) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return DateFormat('E').format(dateTime);
    } else {
      return DateFormat('dd/MM').format(dateTime);
    }
  }

  Color _getChannelColor(String channel) {
    switch (channel.toLowerCase()) {
      case 'whatsapp':
        return const Color(0xFF25D366);
      case 'instagram':
        return const Color(0xFFE1306C);
      case 'messenger':
        return const Color(0xFF0084FF);
      case 'telegram':
        return const Color(0xFF229ED9);
      default:
        return AppColors.primary;
    }
  }

  IconData _getChannelIcon(String channel) {
    switch (channel.toLowerCase()) {
      case 'whatsapp':
        return LucideIcons.messageCircle;
      case 'instagram':
        return LucideIcons.instagram;
      case 'messenger':
        return LucideIcons.messageSquare;
      default:
        return LucideIcons.messageSquare;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final lastMsg = conversation.lastMessage;
    final hasUnread = conversation.unreadCount > 0;
    final channelColor = _getChannelColor(conversation.channel);

    String snippet = lastMsg?.body ?? 'No messages yet';
    if (lastMsg != null) {
      if (lastMsg.isNote) {
        snippet = '🔒 Note: ${lastMsg.body}';
      } else if (lastMsg.type == MessageType.image) {
        snippet = '📷 Photo';
      } else if (lastMsg.type == MessageType.audio) {
        snippet = '🎤 Voice note';
      } else if (lastMsg.type == MessageType.document) {
        snippet = '📄 Document';
      } else if (lastMsg.isOutbound) {
        snippet = 'You: ${lastMsg.body}';
      }
    }

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: hasUnread
              ? (isDark
                  ? AppColors.primary.withOpacity(0.08)
                  : AppColors.primaryLight.withOpacity(0.15))
              : Colors.transparent,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Avatar with Channel Badge
            Stack(
              clipBehavior: Clip.none,
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                  backgroundImage: conversation.contact.avatar != null &&
                          conversation.contact.avatar!.isNotEmpty
                      ? CachedNetworkImageProvider(conversation.contact.avatar!)
                      : null,
                  child: conversation.contact.avatar == null ||
                          conversation.contact.avatar!.isEmpty
                      ? Text(
                          conversation.contact.name.isNotEmpty
                              ? conversation.contact.name[0].toUpperCase()
                              : '?',
                          style: AppTypography.headingSmall(
                            color: isDark ? Colors.white : AppColors.primary,
                          ),
                        )
                      : null,
                ),
                // Channel Badge Icon
                Positioned(
                  bottom: -2,
                  right: -2,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      color: channelColor,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isDark ? AppColors.darkBackground : Colors.white,
                        width: 1.5,
                      ),
                    ),
                    child: Icon(
                      _getChannelIcon(conversation.channel),
                      size: 10,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 12),

            // Middle Column: Contact name, snippet, labels
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          conversation.contact.name,
                          style: AppTypography.bodyRegular(
                            fontWeight: hasUnread ? FontWeight.w700 : FontWeight.w600,
                            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      // Timestamp
                      Text(
                        _formatTimestamp(conversation.lastMessageAt),
                        style: AppTypography.caption(
                          color: hasUnread
                              ? AppColors.primary
                              : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                          fontWeight: hasUnread ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),

                  Row(
                    children: [
                      // Snippet text
                      Expanded(
                        child: Text(
                          snippet,
                          style: AppTypography.bodySmall(
                            color: hasUnread
                                ? (isDark ? Colors.white : Colors.black87)
                                : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                            fontWeight: hasUnread ? FontWeight.w500 : FontWeight.w400,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),

                      // WhatsApp 24h Window Indicator
                      if (conversation.channel.toLowerCase() == 'whatsapp')
                        Tooltip(
                          message: conversation.isWhatsappWindowOpen
                              ? 'WhatsApp 24h window active'
                              : 'WhatsApp 24h window expired',
                          child: Container(
                            width: 8,
                            height: 8,
                            margin: const EdgeInsets.only(right: 6),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: conversation.isWhatsappWindowOpen
                                  ? const Color(0xFF25D366)
                                  : AppColors.error,
                            ),
                          ),
                        ),

                      // Unread Count Badge
                      if (hasUnread)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            conversation.unreadCount > 99 ? '99+' : '${conversation.unreadCount}',
                            style: AppTypography.caption(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                    ],
                  ),

                  // Labels Row
                  if (conversation.labels.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 4,
                      runSpacing: 2,
                      children: conversation.labels.map((label) {
                        Color chipColor = AppColors.primary;
                        try {
                          final hex = label.color.replaceAll('#', '');
                          if (hex.length == 6) {
                            chipColor = Color(int.parse('FF$hex', radix: 16));
                          }
                        } catch (_) {}

                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: chipColor.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(
                              color: chipColor.withOpacity(0.4),
                              width: 0.8,
                            ),
                          ),
                          child: Text(
                            label.name,
                            style: AppTypography.caption(
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                              color: chipColor,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
