import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { AlertTriangle, Loader2, MapPin, User, Clock, ArrowLeft, XCircle } from 'lucide-react';
import styles from './DetailPage.module.css';

const SignInsPage = () => {
    const { instance, accounts } = useMsal();
    const navigate = useNavigate();
    const [signIns, setSignIns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (accounts.length > 0) {
                try {
                    const response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0]
                    });
                    const graphService = new GraphService(response.accessToken);
                    const data = await graphService.getFailedSignIns();
                    setSignIns(data);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [instance, accounts]);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className="animate-spin" style={{ width: '2.5rem', height: '2.5rem', color: '#eab308' }} />
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
                        <AlertTriangle style={{ width: '2rem', height: '2rem', color: '#eab308' }} />
                        Failed Sign-Ins
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Monitor and investigate failed authentication attempts across your organization
                    </p>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <XCircle style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
                            Recent Failed Attempts
                        </h2>
                        <span className={`${styles.badge} ${styles.badgeWarning}`}>
                            {signIns.length} FAILED
                        </span>
                    </div>

                    {signIns.length > 0 ? (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th>User</th>
                                        <th>Location</th>
                                        <th>Failure Reason</th>
                                        <th>Time</th>
                                        <th>Application</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {signIns.map((log, i) => (
                                        <tr key={i} className={styles.tableRow}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px' }}>
                                                        <User style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 500, color: 'white' }}>{log.userPrincipalName}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>{log.userId}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db' }}>
                                                    <MapPin style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                                                    {log.location?.city}, {log.location?.countryOrRegion}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`${styles.badge} ${styles.badgeError}`}>
                                                    {log.status?.failureReason || 'Unknown Error'}
                                                </span>
                                            </td>
                                            <td style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Clock style={{ width: '1rem', height: '1rem' }} />
                                                    {new Date(log.createdDateTime).toLocaleString()}
                                                </div>
                                            </td>
                                            <td style={{ color: '#06b6d4', fontWeight: 500, fontSize: '0.875rem' }}>
                                                {log.appDisplayName}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <AlertTriangle style={{ width: '2.5rem', height: '2.5rem', color: '#22c55e' }} />
                            </div>
                            <h3 className={styles.emptyTitle}>No Failed Sign-Ins</h3>
                            <p className={styles.emptyDescription}>
                                Great news! There are no recent failed sign-in attempts in your organization.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SignInsPage;
