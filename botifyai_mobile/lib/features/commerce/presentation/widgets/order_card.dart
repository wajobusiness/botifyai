import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:botifyai_mobile/app/theme/app_colors.dart';
import 'package:botifyai_mobile/app/theme/app_typography.dart';
import 'package:botifyai_mobile/features/commerce/domain/entities/order.dart';
import 'order_status_badge.dart';

class OrderCard extends StatelessWidget {
  final Order order;
  final VoidCallback onTap;

  const OrderCard({
    super.key,
    required this.order,
    required this.onTap,
  });

  String _formatDate(DateTime dt) {
    return DateFormat('dd MMM, HH:mm').format(dt);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currencyFmt = NumberFormat.currency(
      symbol: order.currencySymbol,
      decimalDigits: 2,
    );

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Order Number & Date
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '#${order.orderNumber.replaceAll('#', '')}',
                  style: AppTypography.bodyRegular(
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : AppColors.primaryDark,
                  ),
                ),
                Text(
                  _formatDate(order.createdAt),
                  style: AppTypography.caption(
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Middle Row: Customer Name & Items count
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    order.customerName,
                    style: AppTypography.bodyRegular(
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  '${order.itemsCount} ${order.itemsCount == 1 ? 'item' : 'items'}',
                  style: AppTypography.caption(
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 12),

            // Bottom Row: Total Amount & Status Badges
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  currencyFmt.format(order.totalAmount),
                  style: AppTypography.headingSmall(
                    color: isDark ? AppColors.aiAccent : AppColors.primary,
                  ),
                ),
                Row(
                  children: [
                    OrderStatusBadge(status: order.paymentStatus, isPayment: true),
                    const SizedBox(width: 6),
                    OrderStatusBadge(status: order.fulfillmentStatus),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
