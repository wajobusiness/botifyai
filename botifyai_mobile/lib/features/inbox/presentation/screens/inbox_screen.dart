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
import '../bloc/inbox/inbox_bloc.dart';
import '../bloc/inbox/inbox_event.dart';
import '../bloc/inbox/inbox_state.dart';
import '../widgets/conversation_tile.dart';
import '../widgets/inbox_filter_chips.dart';
import '../widgets/inbox_skeleton.dart';

class InboxScreen extends StatelessWidget {
  const InboxScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<InboxBloc>(
      create: (context) {
        final apiClient = RepositoryProvider.of<ApiClient>(context);
        final remoteSource = InboxRemoteDataSourceImpl(apiClient: apiClient);
        final repository = InboxRepositoryImpl(remoteDataSource: remoteSource);
        final pusherService = PusherService();

        final bloc = InboxBloc(
          repository: repository,
          pusherService: pusherService,
        );
        bloc.add(FetchInboxSetupEvent());
        return bloc;
      },
      child: const _InboxView(),
    );
  }
}

class _InboxView extends StatefulWidget {
  const _InboxView();

  @override
  State<_InboxView> createState() => _InboxViewState();
}

class _InboxViewState extends State<_InboxView> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      context.read<InboxBloc>().add(const LoadConversationsEvent(isLoadMore: true));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                style: AppTypography.bodyRegular(
                  color: isDark ? Colors.white : Colors.black87,
                ),
                decoration: InputDecoration(
                  hintText: 'Search contacts, phone...',
                  hintStyle: AppTypography.bodySmall(
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                  border: InputBorder.none,
                ),
                onChanged: (val) {
                  context.read<InboxBloc>().add(SearchQueryChangedEvent(val));
                },
              )
            : Text('Inbox', style: AppTypography.headingMedium()),
        actions: [
          IconButton(
            icon: Icon(_isSearching ? LucideIcons.x : LucideIcons.search, size: 20),
            onPressed: () {
              setState(() {
                if (_isSearching) {
                  _searchController.clear();
                  context.read<InboxBloc>().add(ClearSearchEvent());
                  _isSearching = false;
                } else {
                  _isSearching = true;
                }
              });
            },
          ),
          IconButton(
            icon: const Icon(LucideIcons.filter, size: 20),
            onPressed: () {
              // Channel filter sheet
              _showChannelFilterBottomSheet(context);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Folder Filter Chips Bar
          BlocBuilder<InboxBloc, InboxState>(
            builder: (context, state) {
              final folder = state is InboxLoaded ? state.currentFolder : 'mine';
              final channel = state is InboxLoaded ? state.currentChannel : null;

              return InboxFilterChips(
                selectedFolder: folder,
                selectedChannel: channel,
                onFolderSelected: (newFolder) {
                  context.read<InboxBloc>().add(ChangeFolderEvent(newFolder));
                },
                onChannelSelected: (newChannel) {
                  context.read<InboxBloc>().add(ChangeChannelFilterEvent(newChannel));
                },
              );
            },
          ),

          // Main Conversation List
          Expanded(
            child: BlocBuilder<InboxBloc, InboxState>(
              builder: (context, state) {
                if (state is InboxLoading) {
                  return const InboxSkeleton();
                }

                if (state is InboxError) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.error),
                          const SizedBox(height: 12),
                          Text('Failed to load inbox', style: AppTypography.headingSmall()),
                          const SizedBox(height: 6),
                          Text(
                            state.message,
                            textAlign: TextAlign.center,
                            style: AppTypography.bodySmall(),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: () {
                              context.read<InboxBloc>().add(const LoadConversationsEvent());
                            },
                            icon: const Icon(LucideIcons.refreshCw, size: 16),
                            label: const Text('Retry'),
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

                if (state is InboxLoaded) {
                  if (state.conversations.isEmpty) {
                    return RefreshIndicator(
                      color: AppColors.primary,
                      onRefresh: () async {
                        context.read<InboxBloc>().add(const LoadConversationsEvent(isRefresh: true));
                      },
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                          Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  LucideIcons.inbox,
                                  size: 64,
                                  color: isDark ? Colors.grey[700] : Colors.grey[300],
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'No conversations found',
                                  style: AppTypography.headingSmall(
                                    color: isDark
                                        ? AppColors.darkTextPrimary
                                        : AppColors.lightTextPrimary,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  state.searchQuery.isNotEmpty
                                      ? 'No matching results for "${state.searchQuery}"'
                                      : 'You have no ${state.currentFolder} conversations.',
                                  style: AppTypography.bodySmall(
                                    color: isDark
                                        ? AppColors.darkTextSecondary
                                        : AppColors.lightTextSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  return RefreshIndicator(
                    color: AppColors.primary,
                    onRefresh: () async {
                      context.read<InboxBloc>().add(const LoadConversationsEvent(isRefresh: true));
                    },
                    child: ListView.separated(
                      controller: _scrollController,
                      physics: const AlwaysScrollableScrollPhysics(),
                      itemCount: state.conversations.length + (state.isLoadingMore ? 1 : 0),
                      separatorBuilder: (_, __) => Divider(
                        height: 1,
                        color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                        indent: 72,
                      ),
                      itemBuilder: (context, index) {
                        if (index == state.conversations.length) {
                          return const Padding(
                            padding: EdgeInsets.all(16),
                            child: Center(
                              child: SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                            ),
                          );
                        }

                        final conv = state.conversations[index];
                        return ConversationTile(
                          conversation: conv,
                          onTap: () {
                            context.push(
                              '/inbox/chat/${conv.uuid}',
                              extra: conv,
                            );
                          },
                        );
                      },
                    ),
                  );
                }

                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showChannelFilterBottomSheet(BuildContext context) {
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
                Text('Filter by Channel', style: AppTypography.headingSmall()),
                const SizedBox(height: 8),
                ListTile(
                  leading: const Icon(LucideIcons.layers, color: AppColors.primary),
                  title: const Text('All Channels'),
                  onTap: () {
                    Navigator.pop(sheetContext);
                    context.read<InboxBloc>().add(const ChangeChannelFilterEvent(null));
                  },
                ),
                ListTile(
                  leading: const Icon(LucideIcons.messageCircle, color: Color(0xFF25D366)),
                  title: const Text('WhatsApp'),
                  onTap: () {
                    Navigator.pop(sheetContext);
                    context.read<InboxBloc>().add(const ChangeChannelFilterEvent('whatsapp'));
                  },
                ),
                ListTile(
                  leading: const Icon(LucideIcons.instagram, color: Color(0xFFE1306C)),
                  title: const Text('Instagram Direct'),
                  onTap: () {
                    Navigator.pop(sheetContext);
                    context.read<InboxBloc>().add(const ChangeChannelFilterEvent('instagram'));
                  },
                ),
                ListTile(
                  leading: const Icon(LucideIcons.messageSquare, color: Color(0xFF0084FF)),
                  title: const Text('Facebook Messenger'),
                  onTap: () {
                    Navigator.pop(sheetContext);
                    context.read<InboxBloc>().add(const ChangeChannelFilterEvent('messenger'));
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
