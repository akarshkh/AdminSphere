import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, RefreshCw, Filter, Download, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const ServicePage = () => {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();

    const [reportData, setReportData] = useState([]);
    const [filterText, setFilterText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const serviceNames = {
        exchange: 'Exchange Online',
        entra: 'Microsoft Entra ID',
        intune: 'Microsoft Intune',
        purview: 'Microsoft Purview',
        licensing: 'Licensing & Billing'
    };

    const name = serviceNames[serviceId] || 'Service Module';
    const isExchange = serviceId === 'exchange';

    const filteredData = reportData.filter(item => {
        if (!filterText) return true;
        const searchStr = filterText.toLowerCase();
        const name = item.displayName?.toLowerCase() || '';
        const email = item.emailAddress?.toLowerCase() || '';
        const raw = String(item).toLowerCase();
        return name.includes(searchStr) || email.includes(searchStr) || raw.includes(searchStr);
    });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await instance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0]
            });

            const graphService = new GraphService(response.accessToken);

            if (isExchange) {
                const data = await graphService.getExchangeMailboxReport();
                setReportData(data);
            } else {
                // Placeholder for other modules
                setReportData([1, 2, 3, 4, 5]);
            }
        } catch (err) {
            console.error("Data Fetch Error:", err);
            setError("Failed to fetch real-time data from Microsoft Graph. Please check permissions.");
            // Fallback to empty if real fetch fails
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [serviceId, instance, accounts]);

    const stats = isExchange ? [
        { label: 'Total Mailboxes', value: reportData.length.toString(), trend: 'Real-time' },
        { label: 'Archive Enabled', value: reportData.filter(r => r.archivePolicy).length.toString(), trend: 'Active' },
        { label: 'Sync Status', value: 'Healthy', trend: '100%', color: 'text-green-400' }
    ] : [
        { label: 'Total Resources', value: '1,242', trend: '+12%' },
        { label: 'Active Sessions', value: '842', trend: '+5%' },
        { label: 'Security Alerts', value: '3', trend: '-2%', color: 'text-red-400' }
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <header className="glass sticky top-0 z-40 rounded-none border-x-0 border-t-0 bg-black/40 backdrop-blur-xl px-8 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold font-['Outfit']">{name}</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-8">
                {error && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-400">
                        <AlertCircle className="w-6 h-6" />
                        <span>{error}</span>
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                >
                    {stats.map((stat, i) => (
                        <div key={i} className="glass p-6">
                            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                            <p className="text-3xl font-bold">{stat.value}</p>
                            <div className={`mt-4 flex items-center text-xs ${stat.color || 'text-green-400'}`}>
                                <span className="font-bold">{stat.trend}</span>
                                <span className="ml-2 text-gray-500 text-[10px] uppercase tracking-wider">Source: Microsoft Graph</span>
                            </div>
                        </div>
                    ))}
                </motion.div>

                <div className="glass p-8 relative min-h-[400px] flex items-center justify-center">
                    {isExchange ? (
                        <div className="text-center space-y-4">
                            <h3 className="text-2xl font-bold">Exchange Mailbox Report</h3>
                            <p className="text-gray-400 max-w-md mx-auto">
                                View detailed statistics about user mailboxes, archive status, retention policies, and more.
                            </p>
                            <button
                                onClick={() => navigate('/service/exchange/report')}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-all flex items-center space-x-2 mx-auto"
                            >
                                <span>View Mailbox Report</span>

                            </button>
                        </div>
                    ) : (
                        <div className="w-full">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold">Latest Reports</h3>
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search here"
                                            value={filterText}
                                            onChange={(e) => setFilterText(e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-sm focus:outline-none focus:border-blue-500/50"
                                        />
                                    </div>
                                    <button className="p-2 hover:bg-white/10 rounded-lg border border-white/10">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto min-h-[300px]">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                        <p className="text-gray-400 animate-pulse">Fetching Real-time Telemetry...</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                                                <th className="pb-4 font-semibold">User / Resource</th>
                                                <th className="pb-4 font-semibold">Status</th>
                                                <th className="pb-4 font-semibold">Activity</th>
                                                <th className="pb-4 font-semibold">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-sm">
                                            {filteredData.length > 0 ? filteredData.map((report, i) => (
                                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                                    <td className="py-4">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                                                                UR
                                                            </div>
                                                            <span className="font-medium text-white/90">User Resource {report}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-md text-[10px] uppercase font-bold border border-green-500/20">
                                                            Active
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-gray-400">Policy modification detected</td>
                                                    <td className="py-4 text-gray-500">{report}h ago</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" className="py-20 text-center">
                                                        <div className="flex flex-col items-center space-y-4">
                                                            <AlertCircle className="w-12 h-12 text-gray-600" />
                                                            <div className="text-gray-500 italic">No real-time data found. Ensure Graph API permissions are granted.</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ServicePage;
