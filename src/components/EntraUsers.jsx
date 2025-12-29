import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { UsersService } from '../services/entra';
import { ArrowLeft, Search, Download, CheckCircle2, XCircle, Loader2, Users } from 'lucide-react';
import styles from './DetailPage.module.css';

const EntraUsers = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterLicense, setFilterLicense] = useState('all');

    useEffect(() => {
        const fetchUsers = async () => {
            if (accounts.length > 0) {
                try {
                    const response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0]
                    });
                    const client = new GraphService(response.accessToken).client;
                    const data = await UsersService.getAllUsers(client, 100);
                    setUsers(data);
                } catch (error) {
                    console.error("User fetch error:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchUsers();
    }, [accounts, instance]);

    const filteredUsers = users.filter(user => {
        const matchesText = (user.displayName || '').toLowerCase().includes(filterText.toLowerCase()) ||
            (user.userPrincipalName || '').toLowerCase().includes(filterText.toLowerCase());

        const matchesType = filterType === 'all' ||
            (filterType === 'guest' ? user.userType === 'Guest' : user.userType !== 'Guest');

        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'enabled' ? user.accountEnabled : !user.accountEnabled);

        const isLicensed = user.assignedLicenses && user.assignedLicenses.length > 0;
        const matchesLicense = filterLicense === 'all' ||
            (filterLicense === 'licensed' ? isLicensed : !isLicensed);

        return matchesText && matchesType && matchesStatus && matchesLicense;
    });

    const handleDownloadCSV = () => {
        const headers = ['Display Name', 'User Principal Name', 'User Type', 'Account Enabled', 'Licensed'];
        const rows = filteredUsers.map(u => [
            `"${u.displayName}"`,
            `"${u.userPrincipalName}"`,
            `"${u.userType || 'Member'}"`,
            u.accountEnabled,
            (u.assignedLicenses && u.assignedLicenses.length > 0) ? 'Yes' : 'No'
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'entra_users.csv';
        link.click();
    };

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
                <button onClick={() => navigate('/service/entra')} className={styles.backButton}>
                    <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Back to Dashboard
                </button>

                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>
                        <Users style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
                        All Users
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Manage user identities, access permissions, and account settings
                    </p>
                </div>

                <div className={styles.filterBar}>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={styles.filterInput} style={{ flex: 'initial', minWidth: '150px' }}>
                        <option value="all">All Types</option>
                        <option value="member">Members</option>
                        <option value="guest">Guests</option>
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={styles.filterInput} style={{ flex: 'initial', minWidth: '150px' }}>
                        <option value="all">All Status</option>
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                    </select>
                    <select value={filterLicense} onChange={(e) => setFilterLicense(e.target.value)} className={styles.filterInput} style={{ flex: 'initial', minWidth: '180px' }}>
                        <option value="all">All License States</option>
                        <option value="licensed">Licensed</option>
                        <option value="unlicensed">Unlicensed</option>
                    </select>

                    <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#6b7280' }} />
                        <input
                            type="text"
                            placeholder="Search users..."
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
                        <h2 className={styles.cardTitle}>Users Directory</h2>
                        <span className={`${styles.badge} ${styles.badgeInfo}`}>
                            {filteredUsers.length} USERS
                        </span>
                    </div>

                    {filteredUsers.length > 0 ? (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th>Display Name</th>
                                        <th>User Principal Name</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>License</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user, i) => (
                                        <tr key={i} className={styles.tableRow}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6' }}>
                                                        {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U'}
                                                    </div>
                                                    <span style={{ fontWeight: 500, color: 'white' }}>{user.displayName}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{user.userPrincipalName}</td>
                                            <td style={{ color: '#d1d5db', fontSize: '0.875rem' }}>{user.userType || 'Member'}</td>
                                            <td>
                                                {user.accountEnabled ? (
                                                    <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                                                        <CheckCircle2 style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.375rem' }} />
                                                        Enabled
                                                    </span>
                                                ) : (
                                                    <span className={`${styles.badge} ${styles.badgeError}`}>
                                                        <XCircle style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.375rem' }} />
                                                        Disabled
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {user.assignedLicenses && user.assignedLicenses.length > 0 ? (
                                                    <span className={`${styles.badge} ${styles.badgeInfo}`}>Licensed</span>
                                                ) : (
                                                    <span className={`${styles.badge} ${styles.badgeNeutral}`}>Unlicensed</span>
                                                )}
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
                            <h3 className={styles.emptyTitle}>No Users Found</h3>
                            <p className={styles.emptyDescription}>
                                No users match your current filters. Try adjusting your search criteria.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EntraUsers;
