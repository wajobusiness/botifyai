import 'package:flutter_test/flutter_test.dart';
import 'package:botifyai_mobile/features/crm/presentation/bloc/crm_bloc.dart';
import 'package:botifyai_mobile/features/crm/presentation/bloc/crm_event.dart';
import 'package:botifyai_mobile/features/crm/presentation/bloc/crm_state.dart';
import 'package:botifyai_mobile/features/crm/domain/entities/contact_profile.dart';
import 'package:botifyai_mobile/features/crm/domain/repositories/crm_repository.dart';
import 'package:botifyai_mobile/features/inbox/domain/entities/contact.dart';
import 'package:botifyai_mobile/features/inbox/domain/repositories/inbox_repository.dart';

class MockCrmRepository implements CrmRepository {
  bool shouldFail = false;

  final sampleContact = const Contact(
    id: 1,
    name: 'Chioma Adebayo',
    email: 'chioma@example.com',
    phone: '+2348012345678',
  );

  final sampleProfile = const ContactProfile(
    contact: Contact(
      id: 1,
      name: 'Chioma Adebayo',
      email: 'chioma@example.com',
      phone: '+2348012345678',
    ),
    channel: 'whatsapp',
    totalOrders: 4,
    totalSpend: 145000.0,
    currencySymbol: '₦',
    notes: [
      {'id': 1, 'author': 'Alex', 'content': 'Prefers morning deliveries.', 'date': '2026-09-20'},
    ],
  );

  @override
  Future<PaginatedList<Contact>> getContacts({String? search, String? tag, int page = 1}) async {
    if (shouldFail) throw Exception('CRM network error');
    return PaginatedList<Contact>(
      data: [sampleContact],
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
  Future<Contact> createContact({
    required String name,
    String? phone,
    String? email,
    Map<String, dynamic>? customFields,
  }) async {
    return Contact(id: 2, name: name, phone: phone, email: email);
  }

  @override
  Future<Contact> updateContact({
    required int id,
    required String name,
    String? phone,
    String? email,
    Map<String, dynamic>? customFields,
  }) async {
    return Contact(id: id, name: name, phone: phone, email: email);
  }
}

void main() {
  group('CrmBloc Unit Tests', () {
    late MockCrmRepository mockRepo;
    late CrmBloc crmBloc;

    setUp(() {
      mockRepo = MockCrmRepository();
      crmBloc = CrmBloc(repository: mockRepo);
    });

    tearDown(() {
      crmBloc.close();
    });

    test('Initial state is CrmInitial', () {
      expect(crmBloc.state, isA<CrmInitial>());
    });

    test('LoadContactsEvent emits [CrmLoading, CrmLoaded] on success', () async {
      final expectedStates = [
        isA<CrmLoading>(),
        isA<CrmLoaded>().having((s) => s.contacts.length, 'contacts count', 1),
      ];

      expectLater(crmBloc.stream, emitsInOrder(expectedStates));
      crmBloc.add(const LoadContactsEvent());
    });

    test('LoadContactProfileEvent loads active profile into CrmLoaded state', () async {
      // First load contacts to have CrmLoaded state
      crmBloc.add(const LoadContactsEvent());
      await expectLater(crmBloc.stream, emitsThrough(isA<CrmLoaded>()));

      crmBloc.add(const LoadContactProfileEvent(1));

      await expectLater(
        crmBloc.stream,
        emitsThrough(
          isA<CrmLoaded>().having(
            (s) => s.activeProfile?.totalSpend,
            'total spend',
            145000.0,
          ),
        ),
      );
    });
  });
}
