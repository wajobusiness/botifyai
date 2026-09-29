import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/audio/voice_record_service.dart';

class VoiceNoteRecorderBar extends StatefulWidget {
  final Function(File audioFile, Duration duration) onRecorded;
  final VoidCallback onCancel;

  const VoiceNoteRecorderBar({
    super.key,
    required this.onRecorded,
    required this.onCancel,
  });

  @override
  State<VoiceNoteRecorderBar> createState() => _VoiceNoteRecorderBarState();
}

class _VoiceNoteRecorderBarState extends State<VoiceNoteRecorderBar> with SingleTickerProviderStateMixin {
  final VoiceRecordService _recordService = VoiceRecordService();
  Timer? _timer;
  int _elapsedSeconds = 0;
  bool _isLocked = false;
  bool _isCanceling = false;
  double _horizontalDrag = 0.0;
  double _verticalDrag = 0.0;

  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);

    _startRecording();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseController.dispose();
    _recordService.dispose();
    super.dispose();
  }

  Future<void> _startRecording() async {
    HapticFeedback.mediumImpact();
    final started = await _recordService.startRecording();
    if (started) {
      _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() {
          _elapsedSeconds++;
        });
      });
    } else {
      widget.onCancel();
    }
  }

  Future<void> _finishAndSend() async {
    _timer?.cancel();
    HapticFeedback.lightImpact();
    final file = await _recordService.stopRecording();
    if (file != null && _elapsedSeconds > 0) {
      widget.onRecorded(file, Duration(seconds: _elapsedSeconds));
    } else {
      widget.onCancel();
    }
  }

  Future<void> _cancelRecording() async {
    _timer?.cancel();
    HapticFeedback.heavyImpact();
    await _recordService.cancelRecording();
    widget.onCancel();
  }

  String _formatDuration(int totalSecs) {
    final mins = totalSecs ~/ 60;
    final secs = totalSecs % 60;
    return '$mins:${secs.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 8,
        bottom: MediaQuery.of(context).padding.bottom > 0 ? MediaQuery.of(context).padding.bottom + 4 : 12,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkBackground : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          // Cancel / Trash button
          IconButton(
            icon: const Icon(LucideIcons.trash2, size: 20, color: AppColors.error),
            onPressed: _cancelRecording,
          ),

          // Pulsing red recording dot & Timer
          FadeTransition(
            opacity: _pulseController,
            child: Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                color: AppColors.error,
                shape: BoxShape.circle,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            _formatDuration(_elapsedSeconds),
            style: AppTypography.bodyRegular.copyWith(
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : Colors.black87,
            ),
          ),

          const Spacer(),

          // Slide indicator or locked status
          if (!_isLocked)
            Row(
              children: [
                const Icon(LucideIcons.chevronLeft, size: 14, color: Colors.grey),
                Text(
                  'Slide to cancel',
                  style: AppTypography.caption.copyWith(color: Colors.grey),
                ),
              ],
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(LucideIcons.lock, size: 12, color: AppColors.primary),
                  const SizedBox(width: 4),
                  Text(
                    'Hands-free recording',
                    style: AppTypography.caption.copyWith(
                      color: AppColors.primary,
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(width: 12),

          // Send Action Button
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: const Icon(LucideIcons.send, size: 18, color: Colors.white),
              onPressed: _finishAndSend,
              padding: EdgeInsets.zero,
            ),
          ),
        ],
      ),
    );
  }
}
