import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/features/copilot/presentation/widgets/copilot_keyboard_bar.dart';

void main() {
  Widget createTestWidget(Widget child) {
    return MaterialApp(
      home: Scaffold(
        body: child,
      ),
    );
  }

  group('CopilotKeyboardBar Widget Tests', () {
    testWidgets('Renders all 4 quick action pills and triggers callbacks on tap', (WidgetTester tester) async {
      bool draftTapped = false;
      bool summarizeTapped = false;
      bool shortcutsTapped = false;
      bool templatesTapped = false;

      await tester.pumpWidget(createTestWidget(
        CopilotKeyboardBar(
          onTapDraft: () => draftTapped = true,
          onTapSummarize: () => summarizeTapped = true,
          onTapShortcuts: () => shortcutsTapped = true,
          onTapTemplates: () => templatesTapped = true,
        ),
      ));

      expect(find.text('✨ AI Draft'), findsOneWidget);
      expect(find.text('📝 Summarize'), findsOneWidget);
      expect(find.text('⚡ /shortcuts'), findsOneWidget);
      expect(find.text('📋 Templates'), findsOneWidget);

      await tester.tap(find.text('✨ AI Draft'));
      expect(draftTapped, isTrue);

      await tester.tap(find.text('📝 Summarize'));
      expect(summarizeTapped, isTrue);

      await tester.tap(find.text('⚡ /shortcuts'));
      expect(shortcutsTapped, isTrue);

      await tester.tap(find.text('📋 Templates'));
      expect(templatesTapped, isTrue);
    });
  });
}
