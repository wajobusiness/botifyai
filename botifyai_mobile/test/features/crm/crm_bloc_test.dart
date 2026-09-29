import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/features/crm/presentation/bloc/crm_bloc.dart';
import 'package:botifyai_mobile/features/crm/presentation/bloc/crm_event.dart';
import 'package:botifyai_mobile/features/crm/presentation/bloc/crm_state.dart';
import 'package:botifyai_mobile/features/crm/domain/entities/contact_profile.dart';
import 'package:botifyai_mobile/features/crm/domain/repositories/crm_repository.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/conversation.dart';

class MockCrmRepository implements CrmRepository {
  bool shouldFail = false;

  final sampleProfile = const ContactProfile(
    id: 1,
    name: 'Chioma Adebayo',
    email: 'chioma@example.com',
    phone: '+2348012345678',
    channel: 'whatsapp',
    tags: ['VIP Buyer', 'Urgent'],
    totalOrders: 4,
    lifetimeSpend: 145000.0,
    currency: '₦',
    notes: [
      ContactNote(id: 1, authorName: 'Alex', content: 'Prefers morning deliveries.', createdAt: '2026-09-20'),
    ],
  );

  @override
  Future<PaginatedList<ContactProfile>> getContacts({String? search, String? tag, int page = 1}) async {
    if (shouldFail) throw Exception('CRM network error');
    return PaginatedList<ContactProfile>(
      data: [sampleProfile],
      currentPage: 1,
      lastPage: 1,
      total: 1,
    );
  }

  @override
  Future<ContactProfile> getContactProfile(int contactId) async {
    if (shouldFail) throw Exception('Profile fetch failed');
    return sampleProfile;
  }

  @override
  Future<ContactProfile> addTag({required int contactId, required String tag}) async {
    return sampleProfile.copyWith(tags: [...sampleProfile.tags, tag]);
  }

  @override
  Future<ContactProfile> removeTag({required int contactId, required String tag}) async {
    return sampleProfile.copyWith(tags: sampleProfile.tags.where((t) => t != tag).toList());
  }

  @override
  Future<ContactNote> addNote({required int contactId, required String content}) async {
    return ContactNote(id: 2, authorName: 'Current User', content: content, createdAt: '2026-09-29');
  }
}

void main() {
  group('CrmBloc Unit Tests', () {
    late MockCrmRepository mockRepo;
    late CrmBloc crmBloc;

    setUp(() {
      mockRepo = MockCrmRepository();
      crmBloc = CrmBloc(crmRepository: mockRepo);
    });

    tearDown(() {
      crmBloc.close();
    });

    test('Initial state is CrmInitial', () {
      expect(crmBloc.state, isA<CrmInitial>());
    });

    test('FetchContactsEvent emits [CrmLoading, CrmLoaded] on success', () async {
      final expectedStates = [
        isA<CrmLoading>(),
        isA<CrmLoaded>().having((s) => s.contacts.length, 'contacts count', 1),
      ];

      expectLater(crmBloc.stream, emitsInOrder(expectedStates));
      crmBloc.add(const FetchContactsEvent());
    });

    test('FetchContactProfileEvent loads full profile with order history and tags', () async {
      final expectedStates = [
        isA<ContactProfileLoading>(),
        isA<ContactProfileLoaded>().having((s) => s.profile.lifetimeSpend, 'lifetime spend', 145000.0),
      ];

      expectLater(crmBloc.stream, emitsInOrder(expectedStates));
      crmBloc.add(const FetchContactProfileEvent(contactId: 1));
    });
  });
}
