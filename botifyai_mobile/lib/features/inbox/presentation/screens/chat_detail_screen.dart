import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/realtime/pusher_service.dart';
import '../../data/datasources/inbox_remote_data_source.dart';
import '../../data/repositories/inbox_repository_impl.dart';
import '../../domain/entities/conversation.dart';
import '../bloc/chat/chat_detail_bloc.dart';
import '../bloc/chat/chat_detail_event.dart';
import '../bloc/chat/chat_detail_state.dart';
import '../widgets/chat_input_bar.dart';
import '../widgets/message_bubble.dart';
import '../widgets/whatsapp_window_banner.dart';

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
    return BlocProvider<ChatDetailBloc>(
      create: (context) {
        final apiClient = RepositoryProvider.of<ApiClient>(context);
        final remoteSource = InboxRemoteDataSourceImpl(apiClient: apiClient);
        final repository = InboxRepositoryImpl(remoteDataSource: remoteSource);
        final pusherService = PusherService();

        final bloc = ChatDetailBloc(
          repository: repository,
          pusherService: pusherService,
        );
        bloc.add(LoadChatDetailEvent(conversationUuid));
        return bloc;
      },
      child: _ChatDetailView(
        conversationUuid: conversationUuid,
        initialConversation: initialConversation,
      ),
    );
  }
}

class _ChatDetailView extends StatefulWidget {
  final String conversationUuid;
  final Conversation? initialConversation;

  const _ChatDetailView({
    required this.conversationUuid,
    this.initialConversation,
  });

  @override
  State<_ChatDetailView> createState() => _ChatDetailViewState();
}

class _ChatDetailViewState extends State<_ChatDetailView> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
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
                  style: AppTypography.headingSmall,
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

  void _showTemplatePickerPlaceholder(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('WhatsApp Template Picker will be fully integrated in Sprint 3.'),
        backgroundColor: AppColors.primary,
        duration: const Duration(seconds: 2),
      ),
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

            return Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: AppColors.primaryLight.withValues(alpha: 0.2),
                  backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty
                      ? CachedNetworkImageProvider(avatarUrl)
                      : null,
                  child: avatarUrl == null || avatarUrl.isEmpty
                      ? Text(
                          contactName.isNotEmpty ? contactName[0].toUpperCase() : '?',
                          style: AppTypography.bodySmall.copyWith(
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
                        style: AppTypography.bodyRegular.copyWith(
                          fontWeight: FontWeight.w600,
                          color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        subtitle,
                        style: AppTypography.caption.copyWith(
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
            );
          },
        ),
        actions: [
          BlocBuilder<ChatDetailBloc, ChatDetailState>(
            builder: (context, state) {
              if (state is! ChatDetailLoaded) return const SizedBox.shrink();
              return IconButton(
                icon: const Icon(LucideIcons.moreVertical, size: 20),
                onPressed: () => _showStatusDialog(context, state.conversation),
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
                      style: AppTypography.headingSmall,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      state.message,
                      textAlign: TextAlign.center,
                      style: AppTypography.bodySmall,
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
            final isLocked = state.conversation.channel.toLowerCase() == 'whatsapp' &&
                !state.conversation.isWhatsappWindowOpen;

            return Column(
              children: [
                // WhatsApp 24-hour expiration banner
                WhatsAppWindowBanner(
                  isWindowOpen: state.conversation.isWhatsappWindowOpen,
                  onSelectTemplate: () => _showTemplatePickerPlaceholder(context),
                ),

                // Typing indicator banner
                if (state.isOtherTyping)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    color: AppColors.primaryLight.withValues(alpha: 0.1),
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
                          style: AppTypography.caption.copyWith(
                            color: AppColors.primary,
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
                            style: AppTypography.bodySmall.copyWith(
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

                // Composer Bar
                ChatInputBar(
                  isNoteMode: state.isNoteMode,
                  isSending: state.isSending,
                  isWindowLocked: isLocked,
                  onSend: (text, isNote) {
                    context.read<ChatDetailBloc>().add(
                          SendTextMessageEvent(text: text, isNote: isNote),
                        );
                  },
                  onToggleNoteMode: () {
                    context.read<ChatDetailBloc>().add(ToggleNoteModeEvent());
                  },
                  onAttachmentTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Media picker will be active in Sprint 3.'),
                        duration: Duration(seconds: 1),
                      ),
                    );
                  },
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
