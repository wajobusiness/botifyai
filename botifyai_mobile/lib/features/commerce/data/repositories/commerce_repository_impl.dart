import 'package:botifyai_mobile/features/inbox/domain/repositories/inbox_repository.dart';
import '../../domain/entities/order.dart';
import '../../domain/repositories/commerce_repository.dart';
import '../datasources/commerce_remote_data_source.dart';

class CommerceRepositoryImpl implements CommerceRepository {
  final CommerceRemoteDataSource remoteDataSource;

  CommerceRepositoryImpl({required this.remoteDataSource});

  @override
  Future<PaginatedList<Order>> getOrders({
    String? status,
    String? search,
    int page = 1,
  }) async {
    return await remoteDataSource.getOrders(
      status: status,
      search: search,
      page: page,
    );
  }

  @override
  Future<Order> getOrderDetail(int id) async {
    return await remoteDataSource.getOrderDetail(id);
  }

  @override
  Future<Order> updateOrderStatus({
    required int id,
    required String fulfillmentStatus,
    String? trackingNumber,
  }) async {
    return await remoteDataSource.updateOrderStatus(
      id: id,
      fulfillmentStatus: fulfillmentStatus,
      trackingNumber: trackingNumber,
    );
  }
}
