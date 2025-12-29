import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { Loader2, CheckCircle2, Globe, ShieldAlert, ArrowLeft } from 'lucide-react';
import styles from './DetailPage.module.css';

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

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className="animate-spin" style={{ width: '2.5rem', height: '2.5rem', color: '#3b82f6' }} />
            </div>
        );
    }

    const verifiedCount = domains.filter(d => d.state === 'Verified').length;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <button onClick={() => navigate('/service/admin')} className={styles.backButton}>
                    <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Back to Dashboard
                </button>

                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>
                        <Globe style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
                        Domains
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Manage and verify your organization's domain names and DNS settings
                    </p>
                </div>

                {error && (
                    <div className={`${styles.alert} ${styles.alertError}`}>
                        <AlertCircle style={{ width: '1.5rem', height: '1.5rem', flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>
                            <Globe style={{ width: '1.125rem', height: '1.125rem' }} />
                            Total Domains
                        </div>
                        <div className={styles.statValue}>{domains.length}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>
                            <CheckCircle2 style={{ width: '1.125rem', height: '1.125rem' }} />
                            Verified
                        </div>
                        <div className={styles.statValue} style={{ color: '#22c55e' }}>{verifiedCount}</div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <Globe style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
                            Domain List
                        </h2>
                    </div>

                    {domains.length > 0 ? (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th>Domain Name</th>
                                        <th>Status</th>
                                        <th>Authentication</th>
                                        <th style={{ textAlign: 'center' }}>Default</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {domains.map((domain) => (
                                        <tr key={domain.id} className={styles.tableRow}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '0.5rem' }}>
                                                        <Globe style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />
                                                    </div>
                                                    <span style={{ fontWeight: 500, color: 'white' }}>{domain.id}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {domain.state === 'Verified' ? (
                                                    <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                                                        <CheckCircle2 style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.375rem' }} />
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className={`${styles.badge} ${styles.badgeWarning}`}>
                                                        <ShieldAlert style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.375rem' }} />
                                                        {domain.state}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ color: '#d1d5db', fontSize: '0.875rem' }}>
                                                {domain.authenticationType}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {domain.isDefault && (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.25rem', background: '#3b82f6', borderRadius: '9999px' }}>
                                                        <CheckCircle2 style={{ width: '1rem', height: '1rem', color: 'white' }} />
                                                    </span>
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
                                <Globe style={{ width: '2.5rem', height: '2.5rem', color: '#6b7280' }} />
                            </div>
                            <h3 className={styles.emptyTitle}>No Domains Found</h3>
                            <p className={styles.emptyDescription}>
                                No domains are configured for your organization.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DomainsPage;
