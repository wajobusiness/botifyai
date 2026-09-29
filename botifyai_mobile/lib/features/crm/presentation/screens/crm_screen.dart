import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/api/api_client.dart';
import '../../inbox/presentation/widgets/inbox_skeleton.dart';
import '../data/datasources/crm_remote_data_source.dart';
import '../data/repositories/crm_repository_impl.dart';
import '../domain/entities/contact_profile.dart';
import '../presentation/bloc/crm_bloc.dart';
import '../presentation/bloc/crm_event.dart';
import '../presentation/bloc/crm_state.dart';
import '../presentation/widgets/contact_detail_drawer.dart';
import '../presentation/widgets/contact_tile.dart';

class CrmScreen extends StatelessWidget {
  const CrmScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final apiClient = RepositoryProvider.of<ApiClient>(context);
    final remoteSource = CrmRemoteDataSourceImpl(apiClient: apiClient);
    final repository = CrmRepositoryImpl(remoteDataSource: remoteSource);

    return BlocProvider<CrmBloc>(
      create: (context) {
        final bloc = CrmBloc(repository: repository);
        bloc.add(const LoadContactsEvent());
        return bloc;
      },
      child: const _CrmView(),
    );
  }
}

class _CrmView extends StatefulWidget {
  const _CrmView();

  @override
  State<_CrmView> createState() => _CrmViewState();
}

class _CrmViewState extends State<_CrmView> {
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
      context.read<CrmBloc>().add(const LoadContactsEvent(isLoadMore: true));
    }
  }

  void _openContactDrawer(BuildContext context, int contactId) {
    context.read<CrmBloc>().add(LoadContactProfileEvent(contactId));
    final currentState = context.read<CrmBloc>().state;
    if (currentState is CrmLoaded) {
      final contact = currentState.contacts.firstWhere((c) => c.id == contactId);
      final fallbackProfile = ContactProfile(contact: contact);

      ContactDetailDrawer.show(
        context: context,
        profile: currentState.activeProfile ?? fallbackProfile,
        onOpenChat: () {
          // Navigate to conversations
          context.push('/inbox');
        },
      );
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
                style: AppTypography.bodyRegular.copyWith(
                  color: isDark ? Colors.white : Colors.black87,
                ),
                decoration: InputDecoration(
                  hintText: 'Search contacts by name, email, phone...',
                  hintStyle: AppTypography.bodySmall.copyWith(
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                  border: InputBorder.none,
                ),
                onChanged: (val) {
                  context.read<CrmBloc>().add(SearchContactsEvent(val));
                },
              )
            : Text('CRM & Contacts', style: AppTypography.headingMedium),
        actions: [
          IconButton(
            icon: Icon(_isSearching ? LucideIcons.x : LucideIcons.search, size: 20),
            onPressed: () {
              setState(() {
                if (_isSearching) {
                  _searchController.clear();
                  context.read<CrmBloc>().add(const SearchContactsEvent(''));
                  _isSearching = false;
                } else {
                  _isSearching = true;
                }
              });
            },
          ),
        ],
      ),
      body: BlocBuilder<CrmBloc, CrmState>(
        builder: (context, state) {
          if (state is CrmLoading) {
            return const InboxSkeleton();
          }

          if (state is CrmError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.error),
                    const SizedBox(height: 12),
                    Text('Failed to load contacts', style: AppTypography.headingSmall),
                    const SizedBox(height: 6),
                    Text(
                      state.message,
                      textAlign: TextAlign.center,
                      style: AppTypography.bodySmall,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () {
                        context.read<CrmBloc>().add(const LoadContactsEvent());
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

          if (state is CrmLoaded) {
            if (state.contacts.isEmpty) {
              return RefreshIndicator(
                color: AppColors.primary,
                onRefresh: () async {
                  context.read<CrmBloc>().add(const LoadContactsEvent(isRefresh: true));
                },
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: [
                    SizedBox(height: MediaQuery.of(context).size.height * 0.25),
                    Center(
                      child: Column(
                        children: [
                          Icon(
                            LucideIcons.users,
                            size: 64,
                            color: isDark ? Colors.grey[700] : Colors.grey[300],
                          ),
                          const SizedBox(height: 16),
                          Text('No contacts found', style: AppTypography.headingSmall),
                          const SizedBox(height: 6),
                          Text(
                            state.searchQuery.isNotEmpty
                                ? 'No contacts match "${state.searchQuery}"'
                                : 'You currently have no contacts in your CRM.',
                            style: AppTypography.bodySmall,
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
                context.read<CrmBloc>().add(const LoadContactsEvent(isRefresh: true));
              },
              child: ListView.separated(
                controller: _scrollController,
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: state.contacts.length + (state.isLoadingMore ? 1 : 0),
                separatorBuilder: (_, __) => Divider(
                  height: 1,
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  indent: 68,
                ),
                itemBuilder: (context, index) {
                  if (index == state.contacts.length) {
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

                  final contact = state.contacts[index];
                  return ContactTile(
                    contact: contact,
                    onTap: () => _openContactDrawer(context, contact.id),
                    onMessageTap: () {
                      context.push('/inbox');
                    },
                  );
                },
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }
}
