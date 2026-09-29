import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:botifyai_mobile/app/theme/app_colors.dart';
import 'package:botifyai_mobile/app/theme/app_typography.dart';
import 'package:botifyai_mobile/shared/widgets/botify_button.dart';
import 'package:botifyai_mobile/features/copilot/presentation/bloc/copilot_bloc.dart';
import 'package:botifyai_mobile/features/copilot/presentation/bloc/copilot_event.dart';
import 'package:botifyai_mobile/features/copilot/presentation/bloc/copilot_state.dart';

class CopilotDrawer extends StatefulWidget {
  final String conversationUuid;
  final Function(String text) onInsert;
  final Function(String text) onSendDirect;
  final Function(String note)? onSaveNote;

  const CopilotDrawer({
    super.key,
    required this.conversationUuid,
    required this.onInsert,
    required this.onSendDirect,
    this.onSaveNote,
  });

  static void show({
    required BuildContext context,
    required String conversationUuid,
    required CopilotBloc copilotBloc,
    required Function(String text) onInsert,
    required Function(String text) onSendDirect,
    Function(String note)? onSaveNote,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) {
        return BlocProvider<CopilotBloc>.value(
          value: copilotBloc,
          child: Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(modalContext).viewInsets.bottom,
            ),
            child: CopilotDrawer(
              conversationUuid: conversationUuid,
              onInsert: (text) {
                Navigator.pop(modalContext);
                onInsert(text);
              },
              onSendDirect: (text) {
                Navigator.pop(modalContext);
                onSendDirect(text);
              },
              onSaveNote: onSaveNote != null
                  ? (note) {
                      Navigator.pop(modalContext);
                      onSaveNote(note);
                    }
                  : null,
            ),
          ),
        );
      },
    );
  }

  @override
  State<CopilotDrawer> createState() => _CopilotDrawerState();
}

class _CopilotDrawerState extends State<CopilotDrawer> {
  final TextEditingController _customPromptController = TextEditingController();
  final TextEditingController _editableTextController = TextEditingController();

