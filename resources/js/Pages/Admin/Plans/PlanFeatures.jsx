import { Button, Input, Toggle } from '@/Components/ui';
import { Plus, Trash2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PlanFeatures({
    features = [],
    featureToggles = {},
    featureDefinitions = {},
    onFeaturesChange,
    onTogglesChange,
}) {
    const { t } = useTranslation();
    const list = Array.isArray(features) ? [...features] : [];

    const addBullet = () => {
        onFeaturesChange([...list, '']);
    };

    const removeBullet = (index) => {
        onFeaturesChange(list.filter((_, i) => i !== index));
    };

    const updateBullet = (index, text) => {
        const next = [...list];
        next[index] = text;
        onFeaturesChange(next);
    };

    const handleToggle = (key, value) => {
        onTogglesChange({
            ...featureToggles,
            [key]: value,
        });
    };

    // Extract boolean features grouped by category
    const categorizedBooleans = {};
    Object.entries(featureDefinitions || {}).forEach(([cat, items]) => {
        const booleans = Object.entries(items || {}).filter(([_, def]) => def.type === 'boolean');
        if (booleans.length > 0) {
            categorizedBooleans[cat] = booleans;
        }
    });

    return (
        <div className="space-y-8">
            {/* 1. Dynamic Platform Capabilities (Permissions & Gates) */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            Dynamic Feature Entitlements
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Enable or disable access to specific platform systems and tools for this plan.
                        </p>
                    </div>
                </div>

                {Object.keys(categorizedBooleans).length === 0 ? (
                    <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-500 text-center">
                        No feature definitions loaded. All features enabled by default.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(categorizedBooleans).map(([category, items]) => (
                            <div key={category} className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-800">
                                <div className="bg-neutral-50 dark:bg-neutral-800/80 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                                        {category}
                                    </span>
                                </div>
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                    {items.map(([key, def]) => {
                                        const isEnabled = featureToggles[key] ?? def.default ?? false;
                                        return (
                                            <div
                                                key={key}
                                                className="p-3.5 flex items-center justify-between gap-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-750 transition"
                                            >
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                            {def.name}
                                                        </span>
                                                        {isEnabled ? (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">
                                                                Disabled
                                                            </span>
                                                        )}
                                                    </div>
                                                    {def.description && (
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl">
                                                            {def.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <Toggle
                                                    checked={isEnabled}
                                                    onChange={(checked) => handleToggle(key, checked)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. Marketing Feature Bullets (Pricing Page Display) */}
            <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        <div>
                            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                {t('admin.feature_list')} (Pricing Card Highlights)
                            </span>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Visible bullet points displayed with checkmarks on the public pricing tables.
                            </p>
                        </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addBullet}>
                        <Plus className="h-4 w-4 mr-1" />
                        {t('common.add')}
                    </Button>
                </div>

                <div className="space-y-2">
                    {list.map((text, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <Input
                                value={text}
                                onChange={(e) => updateBullet(index, e.target.value)}
                                placeholder="e.g. Dedicated Account Manager, 24/7 SLA Guarantee"
                                className="flex-1"
                            />
                            <button
                                type="button"
                                onClick={() => removeBullet(index)}
                                className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-red-600 dark:hover:bg-neutral-800 dark:hover:text-red-400 transition"
                                aria-label={t('admin.remove_feature')}
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {list.length === 0 && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 py-2 italic">
                            {t('admin.no_features_added')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
