import '../../domain/entities/conversation.dart';
import 'contact_model.dart';
import 'inbox_setup_model.dart';
import 'message_model.dart';

class ConversationModel extends Conversation {
  const ConversationModel({
    required super.id,
    required super.uuid,
    super.status = 'open',
    super.channel = 'whatsapp',
    super.channelAccountId,
    super.channelAccountName,
    super.unreadCount = 0,
    super.lastMessageAt,
    super.lastCustomerMessageAt,
    super.isWhatsappWindowOpen = true,
    super.assignedTo = 'unassigned',
    super.assignedUserId,
    super.assignedUserName,
    super.assignedUserAvatar,
    required super.contact,
    super.lastMessage,
    super.labels = const [],
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    final contactJson = json['contact'] is Map<String, dynamic>
        ? json['contact'] as Map<String, dynamic>
        : <String, dynamic>{
            'id': json['contact_id'] ?? 0,
            'name': json['contact_name'] ?? 'Unknown Contact',
            'phone': json['phone'] ?? json['from'],
          };

    final contact = ContactModel.fromJson(contactJson);

    MessageModel? lastMessage;
    if (json['last_message'] is Map<String, dynamic>) {
      lastMessage = MessageModel.fromJson(
        json['last_message'] as Map<String, dynamic>,
        conversationUuid: json['uuid']?.toString(),
      );
    }

    final labelsList = (json['labels'] as List<dynamic>?)
            ?.map((e) => ConversationLabelModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final lastMessageAt = json['last_message_at'] != null
        ? DateTime.tryParse(json['last_message_at'].toString())
        : (json['updated_at'] != null ? DateTime.tryParse(json['updated_at'].toString()) : null);

    final lastCustomerMessageAt = json['last_customer_message_at'] != null
        ? DateTime.tryParse(json['last_customer_message_at'].toString())
        : null;

    // Evaluate 24-hour window status
    bool isWindowOpen = true;
    if (json.containsKey('is_whatsapp_window_open')) {
      isWindowOpen = json['is_whatsapp_window_open'] == true;
    } else if (lastCustomerMessageAt != null && json['channel']?.toString().toLowerCase() == 'whatsapp') {
      final hoursPassed = DateTime.now().difference(lastCustomerMessageAt).inHours;
      isWindowOpen = hoursPassed < 24;
    }

    // Assigned user details
    final assignedUser = json['assigned_user'] is Map<String, dynamic>
        ? json['assigned_user'] as Map<String, dynamic>
        : null;

    return ConversationModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      uuid: json['uuid']?.toString() ?? json['id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'open',
      channel: json['channel']?.toString() ?? 'whatsapp',
      channelAccountId: json['channel_account_id'] is int ? json['channel_account_id'] as int : null,
      channelAccountName: json['channel_account']?['display_name']?.toString() ?? json['channel_account']?['name']?.toString(),
      unreadCount: json['unread_count'] is int ? json['unread_count'] as int : int.tryParse(json['unread_count']?.toString() ?? '0') ?? 0,
      lastMessageAt: lastMessageAt,
      lastCustomerMessageAt: lastCustomerMessageAt,
      isWhatsappWindowOpen: isWindowOpen,
      assignedTo: json['assigned_to']?.toString() ?? (json['assigned_user_id'] != null ? 'human' : 'unassigned'),
      assignedUserId: json['assigned_user_id'] is int ? json['assigned_user_id'] as int : (assignedUser?['id'] is int ? assignedUser!['id'] as int : null),
      assignedUserName: assignedUser?['name']?.toString() ?? json['assigned_user_name']?.toString(),
      assignedUserAvatar: assignedUser?['avatar']?.toString() ?? json['assigned_user_avatar']?.toString(),
      contact: contact,
      lastMessage: lastMessage,
      labels: labelsList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'uuid': uuid,
      'status': status,
      'channel': channel,
      'channel_account_id': channelAccountId,
      'channel_account_name': channelAccountName,
      'unread_count': unreadCount,
      'last_message_at': lastMessageAt?.toIso8601String(),
      'last_customer_message_at': lastCustomerMessageAt?.toIso8601String(),
      'is_whatsapp_window_open': isWhatsappWindowOpen,
      'assigned_to': assignedTo,
      'assigned_user_id': assignedUserId,
      'assigned_user_name': assignedUserName,
      'assigned_user_avatar': assignedUserAvatar,
      'contact': (contact as ContactModel).toJson(),
      'last_message': (lastMessage as MessageModel?)?.toJson(),
      'labels': labels.map((e) => (e as ConversationLabelModel).toJson()).toList(),
    };
  }
}
