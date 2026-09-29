import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import 'voice_note_recorder_bar.dart';

class ChatInputBar extends StatefulWidget {
  final TextEditingController controller;
  final bool isNoteMode;
  final bool isSending;
  final bool isWindowLocked;
  final Function(String text, bool isNote) onSend;
  final Function(File audioFile, Duration duration, bool isNote) onSendVoiceNote;
  final VoidCallback onToggleNoteMode;
  final VoidCallback onAttachmentTap;
  final Function(bool isTyping) onTypingChanged;

  const ChatInputBar({
    super.key,
    required this.controller,
    required this.isNoteMode,
    required this.isSending,
    this.isWindowLocked = false,
    required this.onSend,
    required this.onSendVoiceNote,
    required this.onToggleNoteMode,
    required this.onAttachmentTap,
    required this.onTypingChanged,
  });

  @override
  State<ChatInputBar> createState() => _ChatInputBarState();
}

class _ChatInputBarState extends State<ChatInputBar> {
  final FocusNode _focusNode = FocusNode();
  bool _hasText = false;
  bool _isRecordingVoice = false;

  @override
  void initState() {
    super.initState();
    _hasText = widget.controller.text.trim().isNotEmpty;
    widget.controller.addListener(_handleTextChange);
  }

  void _handleTextChange() {
    final hasNow = widget.controller.text.trim().isNotEmpty;
    if (_hasText != hasNow) {
      setState(() => _hasText = hasNow);
    }
    widget.onTypingChanged(hasNow);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_handleTextChange);
    _focusNode.dispose();
    super.dispose();
  }

  void _handleSend() {
    final text = widget.controller.text.trim();
    if (text.isEmpty || widget.isSending) return;

    HapticFeedback.lightImpact();
    widget.onSend(text, widget.isNoteMode);
    widget.controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    if (_isRecordingVoice) {
      return VoiceNoteRecorderBar(
        onRecorded: (file, duration) {
          setState(() => _isRecordingVoice = false);
          widget.onSendVoiceNote(file, duration, widget.isNoteMode);
        },
        onCancel: () {
          setState(() => _isRecordingVoice = false);
        },
      );
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isNote = widget.isNoteMode;

    return Container(
      padding: EdgeInsets.only(
        left: 12,
        right: 12,
        top: 8,
        bottom: MediaQuery.of(context).padding.bottom > 0 ? MediaQuery.of(context).padding.bottom + 4 : 12,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkBackground : Colors.white,
        border: Border(
          top: BorderSide(
            color: isNote
                ? const Color(0xFFF59E0B)
                : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
            width: isNote ? 1.5 : 1,
          ),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // If Note Mode is active, show banner badge
          if (isNote)
            Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF451A03) : const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.lock, size: 13, color: Color(0xFFD97706)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Adding Private Internal Note (Visible only to team)',
                      style: AppTypography.caption.copyWith(
                        color: isDark ? const Color(0xFFFDE68A) : const Color(0xFFB45309),
                        fontWeight: FontWeight.w600,
                        fontSize: 11,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: widget.onToggleNoteMode,
                    child: const Icon(LucideIcons.x, size: 14, color: Color(0xFFD97706)),
                  ),
                ],
              ),
            ),

          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Note Mode Toggle Button
              IconButton(
                onPressed: widget.onToggleNoteMode,
                icon: Icon(
                  isNote ? LucideIcons.lock : LucideIcons.unlock,
                  size: 20,
                  color: isNote
                      ? const Color(0xFFD97706)
                      : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                ),
                tooltip: isNote ? 'Switch to Customer Reply' : 'Add Internal Note',
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
              ),

              // Attachment Button (Paperclip)
              if (!isNote)
                IconButton(
                  onPressed: widget.isWindowLocked ? null : widget.onAttachmentTap,
                  icon: Icon(
                    LucideIcons.paperclip,
                    size: 20,
                    color: widget.isWindowLocked
                        ? Colors.grey
                        : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                  ),
                  tooltip: 'Attach Media or File',
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                ),

              const SizedBox(width: 4),

              // Text Field Composer
              Expanded(
                child: Container(
                  constraints: const BoxConstraints(maxHeight: 120),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isNote
                          ? const Color(0xFFF59E0B)
                          : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                      width: 1,
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                  child: TextField(
                    controller: widget.controller,
                    focusNode: _focusNode,
                    minLines: 1,
                    maxLines: 5,
                    enabled: !widget.isWindowLocked || isNote,
                    textCapitalization: TextCapitalization.sentences,
                    style: AppTypography.bodyRegular.copyWith(
                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                    ),
                    decoration: InputDecoration(
                      hintText: widget.isWindowLocked && !isNote
                          ? '24h window closed. Use a template.'
                          : (isNote ? 'Type an internal note...' : 'Type a reply...'),
                      hintStyle: AppTypography.bodySmall.copyWith(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
              ),

              const SizedBox(width: 8),

              // Action Button: Voice Mic or Send Button
              if (!_hasText && (!widget.isWindowLocked || isNote)) ...[
                // Mic Button to Start Voice Recording
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: isNote ? const Color(0xFFD97706) : AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: const Icon(LucideIcons.mic, size: 19, color: Colors.white),
                    onPressed: () {
                      setState(() => _isRecordingVoice = true);
                    },
                    padding: EdgeInsets.zero,
                  ),
                ),
              ] else ...[
                // Send Text Button
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: (!_hasText || (widget.isWindowLocked && !isNote))
                        ? (isDark ? Colors.white12 : Colors.black12)
                        : (isNote ? const Color(0xFFD97706) : AppColors.primary),
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    onPressed: (!_hasText || (widget.isWindowLocked && !isNote) || widget.isSending)
                        ? null
                        : _handleSend,
                    icon: widget.isSending
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Icon(LucideIcons.send, size: 18, color: Colors.white),
                    padding: EdgeInsets.zero,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
