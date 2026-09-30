import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:botifyai_mobile/app/theme/app_colors.dart';
import 'package:botifyai_mobile/app/theme/app_typography.dart';
import 'package:botifyai_mobile/core/api/api_client.dart';
import 'package:botifyai_mobile/core/realtime/pusher_service.dart';
import 'package:botifyai_mobile/features/copilot/data/datasources/copilot_remote_data_source.dart';
import 'package:botifyai_mobile/features/copilot/data/repositories/copilot_repository_impl.dart';
import 'package:botifyai_mobile/features/copilot/presentation/bloc/copilot_bloc.dart';
import 'package:botifyai_mobile/features/copilot/presentation/bloc/copilot_event.dart';
import 'package:botifyai_mobile/features/copilot/presentation/bloc/copilot_state.dart';
import 'package:botifyai_mobile/features/copilot/presentation/widgets/copilot_drawer.dart';
import 'package:botifyai_mobile/features/copilot/presentation/widgets/copilot_keyboard_bar.dart';
import 'package:botifyai_mobile/features/inbox/data/datasources/inbox_remote_data_source.dart';
import 'package:botifyai_mobile/features/inbox/data/repositories/inbox_repository_impl.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/conversation.dart';
import 'package:botifyai_mobile/features/inbox/domain/repositories/inbox_repository.dart';
import 'package:botifyai_mobile/features/crm/domain/entities/contact_profile.dart';
import 'package:botifyai_mobile/features/crm/presentation/widgets/contact_detail_drawer.dart';
import 'package:botifyai_mobile/features/inbox/presentation/bloc/chat/chat_detail_bloc.dart';
import 'package:botifyai_mobile/features/inbox/presentation/bloc/chat/chat_detail_event.dart';
import 'package:botifyai_mobile/features/inbox/presentation/bloc/chat/chat_detail_state.dart';
import 'package:botifyai_mobile/features/inbox/presentation/widgets/attachment_picker_sheet.dart';
import 'package:botifyai_mobile/features/inbox/presentation/widgets/canned_replies_sheet.dart';
import 'package:botifyai_mobile/features/inbox/presentation/widgets/chat_input_bar.dart';
import 'package:botifyai_mobile/features/inbox/presentation/widgets/message_bubble.dart';
import 'package:botifyai_mobile/features/inbox/presentation/widgets/template_picker_sheet.dart';
import 'package:botifyai_mobile/features/inbox/presentation/widgets/whatsapp_window_countdown.dart';

class ChatDetailScreen extends StatelessWidget {
  final String conversationUuid;
  final Conversation? initialConversation;

  const ChatDetailScreen({
    super.key,
    required this.conversationUuid,
    this.initialConversation,
  });

  @override
  Widget build(BuildContext context) {
    final apiClient = RepositoryProvider.of<ApiClient>(context);
    final remoteSource = InboxRemoteDataSourceImpl(apiClient: apiClient);
    final inboxRepository = InboxRepositoryImpl(remoteDataSource: remoteSource);
    final copilotRemoteSource = CopilotRemoteDataSourceImpl(apiClient: apiClient);
    final copilotRepository = CopilotRepositoryImpl(remoteDataSource: copilotRemoteSource);
    final pusherService = PusherService();

    return MultiBlocProvider(
      providers: [
        BlocProvider<ChatDetailBloc>(
          create: (context) {
            final bloc = ChatDetailBloc(
              repository: inboxRepository,
              pusherService: pusherService,
            );
            bloc.add(LoadChatDetailEvent(conversationUuid));
            return bloc;
          },
        ),
        BlocProvider<CopilotBloc>(
          create: (context) => CopilotBloc(repository: copilotRepository),
        ),
      ],
      child: _ChatDetailView(
        conversationUuid: conversationUuid,
        initialConversation: initialConversation,
        inboxRepository: inboxRepository,
      ),
    );
  }
}

class _ChatDetailView extends StatefulWidget {
  final String conversationUuid;
  final Conversation? initialConversation;
  final InboxRepository inboxRepository;

  const _ChatDetailView({
    required this.conversationUuid,
    this.initialConversation,
    required this.inboxRepository,
  });

  @override
  State<_ChatDetailView> createState() => _ChatDetailViewState();
}

