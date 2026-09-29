import '../../domain/entities/order_item.dart';

class OrderItemModel extends OrderItem {
  const OrderItemModel({
    required super.id,
    required super.productName,
    required super.quantity,
    required super.unitPrice,
    required super.totalPrice,
    super.imageUrl,
    super.sku,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    final unitPrice = (json['unit_price'] ?? json['price'] ?? 0.0) is num
        ? (json['unit_price'] ?? json['price'] ?? 0.0).toDouble()
        : (double.tryParse(json['unit_price']?.toString() ?? '0.0') ?? 0.0);

    final totalPrice = (json['total_price'] ?? json['total'] ?? 0.0) is num
        ? (json['total_price'] ?? json['total'] ?? 0.0).toDouble()
        : (double.tryParse(json['total_price']?.toString() ?? '0.0') ?? 0.0);

    final int qty = (json['quantity'] ?? json['qty'] ?? 1) is int
        ? (json['quantity'] ?? json['qty'] ?? 1) as int
        : (int.tryParse(json['quantity']?.toString() ?? '1') ?? 1);

    return OrderItemModel(
      id: json['id'] is int ? json['id'] as int : (int.tryParse(json['id']?.toString() ?? '0') ?? 0),
      productName: json['product_name']?.toString() ?? json['name']?.toString() ?? json['title']?.toString() ?? 'Product',
      quantity: qty,
      unitPrice: unitPrice,
      totalPrice: totalPrice > 0 ? totalPrice : (unitPrice * qty),
      imageUrl: json['image_url']?.toString() ?? json['image']?.toString() ?? json['thumbnail']?.toString(),
      sku: json['sku']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'product_name': productName,
        'quantity': quantity,
        'unit_price': unitPrice,
        'total_price': totalPrice,
        'image_url': imageUrl,
        'sku': sku,
      };
}
