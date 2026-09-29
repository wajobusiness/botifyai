import 'package:dio/dio.dart';
import 'package:botifyai_mobile/core/api/api_client.dart';
import 'package:botifyai_mobile/core/api/api_endpoints.dart';
import 'package:botifyai_mobile/core/errors/failures.dart';
import 'package:botifyai_mobile/features/inbox/domain/repositories/inbox_repository.dart';
import '../models/order_model.dart';

abstract class CommerceRemoteDataSource {
  Future<PaginatedList<OrderModel>> getOrders({
    String? status,
    String? search,
    int page = 1,
  });

  Future<OrderModel> getOrderDetail(int id);

  Future<OrderModel> updateOrderStatus({
    required int id,
    required String fulfillmentStatus,
    String? trackingNumber,
  });
}

class CommerceRemoteDataSourceImpl implements CommerceRemoteDataSource {
  final ApiClient apiClient;

  CommerceRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<PaginatedList<OrderModel>> getOrders({
    String? status,
    String? search,
    int page = 1,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
      };
      if (status != null && status.isNotEmpty && status != 'all') {
        queryParams['status'] = status;
      }
      if (search != null && search.trim().isNotEmpty) {
        queryParams['search'] = search.trim();
      }

      final response = await apiClient.get(
        ApiEndpoints.orders,
        queryParameters: queryParams,
      );

      final dynamic resData = response.data;
      List<dynamic> rawList = [];
      int currentPage = page;
      int lastPage = page;
      int total = 0;

      if (resData is Map<String, dynamic>) {
        if (resData['data'] is List) {
          rawList = resData['data'] as List<dynamic>;
        } else if (resData['orders'] is List) {
          rawList = resData['orders'] as List<dynamic>;
        }

        if (resData['meta'] is Map<String, dynamic>) {
          final meta = resData['meta'] as Map<String, dynamic>;
          currentPage = meta['current_page'] is int ? meta['current_page'] as int : page;
          lastPage = meta['last_page'] is int ? meta['last_page'] as int : page;
          total = meta['total'] is int ? meta['total'] as int : rawList.length;
        } else if (resData['current_page'] != null) {
          currentPage = resData['current_page'] is int ? resData['current_page'] as int : page;
          lastPage = resData['last_page'] is int ? resData['last_page'] as int : page;
          total = resData['total'] is int ? resData['total'] as int : rawList.length;
        }
      } else if (resData is List) {
        rawList = resData;
        total = rawList.length;
      }

      final orders = rawList
          .map((e) => OrderModel.fromJson(e as Map<String, dynamic>))
          .toList();

      return PaginatedList<OrderModel>(
        data: orders,
        currentPage: currentPage,
        lastPage: lastPage,
        total: total,
      );
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to load merchant orders',
      );
    }
  }

  @override
  Future<OrderModel> getOrderDetail(int id) async {
    try {
      final response = await apiClient.get(ApiEndpoints.orderDetail(id));
      final dynamic resData = response.data;
      final mapData = resData is Map<String, dynamic>
          ? (resData['order'] ?? resData['data'] ?? resData)
          : resData;
      return OrderModel.fromJson(mapData as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to load order details',
      );
    }
  }

  @override
  Future<OrderModel> updateOrderStatus({
    required int id,
    required String fulfillmentStatus,
    String? trackingNumber,
  }) async {
    try {
      final response = await apiClient.patch(
        ApiEndpoints.updateOrderStatus(id),
        data: {
          'fulfillment_status': fulfillmentStatus,
          if (trackingNumber != null) 'tracking_number': trackingNumber,
        },
      );
      final dynamic resData = response.data;
      final mapData = resData is Map<String, dynamic>
          ? (resData['order'] ?? resData['data'] ?? resData)
          : resData;
      return OrderModel.fromJson(mapData as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to update order status',
      );
    }
  }
}
