import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { SubscriptionsService } from '../services/entra';
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import styles from './DetailPage.module.css';

const EntraSubscriptions = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubs = async () => {
            if (accounts.length > 0) {
                try {
                    const response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0]
                    });
                    const client = new GraphService(response.accessToken).client;
                    const data = await SubscriptionsService.getSubscriptions(client);
                    setSubs(data);
                } catch (error) {
                    console.error("Subs fetch error", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchSubs();
    }, [accounts, instance]);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className="animate-spin" style={{ width: '2.5rem', height: '2.5rem', color: '#10b981' }} />
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
                        <CreditCard style={{ width: '2rem', height: '2rem', color: '#10b981' }} />
                        Subscriptions
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Manage licenses, services, and subscription allocations
                    </p>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Active Subscriptions</h2>
                        <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                            {subs.length} SUBSCRIPTIONS
                        </span>
                    </div>

                    {subs.length > 0 ? (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th>SKU Name</th>
                                        <th>Status</th>
                                        <th>Total Licenses</th>
                                        <th>Assigned</th>
                                        <th>Available</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subs.map((sub, i) => (
                                        <tr key={i} className={styles.tableRow}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <CreditCard style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                                                    <span style={{ fontWeight: 500, color: 'white' }}>{sub.skuPartNumber}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {sub.capabilityStatus === 'Enabled' ? (
                                                    <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                                                        <CheckCircle style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.375rem' }} />
                                                        Enabled
                                                    </span>
                                                ) : (
                                                    <span className={`${styles.badge} ${styles.badgeError}`}>
                                                        <AlertCircle style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.375rem' }} />
                                                        {sub.capabilityStatus}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ color: '#d1d5db', fontSize: '0.875rem' }}>{sub.prepaidUnits?.enabled || 0}</td>
                                            <td style={{ color: '#d1d5db', fontSize: '0.875rem' }}>{sub.consumedUnits || 0}</td>
                                            <td style={{ color: '#d1d5db', fontSize: '0.875rem' }}>{(sub.prepaidUnits?.enabled || 0) - (sub.consumedUnits || 0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon} style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                                <CreditCard style={{ width: '2.5rem', height: '2.5rem', color: '#10b981' }} />
                            </div>
                            <h3 className={styles.emptyTitle}>No Subscriptions Found</h3>
                            <p className={styles.emptyDescription}>
                                No active subscriptions found for your organization.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EntraSubscriptions;
