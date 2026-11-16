import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import ClientLayout from '@/Layouts/ClientLayout';
import {
    Database, Globe, Server, ShoppingCart, Cloud, Users,
    RefreshCw, Plus, CheckCircle2, AlertCircle, Trash2, ArrowUpRight,
    Search, BarChart2, Zap, FileText, ExternalLink, HelpCircle
} from 'lucide-react';

const CONNECTOR_PRESETS = [
    { type: 'rest_api', title: 'REST API Connector', icon: Globe, desc: 'Connect any JSON API (products, catalog, prices, docs).' },
    { type: 'mysql', title: 'MySQL / PostgreSQL Database', icon: Server, desc: 'Query and sync inventory, customers, or transactions directly.' },
    { type: 'shopify', title: 'Shopify Store Connector', icon: ShoppingCart, desc: 'Auto-sync products, stock levels, variants, and collections.' },
    { type: 'woocommerce', title: 'WooCommerce Store', icon: ShoppingCart, desc: 'Sync WP WooCommerce catalog, categories, and inventory.' },
    { type: 'google_drive', title: 'Google Drive & Dropbox', icon: Cloud, desc: 'Train AI on company PDFs, spreadsheets, and manuals.' },
    { type: 'hubspot', title: 'HubSpot / Salesforce CRM', icon: Users, desc: 'Help your AI understand customer history and deals.' },
];

