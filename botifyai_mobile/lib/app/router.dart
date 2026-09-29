import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/splash_screen.dart';
import '../features/commerce/presentation/screens/commerce_screen.dart';
import '../features/crm/presentation/screens/crm_screen.dart';
import '../features/hub/presentation/screens/hub_screen.dart';
import '../features/inbox/domain/entities/conversation.dart';
import '../features/inbox/presentation/screens/chat_detail_screen.dart';
import '../features/inbox/presentation/screens/inbox_screen.dart';
import '../shared/widgets/main_shell_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();
final GlobalKey<NavigatorState> _inboxNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'inbox');
final GlobalKey<NavigatorState> _crmNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'crm');
final GlobalKey<NavigatorState> _commerceNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'commerce');
final GlobalKey<NavigatorState> _hubNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'hub');

class AppRouter {
  AppRouter._();

  static final GoRouter router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    debugLogDiagnostics: true,
    routes: [
      // Splash & Auth
      GoRoute(
        path: '/',
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),

      // Direct Chat Detail Route (Full Screen Overlay)
      GoRoute(
        path: '/inbox/chat/:uuid',
        name: 'chat_detail',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final uuid = state.pathParameters['uuid'] ?? '';
          final extraConversation = state.extra is Conversation ? state.extra as Conversation : null;
          return ChatDetailScreen(
            conversationUuid: uuid,
            initialConversation: extraConversation,
          );
        },
      ),

      // 4-Tab Stateful Navigation Shell
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainShellScreen(navigationShell: navigationShell);
        },
        branches: [
          // Branch 1: Inbox
          StatefulShellBranch(
            navigatorKey: _inboxNavigatorKey,
            routes: [
              GoRoute(
                path: '/inbox',
                name: 'inbox',
                builder: (context, state) => const InboxScreen(),
              ),
            ],
          ),

          // Branch 2: CRM & Contacts
          StatefulShellBranch(
            navigatorKey: _crmNavigatorKey,
            routes: [
              GoRoute(
                path: '/crm',
                name: 'crm',
                builder: (context, state) => const CrmScreen(),
              ),
            ],
          ),

          // Branch 3: Commerce & Orders
          StatefulShellBranch(
            navigatorKey: _commerceNavigatorKey,
            routes: [
              GoRoute(
                path: '/commerce',
                name: 'commerce',
                builder: (context, state) => const CommerceScreen(),
              ),
            ],
          ),

          // Branch 4: Hub & Settings
          StatefulShellBranch(
            navigatorKey: _hubNavigatorKey,
            routes: [
              GoRoute(
                path: '/hub',
                name: 'hub',
                builder: (context, state) => const HubScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
