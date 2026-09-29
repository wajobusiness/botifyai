import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/features/commerce/presentation/bloc/orders_bloc.dart';
import 'package:botifyai_mobile/features/commerce/presentation/bloc/orders_event.dart';
import 'package:botifyai_mobile/features/commerce/presentation/bloc/orders_state.dart';
import 'package:botifyai_mobile/features/commerce/domain/entities/order.dart';
import 'package:botifyai_mobile/features/commerce/domain/repositories/commerce_repository.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/conversation.dart';

class MockCommerceRepository implements CommerceRepository {
  bool shouldFail = false;

  final sampleOrder = Order(
    id: 101,
    orderNumber: 'BOT-8842',
    customerName: 'Amina Bello',
    customerPhone: '+2348098765432',
    customerEmail: 'amina@example.com',
    paymentStatus: 'paid',
    fulfillmentStatus: 'processing',
    currency: '₦',
    totalAmount: 45000.0,
    itemsCount: 2,
    items: const [
      OrderItem(id: 1, productName: 'Wireless Earbuds Pro', quantity: 1, price: 35000.0),
      OrderItem(id: 2, productName: 'Silicone Case', quantity: 1, price: 10000.0),
    ],
    createdAt: DateTime.now(),
  );

  @override
  Future<PaginatedList<Order>> getOrders({String? status, String? search, int page = 1}) async {
    if (shouldFail) throw Exception('Orders network error');
    return PaginatedList<Order>(
      data: [sampleOrder],
      currentPage: 1,
      lastPage: 1,
      total: 1,
    );
  }

  @override
  Future<Order> getOrderDetail(int orderId) async {
    if (shouldFail) throw Exception('Order detail error');
    return sampleOrder;
  }

  @override
  Future<Order> updateOrderStatus({
    required int orderId,
    required String status,
    String? trackingNumber,
    String? courier,
  }) async {
    return sampleOrder.copyWith(
      fulfillmentStatus: status,
      trackingNumber: trackingNumber,
      courierName: courier,
    );
  }

  @override
  Future<void> sendTrackingUpdate({required int orderId, required String channel}) async {}
}

void main() {
  group('OrdersBloc Unit Tests', () {
    late MockCommerceRepository mockRepo;
    late OrdersBloc ordersBloc;

    setUp(() {
      mockRepo = MockCommerceRepository();
      ordersBloc = OrdersBloc(commerceRepository: mockRepo);
    });

    tearDown(() {
      ordersBloc.close();
    });

    test('Initial state is OrdersInitial', () {
      expect(ordersBloc.state, isA<OrdersInitial>());
    });

    test('FetchOrdersEvent emits [OrdersLoading, OrdersLoaded] on success', () async {
      final expectedStates = [
        isA<OrdersLoading>(),
        isA<OrdersLoaded>().having((s) => s.orders.first.orderNumber, 'orderNumber', 'BOT-8842'),
      ];

      expectLater(ordersBloc.stream, emitsInOrder(expectedStates));
      ordersBloc.add(const FetchOrdersEvent());
    });

    test('UpdateOrderStatusEvent dispatches PATCH and updates fulfillment status', () async {
      // First fetch
      ordersBloc.add(const FetchOrdersEvent());
      await expectLater(ordersBloc.stream, emitsThrough(isA<OrdersLoaded>()));

      ordersBloc.add(const UpdateOrderStatusEvent(
        orderId: 101,
        status: 'shipped',
        trackingNumber: 'TRK-998811',
        courier: 'DHL Express',
      ));

      await expectLater(
        ordersBloc.stream,
        emitsThrough(
          isA<OrdersLoaded>().having(
            (s) => s.orders.any((o) => o.id == 101 && o.fulfillmentStatus == 'shipped'),
            'is marked shipped',
            true,
          ),
        ),
      );
    });
  });
}