class _ChatDetailViewState extends State<_ChatDetailView> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _inputController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _inputController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      context.read<ChatDetailBloc>().add(LoadMoreMessagesEvent());
    }
  }

  void _showStatusDialog(BuildContext context, Conversation conversation) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).cardColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Change Conversation Status',
                  style: AppTypography.headingSmall(),
                ),
                const SizedBox(height: 12),
                ListTile(
                  leading: const Icon(LucideIcons.checkCircle2, color: AppColors.success),
                  title: const Text('Mark as Resolved'),
                  onTap: () {
                    Navigator.pop(sheetContext);
                    context.read<ChatDetailBloc>().add(const UpdateChatStatusEvent('resolved'));
                  },
                ),
                ListTile(
                  leading: const Icon(LucideIcons.clock, color: Colors.orange),
                  title: const Text('Snooze Conversation'),
                  onTap: () {
                    Navigator.pop(sheetContext);
                    context.read<ChatDetailBloc>().add(const UpdateChatStatusEvent('snoozed'));
                  },
                ),
                ListTile(
                  leading: const Icon(LucideIcons.messageSquare, color: AppColors.primary),
                  title: const Text('Re-open as Active'),
                  onTap: () {
                    Navigator.pop(sheetContext);
                    context.read<ChatDetailBloc>().add(const UpdateChatStatusEvent('open'));
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _triggerAiDraft(BuildContext context) {
    final copilotBloc = context.read<CopilotBloc>();
    copilotBloc.add(GenerateCopilotDraftEvent(conversationUuid: widget.conversationUuid));
    CopilotDrawer.show(
      context: context,
      conversationUuid: widget.conversationUuid,
      copilotBloc: copilotBloc,
      onInsert: (text) {
        setState(() {
          _inputController.text = text;
        });
      },
      onSendDirect: (text) {
        context.read<ChatDetailBloc>().add(SendTextMessageEvent(text: text));
      },
      onSaveNote: (note) {
        context.read<ChatDetailBloc>().add(SendTextMessageEvent(text: note, isNote: true));
      },
    );
  }

  void _triggerSummarize(BuildContext context) {
    final copilotBloc = context.read<CopilotBloc>();
    copilotBloc.add(SummarizeConversationEvent(widget.conversationUuid));
    CopilotDrawer.show(
      context: context,
      conversationUuid: widget.conversationUuid,
      copilotBloc: copilotBloc,
      onInsert: (text) {
        setState(() {
          _inputController.text = text;
        });
      },
      onSendDirect: (text) {
        context.read<ChatDetailBloc>().add(SendTextMessageEvent(text: text));
      },
      onSaveNote: (note) {
        context.read<ChatDetailBloc>().add(SendTextMessageEvent(text: note, isNote: true));
      },
    );
  }

  void _openShortcutsSheet() async {
    try {
      final setup = await widget.inboxRepository.getInboxSetup();
      if (!mounted) return;
      CannedRepliesSheet.show(
        context: context,
        cannedReplies: setup.cannedReplies,
        onSelect: (body) {
          setState(() {
            _inputController.text = body;
          });
        },
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No canned replies available.')),
      );
    }
  }

  void _openTemplatePicker(BuildContext context) {
    TemplatePickerSheet.show(
      context: context,
      inboxRepository: widget.inboxRepository,
      onSelectTemplate: (template, params, interpolatedBody) {
        // Send WhatsApp Meta template
        context.read<ChatDetailBloc>().add(
              SendTextMessageEvent(text: interpolatedBody),
            );
      },
    );
  }

  void _openAttachmentPicker(BuildContext context) {
    AttachmentPickerSheet.show(
      context: context,
      onFileSelected: (file, type) {
        context.read<ChatDetailBloc>().add(
              SendAttachmentMessageEvent(
                attachment: file,
                type: type,
                caption: '',
              ),
            );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => context.pop(),
        ),
        titleSpacing: 0,
        title: BlocBuilder<ChatDetailBloc, ChatDetailState>(
          builder: (context, state) {
            Conversation? conv = widget.initialConversation;
            String subtitle = 'Online';
            bool isTyping = false;

            if (state is ChatDetailLoaded) {
              conv = state.conversation;
              isTyping = state.isOtherTyping;
              if (isTyping) {
                subtitle = '${state.typingUserName ?? "Customer"} is typing...';
              } else if (conv.contact.phone != null) {
                subtitle = conv.contact.phone!;
              }
            }

            final contactName = conv?.contact.name ?? 'Live Chat';
            final avatarUrl = conv?.contact.avatar;

            return InkWell(
              onTap: () {
                if (conv != null) {
                  ContactDetailDrawer.show(
                    context: context,
                    profile: ContactProfile(
                      contact: conv.contact,
                      labels: conv.labels,
                      channel: conv.channel,
                      assignedAgentName: conv.assignedUserName,
                    ),
                  );
                }
              },
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: AppColors.primaryLight.withOpacity(0.2),
                    backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty
                        ? CachedNetworkImageProvider(avatarUrl)
                        : null,
                    child: avatarUrl == null || avatarUrl.isEmpty
                        ? Text(
                            contactName.isNotEmpty ? contactName[0].toUpperCase() : '?',
                            style: AppTypography.bodySmall(
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          contactName,
                          style: AppTypography.bodyRegular(
                            fontWeight: FontWeight.w600,
                            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          subtitle,
                          style: AppTypography.caption(
                            fontSize: 11,
                            color: isTyping
                                ? AppColors.primary
                                : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                            fontWeight: isTyping ? FontWeight.w600 : FontWeight.w400,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        actions: [
          BlocBuilder<ChatDetailBloc, ChatDetailState>(
            builder: (context, state) {
              if (state is! ChatDetailLoaded) return const SizedBox.shrink();
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(LucideIcons.user, size: 20),
                    tooltip: 'Contact 360',
                    onPressed: () {
                      ContactDetailDrawer.show(
                        context: context,
                        profile: ContactProfile(
                          contact: state.conversation.contact,
                          labels: state.conversation.labels,
                          channel: state.conversation.channel,
                          assignedAgentName: state.conversation.assignedUserName,
                        ),
                      );
                    },
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.moreVertical, size: 20),
                    onPressed: () => _showStatusDialog(context, state.conversation),
                  ),
                ],
              );
            },
          ),
        ],
      ),
      body: BlocConsumer<ChatDetailBloc, ChatDetailState>(
        listener: (context, state) {
          if (state is ChatDetailLoaded && state.errorMessage != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.errorMessage!),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is ChatDetailLoading) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }

          if (state is ChatDetailError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.error),
                    const SizedBox(height: 12),
                    Text(
                      'Failed to load conversation',
                      style: AppTypography.headingSmall(),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      state.message,
                      textAlign: TextAlign.center,
                      style: AppTypography.bodySmall(),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () {
                        context.read<ChatDetailBloc>().add(
                              LoadChatDetailEvent(widget.conversationUuid),
                            );
                      },
                      icon: const Icon(LucideIcons.refreshCw, size: 16),
                      label: const Text('Try Again'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          if (state is ChatDetailLoaded) {
            final isWhatsApp = state.conversation.channel.toLowerCase() == 'whatsapp';
            final isLocked = isWhatsApp && !state.conversation.isWhatsappWindowOpen;

            return Column(
              children: [
                // WhatsApp 24-hour dynamic countdown banner
                if (isWhatsApp)
                  WhatsAppWindowCountdown(
                    lastCustomerMessageAt: state.conversation.lastCustomerMessageAt ?? state.conversation.lastMessageAt,
                    isWindowOpen: state.conversation.isWhatsappWindowOpen,
                    onOpenTemplatePicker: () => _openTemplatePicker(context),
                  ),

                // Typing indicator bar
                if (state.isOtherTyping)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    color: AppColors.primaryLight.withOpacity(0.1),
                    child: Row(
                      children: [
                        const SizedBox(
                          width: 12,
                          height: 12,
                          child: CircularProgressIndicator(
                            strokeWidth: 1.5,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${state.typingUserName ?? "Customer"} is typing a response...',
                          style: AppTypography.caption(
                            color: AppColors.primary,
                          ).copyWith(
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ),
                  ),

                // Inverted Messages List View
                Expanded(
                  child: state.messages.isEmpty
                      ? Center(
                          child: Text(
                            'No messages in this conversation yet.',
                            style: AppTypography.bodySmall(
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                            ),
                          ),
                        )
                      : ListView.builder(
                          controller: _scrollController,
                          reverse: true, // Inverted list (index 0 is newest)
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          itemCount: state.messages.length + (state.isLoadingMore ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == state.messages.length) {
                              return const Padding(
                                padding: EdgeInsets.all(12),
                                child: Center(
                                  child: SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  ),
                                ),
                              );
                            }

                            final message = state.messages[index];
                            return MessageBubble(
                              message: message,
                              onRetry: () {
                                context.read<ChatDetailBloc>().add(RetryMessageEvent(message));
                              },
                            );
                          },
                        ),
                ),

                // AI Copilot Keyboard Accessory Bar
                BlocBuilder<CopilotBloc, CopilotState>(
                  builder: (context, copilotState) {
                    return CopilotKeyboardBar(
                      isGenerating: copilotState is CopilotGenerating,
                      onAiDraft: () => _triggerAiDraft(context),
                      onSummarize: () => _triggerSummarize(context),
                      onShortcuts: () => _openShortcutsSheet(),
                      onTemplates: () => _openTemplatePicker(context),
                    );
                  },
                ),

                // Main Composer Bar
                ChatInputBar(
                  controller: _inputController,
                  isNoteMode: state.isNoteMode,
                  isSending: state.isSending,
                  isWindowLocked: isLocked,
                  onSend: (text, isNote) {
                    context.read<ChatDetailBloc>().add(
                          SendTextMessageEvent(text: text, isNote: isNote),
                        );
                  },
                  onSendVoiceNote: (audioFile, duration, isNote) {
                    context.read<ChatDetailBloc>().add(
                          SendAttachmentMessageEvent(
                            attachment: audioFile,
                            type: 'audio',
                            caption: '',
                            isNote: isNote,
                          ),
                        );
                  },
                  onToggleNoteMode: () {
                    context.read<ChatDetailBloc>().add(ToggleNoteModeEvent());
                  },
                  onAttachmentTap: () => _openAttachmentPicker(context),
                  onTypingChanged: (isTyping) {
                    context.read<ChatDetailBloc>().add(SendUserTypingEvent(isTyping));
                  },
                ),
              ],
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }
}