export default function KnowledgeHubIndex({ sources = [], nativeDocs = [], analytics = {} }) {
    const [selectedTab, setSelectedTab] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        type: 'rest_api',
        name: '',
        sync_frequency: 'daily',
        connection_details: {
            url: '',
            token: '',
            host: '127.0.0.1',
            port: 3306,
            database: '',
            username: '',
            password: '',
            table: '',
            store_url: '',
            access_token: '',
            consumer_key: '',
            consumer_secret: '',
            provider: 'google_drive',
            crm: 'hubspot',
        },
    });

    const handleOpenModal = (type = 'rest_api') => {
        setData('type', type);
        setData('name', CONNECTOR_PRESETS.find(p => p.type === type)?.title || 'New Knowledge Source');
        setTestResult(null);
        setIsModalOpen(true);
    };

    const handleDetailChange = (key, value) => {
        setData('connection_details', {
            ...data.connection_details,
            [key]: value,
        });
    };

    const handleTestConnection = async () => {
        setTestingConnection(true);
        setTestResult(null);
        try {
            const res = await axios.post(route('client.ai.knowledge-hub.test'), {
                type: data.type,
                connection_details: data.connection_details,
            });
            setTestResult(res.data);
        } catch (err) {
            setTestResult({ success: false, message: err.response?.data?.message || 'Connection test failed.' });
        } finally {
            setTestingConnection(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('client.ai.knowledge-hub.store'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        });
    };

    const handleSync = (id) => {
        router.post(route('client.ai.knowledge-hub.sync', id));
    };

    const handleDelete = (id, name) => {
        if (confirm(`Are you sure you want to delete the knowledge connector "${name}"?`)) {
            router.delete(route('client.ai.knowledge-hub.destroy', id));
        }
    };

    const filteredSources = selectedTab === 'all'
        ? sources
        : sources.filter(s => s.type.includes(selectedTab) || (selectedTab === 'database' && ['mysql', 'postgres', 'mongodb'].includes(s.type)));

    return (
        <ClientLayout>
            <Head title="AI Knowledge Hub & Multi-Source Connectors" />

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
                            <Zap className="h-4 w-4" />
                            <span>Enterprise Knowledge Engine</span>
                        </div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                            AI Knowledge Hub
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Connect external REST APIs, Databases, Shopify stores, Cloud drives, and CRMs. Your AI automatically learns and responds with live data.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => handleOpenModal('rest_api')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm shadow-sm transition"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Connect New Source</span>
                    </button>
                </div>

                {/* KPI Metrics Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Conversations</span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{analytics.total_conversations ?? 0}</span>
                            <span className="text-xs text-green-600 font-medium">Chatbot & Widget</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Leads Captured</span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{analytics.leads_generated ?? 0}</span>
                            <span className="text-xs text-teal-600 font-medium">{analytics.conversion_rate ?? 0}% conv.</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">AI Accuracy Rate</span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{analytics.ai_response_accuracy ?? 98.4}%</span>
                            <span className="text-xs text-neutral-400">({analytics.human_takeover_count ?? 0} handovers)</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm">
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Active Knowledge Items</span>
                        <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{analytics.total_knowledge_items ?? 0}</span>
                            <span className="text-xs text-neutral-400">Indexed for RAG</span>
                        </div>
                    </div>
                </div>

                {/* Preset Connectors Grid */}
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Available Integrations & Connectors
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {CONNECTOR_PRESETS.map((preset) => {
                            const IconComponent = preset.icon;
                            return (
                                <div
                                    key={preset.type}
                                    onClick={() => handleOpenModal(preset.type)}
                                    className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-teal-500 dark:hover:border-teal-500 cursor-pointer transition shadow-xs group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition">
                                            <IconComponent className="h-5 w-5" />
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-teal-600 transition" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                        {preset.title}
                                    </h4>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                        {preset.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Connected Knowledge Sources Table */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-teal-600" />
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                Connected Knowledge Sources ({sources.length})
                            </h3>
                        </div>
                    </div>

                    {sources.length === 0 ? (
                        <div className="p-8 text-center space-y-3">
                            <Server className="h-8 w-8 text-neutral-400 mx-auto" />
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                No external knowledge sources connected yet. Add a REST API, database, or Shopify store to supercharge your AI!
                            </p>
                            <button
                                type="button"
                                onClick={() => handleOpenModal('rest_api')}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white"
                            >
                                Connect First Source
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {sources.map((src) => (
                                <div key={src.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-teal-600">
                                            <Globe className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{src.name}</h4>
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300">
                                                    {src.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-neutral-500 mt-0.5">
                                                {src.documents_count || 0} indexed documents • Frequency: {src.sync_frequency} • Last synced: {src.last_sync ? new Date(src.last_sync).toLocaleString() : 'Never'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleSync(src.id)}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 inline-flex items-center gap-1.5"
                                        >
                                            <RefreshCw className="h-3 w-3 text-neutral-400" />
                                            Sync Now
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(src.id, src.name)}
                                            className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                                            title="Delete Connector"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Most Asked Customer Inquiries */}
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-teal-600" />
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                Most Asked Visitor Inquiries & Questions
                            </h3>
                        </div>
                        <span className="text-xs text-neutral-400">Live AI Analytics</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {(analytics.most_asked_questions || []).map((q, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2.5 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300"
                            >
                                <span className="h-5 w-5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {idx + 1}
                                </span>
                                <span className="truncate">{q}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal: Connect External Knowledge Source */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                                Connect Knowledge Source: {CONNECTOR_PRESETS.find(p => p.type === data.type)?.title || data.type}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-neutral-400 hover:text-neutral-600 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">
                                    Connector Name
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Production Catalog API"
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                                    required
                                />
                            </div>

                            {/* REST API Fields */}
                            {data.type === 'rest_api' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">
                                            Endpoint URL
                                        </label>
                                        <input
                                            type="url"
                                            value={data.connection_details.url}
                                            onChange={(e) => handleDetailChange('url', e.target.value)}
                                            placeholder="https://api.yourcompany.com/v1/products"
                                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">
                                            Bearer Auth Token (Optional)
                                        </label>
                                        <input
                                            type="password"
                                            value={data.connection_details.token}
                                            onChange={(e) => handleDetailChange('token', e.target.value)}
                                            placeholder="Bearer token or API secret"
                                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Database Fields */}
                            {['mysql', 'postgres', 'mongodb'].includes(data.type) && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Host & Port</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={data.connection_details.host}
                                                onChange={(e) => handleDetailChange('host', e.target.value)}
                                                placeholder="127.0.0.1"
                                                className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                            />
                                            <input
                                                type="number"
                                                value={data.connection_details.port}
                                                onChange={(e) => handleDetailChange('port', e.target.value)}
                                                placeholder="3306"
                                                className="w-24 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Database Name</label>
                                        <input
                                            type="text"
                                            value={data.connection_details.database}
                                            onChange={(e) => handleDetailChange('database', e.target.value)}
                                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Table Name</label>
                                        <input
                                            type="text"
                                            value={data.connection_details.table}
                                            onChange={(e) => handleDetailChange('table', e.target.value)}
                                            placeholder="e.g. products"
                                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Username</label>
                                        <input
                                            type="text"
                                            value={data.connection_details.username}
                                            onChange={(e) => handleDetailChange('username', e.target.value)}
                                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Password</label>
                                        <input
                                            type="password"
                                            value={data.connection_details.password}
                                            onChange={(e) => handleDetailChange('password', e.target.value)}
                                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* E-Commerce Fields */}
                            {(data.type === 'shopify' || data.type === 'woocommerce') && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">Store URL</label>
                                        <input
                                            type="url"
                                            value={data.connection_details.store_url}
                                            onChange={(e) => handleDetailChange('store_url', e.target.value)}
                                            placeholder="https://yourstore.myshopify.com"
                                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">API Access Token / Key</label>
                                        <input
                                            type="password"
                                            value={data.connection_details.access_token || data.connection_details.consumer_key}
                                            onChange={(e) => handleDetailChange('access_token', e.target.value)}
                                            placeholder="shpat_xxxx or ck_xxxx"
                                            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Cloud Storage & CRM */}
                            {(data.type === 'google_drive' || data.type === 'hubspot') && (
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">OAuth Access Token / API Key</label>
                                    <input
                                        type="password"
                                        value={data.connection_details.access_token}
                                        onChange={(e) => handleDetailChange('access_token', e.target.value)}
                                        placeholder="API Token or Secret Key"
                                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                        required
                                    />
                                </div>
                            )}

                            {/* Sync Frequency */}
                            <div>
                                <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">
                                    Auto-Sync Schedule
                                </label>
                                <select
                                    value={data.sync_frequency}
                                    onChange={(e) => setData('sync_frequency', e.target.value)}
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                >
                                    <option value="hourly">Hourly (Real-Time Catalog)</option>
                                    <option value="daily">Daily (Recommended)</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="manual">Manual Only</option>
                                </select>
                            </div>

                            {/* Test Connection Result */}
                            {testResult && (
                                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                                    testResult.success ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                                }`}>
                                    {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    <span>{testResult.message}</span>
                                </div>
                            )}

                            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={handleTestConnection}
                                    disabled={testingConnection}
                                    className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition disabled:opacity-50"
                                >
                                    {testingConnection ? 'Testing...' : 'Test Connection'}
                                </button>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-sm transition disabled:opacity-50"
                                    >
                                        {processing ? 'Connecting...' : 'Connect & Sync'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ClientLayout>
    );
}
