import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/entities/order.dart';
import '../domain/repositories/commerce_repository.dart';
import 'orders_event.dart';
import 'orders_state.dart';

class OrdersBloc extends Bloc<OrdersEvent, OrdersState> {
  final CommerceRepository repository;

  OrdersBloc({required this.repository}) : super(OrdersInitial()) {
    on<LoadOrdersEvent>(_onLoadOrders);
    on<FilterOrdersByStatusEvent>(_onFilterByStatus);
    on<SearchOrdersEvent>(_onSearchOrders);
    on<UpdateOrderStatusEvent>(_onUpdateOrderStatus);
  }

  Future<void> _onLoadOrders(
    LoadOrdersEvent event,
    Emitter<OrdersState> emit,
  ) async {
    final currentState = state;
    String? status;
    String search = '';
    List<Order> currentList = [];
    int pageToFetch = 1;

    if (currentState is OrdersLoaded) {
      status = currentState.selectedStatus;
      search = currentState.searchQuery;

      if (event.isLoadMore) {
        if (currentState.isLoadingMore || !currentState.hasMore) return;
        emit(currentState.copyWith(isLoadingMore: true));
        pageToFetch = currentState.currentPage + 1;
        currentList = currentState.orders;
      } else if (event.isRefresh) {
        emit(currentState.copyWith(isRefreshing: true));
        pageToFetch = 1;
      } else {
        emit(OrdersLoading());
      }
    } else {
      emit(OrdersLoading());
    }

    try {
      final paginated = await repository.getOrders(
        status: status,
        search: search.isNotEmpty ? search : null,
        page: pageToFetch,
      );

      final updatedList = event.isLoadMore
          ? [...currentList, ...paginated.data]
          : paginated.data;

      emit(OrdersLoaded(
        orders: updatedList,
        selectedStatus: status,
        searchQuery: search,
        isRefreshing: false,
        isLoadingMore: false,
        hasMore: paginated.hasMore,
        currentPage: paginated.currentPage,
        totalCount: paginated.total,
      ));
    } catch (e) {
      if (currentState is OrdersLoaded && (event.isRefresh || event.isLoadMore)) {
        emit(currentState.copyWith(
          isRefreshing: false,
          isLoadingMore: false,
        ));
      } else {
        emit(OrdersError(e.toString().replaceAll('Exception: ', '')));
      }
    }
  }

  Future<void> _onFilterByStatus(
    FilterOrdersByStatusEvent event,
    Emitter<OrdersState> emit,
  ) async {
    final currentState = state;
    if (currentState is OrdersLoaded) {
      emit(currentState.copyWith(selectedStatus: event.status));
      add(const LoadOrdersEvent());
    } else {
      add(const LoadOrdersEvent());
    }
  }

  Future<void> _onSearchOrders(
    SearchOrdersEvent event,
    Emitter<OrdersState> emit,
  ) async {
    final currentState = state;
    if (currentState is OrdersLoaded) {
      emit(currentState.copyWith(searchQuery: event.query));
      add(const LoadOrdersEvent());
    }
  }

  Future<void> _onUpdateOrderStatus(
    UpdateOrderStatusEvent event,
    Emitter<OrdersState> emit,
  ) async {
    final currentState = state;
    if (currentState is! OrdersLoaded) return;

    emit(currentState.copyWith(isUpdatingStatus: true));

    try {
      final updatedOrder = await repository.updateOrderStatus(
        id: event.orderId,
        fulfillmentStatus: event.status,
        trackingNumber: event.trackingNumber,
      );

      final orderIndex = currentState.orders.indexWhere((o) => o.id == event.orderId);
      if (orderIndex != -1) {
        final list = List<Order>.from(currentState.orders);
        list[orderIndex] = updatedOrder;
        emit(currentState.copyWith(
          orders: list,
          isUpdatingStatus: false,
        ));
      } else {
        emit(currentState.copyWith(isUpdatingStatus: false));
      }
    } catch (_) {
      emit(currentState.copyWith(isUpdatingStatus: false));
    }
  }
}
