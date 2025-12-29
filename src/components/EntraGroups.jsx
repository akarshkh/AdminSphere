import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { GroupsService } from '../services/entra';
import { ArrowLeft, Search, Download, UsersRound, Loader2 } from 'lucide-react';
import styles from './DetailPage.module.css';

const EntraGroups = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        const fetchGroups = async () => {
            if (accounts.length > 0) {
                try {
                    const response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0]
                    });
                    const client = new GraphService(response.accessToken).client;
                    const data = await GroupsService.getAllGroups(client, 100);
                    setGroups(data);
                } catch (error) {
                    console.error("Group fetch error:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchGroups();
    }, [accounts, instance]);

    const filteredGroups = groups.filter(group => {
        const matchesText = (group.displayName || '').toLowerCase().includes(filterText.toLowerCase());

        const isSecurity = group.securityEnabled;
        const isDist = group.mailEnabled && !group.securityEnabled;

        let matchesType = true;
        if (filterType === 'security') matchesType = isSecurity;
        if (filterType === 'distribution') matchesType = isDist;
        if (filterType === 'm365') matchesType = group.groupTypes?.includes('Unified');

        return matchesText && matchesType;
    });

    const getGroupType = (group) => {
        if (group.groupTypes?.includes('Unified')) return 'Microsoft 365';
        if (group.securityEnabled) return 'Security';
        if (group.mailEnabled) return 'Distribution';
        return 'Other';
    };

    const handleDownloadCSV = () => {
        const headers = ['Group Name', 'Email', 'Type', 'Description'];
        const rows = filteredGroups.map(g => [
            `"${g.displayName}"`,
            `"${g.mail || ''}"`,
            `"${getGroupType(g)}"`,
            `"${g.description || ''}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'entra_groups.csv';
        link.click();
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className="animate-spin" style={{ width: '2.5rem', height: '2.5rem', color: '#a855f7' }} />
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <button onClick={() => navigate('/service/entra')} className={styles.backButton}>
                    <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Back to Dashboard
                </button>

                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>
                        <UsersRound style={{ width: '2rem', height: '2rem', color: '#a855f7' }} />
                        Groups
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Manage security groups, distribution lists, and Microsoft 365 groups
                    </p>
                </div>

                <div className={styles.filterBar}>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={styles.filterInput} style={{ flex: 'initial', minWidth: '180px' }}>
                        <option value="all">All Types</option>
                        <option value="security">Security</option>
                        <option value="distribution">Distribution</option>
                        <option value="m365">Microsoft 365</option>
                    </select>

                    <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#6b7280' }} />
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className={styles.filterInput}
                            style={{ paddingLeft: '2.75rem' }}
                        />
                    </div>
                    <button onClick={handleDownloadCSV} className={`${styles.actionButton} ${styles.actionButtonSecondary}`}>
                        <Download style={{ width: '1rem', height: '1rem' }} />
                        Export
                    </button>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Groups Directory</h2>
                        <span className={`${styles.badge}`} style={{ background: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)', color: '#a855f7' }}>
                            {filteredGroups.length} GROUPS
                        </span>
                    </div>

                    {filteredGroups.length > 0 ? (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th>Group Name</th>
                                        <th>Type</th>
                                        <th>Email</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredGroups.map((group, i) => (
                                        <tr key={i} className={styles.tableRow}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <UsersRound style={{ width: '1rem', height: '1rem', color: '#a855f7' }} />
                                                    </div>
                                                    <span style={{ fontWeight: 500, color: 'white' }}>{group.displayName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {getGroupType(group) === 'Microsoft 365' ? (
                                                    <span className={`${styles.badge} ${styles.badgeInfo}`}>M365 Group</span>
                                                ) : getGroupType(group) === 'Security' ? (
                                                    <span className={`${styles.badge}`} style={{ background: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)', color: '#a855f7' }}>Security</span>
                                                ) : (
                                                    <span className={`${styles.badge} ${styles.badgeSuccess}`}>Distribution</span>
                                                )}
                                            </td>
                                            <td style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{group.mail || '-'}</td>
                                            <td style={{ color: '#9ca3af', fontSize: '0.875rem', maxWidth: '20rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {group.description || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon} style={{ background: 'rgba(168, 85, 247, 0.08)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                                <UsersRound style={{ width: '2.5rem', height: '2.5rem', color: '#a855f7' }} />
                            </div>
                            <h3 className={styles.emptyTitle}>No Groups Found</h3>
                            <p className={styles.emptyDescription}>
                                No groups match your current filters. Try adjusting your search criteria.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default EntraGroups;
