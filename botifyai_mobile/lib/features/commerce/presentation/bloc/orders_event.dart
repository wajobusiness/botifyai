import 'package:equatable/equatable.dart';

abstract class OrdersEvent extends Equatable {
  const OrdersEvent();

  @override
  List<Object?> get props => [];
}

class LoadOrdersEvent extends OrdersEvent {
  final bool isRefresh;
  final bool isLoadMore;

  const LoadOrdersEvent({
    this.isRefresh = false,
    this.isLoadMore = false,
  });

  @override
  List<Object?> get props => [isRefresh, isLoadMore];
}

class FilterOrdersByStatusEvent extends OrdersEvent {
  final String? status; // 'all', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'

  const FilterOrdersByStatusEvent(this.status);

  @override
  List<Object?> get props => [status];
}

class SearchOrdersEvent extends OrdersEvent {
  final String query;

  const SearchOrdersEvent(this.query);

  @override
  List<Object?> get props => [query];
}

class UpdateOrderStatusEvent extends OrdersEvent {
  final int orderId;
  final String status;
  final String? trackingNumber;

  const UpdateOrderStatusEvent({
    required this.orderId,
    required this.status,
    this.trackingNumber,
  });

  @override
  List<Object?> get props => [orderId, status, trackingNumber];
}
