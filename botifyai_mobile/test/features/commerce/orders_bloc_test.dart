import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/features/commerce/presentation/bloc/orders_bloc.dart';
import 'package:botifyai_mobile/features/commerce/presentation/bloc/orders_event.dart';
import 'package:botifyai_mobile/features/commerce/presentation/bloc/orders_state.dart';
import 'package:botifyai_mobile/features/commerce/domain/entities/order.dart';
import 'package:botifyai_mobile/features/commerce/domain/repositories/commerce_repository.dart';
import 'package:botifyai_mobile/features/inbox/domain/repositories/inbox_repository.dart';

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
      OrderItem(id: 1, productName: 'Wireless Earbuds Pro', quantity: 1, unitPrice: 35000.0, totalPrice: 35000.0),
      OrderItem(id: 2, productName: 'Silicone Case', quantity: 1, unitPrice: 10000.0, totalPrice: 10000.0),
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
  Future<Order> getOrderDetail(int id) async {
    if (shouldFail) throw Exception('Order detail error');
    return sampleOrder;
  }

  @override
  Future<Order> updateOrderStatus({
    required int id,
    required String fulfillmentStatus,
    String? trackingNumber,
  }) async {
    return sampleOrder.copyWith(
      fulfillmentStatus: fulfillmentStatus,
      trackingNumber: trackingNumber,
    );
  }
}

void main() {
  group('OrdersBloc Unit Tests', () {
    late MockCommerceRepository mockRepo;
    late OrdersBloc ordersBloc;

    setUp(() {
      mockRepo = MockCommerceRepository();
      ordersBloc = OrdersBloc(repository: mockRepo);
    });

    tearDown(() {
      ordersBloc.close();
    });

    test('Initial state is OrdersInitial', () {
      expect(ordersBloc.state, isA<OrdersInitial>());
    });

    test('LoadOrdersEvent emits [OrdersLoading, OrdersLoaded] on success', () async {
      final expectedStates = [
        isA<OrdersLoading>(),
        isA<OrdersLoaded>().having((s) => s.orders.first.orderNumber, 'orderNumber', 'BOT-8842'),
      ];

      expectLater(ordersBloc.stream, emitsInOrder(expectedStates));
      ordersBloc.add(const LoadOrdersEvent());
    });

    test('UpdateOrderStatusEvent dispatches PATCH and updates fulfillment status', () async {
      // First fetch
      ordersBloc.add(const LoadOrdersEvent());
      await expectLater(ordersBloc.stream, emitsThrough(isA<OrdersLoaded>()));

      ordersBloc.add(const UpdateOrderStatusEvent(
        orderId: 101,
        status: 'shipped',
        trackingNumber: 'TRK-998811',
      ));

      await expectLater(
        ordersBloc.stream,
        emitsThrough(
          isA<OrdersLoaded>().having(
            (s) => s.orders.any((Order o) => o.id == 101 && o.fulfillmentStatus == 'shipped'),
            'is marked shipped',
            true,
          ),
        ),
      );
    });
  });
}

