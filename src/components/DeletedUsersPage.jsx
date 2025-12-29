import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { GraphService } from '../services/graphService';
import { loginRequest } from '../authConfig';
import { Trash2, RefreshCw, AlertCircle, Loader2, Search, ArrowLeft, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './DetailPage.module.css';

const DeletedUsersPage = () => {
    const { instance, accounts } = useMsal();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterText, setFilterText] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (accounts.length > 0) {
                const response = await instance.acquireTokenSilent({
                    ...loginRequest,
                    account: accounts[0]
                });
                const graphService = new GraphService(response.accessToken);
                const data = await graphService.getDeletedUsers();
                setUsers(data);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to fetch deleted users.");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [accounts]);

    const filteredUsers = users.filter(user => {
        const searchStr = filterText.toLowerCase();
        const name = user.displayName?.toLowerCase() || '';
        const email = user.userPrincipalName?.toLowerCase() || '';
        return name.includes(searchStr) || email.includes(searchStr);
    });

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className="animate-spin" style={{ width: '2.5rem', height: '2.5rem', color: '#ef4444' }} />
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
                        <Trash2 style={{ width: '2rem', height: '2rem', color: '#ef4444' }} />
                        Deleted Users
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Manage and monitor recently deleted users in your organization (soft deleted, can be restored)
                    </p>
                </div>

                {error && (
                    <div className={`${styles.alert} ${styles.alertError}`}>
                        <AlertCircle style={{ width: '1.5rem', height: '1.5rem', flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <div className={styles.filterBar}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#6b7280' }} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className={styles.filterInput}
                            style={{ paddingLeft: '2.75rem' }}
                        />
                    </div>
                    <button
                        onClick={fetchData}
                        className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
                        disabled={loading}
                    >
                        <RefreshCw style={{ width: '1rem', height: '1rem' }} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <UserX style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
                            Deleted Users List
                        </h2>
                        <span className={`${styles.badge} ${styles.badgeError}`}>
                            {filteredUsers.length} DELETED
                        </span>
                    </div>

                    {filteredUsers.length > 0 ? (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th>Display Name</th>
                                        <th>User Principal Name</th>
                                        <th>User ID</th>
                                        <th>Deleted Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className={styles.tableRow}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Trash2 style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />
                                                    </div>
                                                    <span style={{ fontWeight: 500, color: 'white' }}>{user.displayName}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{user.userPrincipalName}</td>
                                            <td style={{ color: '#6b7280', fontSize: '0.75rem', fontFamily: 'monospace' }}>{user.id}</td>
                                            <td style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                                                {user.deletedDateTime ? new Date(user.deletedDateTime).toLocaleDateString() : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon} style={{ background: 'rgba(34, 197, 94, 0.08)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
                                <Trash2 style={{ width: '2.5rem', height: '2.5rem', color: '#22c55e' }} />
                            </div>
                            <h3 className={styles.emptyTitle}>No Deleted Users</h3>
                            <p className={styles.emptyDescription}>
                                {filterText
                                    ? `No deleted users match "${filterText}"`
                                    : "There are no deleted users in your organization's recycle bin."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeletedUsersPage;
