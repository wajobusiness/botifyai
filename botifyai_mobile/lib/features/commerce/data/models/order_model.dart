import '../../domain/entities/order.dart';
import 'order_item_model.dart';

class OrderModel extends Order {
  const OrderModel({
    required super.id,
    required super.orderNumber,
    required super.customerName,
    super.customerPhone,
    super.customerEmail,
    super.shippingAddress,
    required super.totalAmount,
    super.currency = 'NGN',
    super.currencySymbol = '₦',
    super.paymentStatus = 'pending',
    super.fulfillmentStatus = 'processing',
    super.itemsCount = 1,
    super.items = const [],
    super.trackingNumber,
    required super.createdAt,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final rawTotal = json['total_amount'] ?? json['total'] ?? json['amount'] ?? 0.0;
    final total = rawTotal is num
        ? rawTotal.toDouble()
        : (double.tryParse(rawTotal?.toString() ?? '0.0') ?? 0.0);

    final rawItems = json['items'] as List<dynamic>?;
    final itemsList = rawItems != null
        ? rawItems.map((e) => OrderItemModel.fromJson(e as Map<String, dynamic>)).toList()
        : <OrderItemModel>[];

    final int itemsCount = json['items_count'] is int
        ? json['items_count'] as int
        : (int.tryParse(json['items_count']?.toString() ?? '') ?? itemsList.length);

    DateTime createdAt = DateTime.now();
    if (json['created_at'] != null) {
      createdAt = DateTime.tryParse(json['created_at'].toString()) ?? createdAt;
    }

    return OrderModel(
      id: json['id'] is int ? json['id'] as int : (int.tryParse(json['id']?.toString() ?? '0') ?? 0),
      orderNumber: json['order_number']?.toString() ?? json['number']?.toString() ?? 'ORD-${json['id']}',
      customerName: json['customer_name']?.toString() ?? json['customer']?['name']?.toString() ?? 'Customer',
      customerPhone: json['customer_phone']?.toString() ?? json['customer']?['phone']?.toString(),
      customerEmail: json['customer_email']?.toString() ?? json['customer']?['email']?.toString(),
      shippingAddress: json['shipping_address']?.toString() ?? json['address']?.toString(),
      totalAmount: total,
      currency: json['currency']?.toString() ?? 'NGN',
      currencySymbol: json['currency_symbol']?.toString() ?? '₦',
      paymentStatus: json['payment_status']?.toString() ?? 'pending',
      fulfillmentStatus: json['fulfillment_status']?.toString() ?? json['status']?.toString() ?? 'processing',
      itemsCount: itemsCount > 0 ? itemsCount : 1,
      items: itemsList,
      trackingNumber: json['tracking_number']?.toString(),
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'order_number': orderNumber,
        'customer_name': customerName,
        'customer_phone': customerPhone,
        'customer_email': customerEmail,
        'shipping_address': shippingAddress,
        'total_amount': totalAmount,
        'currency': currency,
        'currency_symbol': currencySymbol,
        'payment_status': paymentStatus,
        'fulfillment_status': fulfillmentStatus,
        'items_count': itemsCount,
        'items': items.map((e) => (e as OrderItemModel).toJson()).toList(),
        'tracking_number': trackingNumber,
        'created_at': createdAt.toIso8601String(),
      };
}
