import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../shared/widgets/botify_button.dart';
import '../../domain/entities/whatsapp_template.dart';
import '../../domain/repositories/inbox_repository.dart';

class TemplatePickerSheet extends StatefulWidget {
  final InboxRepository inboxRepository;
  final Function(WhatsAppTemplate template, Map<String, String> params, String interpolatedBody) onSelectTemplate;

  const TemplatePickerSheet({
    super.key,
    required this.inboxRepository,
    required this.onSelectTemplate,
  });

  static void show({
    required BuildContext context,
    required InboxRepository inboxRepository,
    required Function(WhatsAppTemplate template, Map<String, String> params, String interpolatedBody) onSelectTemplate,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(modalContext).viewInsets.bottom,
          ),
          child: TemplatePickerSheet(
            inboxRepository: inboxRepository,
            onSelectTemplate: (template, params, body) {
              Navigator.pop(modalContext);
              onSelectTemplate(template, params, body);
            },
          ),
        );
      },
    );
  }

  @override
  State<TemplatePickerSheet> createState() => _TemplatePickerSheetState();
}

class _TemplatePickerSheetState extends State<TemplatePickerSheet> {
  bool _isLoading = true;
  List<WhatsAppTemplate> _allTemplates = [];
  List<WhatsAppTemplate> _filteredTemplates = [];
  String _selectedCategory = 'ALL';
  String _searchQuery = '';

  WhatsAppTemplate? _selectedTemplate;
  final Map<String, TextEditingController> _paramControllers = {};

  @override
  void initState() {
    super.initState();
    _loadTemplates();
  }

  @override
  void dispose() {
    for (final controller in _paramControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _loadTemplates() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final templates = await widget.inboxRepository.getWhatsAppTemplates();
      setState(() {
        _allTemplates = templates;
        _filterList();
        _isLoading = false;
      });
    } catch (e) {
      // Fallback with standard default templates if network fails
      final defaultTemplates = [
        const WhatsAppTemplate(
          id: 1,
          name: 'customer_care_reopen',
          category: 'UTILITY',
          bodyText: 'Hello {{1}}, we are following up on your recent inquiry regarding order {{2}}. Is there anything else we can assist you with?',
          parameterNames: ['1', '2'],
        ),
        const WhatsAppTemplate(
          id: 2,
          name: 'order_status_update',
          category: 'UTILITY',
          bodyText: 'Hi {{1}}, your order #{{2}} has been shipped! Tracking number is {{3}}.',
          parameterNames: ['1', '2', '3'],
        ),
        const WhatsAppTemplate(
          id: 3,
          name: 'special_offer_broadcast',
          category: 'MARKETING',
          bodyText: 'Hi {{1}}! Exclusive promo for you: Use code {{2}} at checkout to get {{3}} off today.',
          parameterNames: ['1', '2', '3'],
        ),
      ];

      setState(() {
        _allTemplates = defaultTemplates;
        _filterList();
        _isLoading = false;
      });
    }
  }

  void _filterList() {
    _filteredTemplates = _allTemplates.where((t) {
      final matchesCat = _selectedCategory == 'ALL' || t.category.toUpperCase() == _selectedCategory;
      final matchesSearch = _searchQuery.isEmpty ||
          t.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          t.bodyText.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    }).toList();
  }

  void _selectTemplate(WhatsAppTemplate template) {
    setState(() {
      _selectedTemplate = template;
      // Initialize parameter controllers
      for (final controller in _paramControllers.values) {
        controller.dispose();
      }
      _paramControllers.clear();

      for (final param in template.parameterNames) {
        final controller = TextEditingController();
        controller.addListener(() => setState(() {}));
        _paramControllers[param] = controller;
      }
    });
  }

  String _getInterpolatedPreview() {
    if (_selectedTemplate == null) return '';
    final map = <String, String>{};
    _paramControllers.forEach((key, controller) {
      map[key] = controller.text.trim().isNotEmpty ? controller.text.trim() : '{{$key}}';
    });
    return _selectedTemplate!.interpolate(map);
  }

