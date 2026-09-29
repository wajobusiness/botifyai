import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/message.dart';
import 'voice_note_player.dart';

class MessageBubble extends StatelessWidget {
  final Message message;
  final VoidCallback? onRetry;

  const MessageBubble({
    super.key,
    required this.message,
    this.onRetry,
  });

  String _formatTime(DateTime dateTime) {
    return DateFormat('HH:mm').format(dateTime);
  }

  Widget _buildStatusIcon(BuildContext context) {
    switch (message.status) {
      case MessageDeliveryStatus.pending:
        return const Icon(LucideIcons.clock, size: 12, color: Colors.white70);
      case MessageDeliveryStatus.sent:
        return const Icon(LucideIcons.check, size: 12, color: Colors.white70);
      case MessageDeliveryStatus.delivered:
        return const Icon(LucideIcons.checkCheck, size: 13, color: Colors.white70);
      case MessageDeliveryStatus.read:
        return const Icon(LucideIcons.checkCheck, size: 13, color: AppColors.aiAccent);
      case MessageDeliveryStatus.failed:
        return GestureDetector(
          onTap: onRetry,
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(LucideIcons.alertCircle, size: 12, color: AppColors.error),
              SizedBox(width: 2),
              Text(
                'Retry',
                style: TextStyle(color: AppColors.error, fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // 1. System Event Bubble (Centered Pill)
    if (message.type == MessageType.event) {
      return Center(
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 8),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSurface : Colors.grey[200],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            message.body,
            style: AppTypography.caption(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
        ),
      );
    }

    // 2. Private Internal Note Bubble (Amber Card)
    if (message.isNote || message.type == MessageType.note) {
      return Container(
        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF451A03) : const Color(0xFFFEF3C7),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: const Color(0xFFF59E0B).withOpacity(0.5),
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(LucideIcons.lock, size: 14, color: Color(0xFFD97706)),
                const SizedBox(width: 6),
                Text(
                  'Private Note',
                  style: AppTypography.caption(
                    fontWeight: FontWeight.w700,
                    color: isDark ? const Color(0xFFFDE68A) : const Color(0xFFB45309),
                  ),
                ),
                const Spacer(),
                Text(
                  _formatTime(message.sentAt),
                  style: AppTypography.caption(
                    fontSize: 10,
                    color: isDark ? Colors.amber[200] : const Color(0xFF92400E),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              message.body,
              style: AppTypography.bodyRegular(
                color: isDark ? const Color(0xFFFEF3C7) : const Color(0xFF78350F),
              ),
            ),
            if (message.senderName != null) ...[
              const SizedBox(height: 4),
              Text(
                'By ${message.senderName}',
                style: AppTypography.caption(
                  fontSize: 10,
                  color: isDark ? Colors.amber[300] : const Color(0xFFB45309),
                ),
              ),
            ],
          ],
        ),
      );
    }

    // 3. Regular Inbound vs Outbound Message Bubble
    final isOutbound = message.isOutbound;
    final bubbleColor = isOutbound
        ? AppColors.primary
        : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9));
    final textColor = isOutbound
        ? Colors.white
        : (isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary);
    final metaColor = isOutbound
        ? Colors.white70
        : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary);

    return Align(
      alignment: isOutbound ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.78,
        ),
        margin: EdgeInsets.only(
          left: isOutbound ? 48 : 16,
          right: isOutbound ? 16 : 48,
          top: 4,
          bottom: 4,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: bubbleColor,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isOutbound ? 16 : 4),
            bottomRight: Radius.circular(isOutbound ? 4 : 16),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 3,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment:
              isOutbound ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            // Sender name on inbound if group or multi-user
            if (!isOutbound && message.senderName != null && message.senderName!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 3),
                child: Text(
                  message.senderName!,
                  style: AppTypography.caption(
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ),

            // Image Attachment Preview
            if (message.type == MessageType.image && message.attachmentUrl != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: CachedNetworkImage(
                  imageUrl: message.attachmentUrl!,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(
                    height: 180,
                    color: Colors.black12,
                    child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                  ),
                  errorWidget: (_, __, ___) => const Icon(LucideIcons.imageOff),
                ),
              ),

            // Voice Note Audio Player
            if (message.type == MessageType.audio && (message.attachmentUrl != null || message.body.isNotEmpty))
              VoiceNotePlayer(
                audioUrl: message.attachmentUrl ?? message.body,
                isOutbound: isOutbound,
              ),

            // Document Attachment Preview
            if (message.type == MessageType.document)
              Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isOutbound ? Colors.white12 : Colors.black12,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      LucideIcons.fileText,
                      size: 20,
                      color: isOutbound ? Colors.white : AppColors.primary,
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        message.attachmentName ?? 'Document',
                        style: AppTypography.bodySmall(
                          color: textColor,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),

            // Text Body
            if (message.body.isNotEmpty)
              Text(
                message.body,
                style: AppTypography.bodyRegular(
                  color: textColor,
                ),
              ),

            const SizedBox(height: 4),

            // Time & Delivery Status Checkmarks
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _formatTime(message.sentAt),
                  style: AppTypography.caption(
                    fontSize: 10,
                    color: metaColor,
                  ),
                ),
                if (isOutbound) ...[
                  const SizedBox(width: 4),
                  _buildStatusIcon(context),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
