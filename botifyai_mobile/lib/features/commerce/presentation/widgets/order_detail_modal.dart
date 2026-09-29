import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:botifyai_mobile/app/theme/app_colors.dart';
import 'package:botifyai_mobile/app/theme/app_typography.dart';
import 'package:botifyai_mobile/shared/widgets/botify_button.dart';
import 'package:botifyai_mobile/features/commerce/domain/entities/order.dart';
import 'order_status_badge.dart';

class OrderDetailModal extends StatefulWidget {
  final Order order;
  final Function(String newStatus, String? trackingNumber) onUpdateStatus;
  final Function(Order order)? onSendWhatsAppTracking;

  const OrderDetailModal({
    super.key,
    required this.order,
    required this.onUpdateStatus,
    this.onSendWhatsAppTracking,
  });

  static void show({
    required BuildContext context,
    required Order order,
    required Function(String newStatus, String? trackingNumber) onUpdateStatus,
    Function(Order order)? onSendWhatsAppTracking,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) {
        return OrderDetailModal(
          order: order,
          onUpdateStatus: (status, tracking) {
            Navigator.pop(modalContext);
            onUpdateStatus(status, tracking);
          },
          onSendWhatsAppTracking: onSendWhatsAppTracking != null
              ? (o) {
                  Navigator.pop(modalContext);
                  onSendWhatsAppTracking(o);
                }
              : null,
        );
      },
    );
  }

  @override
  State<OrderDetailModal> createState() => _OrderDetailModalState();
}

class _OrderDetailModalState extends State<OrderDetailModal> {
  void _promptTrackingNumberAndShip(BuildContext context) {
    final trackingController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) {
        final isDark = Theme.of(dialogContext).brightness == Brightness.dark;
        return AlertDialog(
          backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
          title: Text('Mark as Shipped', style: AppTypography.headingSmall()),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Enter the courier tracking number for ${widget.order.orderNumber}:',
                style: AppTypography.bodySmall(),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: trackingController,
                style: AppTypography.bodyRegular(),
                decoration: const InputDecoration(
                  hintText: 'e.g. DHL-984210492 or GIG-1234',
                  isDense: true,
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                final tracking = trackingController.text.trim();
                Navigator.pop(dialogContext);
                widget.onUpdateStatus('shipped', tracking.isNotEmpty ? tracking : null);
              },
              child: const Text('Confirm Shipment'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currencyFmt = NumberFormat.currency(
      symbol: widget.order.currencySymbol,
      decimalDigits: 2,
    );

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkBackground : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag Handle
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: isDark ? Colors.grey[700] : Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              children: [
                Text(
                  widget.order.orderNumber,
                  style: AppTypography.headingSmall(
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                  ),
                ),
                const Spacer(),
                OrderStatusBadge(status: widget.order.paymentStatus, isPayment: true),
                const SizedBox(width: 6),
                OrderStatusBadge(status: widget.order.fulfillmentStatus),
                IconButton(
                  icon: const Icon(LucideIcons.x, size: 20),
                  onPressed: () => Navigator.pop(context),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Customer & Shipping Info Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(LucideIcons.user, size: 16, color: AppColors.primary),
                            const SizedBox(width: 8),
                            Text(
                              widget.order.customerName,
                              style: AppTypography.bodyRegular(fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        if (widget.order.customerPhone != null) ...[
                          const SizedBox(height: 4),
                          Text('Phone: ${widget.order.customerPhone!}', style: AppTypography.caption()),
                        ],
                        if (widget.order.shippingAddress != null) ...[
                          const SizedBox(height: 6),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(LucideIcons.mapPin, size: 14, color: Colors.grey),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  widget.order.shippingAddress!,
                                  style: AppTypography.caption(),
                                ),
                              ),
                            ],
                          ),
                        ],
                        if (widget.order.trackingNumber != null) ...[
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Tracking: ${widget.order.trackingNumber!}',
                              style: AppTypography.caption(
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Itemized Line Items
                  Text(
                    'Order Items (${widget.order.items.length})',
                    style: AppTypography.bodySmall(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  if (widget.order.items.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Standard Items (${widget.order.itemsCount})', style: AppTypography.bodySmall()),
                          Text(currencyFmt.format(widget.order.totalAmount), style: AppTypography.bodySmall(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    )
                  else
                    ...widget.order.items.map((item) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: isDark ? Colors.white10 : Colors.black12,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(LucideIcons.package, size: 18),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.productName,
                                    style: AppTypography.bodySmall(fontWeight: FontWeight.bold),
                                  ),
                                  Text(
                                    'Qty: ${item.quantity} × ${currencyFmt.format(item.unitPrice)}',
                                    style: AppTypography.caption(),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              currencyFmt.format(item.totalPrice),
                              style: AppTypography.bodyRegular(fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      );
                    }),
                  const SizedBox(height: 16),

                  // Total Amount Box
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Total Amount', style: AppTypography.headingSmall()),
                      Text(
                        currencyFmt.format(widget.order.totalAmount),
                        style: AppTypography.headingLarge(
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Action Buttons
                  if (!widget.order.isShipped && !widget.order.isDelivered) ...[
                    BotifyButton(
                      text: 'Mark as Shipped',
                      icon: LucideIcons.truck,
                      onPressed: () => _promptTrackingNumberAndShip(context),
                    ),
                    const SizedBox(height: 10),
                  ],

                  if (widget.order.isShipped && !widget.order.isDelivered) ...[
                    BotifyButton(
                      text: 'Mark as Delivered',
                      icon: LucideIcons.checkCircle2,
                      onPressed: () => widget.onUpdateStatus('delivered', widget.order.trackingNumber),
                    ),
                    const SizedBox(height: 10),
                  ],

                  if (widget.onSendWhatsAppTracking != null)
                    BotifyButton(
                      text: 'Send WhatsApp Tracking Update',
                      icon: LucideIcons.messageCircle,
                      variant: BotifyButtonVariant.secondary,
                      onPressed: () => widget.onSendWhatsAppTracking!(widget.order),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
