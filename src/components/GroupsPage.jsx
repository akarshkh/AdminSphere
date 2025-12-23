import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { Loader2, ArrowLeft, Users, Shield, Globe, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const GroupsPage = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterText, setFilterText] = useState('');
    const [filterType, setFilterType] = useState(null);

    useEffect(() => {
        const fetchGroups = async () => {
            if (accounts.length === 0) return;
            try {
                const response = await instance.acquireTokenSilent({
                    ...loginRequest,
                    account: accounts[0]
                });
                const graphService = new GraphService(response.accessToken);
                const data = await graphService.getGroups();
                setGroups(data);
            } catch (err) {
                console.error("Error fetching groups:", err);
                setError("Failed to load groups.");
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, [instance, accounts]);

    const m365Count = groups.filter(g => g.groupTypes?.includes('Unified')).length;
    const securityCount = groups.filter(g => g.securityEnabled && !g.groupTypes?.includes('Unified')).length;
    const distributionCount = groups.filter(g => g.mailEnabled && !g.securityEnabled && !g.groupTypes?.includes('Unified')).length;

    const stats = [
        { label: 'M365 Groups', value: m365Count, icon: Globe, color: 'text-blue-400', type: 'Unified', borderColor: 'border-blue-500' },
        { label: 'Security Groups', value: securityCount, icon: Shield, color: 'text-purple-400', type: 'Security', borderColor: 'border-purple-500' },
        { label: 'Distribution Lists', value: distributionCount, icon: Mail, color: 'text-green-400', type: 'Distribution', borderColor: 'border-green-500' },
    ];

    const filteredGroups = groups.filter(group => {
        const searchStr = filterText.toLowerCase();
        const matchesText = (group.displayName?.toLowerCase() || '').includes(searchStr) ||
            (group.mail?.toLowerCase() || '').includes(searchStr);

        if (!matchesText) return false;

        if (filterType === 'Unified') return group.groupTypes?.includes('Unified');
        if (filterType === 'Security') return group.securityEnabled && !group.groupTypes?.includes('Unified');
        if (filterType === 'Distribution') return group.mailEnabled && !group.securityEnabled && !group.groupTypes?.includes('Unified');

        return true;
    });

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
                    Groups
                </h1>
                <p className="text-sm text-gray-400">Manage your organization's groups and distribution lists.</p>
            </div>

            {/* Group Stats Tiles */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        onClick={() => setFilterType(filterType === stat.type ? null : stat.type)}
                        className={`glass p-6 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] border ${filterType === stat.type ? `${stat.borderColor} bg-white/10` : 'border-transparent hover:bg-white/5'}`}
                    >
                        <div>
                            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                            <p className="text-3xl font-bold">{stat.value}</p>
                        </div>
                        <div className={`mt-4 p-2 bg-white/5 rounded-lg w-fit ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                    </div>
                ))}
            </motion.div>

            <div className="glass-panel rounded-xl overflow-hidden border border-white/10 relative min-h-[400px]">
                <div className="p-4 border-b border-white/10 flex justify-end">
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-sm focus:outline-none focus:border-blue-500/50 w-64"
                    />
                </div>
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                        <tr className="text-gray-400 text-sm uppercase tracking-wider">
                            <th className="pb-4 pt-4 px-6 font-semibold">Display Name</th>
                            <th className="pb-4 pt-4 px-6 font-semibold">Email</th>
                            <th className="pb-4 pt-4 px-6 font-semibold">Type</th>
                            <th className="pb-4 pt-4 px-6 font-semibold">Description</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {filteredGroups.length > 0 ? filteredGroups.map((group) => (
                            <tr key={group.id} className="hover:bg-white/5 transition-colors">
                                <td className="py-4 px-6 font-medium flex items-center space-x-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <span>{group.displayName}</span>
                                </td>
                                <td className="py-4 px-6 text-gray-300">
                                    {group.mail || <span className="text-gray-500 italic">No Email</span>}
                                </td>
                                <td className="py-4 px-6">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${group.groupTypes?.includes('Unified') ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                        group.securityEnabled ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                            'bg-green-500/10 text-green-400 border-green-500/20'
                                        }`}>
                                        {group.groupTypes?.includes('Unified') ? 'M365 Group' :
                                            group.securityEnabled ? 'Security' : 'Distribution'}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-gray-400 truncate max-w-xs">
                                    {group.description || '-'}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="py-8 text-center text-gray-500">
                                    No groups found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GroupsPage;
