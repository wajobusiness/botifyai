import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../app/theme/app_colors.dart';

class MainShellScreen extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const MainShellScreen({
    super.key,
    required this.navigationShell,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(
              color: isDark ? AppColors.borderDark : AppColors.borderLight,
              width: 1,
            ),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: navigationShell.currentIndex,
          onTap: (index) => _onTap(context, index),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.messageSquare),
              activeIcon: Icon(LucideIcons.messageSquare, color: AppColors.brandPrimary),
              label: 'Inbox',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.users),
              activeIcon: Icon(LucideIcons.users, color: AppColors.brandPrimary),
              label: 'CRM',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.shoppingBag),
              activeIcon: Icon(LucideIcons.shoppingBag, color: AppColors.brandPrimary),
              label: 'Orders',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.layoutGrid),
              activeIcon: Icon(LucideIcons.layoutGrid, color: AppColors.brandPrimary),
              label: 'Hub',
            ),
          ],
        ),
      ),
    );
  }

  void _onTap(BuildContext context, int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }
}
