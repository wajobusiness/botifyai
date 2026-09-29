import 'package:dio/dio.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_endpoints.dart';
import '../../../../core/errors/failures.dart';
import '../../inbox/data/models/contact_model.dart';
import '../../inbox/domain/repositories/inbox_repository.dart';
import '../models/contact_profile_model.dart';

abstract class CrmRemoteDataSource {
  Future<PaginatedList<ContactModel>> getContacts({
    String? search,
    String? tag,
    int page = 1,
  });

  Future<ContactProfileModel> getContactProfile(int contactId);

  Future<ContactModel> createContact({
    required String name,
    String? phone,
    String? email,
    Map<String, dynamic>? customFields,
  });

  Future<ContactModel> updateContact({
    required int id,
    required String name,
    String? phone,
    String? email,
    Map<String, dynamic>? customFields,
  });
}

class CrmRemoteDataSourceImpl implements CrmRemoteDataSource {
  final ApiClient apiClient;

  CrmRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<PaginatedList<ContactModel>> getContacts({
    String? search,
    String? tag,
    int page = 1,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
      };
      if (search != null && search.trim().isNotEmpty) {
        queryParams['search'] = search.trim();
        queryParams['q'] = search.trim();
      }
      if (tag != null && tag.isNotEmpty && tag != 'all') {
        queryParams['tag'] = tag;
      }

      final response = await apiClient.get(
        ApiEndpoints.contactSearch,
        queryParameters: queryParams,
      );

      final dynamic resData = response.data;
      List<dynamic> rawList = [];
      int currentPage = page;
      int lastPage = page;
      int total = 0;

      if (resData is Map<String, dynamic>) {
        if (resData['data'] is List) {
          rawList = resData['data'] as List<dynamic>;
        } else if (resData['contacts'] is List) {
          rawList = resData['contacts'] as List<dynamic>;
        }

        if (resData['meta'] is Map<String, dynamic>) {
          final meta = resData['meta'] as Map<String, dynamic>;
          currentPage = meta['current_page'] is int ? meta['current_page'] as int : page;
          lastPage = meta['last_page'] is int ? meta['last_page'] as int : page;
          total = meta['total'] is int ? meta['total'] as int : rawList.length;
        } else if (resData['current_page'] != null) {
          currentPage = resData['current_page'] is int ? resData['current_page'] as int : page;
          lastPage = resData['last_page'] is int ? resData['last_page'] as int : page;
          total = resData['total'] is int ? resData['total'] as int : rawList.length;
        }
      } else if (resData is List) {
        rawList = resData;
        total = rawList.length;
      }

      final contacts = rawList
          .map((e) => ContactModel.fromJson(e as Map<String, dynamic>))
          .toList();

      return PaginatedList<ContactModel>(
        data: contacts,
        currentPage: currentPage,
        lastPage: lastPage,
        total: total,
      );
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to load contacts',
      );
    }
  }

  @override
  Future<ContactProfileModel> getContactProfile(int contactId) async {
    try {
      final response = await apiClient.get(ApiEndpoints.contactDetail(contactId));
      final dynamic resData = response.data;
      final mapData = resData is Map<String, dynamic>
          ? (resData['data'] is Map<String, dynamic> ? resData['data'] as Map<String, dynamic> : resData)
          : <String, dynamic>{};
      return ContactProfileModel.fromJson(mapData);
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to load contact profile',
      );
    }
  }

  @override
  Future<ContactModel> createContact({
    required String name,
    String? phone,
    String? email,
    Map<String, dynamic>? customFields,
  }) async {
    try {
      final response = await apiClient.post(
        ApiEndpoints.contacts,
        data: {
          'name': name,
          if (phone != null) 'phone': phone,
          if (email != null) 'email': email,
          if (customFields != null) 'custom_fields': customFields,
        },
      );
      final resData = response.data is Map<String, dynamic>
          ? (response.data['contact'] ?? response.data['data'] ?? response.data)
          : response.data;
      return ContactModel.fromJson(resData as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to create contact',
      );
    }
  }

  @override
  Future<ContactModel> updateContact({
    required int id,
    required String name,
    String? phone,
    String? email,
    Map<String, dynamic>? customFields,
  }) async {
    try {
      final response = await apiClient.put(
        '${ApiEndpoints.contacts}/$id',
        data: {
          'name': name,
          if (phone != null) 'phone': phone,
          if (email != null) 'email': email,
          if (customFields != null) 'custom_fields': customFields,
        },
      );
      final resData = response.data is Map<String, dynamic>
          ? (response.data['contact'] ?? response.data['data'] ?? response.data)
          : response.data;
      return ContactModel.fromJson(resData as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to update contact',
      );
    }
  }
}
