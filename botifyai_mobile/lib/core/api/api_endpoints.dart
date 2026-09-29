/// API endpoint constants for BotifyAI Mobile Application
class ApiEndpoints {
  ApiEndpoints._();

  // Base URL (configurable per environment: local, staging, production)
  static const String defaultBaseUrl = 'https://botifyai.cloud';
  static const String apiVersion = '/api/v1';

  // Auth & Account
  static const String login = '$apiVersion/auth/login';
  static const String logout = '$apiVersion/auth/logout';
  static const String me = '$apiVersion/auth/me';
  static const String profile = '$apiVersion/auth/profile';

  // Mobile Inbox & Conversations
  static const String inboxSetup = '$apiVersion/mobile/inbox/setup';
  static const String inboxTemplates = '$apiVersion/mobile/inbox/templates';
  static const String conversations = '$apiVersion/mobile/conversations';
  static String conversationDetail(String uuid) => '$apiVersion/mobile/conversations/$uuid';
  static String conversationMessages(String uuid) => '$apiVersion/mobile/conversations/$uuid/messages';
  static String conversationReply(String uuid) => '$apiVersion/mobile/conversations/$uuid/reply';
  static String conversationAssign(String uuid) => '$apiVersion/mobile/conversations/$uuid/assign';
  static String conversationStatus(String uuid) => '$apiVersion/mobile/conversations/$uuid/status';
  static String conversationTyping(String uuid) => '$apiVersion/mobile/conversations/$uuid/typing';
  static String conversationHandover(String uuid) => '$apiVersion/mobile/conversations/$uuid/handover';
  static String conversationNotes(String uuid) => '$apiVersion/mobile/conversations/$uuid/notes';
  static String conversationLabels(String uuid) => '$apiVersion/mobile/conversations/$uuid/labels';
  static String conversationDetachLabel(String uuid, int labelId) => '$apiVersion/mobile/conversations/$uuid/labels/$labelId';

  // Contacts & CRM
  static const String contactSearch = '$apiVersion/mobile/contacts/search';
  static String contactDetail(int id) => '$apiVersion/mobile/contacts/$id';
  static const String contacts = '$apiVersion/contacts';

  // Commerce & Orders
  static const String orders = '$apiVersion/mobile/orders';
  static String orderDetail(int id) => '$apiVersion/mobile/orders/$id';
  static String updateOrderStatus(int id) => '$apiVersion/mobile/orders/$id/status';

  // AI Copilot
  static const String copilotDraft = '$apiVersion/mobile/ai/copilot-draft';

  // Push Notifications & Devices
  static const String registerPushDevice = '$apiVersion/mobile/devices/register-push';
}
