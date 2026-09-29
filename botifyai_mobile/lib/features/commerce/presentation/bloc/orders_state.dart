import 'package:equatable/equatable.dart';
import 'package:botifyai_mobile/features/commerce/domain/entities/order.dart';

abstract class OrdersState extends Equatable {
  const OrdersState();

  @override
  List<Object?> get props => [];
}

class OrdersInitial extends OrdersState {}

class OrdersLoading extends OrdersState {}

class OrdersLoaded extends OrdersState {
  final List<Order> orders;
  final String? selectedStatus;
  final String searchQuery;
  final bool isRefreshing;
  final bool isLoadingMore;
  final bool hasMore;
  final int currentPage;
  final int totalCount;
  final bool isUpdatingStatus;

  const OrdersLoaded({
    required this.orders,
    this.selectedStatus,
    this.searchQuery = '',
    this.isRefreshing = false,
    this.isLoadingMore = false,
    this.hasMore = false,
    this.currentPage = 1,
    this.totalCount = 0,
    this.isUpdatingStatus = false,
  });

  OrdersLoaded copyWith({
    List<Order>? orders,
    String? selectedStatus,
    String? searchQuery,
    bool? isRefreshing,
    bool? isLoadingMore,
    bool? hasMore,
    int? currentPage,
    int? totalCount,
    bool? isUpdatingStatus,
  }) {
    return OrdersLoaded(
      orders: orders ?? this.orders,
      selectedStatus: selectedStatus ?? this.selectedStatus,
      searchQuery: searchQuery ?? this.searchQuery,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      totalCount: totalCount ?? this.totalCount,
      isUpdatingStatus: isUpdatingStatus ?? this.isUpdatingStatus,
    );
  }

  @override
  List<Object?> get props => [
        orders,
        selectedStatus,
        searchQuery,
        isRefreshing,
        isLoadingMore,
        hasMore,
        currentPage,
        totalCount,
        isUpdatingStatus,
      ];
}

class OrdersError extends OrdersState {
  final String message;

  const OrdersError(this.message);

  @override
  List<Object?> get props => [message];
}
