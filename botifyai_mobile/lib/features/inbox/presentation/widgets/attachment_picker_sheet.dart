import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';

class AttachmentPickerSheet extends StatelessWidget {
  final Function(File file, String type) onFileSelected;

  const AttachmentPickerSheet({
    super.key,
    required this.onFileSelected,
  });

  static void show({
    required BuildContext context,
    required Function(File file, String type) onFileSelected,
  }) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (modalContext) {
        return AttachmentPickerSheet(
          onFileSelected: (file, type) {
            Navigator.pop(modalContext);
            onFileSelected(file, type);
          },
        );
      },
    );
  }

  Future<void> _pickImage(BuildContext context, ImageSource source) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: source,
      imageQuality: 80,
      maxWidth: 1920,
    );

    if (picked != null) {
      onFileSelected(File(picked.path), 'image');
    }
  }

  Future<void> _pickVideo(BuildContext context, ImageSource source) async {
    final picker = ImagePicker();
    final picked = await picker.pickVideo(
      source: source,
      maxDuration: const Duration(minutes: 3),
    );

    if (picked != null) {
      onFileSelected(File(picked.path), 'video');
    }
  }

  Widget _buildOption({
    required BuildContext context,
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              shape: BoxShape.circle,
              border: Border.all(color: color.withOpacity(0.3)),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: AppTypography.caption(
              fontWeight: FontWeight.w600,
              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkBackground : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.grey[700] : Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Share Media & Files',
              style: AppTypography.headingSmall(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildOption(
                  context: context,
                  icon: LucideIcons.camera,
                  label: 'Camera',
                  color: Colors.purple,
                  onTap: () => _pickImage(context, ImageSource.camera),
                ),
                _buildOption(
                  context: context,
                  icon: LucideIcons.image,
                  label: 'Gallery',
                  color: AppColors.primary,
                  onTap: () => _pickImage(context, ImageSource.gallery),
                ),
                _buildOption(
                  context: context,
                  icon: LucideIcons.video,
                  label: 'Video',
                  color: Colors.redAccent,
                  onTap: () => _pickVideo(context, ImageSource.gallery),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
