import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { Loader2, ArrowLeft, Users, Shield, Globe, Mail, Search } from 'lucide-react';
import styles from './DetailPage.module.css';

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

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className="animate-spin" style={{ width: '2.5rem', height: '2.5rem', color: '#3b82f6' }} />
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <button onClick={() => navigate('/service/admin')} className={styles.backButton}>
                    <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Back to Dashboard
                </button>

                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>
                        <Users style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
                        Groups
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Manage Microsoft 365 groups, security groups, and distribution lists
                    </p>
                </div>

                {error && (
                    <div className={`${styles.alert} ${styles.alertError}`}>
                        <span>{error}</span>
                    </div>
                )}

                <div className={styles.statsGrid}>
                    <div
                        className={styles.statCard}
                        onClick={() => setFilterType(filterType === 'Unified' ? null : 'Unified')}
                        style={{ cursor: 'pointer', borderColor: filterType === 'Unified' ? '#3b82f6' : 'transparent' }}
                    >
                        <div className={styles.statLabel}>
                            <Globe style={{ width: '1.125rem', height: '1.125rem' }} />
                            M365 Groups
                        </div>
                        <div className={styles.statValue} style={{ color: '#3b82f6' }}>{m365Count}</div>
                    </div>
                    <div
                        className={styles.statCard}
                        onClick={() => setFilterType(filterType === 'Security' ? null : 'Security')}
                        style={{ cursor: 'pointer', borderColor: filterType === 'Security' ? '#a855f7' : 'transparent' }}
                    >
                        <div className={styles.statLabel}>
                            <Shield style={{ width: '1.125rem', height: '1.125rem' }} />
                            Security Groups
                        </div>
                        <div className={styles.statValue} style={{ color: '#a855f7' }}>{securityCount}</div>
                    </div>
                    <div
                        className={styles.statCard}
                        onClick={() => setFilterType(filterType === 'Distribution' ? null : 'Distribution')}
                        style={{ cursor: 'pointer', borderColor: filterType === 'Distribution' ? '#22c55e' : 'transparent' }}
                    >
                        <div className={styles.statLabel}>
                            <Mail style={{ width: '1.125rem', height: '1.125rem' }} />
                            Distribution Lists
                        </div>
                        <div className={styles.statValue} style={{ color: '#22c55e' }}>{distributionCount}</div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <Users style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
                            Groups List
                        </h2>
                        <div style={{ position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#6b7280' }} />
                            <input
                                type="text"
                                placeholder="Search groups..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className={styles.filterInput}
                                style={{ paddingLeft: '2.5rem', minWidth: '250px' }}
                            />
                        </div>
                    </div>

                    {filteredGroups.length > 0 ? (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th>Display Name</th>
                                        <th>Email</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredGroups.map((group) => (
                                        <tr key={group.id} className={styles.tableRow}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '0.5rem' }}>
                                                        <Users style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />
                                                    </div>
                                                    <span style={{ fontWeight: 500, color: 'white' }}>{group.displayName}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: '#d1d5db', fontSize: '0.875rem' }}>
                                                {group.mail || <span style={{ color: '#6b7280', fontStyle: 'italic' }}>No Email</span>}
                                            </td>
                                            <td>
                                                {group.groupTypes?.includes('Unified') ? (
                                                    <span className={`${styles.badge} ${styles.badgeInfo}`}>M365 Group</span>
                                                ) : group.securityEnabled ? (
                                                    <span className={`${styles.badge}`} style={{ background: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)', color: '#a855f7' }}>Security</span>
                                                ) : (
                                                    <span className={`${styles.badge} ${styles.badgeSuccess}`}>Distribution</span>
                                                )}
                                            </td>
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
                            <div className={styles.emptyIcon}>
                                <Users style={{ width: '2.5rem', height: '2.5rem', color: '#6b7280' }} />
                            </div>
                            <h3 className={styles.emptyTitle}>No Groups Found</h3>
                            <p className={styles.emptyDescription}>
                                {filterText || filterType
                                    ? `No groups match your current filters`
                                    : "No groups are configured in your organization."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupsPage;
