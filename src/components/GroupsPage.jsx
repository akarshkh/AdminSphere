import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Users, Shield, Globe, Mail, Search, AlertCircle } from 'lucide-react';

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
            setLoading(true);
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
                setError("Failed to synchronize organization groups from Microsoft Graph.");
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
        { label: 'M365 Groups', value: m365Count, icon: Globe, color: 'blue', type: 'Unified' },
        { label: 'Security Groups', value: securityCount, icon: Shield, color: 'purple', type: 'Security' },
        { label: 'Distribution Lists', value: distributionCount, icon: Mail, color: 'green', type: 'Distribution' },
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

    return (
        <div className="app-container">
            <div className="main-content">
                <button
                    onClick={() => navigate('/service/admin')}
                    className="btn-back"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Admin</span>
                </button>

                <div className="mb-10">
                    <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                        Directory Groups
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Management and visibility for all organizational security and mail distributions</p>
                </div>

                {error && (
                    <div style={{ marginBottom: '32px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
                        <AlertCircle size={24} />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin" size={48} color="var(--accent-blue)" />
                        <p style={{ color: 'var(--text-secondary)' }}>Retrieving directory graph data...</p>
                    </div>
                ) : (
                    <>
                        {/* Group Stats Tiles */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="stats-grid mb-12"
                        >
                            {stats.map((stat, i) => (
                                <div
                                    key={i}
                                    onClick={() => setFilterType(filterType === stat.type ? null : stat.type)}
                                    className={`glass stat-card glass-hover relative overflow-hidden cursor-pointer transition-all ${filterType === stat.type ? 'ring-2 ring-blue-500/50' : ''}`}
                                    style={{ borderLeft: `4px solid var(--accent-${stat.color})` }}
                                >
                                    <div className="ambient-glow" style={{ background: `var(--accent-${stat.color})`, width: '100px', height: '100px', top: '-50px', right: '-50px', opacity: 0.1 }} />
                                    <p className="stat-label">{stat.label}</p>
                                    <h3 className="stat-value">{stat.value}</h3>
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="badge" style={{ background: `rgba(var(--accent-${stat.color}-rgb), 0.1)`, color: `var(--accent-${stat.color})`, fontSize: '10px' }}>
                                            {stat.type} Members
                                        </div>
                                        <stat.icon size={16} style={{ color: `var(--accent-${stat.color})`, opacity: 0.5 }} />
                                    </div>
                                </div>
                            ))}
                        </motion.div>

                        <div className="glass" style={{ padding: '32px' }}>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold">Group Directory</h3>
                                <div className="flex items-center gap-4">
                                    <div style={{ position: 'relative' }}>
                                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                        <input
                                            type="text"
                                            placeholder="Search groups..."
                                            value={filterText}
                                            onChange={(e) => setFilterText(e.target.value)}
                                            className="glass"
                                            style={{ padding: '10px 16px 10px 40px', borderRadius: '12px', fontSize: '0.875rem', width: '280px' }}
                                        />
                                    </div>
                                    {filterType && (
                                        <button
                                            onClick={() => setFilterType(null)}
                                            className="badge badge-secondary cursor-pointer hover:bg-white/10"
                                            style={{ textTransform: 'none' }}
                                        >
                                            Clear Filter: {filterType} ×
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Display Name</th>
                                            <th>Email</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredGroups.length > 0 ? filteredGroups.map((group) => (
                                            <tr key={group.id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="avatar" style={{ background: 'rgba(59, 130, 246, 0.05)', color: 'var(--accent-blue)', width: '32px', height: '32px' }}>
                                                            <Users size={14} />
                                                        </div>
                                                        <span style={{ fontWeight: 600 }}>{group.displayName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ color: 'var(--text-secondary)' }}>
                                                    {group.mail || <span style={{ opacity: 0.3, fontStyle: 'italic' }}>No Email</span>}
                                                </td>
                                                <td>
                                                    <span className={`badge ${group.groupTypes?.includes('Unified') ? 'badge-primary' :
                                                        group.securityEnabled ? 'badge-purple' : 'badge-success'
                                                        }`} style={{ fontSize: '10px' }}>
                                                        {group.groupTypes?.includes('Unified') ? 'M365 Group' :
                                                            group.securityEnabled ? 'Security' : 'Distribution'}
                                                    </span>
                                                </td>
                                                <td style={{ color: 'var(--text-dim)', fontSize: '0.875rem', maxWidth: '300px' }} className="truncate">
                                                    {group.description || <span style={{ opacity: 0.3 }}>-</span>}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" style={{ padding: '80px', textAlign: 'center' }}>
                                                    <div className="flex flex-col items-center gap-4 text-muted">
                                                        <Search size={48} opacity={0.2} />
                                                        <p>No groups matching your search or filters.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default GroupsPage;
