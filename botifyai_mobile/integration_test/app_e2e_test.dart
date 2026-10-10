import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:botifyai_mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('E2E: App startup, login screen rendering and navigation flow', (WidgetTester tester) async {
    app.main();
    await tester.pumpAndSettle();

    // Verify login screen is displayed initially
    expect(find.text('BotifyAI Companion'), findsOneWidget);
    expect(find.byType(TextField), findsNWidgets(2)); // Email & Password fields

    // Enter login credentials
    await tester.enterText(find.byType(TextField).at(0), 'admin@botifyai.cloud');
    await tester.enterText(find.byType(TextField).at(1), 'password123');
    await tester.pumpAndSettle();

    // Tap login button
    final loginButton = find.byType(ElevatedButton);
    expect(loginButton, findsOneWidget);
    await tester.tap(loginButton);
    await tester.pumpAndSettle(const Duration(seconds: 2));
  });
}