  @override
  void dispose() {
    _customPromptController.dispose();
    _editableTextController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.75,
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
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: AppColors.aiAccent.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(LucideIcons.sparkles, size: 18, color: AppColors.primary),
                ),
                const SizedBox(width: 10),
                Text(
                  'BotifyAI Copilot',
                  style: AppTypography.headingSmall(
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

          // Content Area
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: BlocConsumer<CopilotBloc, CopilotState>(
                listener: (context, state) {
                  if (state is CopilotSuccess) {
                    _editableTextController.text = state.suggestion.suggestedText;
                  }
                },
                builder: (context, state) {
                  if (state is CopilotGenerating) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 40),
                        child: Column(
                          children: [
                            const SizedBox(
                              width: 36,
                              height: 36,
                              child: CircularProgressIndicator(
                                color: AppColors.primary,
                                strokeWidth: 3,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              state.action == 'summarize'
                                  ? 'Synthesizing conversation summary...'
                                  : 'Generating context-aware reply...',
                              style: AppTypography.bodyRegular(
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  if (state is CopilotError) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      child: Column(
                        children: [
                          const Icon(LucideIcons.alertCircle, size: 40, color: AppColors.error),
                          const SizedBox(height: 12),
                          Text('Failed to generate response', style: AppTypography.headingSmall()),
                          const SizedBox(height: 6),
                          Text(
                            state.message,
                            textAlign: TextAlign.center,
                            style: AppTypography.bodySmall(),
                          ),
                          const SizedBox(height: 16),
                          BotifyButton(
                            text: 'Try Again',
                            icon: LucideIcons.refreshCw,
                            onPressed: () {
                              context.read<CopilotBloc>().add(
                                    GenerateCopilotDraftEvent(
                                      conversationUuid: widget.conversationUuid,
                                    ),
                                  );
                            },
                          ),
                        ],
                      ),
                    );
                  }

                  if (state is CopilotSuccess) {
                    final suggestion = state.suggestion;
                    final isSummary = suggestion.instruction == 'summarize';

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Metadata Bar (Confidence & Sources)
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppColors.aiAccent.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: AppColors.aiAccent,
                                  width: 0.8,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(LucideIcons.gauge, size: 12, color: AppColors.primary),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${(suggestion.confidenceScore * 100).toInt()}% Match',
                                    style: AppTypography.caption(
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.primary,
                                      fontSize: 10,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (suggestion.sourcesUsed.isNotEmpty) ...[
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Source: ${suggestion.sourcesUsed.first}',
                                  style: AppTypography.caption(
                                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                  ).copyWith(
                                    fontStyle: FontStyle.italic,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 12),

                        // Editable Suggestion Container
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                            ),
                          ),
                          child: TextField(
                            controller: _editableTextController,
                            maxLines: 6,
                            minLines: 3,
                            style: AppTypography.bodyRegular(
                              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                            ),
                            decoration: const InputDecoration(
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Refine with custom prompt
                        Row(
                          children: [
                            Expanded(
                              child: Container(
                                height: 36,
                                padding: const EdgeInsets.symmetric(horizontal: 10),
                                decoration: BoxDecoration(
                                  color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                                  ),
                                ),
                                child: TextField(
                                  controller: _customPromptController,
                                  style: AppTypography.bodySmall(),
                                  decoration: InputDecoration(
                                    hintText: 'Refine (e.g. "make it friendlier")...',
                                    hintStyle: AppTypography.caption(),
                                    border: InputBorder.none,
                                    isDense: true,
                                    contentPadding: const EdgeInsets.symmetric(vertical: 8),
                                  ),
                                  onSubmitted: (prompt) {
                                    if (prompt.trim().isNotEmpty) {
                                      context.read<CopilotBloc>().add(
                                            GenerateCopilotDraftEvent(
                                              conversationUuid: widget.conversationUuid,
                                              customPrompt: prompt.trim(),
                                            ),
                                          );
                                      _customPromptController.clear();
                                    }
                                  },
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            IconButton(
                              onPressed: () {
                                final prompt = _customPromptController.text.trim();
                                if (prompt.isNotEmpty) {
                                  context.read<CopilotBloc>().add(
                                        GenerateCopilotDraftEvent(
                                          conversationUuid: widget.conversationUuid,
                                          customPrompt: prompt,
                                        ),
                                      );
                                  _customPromptController.clear();
                                }
                              },
                              icon: const Icon(LucideIcons.cornerDownLeft, size: 16),
                              style: IconButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.all(8),
                                minimumSize: Size.zero,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Action Buttons
                        if (isSummary) ...[
                          if (widget.onSaveNote != null)
                            BotifyButton(
                              text: 'Save as Internal Note',
                              icon: LucideIcons.lock,
                              onPressed: () {
                                widget.onSaveNote!(_editableTextController.text.trim());
                              },
                            ),
                          const SizedBox(height: 8),
                          BotifyButton(
                            text: 'Insert into Composer',
                            icon: LucideIcons.clipboard,
                            variant: BotifyButtonVariant.secondary,
                            onPressed: () {
                              widget.onInsert(_editableTextController.text.trim());
                            },
                          ),
                        ] else ...[
                          Row(
                            children: [
                              Expanded(
                                child: BotifyButton(
                                  text: 'Insert to Composer',
                                  icon: LucideIcons.cornerDownLeft,
                                  variant: BotifyButtonVariant.secondary,
                                  onPressed: () {
                                    widget.onInsert(_editableTextController.text.trim());
                                  },
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: BotifyButton(
                                  text: 'Send Instantly',
                                  icon: LucideIcons.send,
                                  onPressed: () {
                                    widget.onSendDirect(_editableTextController.text.trim());
                                  },
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    );
                  }

                  return const SizedBox.shrink();
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
