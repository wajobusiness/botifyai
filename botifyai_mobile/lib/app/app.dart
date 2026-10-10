import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'router.dart';
import 'theme/app_theme.dart';

class BotifyApp extends StatelessWidget {
  const BotifyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'BotifyAI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: AppRouter.router,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en', ''),
        Locale('es', ''),
        Locale('fr', ''),
        Locale('ar', ''),
      ],
    );
  }
}
