import 'package:equatable/equatable.dart';

class ConversationLabel extends Equatable {
  final int id;
  final String name;
  final String color;

  const ConversationLabel({
    required this.id,
    required this.name,
    required this.color,
  });

  @override
  List<Object?> get props => [id, name, color];
}

class CannedReply extends Equatable {
  final int id;
  final String shortcut;
  final String body;

  const CannedReply({
    required this.id,
    required this.shortcut,
    required this.body,
  });

  @override
  List<Object?> get props => [id, shortcut, body];
}

class ChannelAccount extends Equatable {
  final int id;
  final String channel;
  final String displayName;
  final String? phoneNumberId;

  const ChannelAccount({
    required this.id,
    required this.channel,
    required this.displayName,
    this.phoneNumberId,
  });

  @override
  List<Object?> get props => [id, channel, displayName, phoneNumberId];
}

class TeamMember extends Equatable {
  final int id;
  final String name;
  final String email;
  final String? avatar;
  final String? role;

  const TeamMember({
    required this.id,
    required this.name,
    required this.email,
    this.avatar,
    this.role,
  });

  @override
  List<Object?> get props => [id, name, email, avatar, role];
}

class InboxSetup extends Equatable {
  final List<ConversationLabel> labels;
  final List<CannedReply> cannedReplies;
  final List<ChannelAccount> channelAccounts;
  final List<TeamMember> teamMembers;

  const InboxSetup({
    this.labels = const [],
    this.cannedReplies = const [],
    this.channelAccounts = const [],
    this.teamMembers = const [],
  });

  @override
  List<Object?> get props => [labels, cannedReplies, channelAccounts, teamMembers];
}
