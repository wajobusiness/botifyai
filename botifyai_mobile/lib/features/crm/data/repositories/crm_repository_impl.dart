import '../../inbox/domain/entities/contact.dart';
import '../../inbox/domain/repositories/inbox_repository.dart';
import '../domain/entities/contact_profile.dart';
import '../domain/repositories/crm_repository.dart';
import '../datasources/crm_remote_data_source.dart';

class CrmRepositoryImpl implements CrmRepository {
  final CrmRemoteDataSource remoteDataSource;

  CrmRepositoryImpl({required this.remoteDataSource});

  @override
  Future<PaginatedList<Contact>> getContacts({
    String? search,
    String? tag,
    int page = 1,
  }) async {
    return await remoteDataSource.getContacts(
      search: search,
      tag: tag,
      page: page,
    );
  }

  @override
  Future<ContactProfile> getContactProfile(int contactId) async {
    return await remoteDataSource.getContactProfile(contactId);
  }

  @override
  Future<Contact> createContact({
    required String name,
    String? phone,
    String? email,
    Map<String, dynamic>? customFields,
  }) async {
    return await remoteDataSource.createContact(
      name: name,
      phone: phone,
      email: email,
      customFields: customFields,
    );
  }

  @override
  Future<Contact> updateContact({
    required int id,
    required String name,
    String? phone,
    String? email,
    Map<String, dynamic>? customFields,
  }) async {
    return await remoteDataSource.updateContact(
      id: id,
      name: name,
      phone: phone,
      email: email,
      customFields: customFields,
    );
  }
}
