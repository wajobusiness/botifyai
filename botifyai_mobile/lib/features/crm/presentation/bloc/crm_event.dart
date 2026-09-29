import 'package:equatable/equatable.dart';

abstract class CrmEvent extends Equatable {
  const CrmEvent();

  @override
  List<Object?> get props => [];
}

class LoadContactsEvent extends CrmEvent {
  final bool isRefresh;
  final bool isLoadMore;

  const LoadContactsEvent({
    this.isRefresh = false,
    this.isLoadMore = false,
  });

  @override
  List<Object?> get props => [isRefresh, isLoadMore];
}

class SearchContactsEvent extends CrmEvent {
  final String query;

  const SearchContactsEvent(this.query);

  @override
  List<Object?> get props => [query];
}

class FilterContactsByTagEvent extends CrmEvent {
  final String? tag;

  const FilterContactsByTagEvent(this.tag);

  @override
  List<Object?> get props => [tag];
}

class LoadContactProfileEvent extends CrmEvent {
  final int contactId;

  const LoadContactProfileEvent(this.contactId);

  @override
  List<Object?> get props => [contactId];
}
