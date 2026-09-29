import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/features/commerce/domain/entities/order.dart';
import 'package:botifyai_mobile/features/commerce/presentation/widgets/order_card.dart';

void main() {
  Widget createTestWidget(Widget child) {
    return MaterialApp(
      home: Scaffold(
        body: child,
      ),
    );
  }

  group('OrderCard Widget Tests', () {
    testWidgets('Renders order number, customer name, and formatted amount', (WidgetTester tester) async {
      final order = Order(
        id: 50,
        orderNumber: 'BOT-5050',
        customerName: 'Fatima Garba',
        paymentStatus: 'paid',
        fulfillmentStatus: 'processing',
        currency: '₦',
        totalAmount: 18500.0,
        itemsCount: 1,
        items: const [
          OrderItem(id: 1, productName: 'Silk Hijab Navy Blue', quantity: 1, unitPrice: 18500.0, totalPrice: 18500.0),
        ],
        createdAt: DateTime.now(),
      );

      bool tapped = false;

      await tester.pumpWidget(createTestWidget(
        OrderCard(
          order: order,
          onTap: () {
            tapped = true;
          },
        ),
      ));

      expect(find.text('#BOT-5050'), findsOneWidget);
      expect(find.text('Fatima Garba'), findsOneWidget);
      expect(find.text('₦18,500.00'), findsOneWidget);
      expect(find.text('Paid'), findsOneWidget);

      await tester.tap(find.byType(OrderCard));
      expect(tapped, isTrue);
    });
  });
}
