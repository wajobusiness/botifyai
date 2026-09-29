import 'package:equatable/equatable.dart';
import '../../inbox/domain/entities/contact.dart';
import '../../inbox/domain/entities/inbox_setup.dart';

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
