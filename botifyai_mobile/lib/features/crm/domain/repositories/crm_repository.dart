import '../../inbox/domain/entities/contact.dart';
import '../../inbox/domain/repositories/inbox_repository.dart';
import '../domain/entities/contact_profile.dart';

abstract class CrmRepository {
  Future<PaginatedList<Contact>> getContacts({
    String? search,
    String? tag,
    int page = 1,
  });

  Future<ContactProfile> getContactProfile(int contactId);

  Future<Contact> createContact({
    required String name,
    String? phone,
    String? email,
    Map<String, dynamic>? customFields,
  });

  Future<Contact> updateContact({
    required int id,
    required String name,
    String? phone,
    String? email,
    Map<String, dynamic>? customFields,
  });
}
