import 'package:equatable/equatable.dart';
import 'contact.dart';
import 'inbox_setup.dart';
import 'message.dart';

class Conversation extends Equatable {
  final int id;
  final String uuid;
  final String status; // 'open', 'resolved', 'snoozed', 'pending'
  final String channel; // 'whatsapp', 'instagram', 'messenger', 'webchat'
  final int? channelAccountId;
  final String? channelAccountName;
  final int unreadCount;
  final DateTime? lastMessageAt;
  final DateTime? lastCustomerMessageAt;
  final bool isWhatsappWindowOpen;
  final String assignedTo; // 'human', 'bot', 'unassigned'
  final int? assignedUserId;
  final String? assignedUserName;
  final String? assignedUserAvatar;
  final Contact contact;
  final Message? lastMessage;
  final List<ConversationLabel> labels;

  const Conversation({
    required this.id,
    required this.uuid,
    this.status = 'open',
    this.channel = 'whatsapp',
    this.channelAccountId,
    this.channelAccountName,
    this.unreadCount = 0,
    this.lastMessageAt,
    this.lastCustomerMessageAt,
    this.isWhatsappWindowOpen = true,
    this.assignedTo = 'unassigned',
    this.assignedUserId,
    this.assignedUserName,
    this.assignedUserAvatar,
    required this.contact,
    this.lastMessage,
    this.labels = const [],
  });

  bool get isOpen => status == 'open';
  bool get isResolved => status == 'resolved';
  bool get isSnoozed => status == 'snoozed';
  bool get isUnassigned => assignedTo == 'unassigned' || assignedUserId == null;
  bool get hasUnread => unreadCount > 0;

  Conversation copyWith({
    int? id,
    String? uuid,
    String? status,
    String? channel,
    int? channelAccountId,
    String? channelAccountName,
    int? unreadCount,
    DateTime? lastMessageAt,
    DateTime? lastCustomerMessageAt,
    bool? isWhatsappWindowOpen,
    String? assignedTo,
    int? assignedUserId,
    String? assignedUserName,
    String? assignedUserAvatar,
    Contact? contact,
    Message? lastMessage,
    List<ConversationLabel>? labels,
  }) {
    return Conversation(
      id: id ?? this.id,
      uuid: uuid ?? this.uuid,
      status: status ?? this.status,
      channel: channel ?? this.channel,
      channelAccountId: channelAccountId ?? this.channelAccountId,
      channelAccountName: channelAccountName ?? this.channelAccountName,
      unreadCount: unreadCount ?? this.unreadCount,
      lastMessageAt: lastMessageAt ?? this.lastMessageAt,
      lastCustomerMessageAt: lastCustomerMessageAt ?? this.lastCustomerMessageAt,
      isWhatsappWindowOpen: isWhatsappWindowOpen ?? this.isWhatsappWindowOpen,
      assignedTo: assignedTo ?? this.assignedTo,
      assignedUserId: assignedUserId ?? this.assignedUserId,
      assignedUserName: assignedUserName ?? this.assignedUserName,
      assignedUserAvatar: assignedUserAvatar ?? this.assignedUserAvatar,
      contact: contact ?? this.contact,
      lastMessage: lastMessage ?? this.lastMessage,
      labels: labels ?? this.labels,
    );
  }

  @override
  List<Object?> get props => [
        id,
        uuid,
        status,
        channel,
        channelAccountId,
        channelAccountName,
        unreadCount,
        lastMessageAt,
        lastCustomerMessageAt,
        isWhatsappWindowOpen,
        assignedTo,
        assignedUserId,
        assignedUserName,
        assignedUserAvatar,
        contact,
        lastMessage,
        labels,
      ];
}
