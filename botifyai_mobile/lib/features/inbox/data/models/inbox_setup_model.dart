import '../../domain/entities/inbox_setup.dart';

class ConversationLabelModel extends ConversationLabel {
  const ConversationLabelModel({
    required super.id,
    required super.name,
    required super.color,
  });

  factory ConversationLabelModel.fromJson(Map<String, dynamic> json) {
    return ConversationLabelModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name']?.toString() ?? '',
      color: json['color']?.toString() ?? '#467235',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'color': color,
      };
}

class CannedReplyModel extends CannedReply {
  const CannedReplyModel({
    required super.id,
    required super.shortcut,
    required super.body,
  });

  factory CannedReplyModel.fromJson(Map<String, dynamic> json) {
    return CannedReplyModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      shortcut: json['shortcut']?.toString() ?? '',
      body: json['body']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'shortcut': shortcut,
        'body': body,
      };
}

class ChannelAccountModel extends ChannelAccount {
  const ChannelAccountModel({
    required super.id,
    required super.channel,
    required super.displayName,
    super.phoneNumberId,
  });

  factory ChannelAccountModel.fromJson(Map<String, dynamic> json) {
    return ChannelAccountModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      channel: json['channel']?.toString() ?? 'whatsapp',
      displayName: json['display_name']?.toString() ?? json['name']?.toString() ?? 'Channel',
      phoneNumberId: json['phone_number_id']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'channel': channel,
        'display_name': displayName,
        'phone_number_id': phoneNumberId,
      };
}

class TeamMemberModel extends TeamMember {
  const TeamMemberModel({
    required super.id,
    required super.name,
    required super.email,
    super.avatar,
    super.role,
  });

  factory TeamMemberModel.fromJson(Map<String, dynamic> json) {
    return TeamMemberModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name']?.toString() ?? 'Team Member',
      email: json['email']?.toString() ?? '',
      avatar: json['avatar']?.toString(),
      role: json['role']?.toString() ?? json['client_role']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'avatar': avatar,
        'role': role,
      };
}

class InboxSetupModel extends InboxSetup {
  const InboxSetupModel({
    super.labels = const [],
    super.cannedReplies = const [],
    super.channelAccounts = const [],
    super.teamMembers = const [],
  });

  factory InboxSetupModel.fromJson(Map<String, dynamic> json) {
    final labelsList = (json['labels'] as List<dynamic>?)
            ?.map((e) => ConversationLabelModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final repliesList = (json['canned_replies'] as List<dynamic>?)
            ?.map((e) => CannedReplyModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final accountsList = (json['channel_accounts'] as List<dynamic>?)
            ?.map((e) => ChannelAccountModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    final membersList = (json['team_members'] as List<dynamic>?)
            ?.map((e) => TeamMemberModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    return InboxSetupModel(
      labels: labelsList,
      cannedReplies: repliesList,
      channelAccounts: accountsList,
      teamMembers: membersList,
    );
  }
}
