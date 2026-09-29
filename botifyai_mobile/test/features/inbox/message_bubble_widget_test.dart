import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/message.dart';
import 'package:botifyai_mobile/features/inbox/presentation/widgets/message_bubble.dart';

void main() {
  Widget createTestWidget(Widget child) {
    return MaterialApp(
      home: Scaffold(
        body: child,
      ),
    );
  }

  group('MessageBubble Widget Tests', () {
    testWidgets('Renders inbound customer message correctly', (WidgetTester tester) async {
      final customerMessage = Message(
        id: 1,
        uuid: 'msg-1',
        senderType: 'customer',
        senderName: 'Chioma Adebayo',
        body: 'Do you deliver to Ikeja?',
        createdAt: DateTime.now(),
        status: 'delivered',
      );

      await tester.pumpWidget(createTestWidget(
        MessageBubble(message: customerMessage),
      ));

      expect(find.text('Do you deliver to Ikeja?'), findsOneWidget);
      expect(find.text('Chioma Adebayo'), findsOneWidget);
    });

    testWidgets('Renders outbound agent message with sent status indicator', (WidgetTester tester) async {
      final agentMessage = Message(
        id: 2,
        uuid: 'msg-2',
        senderType: 'agent',
        senderName: 'Agent Alex',
        body: 'Yes, delivery is within 24 hours.',
        createdAt: DateTime.now(),
        status: 'sent',
      );

      await tester.pumpWidget(createTestWidget(
        MessageBubble(message: agentMessage),
      ));

      expect(find.text('Yes, delivery is within 24 hours.'), findsOneWidget);
    });

    testWidgets('Renders internal private note with padlock pill', (WidgetTester tester) async {
      final noteMessage = Message(
        id: 3,
        uuid: 'msg-3',
        senderType: 'agent',
        senderName: 'Manager Alex',
        body: 'VIP customer. Provide free shipping code if requested.',
        createdAt: DateTime.now(),
        isInternalNote: true,
      );

      await tester.pumpWidget(createTestWidget(
        MessageBubble(message: noteMessage),
      ));

      expect(find.text('VIP customer. Provide free shipping code if requested.'), findsOneWidget);
      expect(find.text('Private Note'), findsOneWidget);
    });
  });
}
