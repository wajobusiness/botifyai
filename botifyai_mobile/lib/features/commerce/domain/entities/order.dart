import 'package:equatable/equatable.dart';
import 'order_item.dart';

class Order extends Equatable {
  final int id;
  final String orderNumber;
  final String customerName;
  final String? customerPhone;
  final String? customerEmail;
  final String? shippingAddress;
  final double totalAmount;
  final String currency;
  final String currencySymbol;
  final String paymentStatus; // 'paid', 'pending', 'failed', 'refunded'
  final String fulfillmentStatus; // 'processing', 'shipped', 'delivered', 'cancelled'
  final int itemsCount;
  final List<OrderItem> items;
  final String? trackingNumber;
  final DateTime createdAt;

  const Order({
    required this.id,
    required this.orderNumber,
    required this.customerName,
    this.customerPhone,
    this.customerEmail,
    this.shippingAddress,
    required this.totalAmount,
    this.currency = 'NGN',
    this.currencySymbol = '₦',
    this.paymentStatus = 'pending',
    this.fulfillmentStatus = 'processing',
    this.itemsCount = 1,
    this.items = const [],
    this.trackingNumber,
    required this.createdAt,
  });

  bool get isPaid => paymentStatus.toLowerCase() == 'paid';
  bool get isShipped => fulfillmentStatus.toLowerCase() == 'shipped';
  bool get isDelivered => fulfillmentStatus.toLowerCase() == 'delivered';

  Order copyWith({
    int? id,
    String? orderNumber,
    String? customerName,
    String? customerPhone,
    String? customerEmail,
    String? shippingAddress,
    double? totalAmount,
    String? currency,
    String? currencySymbol,
    String? paymentStatus,
    String? fulfillmentStatus,
    int? itemsCount,
    List<OrderItem>? items,
    String? trackingNumber,
    DateTime? createdAt,
  }) {
    return Order(
      id: id ?? this.id,
      orderNumber: orderNumber ?? this.orderNumber,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      customerEmail: customerEmail ?? this.customerEmail,
      shippingAddress: shippingAddress ?? this.shippingAddress,
      totalAmount: totalAmount ?? this.totalAmount,
      currency: currency ?? this.currency,
      currencySymbol: currencySymbol ?? this.currencySymbol,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      fulfillmentStatus: fulfillmentStatus ?? this.fulfillmentStatus,
      itemsCount: itemsCount ?? this.itemsCount,
      items: items ?? this.items,
      trackingNumber: trackingNumber ?? this.trackingNumber,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        orderNumber,
        customerName,
        customerPhone,
        customerEmail,
        shippingAddress,
        totalAmount,
        currency,
        currencySymbol,
        paymentStatus,
        fulfillmentStatus,
        itemsCount,
        items,
        trackingNumber,
        createdAt,
      ];
}
