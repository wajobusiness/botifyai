import 'package:flutter/material.dart';
import 'package:botifyai_mobile/app/theme/app_typography.dart';

class OrderStatusBadge extends StatelessWidget {
  final String status;
  final bool isPayment;

  const OrderStatusBadge({
    super.key,
    required this.status,
    this.isPayment = false,
  });

  Color _getStatusColor() {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'delivered':
      case 'completed':
        return const Color(0xFF10B981); // Emerald
      case 'processing':
      case 'shipped':
        return const Color(0xFF3B82F6); // Blue
      case 'pending':
        return const Color(0xFFF59E0B); // Amber
      case 'cancelled':
      case 'failed':
      case 'refunded':
        return const Color(0xFFEF4444); // Rose
      default:
        return const Color(0xFF6B7280); // Grey
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _getStatusColor();
    final label = status.isNotEmpty ? status[0].toUpperCase() + status.substring(1).toLowerCase() : 'Pending';

    return Semantics(
      label: isPayment ? 'Payment status: $label' : 'Order status: $label',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: color.withOpacity(0.15),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Text(
          label,
          style: AppTypography.caption(
            color: color,
            fontWeight: FontWeight.w700,
            fontSize: 10,
          ),
        ),
      ),
    );
  }
}
