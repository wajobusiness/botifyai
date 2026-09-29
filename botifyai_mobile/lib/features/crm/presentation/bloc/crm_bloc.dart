import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/contact.dart';
import 'package:botifyai_mobile/features/crm/domain/repositories/crm_repository.dart';
import 'crm_event.dart';
import 'crm_state.dart';

class CrmBloc extends Bloc<CrmEvent, CrmState> {
  final CrmRepository repository;

  CrmBloc({required this.repository}) : super(CrmInitial()) {
    on<LoadContactsEvent>(_onLoadContacts);
    on<SearchContactsEvent>(_onSearchContacts);
    on<FilterContactsByTagEvent>(_onFilterByTag);
    on<LoadContactProfileEvent>(_onLoadContactProfile);
  }

  Future<void> _onLoadContacts(
    LoadContactsEvent event,
    Emitter<CrmState> emit,
  ) async {
    final currentState = state;
    String search = '';
    String? tag;
    List<Contact> currentList = [];
    int pageToFetch = 1;

    if (currentState is CrmLoaded) {
      search = currentState.searchQuery;
      tag = currentState.selectedTag;

      if (event.isLoadMore) {
        if (currentState.isLoadingMore || !currentState.hasMore) return;
        emit(currentState.copyWith(isLoadingMore: true));
        pageToFetch = currentState.currentPage + 1;
        currentList = currentState.contacts;
      } else if (event.isRefresh) {
        emit(currentState.copyWith(isRefreshing: true));
        pageToFetch = 1;
      } else {
        emit(CrmLoading());
      }
    } else {
      emit(CrmLoading());
    }

    try {
      final paginated = await repository.getContacts(
        search: search.isNotEmpty ? search : null,
        tag: tag,
        page: pageToFetch,
      );

      final updatedList = event.isLoadMore
          ? [...currentList, ...paginated.data]
          : paginated.data;

      emit(CrmLoaded(
        contacts: updatedList,
        searchQuery: search,
        selectedTag: tag,
        isRefreshing: false,
        isLoadingMore: false,
        hasMore: paginated.hasMore,
        currentPage: paginated.currentPage,
        totalCount: paginated.total,
      ));
    } catch (e) {
      if (currentState is CrmLoaded && (event.isRefresh || event.isLoadMore)) {
        emit(currentState.copyWith(
          isRefreshing: false,
          isLoadingMore: false,
        ));
      } else {
        emit(CrmError(e.toString().replaceAll('Exception: ', '')));
      }
    }
  }

  Future<void> _onSearchContacts(
    SearchContactsEvent event,
    Emitter<CrmState> emit,
  ) async {
    final currentState = state;
    if (currentState is CrmLoaded) {
      emit(currentState.copyWith(searchQuery: event.query));
      add(const LoadContactsEvent());
    }
  }

  Future<void> _onFilterByTag(
    FilterContactsByTagEvent event,
    Emitter<CrmState> emit,
  ) async {
    final currentState = state;
    if (currentState is CrmLoaded) {
      emit(currentState.copyWith(selectedTag: event.tag));
      add(const LoadContactsEvent());
    }
  }

  Future<void> _onLoadContactProfile(
    LoadContactProfileEvent event,
    Emitter<CrmState> emit,
  ) async {
    final currentState = state;
    if (currentState is CrmLoaded) {
      emit(currentState.copyWith(isLoadingProfile: true));
      try {
        final profile = await repository.getContactProfile(event.contactId);
        emit(currentState.copyWith(
          activeProfile: profile,
          isLoadingProfile: false,
        ));
      } catch (_) {
        emit(currentState.copyWith(isLoadingProfile: false));
      }
    }
  }
}
