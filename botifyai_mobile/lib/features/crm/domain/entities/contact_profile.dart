import 'package:equatable/equatable.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/contact.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/inbox_setup.dart';

class ContactProfile extends Equatable {
  final Contact contact;
  final int totalOrders;
  final double totalSpend;
  final String currency;
  final String currencySymbol;
  final String? lastOrderStatus;
  final DateTime? lastOrderDate;
  final List<ConversationLabel> labels;
  final List<Map<String, dynamic>> notes;
  final String? assignedAgentName;
  final String? channel;

  const ContactProfile({
    required this.contact,
    this.totalOrders = 0,
    this.totalSpend = 0.0,
    this.currency = 'NGN',
    this.currencySymbol = '₦',
    this.lastOrderStatus,
    this.lastOrderDate,
    this.labels = const [],
    this.notes = const [],
    this.assignedAgentName,
    this.channel,
  });

  ContactProfile copyWith({
    Contact? contact,
    int? totalOrders,
    double? totalSpend,
    String? currency,
    String? currencySymbol,
    String? lastOrderStatus,
    DateTime? lastOrderDate,
    List<ConversationLabel>? labels,
    List<Map<String, dynamic>>? notes,
    String? assignedAgentName,
    String? channel,
  }) {
    return ContactProfile(
      contact: contact ?? this.contact,
      totalOrders: totalOrders ?? this.totalOrders,
      totalSpend: totalSpend ?? this.totalSpend,
      currency: currency ?? this.currency,
      currencySymbol: currencySymbol ?? this.currencySymbol,
      lastOrderStatus: lastOrderStatus ?? this.lastOrderStatus,
      lastOrderDate: lastOrderDate ?? this.lastOrderDate,
      labels: labels ?? this.labels,
      notes: notes ?? this.notes,
      assignedAgentName: assignedAgentName ?? this.assignedAgentName,
      channel: channel ?? this.channel,
    );
  }

  @override
  List<Object?> get props => [
        contact,
        totalOrders,
        totalSpend,
        currency,
        currencySymbol,
        lastOrderStatus,
        lastOrderDate,
        labels,
        notes,
        assignedAgentName,
        channel,
      ];
}
