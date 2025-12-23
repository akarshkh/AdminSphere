import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { Loader2, CheckCircle2, XCircle, Globe, ShieldCheck, ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const DomainsPage = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDomains = async () => {
            if (accounts.length === 0) return;
            try {
                const response = await instance.acquireTokenSilent({
                    ...loginRequest,
                    account: accounts[0]
                });
                const graphService = new GraphService(response.accessToken);
                const data = await graphService.getDomains();
                setDomains(data);
            } catch (err) {
                console.error("Error fetching domains:", err);
                setError("Failed to load domains.");
            } finally {
                setLoading(false);
            }
        };

        fetchDomains();
    }, [instance, accounts]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh] text-blue-400">
            <Loader2 className="w-10 h-10 animate-spin" />
        </div>
    );

    if (error) return (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400">
            {error}
        </div>
    );

    return (
        <div className="w-full text-white">
            <button
                onClick={() => navigate('/service/admin')}
                className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Admin
            </button>
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-['Outfit'] bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight mb-2">
                    Domains
                </h1>
                <p className="text-sm text-gray-400">Manage and verify your verified domains.</p>
            </div>

            <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr className="text-gray-400 text-sm uppercase tracking-wider">
                            <th className="pb-4 pt-4 px-6 font-semibold">Domain Name</th>
                            <th className="pb-4 pt-4 px-6 font-semibold">Status</th>
                            <th className="pb-4 pt-4 px-6 font-semibold">Authentication</th>
                            <th className="pb-4 pt-4 px-6 font-semibold text-center">Default</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {domains.map((domain) => (
                            <tr key={domain.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-4 px-6 font-medium flex items-center space-x-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                        <Globe className="w-4 h-4" />
                                    </div>
                                    <span>{domain.id}</span>
                                </td>
                                <td className="py-4 px-6">
                                    {domain.state === 'Verified' ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                            <ShieldAlert className="w-3 h-3 mr-1" />
                                            {domain.state}
                                        </span>
                                    )}
                                </td>
                                <td className="py-4 px-6 text-gray-300">
                                    {domain.authenticationType}
                                </td>
                                <td className="py-4 px-6 text-center">
                                    {domain.isDefault && (
                                        <span className="inline-flex items-center justify-center p-1 bg-blue-500 text-white rounded-full">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DomainsPage;
