import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Filter, Download, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const ExchangeReport = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();

    const [reportData, setReportData] = useState([]);
    const [filterText, setFilterText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            const data = await graphService.getExchangeMailboxReport();
            setReportData(data);
        } catch (err) {
            console.error("Data Fetch Error:", err);
            setError("Failed to fetch real-time data from Microsoft Graph. Please check permissions.");
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [instance, accounts]);

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <header className="glass sticky top-0 z-40 rounded-none border-x-0 border-t-0 bg-black/40 backdrop-blur-xl px-8 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <button
                            onClick={() => navigate('/service/exchange')}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold font-['Outfit']">Exchange Mailbox Report</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={fetchData}
                            className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-sm font-medium"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
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

                <div className="glass p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold">
                            Mailbox Report (Real-time)
                        </h3>
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
                                        <th className="pb-4 font-semibold px-4">Display Name</th>
                                        <th className="pb-4 font-semibold px-4">Email Address</th>
                                        <th className="pb-4 font-semibold px-4 text-center">Archive Policy</th>
                                        <th className="pb-4 font-semibold px-4">Retention Policy</th>
                                        <th className="pb-4 font-semibold px-4 text-center">Auto Expanding</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {filteredData.length > 0 ? filteredData.map((report, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4 font-medium text-white/90">{report.displayName}</td>
                                            <td className="py-4 px-4 text-gray-400">{report.emailAddress}</td>
                                            <td className="py-4 px-4 text-center">
                                                {report.archivePolicy ?
                                                    <span className="inline-flex items-center space-x-1 text-green-400 bg-green-400/10 px-2 py-1 rounded-md text-[10px] font-bold border border-green-400/20">
                                                        <CheckCircle2 className="w-3 h-3" /> <span>ENABLED</span>
                                                    </span> :
                                                    <span className="inline-flex items-center space-x-1 text-gray-500 bg-gray-500/10 px-2 py-1 rounded-md text-[10px] font-bold border border-gray-500/20">
                                                        <XCircle className="w-3 h-3" /> <span>DISABLED</span>
                                                    </span>
                                                }
                                            </td>
                                            <td className="py-4 px-4 text-gray-300 italic">{report.retentionPolicy}</td>
                                            <td className="py-4 px-4 text-center">
                                                {report.autoExpanding ?
                                                    <span className="text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md text-[10px] font-bold border border-blue-400/20">YES</span> :
                                                    <span className="text-gray-500 bg-gray-500/10 px-2 py-1 rounded-md text-[10px] font-bold border border-gray-500/20">NO</span>
                                                }
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="py-20 text-center">
                                                <div className="flex flex-col items-center space-y-4">
                                                    <AlertCircle className="w-12 h-12 text-gray-600" />
                                                    <div className="text-gray-500 italic">No matching data found.</div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ExchangeReport;