  void _handleSendTemplate() {
    if (_selectedTemplate == null) return;
    final map = <String, String>{};
    _paramControllers.forEach((key, controller) {
      map[key] = controller.text.trim();
    });
    final body = _selectedTemplate!.interpolate(map);
    widget.onSelectTemplate(_selectedTemplate!, map, body);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkBackground : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag Handle
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: isDark ? Colors.grey[700] : Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF25D366).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(LucideIcons.messageSquare, size: 18, color: Color(0xFF25D366)),
                ),
                const SizedBox(width: 10),
                Text(
                  _selectedTemplate == null ? 'WhatsApp Meta Templates' : 'Configure Template',
                  style: AppTypography.headingSmall(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Spacer(),
                if (_selectedTemplate != null)
                  IconButton(
                    icon: const Icon(LucideIcons.arrowLeft, size: 20),
                    onPressed: () => setState(() => _selectedTemplate = null),
                  ),
                IconButton(
                  icon: const Icon(LucideIcons.x, size: 20),
                  onPressed: () => Navigator.pop(context),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Body
          Flexible(
            child: _isLoading
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(40),
                      child: CircularProgressIndicator(color: AppColors.primary),
                    ),
                  )
                : _selectedTemplate == null
                    ? _buildTemplateSelector(context)
                    : _buildParameterConfigurator(context),
          ),
        ],
      ),
    );
  }

  Widget _buildTemplateSelector(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      children: [
        // Search & Filter Categories
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: TextField(
            style: AppTypography.bodySmall(),
            decoration: InputDecoration(
              hintText: 'Search templates...',
              prefixIcon: const Icon(LucideIcons.search, size: 16),
              filled: true,
              fillColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                ),
              ),
            ),
            onChanged: (val) {
              setState(() {
                _searchQuery = val;
                _filterList();
              });
            },
          ),
        ),

        // Category Pills
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Row(
            children: ['ALL', 'UTILITY', 'MARKETING', 'AUTHENTICATION'].map((cat) {
              final isSel = _selectedCategory == cat;
              return Padding(
                padding: const EdgeInsets.only(right: 6),
                child: FilterChip(
                  label: Text(cat),
                  selected: isSel,
                  selectedColor: AppColors.primary,
                  checkmarkColor: Colors.white,
                  showCheckmark: false,
                  labelStyle: AppTypography.caption(
                    color: isSel ? Colors.white : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                    fontSize: 10,
                    fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                  ),
                  onSelected: (_) {
                    setState(() {
                      _selectedCategory = cat;
                      _filterList();
                    });
                  },
                ),
              );
            }).toList(),
          ),
        ),

        // Templates List
        Expanded(
          child: _filteredTemplates.isEmpty
              ? Center(
                  child: Text(
                    'No templates match your search.',
                    style: AppTypography.bodySmall(),
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _filteredTemplates.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final t = _filteredTemplates[index];
                    return InkWell(
                      onTap: () => _selectTemplate(t),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    t.name,
                                    style: AppTypography.bodyRegular(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: t.category == 'MARKETING'
                                        ? Colors.purple.withOpacity(0.15)
                                        : Colors.blue.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    t.category,
                                    style: AppTypography.caption(
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      color: t.category == 'MARKETING' ? Colors.purple : Colors.blue,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              t.bodyText,
                              style: AppTypography.bodySmall(
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildParameterConfigurator(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final template = _selectedTemplate!;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            template.name,
            style: AppTypography.headingSmall(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),

          // Live Preview Box
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: const Color(0xFF25D366).withOpacity(0.5),
                width: 1.2,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(LucideIcons.eye, size: 14, color: Color(0xFF25D366)),
                    const SizedBox(width: 6),
                    Text(
                      'Live WhatsApp Preview',
                      style: AppTypography.caption(
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF25D366),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  _getInterpolatedPreview(),
                  style: AppTypography.bodyRegular(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Dynamic Parameter Inputs
          if (template.parameterNames.isNotEmpty) ...[
            Text(
              'Fill Template Variables',
              style: AppTypography.bodySmall(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 10),
            ...template.parameterNames.map((param) {
              final controller = _paramControllers[param]!;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: TextField(
                  controller: controller,
                  style: AppTypography.bodyRegular(),
                  decoration: InputDecoration(
                    labelText: 'Parameter {{$param}}',
                    hintText: 'Enter value for {{$param}} (e.g. Customer Name, Order #)',
                    isDense: true,
                    filled: true,
                    fillColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(
                        color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                      ),
                    ),
                  ),
                ),
              );
            }),
            const SizedBox(height: 16),
          ],

          // Send Action Button
          BotifyButton(
            text: 'Send WhatsApp Template',
            icon: LucideIcons.send,
            onPressed: _handleSendTemplate,
          ),
        ],
      ),
    );
  }
}
