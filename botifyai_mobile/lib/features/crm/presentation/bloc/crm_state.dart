import 'package:equatable/equatable.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/contact.dart';
import 'package:botifyai_mobile/features/crm/domain/entities/contact_profile.dart';

abstract class CrmState extends Equatable {
  const CrmState();

  @override
  List<Object?> get props => [];
}

class CrmInitial extends CrmState {}

class CrmLoading extends CrmState {}

class CrmLoaded extends CrmState {
  final List<Contact> contacts;
  final String searchQuery;
  final String? selectedTag;
  final bool isRefreshing;
  final bool isLoadingMore;
  final bool hasMore;
  final int currentPage;
  final int totalCount;
  final ContactProfile? activeProfile;
  final bool isLoadingProfile;

  const CrmLoaded({
    required this.contacts,
    this.searchQuery = '',
    this.selectedTag,
    this.isRefreshing = false,
    this.isLoadingMore = false,
    this.hasMore = false,
    this.currentPage = 1,
    this.totalCount = 0,
    this.activeProfile,
    this.isLoadingProfile = false,
  });

  CrmLoaded copyWith({
    List<Contact>? contacts,
    String? searchQuery,
    String? selectedTag,
    bool? isRefreshing,
    bool? isLoadingMore,
    bool? hasMore,
    int? currentPage,
    int? totalCount,
    ContactProfile? activeProfile,
    bool? isLoadingProfile,
  }) {
    return CrmLoaded(
      contacts: contacts ?? this.contacts,
      searchQuery: searchQuery ?? this.searchQuery,
      selectedTag: selectedTag ?? this.selectedTag,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      totalCount: totalCount ?? this.totalCount,
      activeProfile: activeProfile ?? this.activeProfile,
      isLoadingProfile: isLoadingProfile ?? this.isLoadingProfile,
    );
  }

  @override
  List<Object?> get props => [
        contacts,
        searchQuery,
        selectedTag,
        isRefreshing,
        isLoadingMore,
        hasMore,
        currentPage,
        totalCount,
        activeProfile,
        isLoadingProfile,
      ];
}

class CrmError extends CrmState {
  final String message;

  const CrmError(this.message);

  @override
  List<Object?> get props => [message];
}
