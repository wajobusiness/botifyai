import 'package:botifyai_mobile/features/inbox/domain/repositories/inbox_repository.dart';
import '../entities/order.dart';

abstract class CommerceRepository {
  Future<PaginatedList<Order>> getOrders({
    String? status,
    String? search,
    int page = 1,
  });

  Future<Order> getOrderDetail(int id);

  Future<Order> updateOrderStatus({
    required int id,
    required String fulfillmentStatus,
    String? trackingNumber,
  });
}
