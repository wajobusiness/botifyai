import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/conversation.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/contact.dart';
import 'package:botifyai_mobile/features/inbox/presentation/widgets/conversation_tile.dart';

void main() {
  Widget createTestWidget(Widget child) {
    return MaterialApp(
      home: Scaffold(
        body: child,
      ),
    );
  }

  group('ConversationTile Widget Tests', () {
    testWidgets('Renders contact name, snippet and unread badge count', (WidgetTester tester) async {
      final conversation = Conversation(
        uuid: 'conv-999',
        contact: const Contact(id: 1, name: 'Emeka Okafor', phone: '+2347000000000'),
        channel: 'whatsapp',
        lastMessageSnippet: 'Can I pay via Bank Transfer?',
        lastMessageAt: DateTime.now().subtract(const Duration(minutes: 2)),
        unreadCount: 3,
        status: 'open',
        isWhatsappWindowOpen: true,
      );

      bool tapped = false;

      await tester.pumpWidget(createTestWidget(
        ConversationTile(
          conversation: conversation,
          onTap: () {
            tapped = true;
          },
        ),
      ));

      expect(find.text('Emeka Okafor'), findsOneWidget);
      expect(find.text('Can I pay via Bank Transfer?'), findsOneWidget);
      expect(find.text('3'), findsOneWidget);

      await tester.tap(find.byType(ConversationTile));
      expect(tapped, isTrue);
    });
  });
}
