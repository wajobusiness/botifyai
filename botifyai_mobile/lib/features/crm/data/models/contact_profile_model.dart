import '../../inbox/data/models/contact_model.dart';
import '../../inbox/data/models/inbox_setup_model.dart';
import '../domain/entities/contact_profile.dart';

class ContactProfileModel extends ContactProfile {
  const ContactProfileModel({
    required super.contact,
    super.totalOrders = 0,
    super.totalSpend = 0.0,
    super.currency = 'NGN',
    super.currencySymbol = '₦',
    super.lastOrderStatus,
    super.lastOrderDate,
    super.labels = const [],
    super.notes = const [],
    super.assignedAgentName,
    super.channel,
  });

  factory ContactProfileModel.fromJson(Map<String, dynamic> json) {
    final contactJson = json['contact'] is Map<String, dynamic>
        ? json['contact'] as Map<String, dynamic>
        : json;
    final contact = ContactModel.fromJson(contactJson);

    final labelsList = (json['labels'] as List<dynamic>?)
            ?.map((e) => ConversationLabelModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final notesList = (json['notes'] as List<dynamic>?)
            ?.map((e) => e is Map<String, dynamic> ? e : {'note': e.toString()})
            .toList() ??
        [];

    double spend = 0.0;
    if (json['total_spend'] != null) {
      spend = (json['total_spend'] as num).toDouble();
    } else if (json['orders_total_amount'] != null) {
      spend = (json['orders_total_amount'] as num).toDouble();
    }

    final int ordersCount = json['total_orders'] is int
        ? json['total_orders'] as int
        : (int.tryParse(json['total_orders']?.toString() ?? '0') ?? 0);

    return ContactProfileModel(
      contact: contact,
      totalOrders: ordersCount,
      totalSpend: spend,
      currency: json['currency']?.toString() ?? 'NGN',
      currencySymbol: json['currency_symbol']?.toString() ?? '₦',
      lastOrderStatus: json['last_order_status']?.toString(),
      lastOrderDate: json['last_order_date'] != null
          ? DateTime.tryParse(json['last_order_date'].toString())
          : null,
      labels: labelsList,
      notes: notesList,
      assignedAgentName: json['assigned_agent_name']?.toString() ?? json['assigned_user']?['name']?.toString(),
      channel: json['channel']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'contact': (contact as ContactModel).toJson(),
        'total_orders': totalOrders,
        'total_spend': totalSpend,
        'currency': currency,
        'currency_symbol': currencySymbol,
        'last_order_status': lastOrderStatus,
        'last_order_date': lastOrderDate?.toIso8601String(),
        'labels': labels.map((e) => (e as ConversationLabelModel).toJson()).toList(),
        'notes': notes,
        'assigned_agent_name': assignedAgentName,
        'channel': channel,
      };
}
