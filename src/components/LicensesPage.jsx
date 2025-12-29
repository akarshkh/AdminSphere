import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { Loader2, ArrowLeft, Download, AlertCircle, CreditCard, TrendingUp, Search } from 'lucide-react';
import styles from './DetailPage.module.css';

const LicensesPage = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [licensingSummary, setLicensingSummary] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterText, setFilterText] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (accounts.length === 0) return;
            setLoading(true);
            try {
                const response = await instance.acquireTokenSilent({
                    ...loginRequest,
                    account: accounts[0]
                });
                const graphService = new GraphService(response.accessToken);
                const { skus, users } = await graphService.getLicensingData();
                setLicensingSummary(skus || []);

                const skuMap = new Map();
                (skus || []).forEach(sku => skuMap.set(sku.skuId, sku.skuPartNumber));

                const processedUsers = (users || []).map(user => ({
                    displayName: user.displayName,
                    emailAddress: user.userPrincipalName,
                    licenses: user.assignedLicenses.map(l => skuMap.get(l.skuId) || 'Unknown SKU').join(', ') || 'No License',
                    licenseCount: user.assignedLicenses.length
                }));
                setReportData(processedUsers);
            } catch (err) {
                console.error("Error fetching license data:", err);
                setError("Failed to load license data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [instance, accounts]);

    const filteredData = reportData.filter(item => {
        if (!filterText) return true;
        const searchStr = filterText.toLowerCase();
        const name = item.displayName?.toLowerCase() || '';
        const email = item.emailAddress?.toLowerCase() || '';
        return name.includes(searchStr) || email.includes(searchStr);
    });

    const handleDownloadCSV = () => {
        if (filteredData.length === 0) return;
        const headers = ['Display Name', 'Email / UPN', 'Assigned Licenses', 'Count'];
        const csvRows = [headers.join(',')];

        filteredData.forEach(row => {
            const values = [
                `"${row.displayName || ''}"`,
                `"${row.emailAddress || ''}"`,
                `"${row.licenses || ''}"`,
                `"${row.licenseCount || 0}"`
            ];
            csvRows.push(values.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'licensing_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                <button onClick={() => navigate('/service/admin')} className={styles.backButton}>
                    <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Back to Dashboard
                </button>

                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>
                        <CreditCard style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
                        License Assignments
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Manage user licenses, view seat usage, and track license allocation across your organization
                    </p>
                </div>

                {error && (
                    <div className={`${styles.alert} ${styles.alertError}`}>
                        <AlertCircle style={{ width: '1.5rem', height: '1.5rem', flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                {/* License SKU Cards */}
                {licensingSummary.length > 0 && (
                    <div style={{ marginBottom: '3rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'white' }}>
                            License Breakdown
                        </h3>
                        <div className={styles.statsGrid}>
                            {licensingSummary.map((sku, i) => {
                                const percentage = Math.min((sku.consumedUnits / (sku.prepaidUnits?.enabled || 1)) * 100, 100);
                                return (
                                    <div key={i} className={styles.statCard} style={{ borderLeft: '4px solid #3b82f6' }}>
                                        <div className={styles.statLabel} title={sku.skuPartNumber}>
                                            <CreditCard style={{ width: '1.125rem', height: '1.125rem' }} />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sku.skuPartNumber}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: '1rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Assigned</div>
                                                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{sku.consumedUnits}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total</div>
                                                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{sku.prepaidUnits?.enabled || 0}</div>
                                            </div>
                                        </div>
                                        <div style={{ width: '100%', background: 'rgba(107, 114, 128, 0.3)', height: '0.375rem', marginTop: '1rem', borderRadius: '9999px', overflow: 'hidden' }}>
                                            <div style={{ background: '#3b82f6', height: '100%', width: `${percentage}%`, borderRadius: '9999px', transition: 'width 300ms' }} />
                                        </div>
                                        <div style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: '0.25rem', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                            <TrendingUp style={{ width: '0.875rem', height: '0.875rem' }} />
                                            {Math.round(percentage)}% Used
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* User License Table */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>User License Assignments</h2>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div style={{ position: 'relative' }}>
                                <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#6b7280' }} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    className={styles.filterInput}
                                    style={{ paddingLeft: '2.5rem', minWidth: '250px' }}
                                />
                            </div>
                            <button
                                onClick={handleDownloadCSV}
                                className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
                                title="Download CSV"
                            >
                                <Download style={{ width: '1rem', height: '1rem' }} />
                            </button>
                        </div>
                    </div>

                    {filteredData.length > 0 ? (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th>Display Name</th>
                                        <th>Email / UPN</th>
                                        <th>Assigned Licenses</th>
                                        <th style={{ textAlign: 'center' }}>Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((report, i) => (
                                        <tr key={i} className={styles.tableRow}>
                                            <td style={{ fontWeight: 500, color: 'white' }}>{report.displayName}</td>
                                            <td style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{report.emailAddress}</td>
                                            <td style={{ color: '#d1d5db', fontSize: '0.875rem' }}>
                                                {report.licenses !== 'No License' ? (
                                                    report.licenses
                                                ) : (
                                                    <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Unlicensed</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'center', color: '#9ca3af' }}>
                                                <span className={report.licenseCount > 0 ? styles.badge : `${styles.badge} ${styles.badgeNeutral}`}>
                                                    {report.licenseCount}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <CreditCard style={{ width: '2.5rem', height: '2.5rem', color: '#6b7280' }} />
                            </div>
                            <h3 className={styles.emptyTitle}>No Users Found</h3>
                            <p className={styles.emptyDescription}>
                                {filterText ? `No users match "${filterText}"` : "No user license data available."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LicensesPage;
