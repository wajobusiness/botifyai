import 'dart:io';
import 'package:dio/dio.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_endpoints.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/repositories/inbox_repository.dart';
import '../models/conversation_model.dart';
import '../models/inbox_setup_model.dart';
import '../models/message_model.dart';
import '../models/whatsapp_template_model.dart';

abstract class InboxRemoteDataSource {
  Future<InboxSetupModel> getInboxSetup();

  Future<List<WhatsAppTemplateModel>> getWhatsAppTemplates();

  Future<PaginatedList<ConversationModel>> getConversations({
    String folder = 'mine',
    String? channel,
    String? search,
    int page = 1,
  });

  Future<Map<String, dynamic>> getConversationDetail(String uuid);

  Future<PaginatedList<MessageModel>> getMessages(String uuid, {int page = 1});

  Future<MessageModel> sendMessage({
    required String uuid,
    required String body,
    String type = 'text',
    dynamic attachment,
    Map<String, dynamic>? payload,
    bool isNote = false,
  });

  Future<ConversationModel> assignConversation({
    required String uuid,
    required int? userId,
    String? assignedTo,
  });

  Future<ConversationModel> updateConversationStatus({
    required String uuid,
    required String status,
  });

  Future<void> sendTypingIndicator({
    required String uuid,
    required bool isTyping,
  });

  Future<void> addNote({
    required String uuid,
    required String note,
  });

  Future<void> attachLabel({
    required String uuid,
    required int labelId,
  });

  Future<void> detachLabel({
    required String uuid,
    required int labelId,
  });
}

class InboxRemoteDataSourceImpl implements InboxRemoteDataSource {
  final ApiClient apiClient;

  InboxRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<InboxSetupModel> getInboxSetup() async {
    try {
      final response = await apiClient.get(ApiEndpoints.inboxSetup);
      final data = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};
      return InboxSetupModel.fromJson(data);
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to load inbox setup',
      );
    }
  }

  @override
  Future<List<WhatsAppTemplateModel>> getWhatsAppTemplates() async {
    try {
      final response = await apiClient.get(ApiEndpoints.inboxTemplates);
      final dynamic resData = response.data;
      List<dynamic> list = [];
      if (resData is Map<String, dynamic>) {
        if (resData['data'] is List) {
          list = resData['data'] as List<dynamic>;
        } else if (resData['templates'] is List) {
          list = resData['templates'] as List<dynamic>;
        }
      } else if (resData is List) {
        list = resData;
      }
      return list
          .map((e) => WhatsAppTemplateModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to load WhatsApp templates',
      );
    }
  }

  @override
  Future<PaginatedList<ConversationModel>> getConversations({
    String folder = 'mine',
    String? channel,
    String? search,
    int page = 1,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'folder': folder,
        'page': page,
      };
      if (channel != null && channel.isNotEmpty && channel != 'all') {
        queryParams['channel'] = channel;
      }
      if (search != null && search.trim().isNotEmpty) {
        queryParams['search'] = search.trim();
      }

      final response = await apiClient.get(
        ApiEndpoints.conversations,
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

      final conversations = rawList
          .map((e) => ConversationModel.fromJson(e as Map<String, dynamic>))
          .toList();

      return PaginatedList<ConversationModel>(
        data: conversations,
        currentPage: currentPage,
        lastPage: lastPage,
        total: total,
      );
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to load conversations',
      );
    }
  }

  @override
  Future<Map<String, dynamic>> getConversationDetail(String uuid) async {
    try {
      final response = await apiClient.get(ApiEndpoints.conversationDetail(uuid));
      final resData = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};

      ConversationModel? conversation;
      if (resData['conversation'] is Map<String, dynamic>) {
        conversation = ConversationModel.fromJson(
          resData['conversation'] as Map<String, dynamic>,
        );
      } else if (resData['data'] is Map<String, dynamic>) {
        conversation = ConversationModel.fromJson(
          resData['data'] as Map<String, dynamic>,
        );
      }

      List<MessageModel> messages = [];
      if (resData['messages'] is List) {
        messages = (resData['messages'] as List<dynamic>)
            .map((e) => MessageModel.fromJson(e as Map<String, dynamic>, conversationUuid: uuid))
            .toList();
      }

      return {
        'conversation': conversation,
        'messages': messages,
      };
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to load conversation details',
      );
    }
  }

  @override
  Future<PaginatedList<MessageModel>> getMessages(String uuid, {int page = 1}) async {
    try {
      final response = await apiClient.get(
        ApiEndpoints.conversationMessages(uuid),
        queryParameters: {'page': page},
      );

      final dynamic resData = response.data;
      List<dynamic> rawList = [];
      int currentPage = page;
      int lastPage = page;
      int total = 0;

      if (resData is Map<String, dynamic>) {
        if (resData['data'] is List) {
          rawList = resData['data'] as List<dynamic>;
        } else if (resData['messages'] is List) {
          rawList = resData['messages'] as List<dynamic>;
        }

        if (resData['meta'] is Map<String, dynamic>) {
          final meta = resData['meta'] as Map<String, dynamic>;
          currentPage = meta['current_page'] is int ? meta['current_page'] as int : page;
          lastPage = meta['last_page'] is int ? meta['last_page'] as int : page;
          total = meta['total'] is int ? meta['total'] as int : rawList.length;
        }
      } else if (resData is List) {
        rawList = resData;
        total = rawList.length;
      }

      final messages = rawList
          .map((e) => MessageModel.fromJson(e as Map<String, dynamic>, conversationUuid: uuid))
          .toList();

      return PaginatedList<MessageModel>(
        data: messages,
        currentPage: currentPage,
        lastPage: lastPage,
        total: total,
      );
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to load messages',
      );
    }
  }

  @override
  Future<MessageModel> sendMessage({
    required String uuid,
    required String body,
    String type = 'text',
    dynamic attachment,
    Map<String, dynamic>? payload,
    bool isNote = false,
  }) async {
    try {
      dynamic requestData;

      if (attachment != null) {
        MultipartFile? multipartFile;
        if (attachment is File) {
          final fileName = attachment.path.split('/').last;
          multipartFile = await MultipartFile.fromFile(
            attachment.path,
            filename: fileName,
          );
        } else if (attachment is MultipartFile) {
          multipartFile = attachment;
        }

        requestData = FormData.fromMap({
          'body': body,
          'type': type,
          'is_note': isNote ? 1 : 0,
          if (multipartFile != null) 'attachment': multipartFile,
          if (payload != null) 'payload': payload,
        });
      } else {
        requestData = {
          'body': body,
          'type': isNote ? 'note' : type,
          'is_note': isNote,
          if (payload != null) 'payload': payload,
        };
      }

      final endpoint = isNote
          ? ApiEndpoints.conversationNotes(uuid)
          : ApiEndpoints.conversationReply(uuid);

      final response = await apiClient.post(endpoint, data: requestData);
      final resData = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};

      final msgJson = resData['message'] is Map<String, dynamic>
          ? resData['message'] as Map<String, dynamic>
          : (resData['data'] is Map<String, dynamic> ? resData['data'] as Map<String, dynamic> : resData);

      return MessageModel.fromJson(msgJson, conversationUuid: uuid);
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to send message',
      );
    }
  }

  @override
  Future<ConversationModel> assignConversation({
    required String uuid,
    required int? userId,
    String? assignedTo,
  }) async {
    try {
      final response = await apiClient.patch(
        ApiEndpoints.conversationAssign(uuid),
        data: {
          'user_id': userId,
          'assigned_to': assignedTo ?? (userId != null ? 'human' : 'unassigned'),
        },
      );
      final resData = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};

      final convJson = resData['conversation'] is Map<String, dynamic>
          ? resData['conversation'] as Map<String, dynamic>
          : (resData['data'] is Map<String, dynamic> ? resData['data'] as Map<String, dynamic> : resData);

      return ConversationModel.fromJson(convJson);
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to assign conversation',
      );
    }
  }

  @override
  Future<ConversationModel> updateConversationStatus({
    required String uuid,
    required String status,
  }) async {
    try {
      final response = await apiClient.patch(
        ApiEndpoints.conversationStatus(uuid),
        data: {'status': status},
      );
      final resData = response.data is Map<String, dynamic>
          ? response.data as Map<String, dynamic>
          : <String, dynamic>{};

      final convJson = resData['conversation'] is Map<String, dynamic>
          ? resData['conversation'] as Map<String, dynamic>
          : (resData['data'] is Map<String, dynamic> ? resData['data'] as Map<String, dynamic> : resData);

      return ConversationModel.fromJson(convJson);
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to update conversation status',
      );
    }
  }

  @override
  Future<void> sendTypingIndicator({
    required String uuid,
    required bool isTyping,
  }) async {
    try {
      await apiClient.post(
        ApiEndpoints.conversationTyping(uuid),
        data: {'typing': isTyping},
      );
    } catch (_) {
      // Typing indicators should fail silently without interrupting UI
    }
  }

  @override
  Future<void> addNote({
    required String uuid,
    required String note,
  }) async {
    try {
      await apiClient.post(
        ApiEndpoints.conversationNotes(uuid),
        data: {'note': note, 'body': note},
      );
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to add internal note',
      );
    }
  }

  @override
  Future<void> attachLabel({
    required String uuid,
    required int labelId,
  }) async {
    try {
      await apiClient.post(
        ApiEndpoints.conversationLabels(uuid),
        data: {'label_id': labelId},
      );
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to attach label',
      );
    }
  }

  @override
  Future<void> detachLabel({
    required String uuid,
    required int labelId,
  }) async {
    try {
      await apiClient.delete(
        ApiEndpoints.conversationDetachLabel(uuid, labelId),
      );
    } on DioException catch (e) {
      throw ServerFailure(
        e.response?.data?['message']?.toString() ?? 'Failed to detach label',
      );
    }
  }
}
