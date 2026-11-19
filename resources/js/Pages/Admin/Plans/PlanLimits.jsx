import { Button, Input } from '@/Components/ui';
import { Gauge, Infinity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PlanLimits({
    limits = {},
    featureDefinitions = {},
    onChange,
}) {
    const { t } = useTranslation();

    const update = (key, val) => {
        const next = {
            ...limits,
            [key]: val === '' || val === null || val === undefined ? null : Number(val),
        };
        onChange(next);
    };

    // Extract caps and metered limits grouped by category
    const categorizedLimits = {};
    Object.entries(featureDefinitions || {}).forEach(([cat, items]) => {
        const numLimits = Object.entries(items || {}).filter(
            ([_, def]) => def.type === 'cap' || def.type === 'metered'
        );
        if (numLimits.length > 0) {
            categorizedLimits[cat] = numLimits;
        }
    });

    // Fallback if featureDefinitions not loaded
    const fallbackLimits = [
        { key: 'max_whatsapp_accounts', name: 'Max Connected WhatsApp Numbers', cat: 'WhatsApp Connectivity', def: 2 },
        { key: 'whatsapp_messages_per_month', name: 'Monthly WhatsApp Messages', cat: 'WhatsApp Connectivity', def: 1000 },
        { key: 'whatsapp_templates', name: 'Max WhatsApp Approved Templates', cat: 'WhatsApp Connectivity', def: 10 },
        { key: 'max_chatbots', name: 'Max Active AI Chatbots', cat: 'Artificial Intelligence', def: 3 },
        { key: 'max_knowledge_sources', name: 'Max Knowledge Sources', cat: 'Artificial Intelligence', def: 10 },
        { key: 'ai_tokens_per_month', name: 'Monthly AI Tokens / Credits', cat: 'Artificial Intelligence', def: 250000 },
        { key: 'users', name: 'Team Seats (Users)', cat: 'Inbox & Team', def: 3 },
        { key: 'inbox_agents', name: 'Max Inbox Agents', cat: 'Inbox & Team', def: 5 },
        { key: 'storage', name: 'Media & File Storage (MB)', cat: 'Platform & Enterprise', def: 1024 },
        { key: 'campaigns_per_month', name: 'Broadcast Campaigns / mo', cat: 'Marketing & Campaigns', def: 10 },
        { key: 'sms_per_month', name: 'Monthly SMS Messages', cat: 'Marketing & Campaigns', def: 100 },
        { key: 'emails_per_month', name: 'Monthly Marketing Emails', cat: 'Marketing & Campaigns', def: 5000 },
        { key: 'max_contacts', name: 'Max CRM Contacts Capacity', cat: 'CRM & Leads', def: 2500 },
        { key: 'lead_credits_per_month', name: 'Monthly Lead Credits', cat: 'CRM & Leads', def: 50 },
        { key: 'automations', name: 'Max Active Automations', cat: 'Automations', def: 5 },
        { key: 'social_accounts', name: 'Connected Social Accounts', cat: 'Social Marketing', def: 3 },
        { key: 'social_posts_per_month', name: 'Monthly Social Posts', cat: 'Social Marketing', def: 30 },
    ];

    const hasDefinitions = Object.keys(categorizedLimits).length > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-2">
                <div className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            Usage Caps & Monthly Quotas
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Leave any field blank or empty to grant completely unlimited access.
                        </p>
                    </div>
                </div>
            </div>

            {hasDefinitions ? (
                <div className="space-y-6">
                    {Object.entries(categorizedLimits).map(([category, items]) => (
                        <div key={category} className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-800">
                            <div className="bg-neutral-50 dark:bg-neutral-800/80 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                                <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                                    {category}
                                </span>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {items.map(([key, def]) => {
                                    const val = limits[key];
                                    const isUnlimited = val === null || val === '' || val === undefined;
                                    return (
                                        <div key={key} className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                                    {def.name}
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => update(key, isUnlimited ? (def.default ?? 10) : null)}
                                                    className={`text-[11px] font-medium px-1.5 py-0.5 rounded transition ${
                                                        isUnlimited
                                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                                            : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                                    }`}
                                                >
                                                    {isUnlimited ? '∞ Unlimited' : 'Set Unlimited'}
                                                </button>
                                            </div>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={val ?? ''}
                                                onChange={(e) => update(key, e.target.value)}
                                                placeholder="Unlimited (∞)"
                                                className="text-sm"
                                            />
                                            {def.description && (
                                                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 line-clamp-1">
                                                    {def.description}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fallbackLimits.map((item) => {
                        const val = limits[item.key];
                        const isUnlimited = val === null || val === '' || val === undefined;
                        return (
                            <div key={item.key} className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                        {item.name}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => update(item.key, isUnlimited ? item.def : null)}
                                        className="text-[11px] text-indigo-600 hover:underline"
                                    >
                                        {isUnlimited ? '∞ Unlimited' : 'Set Unlimited'}
                                    </button>
                                </div>
                                <Input
                                    type="number"
                                    min={0}
                                    value={val ?? ''}
                                    onChange={(e) => update(item.key, e.target.value)}
                                    placeholder="Unlimited (∞)"
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
