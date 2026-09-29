import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

class VoiceRecordService {
  final AudioRecorder _recorder = AudioRecorder();
  bool _isRecording = false;
  String? _currentRecordingPath;
  DateTime? _recordingStartTime;

  bool get isRecording => _isRecording;
  String? get currentRecordingPath => _currentRecordingPath;
  Duration get currentDuration => _recordingStartTime != null
      ? DateTime.now().difference(_recordingStartTime!)
      : Duration.zero;

  /// Request permission and start audio recording
  Future<bool> startRecording() async {
    try {
      final hasPermission = await _recorder.hasPermission();
      if (!hasPermission) {
        debugPrint('Microphone permission denied.');
        return false;
      }

      final tempDir = await getTemporaryDirectory();
      final filePath =
          '${tempDir.path}/botify_voice_${DateTime.now().millisecondsSinceEpoch}.m4a';

      await _recorder.start(
        const RecordConfig(
          encoder: AudioEncoder.aacLc,
          bitRate: 128000,
          sampleRate: 44100,
        ),
        path: filePath,
      );

      _isRecording = true;
      _currentRecordingPath = filePath;
      _recordingStartTime = DateTime.now();
      return true;
    } catch (e) {
      debugPrint('Error starting audio recording: $e');
      _isRecording = false;
      return false;
    }
  }

  /// Stop audio recording and return file and total duration
  Future<File?> stopRecording() async {
    if (!_isRecording) return null;

    try {
      final path = await _recorder.stop();
      _isRecording = false;
      _recordingStartTime = null;

      if (path != null && File(path).existsSync()) {
        return File(path);
      }
      return null;
    } catch (e) {
      debugPrint('Error stopping audio recording: $e');
      _isRecording = false;
      return null;
    }
  }

  /// Cancel and discard recording
  Future<void> cancelRecording() async {
    if (!_isRecording) return;
    try {
      final path = await _recorder.stop();
      _isRecording = false;
      _recordingStartTime = null;

      if (path != null) {
        final file = File(path);
        if (file.existsSync()) {
          file.deleteSync();
        }
      }
    } catch (e) {
      debugPrint('Error canceling audio recording: $e');
    }
  }

  void dispose() {
    _recorder.dispose();
  }
}
