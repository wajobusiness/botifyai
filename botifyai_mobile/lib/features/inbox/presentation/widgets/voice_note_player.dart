import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';

class VoiceNotePlayer extends StatefulWidget {
  final String audioUrl;
  final bool isOutbound;

  const VoiceNotePlayer({
    super.key,
    required this.audioUrl,
    required this.isOutbound,
  });

  @override
  State<VoiceNotePlayer> createState() => _VoiceNotePlayerState();
}

class _VoiceNotePlayerState extends State<VoiceNotePlayer> {
  late AudioPlayer _player;
  bool _isPlaying = false;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;
  double _playbackSpeed = 1.0;

  @override
  void initState() {
    super.initState();
    _player = AudioPlayer();

    _player.onPlayerStateChanged.listen((state) {
      if (mounted) {
        setState(() {
          _isPlaying = state == PlayerState.playing;
        });
      }
    });

    _player.onDurationChanged.listen((d) {
      if (mounted) {
        setState(() {
          _duration = d;
        });
      }
    });

    _player.onPositionChanged.listen((p) {
      if (mounted) {
        setState(() {
          _position = p;
        });
      }
    });

    _player.onPlayerComplete.listen((_) {
      if (mounted) {
        setState(() {
          _isPlaying = false;
          _position = Duration.zero;
        });
      }
    });
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  Future<void> _togglePlay() async {
    if (_isPlaying) {
      await _player.pause();
    } else {
      if (widget.audioUrl.startsWith('http')) {
        await _player.play(UrlSource(widget.audioUrl));
      } else {
        await _player.play(DeviceFileSource(widget.audioUrl));
      }
    }
  }

  Future<void> _cycleSpeed() async {
    double nextSpeed = 1.0;
    if (_playbackSpeed == 1.0) {
      nextSpeed = 1.5;
    } else if (_playbackSpeed == 1.5) {
      nextSpeed = 2.0;
    } else {
      nextSpeed = 1.0;
    }

    await _player.setPlaybackRate(nextSpeed);
    if (mounted) {
      setState(() => _playbackSpeed = nextSpeed);
    }
  }

  String _formatDuration(Duration d) {
    final mins = d.inMinutes;
    final secs = d.inSeconds % 60;
    return '$mins:${secs.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final iconColor = widget.isOutbound ? Colors.white : AppColors.primary;
    final textColor = widget.isOutbound ? Colors.white70 : AppColors.lightTextSecondary;

    return Container(
      width: 220,
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          // Play / Pause Circle
          GestureDetector(
            onTap: _togglePlay,
            child: Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: widget.isOutbound ? Colors.white.withOpacity(0.2) : AppColors.primaryLight.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(
                _isPlaying ? LucideIcons.pause : LucideIcons.play,
                size: 16,
                color: iconColor,
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Scrubber Bar & Timer
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                SliderTheme(
                  data: SliderThemeData(
                    trackHeight: 3,
                    thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 5),
                    overlayShape: const RoundSliderOverlayShape(overlayRadius: 8),
                    activeTrackColor: iconColor,
                    inactiveTrackColor: iconColor.withOpacity(0.3),
                    thumbColor: iconColor,
                  ),
                  child: Slider(
                    value: _position.inMilliseconds.toDouble().clamp(
                          0.0,
                          _duration.inMilliseconds > 0 ? _duration.inMilliseconds.toDouble() : 1.0,
                        ),
                    max: _duration.inMilliseconds > 0 ? _duration.inMilliseconds.toDouble() : 1.0,
                    onChanged: (val) {
                      _player.seek(Duration(milliseconds: val.toInt()));
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _formatDuration(_position),
                        style: AppTypography.caption(
                          fontSize: 10,
                          color: textColor,
                        ),
                      ),
                      Text(
                        _formatDuration(_duration),
                        style: AppTypography.caption(
                          fontSize: 10,
                          color: textColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Speed selector pill
          const SizedBox(width: 6),
          GestureDetector(
            onTap: _cycleSpeed,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: widget.isOutbound ? Colors.white24 : Colors.black12,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '${_playbackSpeed.toStringAsFixed(1).replaceAll('.0', '')}x',
                style: AppTypography.caption(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: iconColor,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
