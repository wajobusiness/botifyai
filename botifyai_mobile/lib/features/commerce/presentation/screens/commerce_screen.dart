import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:botifyai_mobile/app/theme/app_colors.dart';
import 'package:botifyai_mobile/app/theme/app_typography.dart';
import 'package:botifyai_mobile/core/api/api_client.dart';
import 'package:botifyai_mobile/features/inbox/presentation/widgets/inbox_skeleton.dart';
import 'package:botifyai_mobile/features/commerce/data/datasources/commerce_remote_data_source.dart';
import 'package:botifyai_mobile/features/commerce/data/repositories/commerce_repository_impl.dart';
import 'package:botifyai_mobile/features/commerce/domain/entities/order.dart';
import 'package:botifyai_mobile/features/commerce/presentation/bloc/orders_bloc.dart';
import 'package:botifyai_mobile/features/commerce/presentation/bloc/orders_event.dart';
import 'package:botifyai_mobile/features/commerce/presentation/bloc/orders_state.dart';
import 'package:botifyai_mobile/features/commerce/presentation/widgets/order_card.dart';
import 'package:botifyai_mobile/features/commerce/presentation/widgets/order_detail_modal.dart';

class CommerceScreen extends StatelessWidget {
  const CommerceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final apiClient = RepositoryProvider.of<ApiClient>(context);
    final remoteSource = CommerceRemoteDataSourceImpl(apiClient: apiClient);
    final repository = CommerceRepositoryImpl(remoteDataSource: remoteSource);

    return BlocProvider<OrdersBloc>(
      create: (context) {
        final bloc = OrdersBloc(repository: repository);
        bloc.add(const LoadOrdersEvent());
        return bloc;
      },
      child: const _CommerceView(),
    );
  }
}

class _CommerceView extends StatefulWidget {
  const _CommerceView();

  @override
  State<_CommerceView> createState() => _CommerceViewState();
}

class _CommerceViewState extends State<_CommerceView> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;

  static const List<Map<String, String>> statusFilters = [
    {'id': 'all', 'label': 'All Orders'},
    {'id': 'paid', 'label': 'Paid'},
    {'id': 'processing', 'label': 'Processing'},
    {'id': 'shipped', 'label': 'Shipped'},
    {'id': 'delivered', 'label': 'Delivered'},
    {'id': 'pending', 'label': 'Pending'},
  ];

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
      context.read<OrdersBloc>().add(const LoadOrdersEvent(isLoadMore: true));
    }
  }

  void _showOrderDetail(BuildContext context, Order order) {
    OrderDetailModal.show(
      context: context,
      order: order,
      onUpdateStatus: (newStatus, trackingNumber) {
        context.read<OrdersBloc>().add(
              UpdateOrderStatusEvent(
                orderId: order.id,
                status: newStatus,
                trackingNumber: trackingNumber,
              ),
            );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Order #${order.orderNumber} updated to $newStatus!'),
            backgroundColor: AppColors.success,
          ),
        );
      },
      onSendWhatsAppTracking: (o) {
        context.push('/inbox');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Opening chat to send tracking update for #${o.orderNumber}...'),
            backgroundColor: AppColors.primary,
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
        title: _isSearching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                style: AppTypography.bodyRegular(
                  color: isDark ? Colors.white : Colors.black87,
                ),
                decoration: InputDecoration(
                  hintText: 'Search order number, customer...',
                  hintStyle: AppTypography.bodySmall(
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                  border: InputBorder.none,
                ),
                onChanged: (val) {
                  context.read<OrdersBloc>().add(SearchOrdersEvent(val));
                },
              )
            : Text('E-Commerce & Orders', style: AppTypography.headingMedium()),
        actions: [
          IconButton(
            icon: Icon(_isSearching ? LucideIcons.x : LucideIcons.search, size: 20),
            onPressed: () {
              setState(() {
                if (_isSearching) {
                  _searchController.clear();
                  context.read<OrdersBloc>().add(const SearchOrdersEvent(''));
                  _isSearching = false;
                } else {
                  _isSearching = true;
                }
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Status Chips Bar
          BlocBuilder<OrdersBloc, OrdersState>(
            builder: (context, state) {
              final selectedStatus = state is OrdersLoaded ? (state.selectedStatus ?? 'all') : 'all';

              return SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                physics: const BouncingScrollPhysics(),
                child: Row(
                  children: statusFilters.map((filter) {
                    final isSel = selectedStatus == filter['id'];
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        selected: isSel,
                        label: Text(filter['label']!),
                        backgroundColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                        selectedColor: AppColors.primary,
                        checkmarkColor: Colors.white,
                        showCheckmark: false,
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                          side: BorderSide(
                            color: isSel
                                ? AppColors.primary
                                : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                            width: 1,
                          ),
                        ),
                        labelStyle: AppTypography.caption(
                          fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                          color: isSel
                              ? Colors.white
                              : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                        ),
                        onSelected: (_) {
                          context.read<OrdersBloc>().add(
                                FilterOrdersByStatusEvent(
                                  filter['id'] == 'all' ? null : filter['id'],
                                ),
                              );
                        },
                      ),
                    );
                  }).toList(),
                ),
              );
            },
          ),

          // Main Orders List
          Expanded(
            child: BlocBuilder<OrdersBloc, OrdersState>(
              builder: (context, state) {
                if (state is OrdersLoading) {
                  return const InboxSkeleton();
                }

                if (state is OrdersError) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.error),
                          const SizedBox(height: 12),
                          Text('Failed to load orders', style: AppTypography.headingSmall()),
                          const SizedBox(height: 6),
                          Text(
                            state.message,
                            textAlign: TextAlign.center,
                            style: AppTypography.bodySmall(),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: () {
                              context.read<OrdersBloc>().add(const LoadOrdersEvent());
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

                if (state is OrdersLoaded) {
                  if (state.orders.isEmpty) {
                    return RefreshIndicator(
                      color: AppColors.primary,
                      onRefresh: () async {
                        context.read<OrdersBloc>().add(const LoadOrdersEvent(isRefresh: true));
                      },
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          SizedBox(height: MediaQuery.of(context).size.height * 0.25),
                          Center(
                            child: Column(
                              children: [
                                Icon(
                                  LucideIcons.shoppingBag,
                                  size: 64,
                                  color: isDark ? Colors.grey[700] : Colors.grey[300],
                                ),
                                const SizedBox(height: 16),
                                Text('No orders found', style: AppTypography.headingSmall()),
                                const SizedBox(height: 6),
                                Text(
                                  state.searchQuery.isNotEmpty
                                      ? 'No orders match "${state.searchQuery}"'
                                      : 'You currently have no ${state.selectedStatus ?? ''} orders.',
                                  style: AppTypography.bodySmall(),
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
                      context.read<OrdersBloc>().add(const LoadOrdersEvent(isRefresh: true));
                    },
                    child: ListView.builder(
                      controller: _scrollController,
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: state.orders.length + (state.isLoadingMore ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index == state.orders.length) {
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

                        final order = state.orders[index];
                        return OrderCard(
                          order: order,
                          onTap: () => _showOrderDetail(context, order),
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
}
