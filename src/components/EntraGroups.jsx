import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { ArrowLeft, Search, Download, Users, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const EntraGroups = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                if (accounts.length > 0) {
                    const response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0]
                    });
                    const graphService = new GraphService(response.accessToken);
                    const data = await graphService.getGroups();
                    setGroups(data || []);
                }
            } catch (error) {
                console.error("Failed to fetch groups", error);
            } finally {
                setLoading(false);
            }
        };
        if (accounts.length > 0) {
            fetchGroups();
        }
    }, [accounts, instance]);

    const sortedGroups = React.useMemo(() => {
        let sortableItems = [...groups];
        if (filterText) {
            sortableItems = sortableItems.filter(g =>
                g.displayName?.toLowerCase().includes(filterText.toLowerCase()) ||
                g.mail?.toLowerCase().includes(filterText.toLowerCase())
            );
        }
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key] || '';
                const bVal = b[sortConfig.key] || '';
                if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [groups, filterText, sortConfig]);

    const getGroupType = (group) => {
        if (group.groupTypes?.includes('Unified')) return { label: 'Microsoft 365', class: 'badge-success' };
        if (group.securityEnabled && !group.mailEnabled) return { label: 'Security', class: 'badge-secondary' };
        if (group.mailEnabled && !group.securityEnabled) return { label: 'Distribution', class: 'badge-secondary' };
        if (group.mailEnabled && group.securityEnabled) return { label: 'Mail-Enabled Security', class: 'badge-secondary' };
        return { label: 'Other', class: 'badge-secondary' };
    };

    const handleDownloadCSV = () => {
        const headers = ['Display Name', 'Email', 'Type', 'Description', 'Created Date'];
        const rows = sortedGroups.map(g => [
            `"${g.displayName}"`,
            `"${g.mail || ''}"`,
            `"${getGroupType(g).label}"`,
            `"${g.description || ''}"`,
            `"${g.createdDateTime || ''}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'entra_groups.csv';
        link.click();
    };

    return (
        <div className="app-container">
            <div className="main-content">
                <button
                    onClick={() => navigate('/service/entra')}
                    className="btn-back"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Entra ID</span>
                </button>

                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                            Groups
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Management and lifecycle monitoring for directory groups</p>
                    </div>
                    <div className="flex gap-4">
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
                        <button onClick={handleDownloadCSV} className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '0.875rem' }}>
                            <Download size={16} />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin" size={48} color="var(--accent-blue)" />
                        <p style={{ color: 'var(--text-secondary)' }}>Synchronizing directory groups...</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass"
                        style={{ padding: '32px' }}
                    >
                        <div className="table-container">
                            <table className="data-table">
                                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)' }}>
                                    <tr>
                                        <th style={{ cursor: 'pointer' }} onClick={() => requestSort('displayName')}>
                                            <div className="flex items-center gap-1">Display Name {sortConfig.key === 'displayName' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}</div>
                                        </th>
                                        <th style={{ cursor: 'pointer' }} onClick={() => requestSort('mail')}>
                                            <div className="flex items-center gap-1">Email {sortConfig.key === 'mail' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}</div>
                                        </th>
                                        <th>Type</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedGroups.length > 0 ? (
                                        sortedGroups.map((group, i) => {
                                            const type = getGroupType(group);
                                            return (
                                                <tr key={i}>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div className="avatar" style={{ background: 'rgba(99, 102, 241, 0.05)', color: 'var(--accent-indigo)', width: '32px', height: '32px' }}>
                                                                <Users size={14} />
                                                            </div>
                                                            <span style={{ fontWeight: 600 }}>{group.displayName}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{group.mail || '-'}</td>
                                                    <td>
                                                        <span className={`badge ${type.class}`} style={{ fontSize: '10px' }}>
                                                            {type.label}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                        <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {group.description || <span style={{ opacity: 0.3 }}>No description set</span>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '80px', textAlign: 'center' }}>
                                                <div className="flex flex-col items-center gap-4 text-muted">
                                                    <Search size={48} opacity={0.2} />
                                                    <p>No groups found matching your search.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default EntraGroups;
