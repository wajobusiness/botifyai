import 'package:equatable/equatable.dart';

class OrderItem extends Equatable {
  final int id;
  final String productName;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final String? imageUrl;
  final String? sku;

  const OrderItem({
    required this.id,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.imageUrl,
    this.sku,
  });

  @override
  List<Object?> get props => [
        id,
        productName,
        quantity,
        unitPrice,
        totalPrice,
        imageUrl,
        sku,
      ];
}
