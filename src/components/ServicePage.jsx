import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, RefreshCw, Filter, Download } from 'lucide-react';

const ServicePage = () => {
    const { serviceId } = useParams();
    const navigate = useNavigate();

    const serviceNames = {
        exchange: 'Exchange Online',
        entra: 'Microsoft Entra ID',
        intune: 'Microsoft Intune',
        purview: 'Microsoft Purview',
        licensing: 'Licensing & Billing'
    };

    const name = serviceNames[serviceId] || 'Service Module';

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

                    <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-sm font-medium">
                            <RefreshCw className="w-4 h-4" />
                            <span>Refresh</span>
                        </button>
                        <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-sm font-medium">
                            <Settings className="w-4 h-4" />
                            <span>Configure</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                >
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass p-6">
                            <p className="text-gray-400 text-sm mb-1">Total Resources</p>
                            <p className="text-3xl font-bold">1,{i * 242}</p>
                            <div className="mt-4 flex items-center text-xs text-green-400">
                                <span className="font-bold">+12%</span>
                                <span className="ml-2 text-gray-500 text-[10px] uppercase tracking-wider">vs last month</span>
                            </div>
                        </div>
                    ))}
                </motion.div>

                <div className="glass p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold">Latest Reports</h3>
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Filter data..."
                                    className="bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50"
                                />
                            </div>
                            <button className="p-2 hover:bg-white/10 rounded-lg border border-white/10">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
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
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                                                    UR
                                                </div>
                                                <span className="font-medium text-white/90">User Resource {i}</span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-md text-[10px] uppercase font-bold border border-green-500/20">
                                                Active
                                            </span>
                                        </td>
                                        <td className="py-4 text-gray-400">Policy modification detected</td>
                                        <td className="py-4 text-gray-500">2h ago</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ServicePage;
