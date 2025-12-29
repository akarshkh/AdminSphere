import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { ArrowLeft, Search, Download, Box, Loader2 } from 'lucide-react';
import styles from './DetailPage.module.css';

const EntraApps = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');

    useEffect(() => {
        const fetchApps = async () => {
            try {
                if (accounts.length > 0) {
                    const response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0]
                    });
                    const graphService = new GraphService(response.accessToken);
                    const data = await graphService.getApplications();
                    setApps(data || []);
                }
            } catch (error) {
                console.error("Failed to fetch apps", error);
            } finally {
                setLoading(false);
            }
        };
        if (accounts.length > 0) {
            fetchApps();
        }
    }, [accounts, instance]);

    const filteredApps = apps.filter(app =>
        app.displayName?.toLowerCase().includes(filterText.toLowerCase()) ||
        app.appId?.toLowerCase().includes(filterText.toLowerCase())
    );

    const handleDownloadCSV = () => {
        const headers = ['Display Name', 'App ID', 'Created Date', 'Sign-in Audience'];
        const rows = filteredApps.map(a => [
            `"${a.displayName}"`,
            `"${a.appId}"`,
            `"${a.createdDateTime}"`,
            `"${a.signInAudience}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'entra_applications.csv';
        link.click();
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className="animate-spin" style={{ width: '2.5rem', height: '2.5rem', color: '#06b6d4' }} />
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
                        <Box style={{ width: '2rem', height: '2rem', color: '#06b6d4' }} />
                        App Registrations
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Manage enterprise applications and service principals
                    </p>
                </div>

                <div className={styles.filterBar}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#6b7280' }} />
                        <input
                            type="text"
                            placeholder="Search apps..."
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
                        <h2 className={styles.cardTitle}>Applications</h2>
                        <span className={`${styles.badge}`} style={{ background: 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.3)', color: '#06b6d4' }}>
                            {filteredApps.length} APPS
                        </span>
                    </div>

                    {filteredApps.length > 0 ? (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th>Display Name</th>
                                        <th>Application (Client) ID</th>
                                        <th>Created</th>
                                        <th>Audience</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredApps.map((app, i) => (
                                        <tr key={i} className={styles.tableRow}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Box style={{ width: '1rem', height: '1rem', color: '#06b6d4' }} />
                                                    </div>
                                                    <span style={{ fontWeight: 500, color: 'white' }}>{app.displayName}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: '#9ca3af', fontSize: '0.875rem', fontFamily: 'monospace' }}>{app.appId}</td>
                                            <td style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                                                {new Date(app.createdDateTime).toLocaleDateString()}
                                            </td>
                                            <td style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{app.signInAudience}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon} style={{ background: 'rgba(6, 182, 212, 0.08)', borderColor: 'rgba(6, 182, 212, 0.2)' }}>
                                <Box style={{ width: '2.5rem', height: '2.5rem', color: '#06b6d4' }} />
                            </div>
                            <h3 className={styles.emptyTitle}>No Applications Found</h3>
                            <p className={styles.emptyDescription}>
                                {filterText ? `No applications match "${filterText}"` : "No app registrations found in your organization."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EntraApps;
