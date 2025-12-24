import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { Loader2, ArrowLeft, Download, AlertCircle, Search } from 'lucide-react';

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
                setError("Failed to load real-time license telemetry from Microsoft Graph.");
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

    return (
        <div className="app-container">
            <div className="main-content">
                <button
                    onClick={() => navigate('/service/admin')}
                    className="btn-back"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Admin</span>
                </button>

                <div className="mb-8">
                    <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                        License Assignments
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Full visibility into seat usage and assignments</p>
                </div>

                {error && (
                    <div style={{ marginBottom: '32px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
                        <AlertCircle size={24} />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin" size={48} color="var(--accent-blue)" />
                        <p style={{ color: 'var(--text-secondary)' }}>Synchronizing Cloud Licenses...</p>
                    </div>
                ) : (
                    <>
                        {/* License Breakdown Grid */}
                        {licensingSummary.length > 0 && (
                            <div className="mb-12">
                                <h3 className="mb-6">Global License Breakdown</h3>
                                <div className="stats-grid">
                                    {licensingSummary.map((sku, i) => (
                                        <div key={i} className="glass stat-card glass-hover relative overflow-hidden" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
                                            <div className="ambient-glow" style={{ background: 'var(--accent-blue)', width: '100px', height: '100px', top: '-50px', right: '-50px', opacity: 0.1 }} />
                                            <p className="stat-label truncate" title={sku.skuPartNumber}>{sku.skuPartNumber}</p>

                                            <div className="flex justify-between items-end mt-4">
                                                <div>
                                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Assigned</p>
                                                    <p className="stat-value">{sku.consumedUnits}</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total</p>
                                                    <p className="stat-value">{sku.prepaidUnits?.enabled || 0}</p>
                                                </div>
                                            </div>

                                            <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', height: '6px', marginTop: '16px', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div
                                                    style={{
                                                        background: 'var(--accent-blue)',
                                                        height: '100%',
                                                        borderRadius: '3px',
                                                        width: `${Math.min(((sku.consumedUnits / (sku.prepaidUnits?.enabled || 1)) * 100), 100)}%`
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center mt-3">
                                                <span className="badge badge-success" style={{ fontSize: '10px' }}>
                                                    {Math.round((sku.consumedUnits / (sku.prepaidUnits?.enabled || 1)) * 100)}% Seats Used
                                                </span>
                                                <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 600 }}>ENFORCED</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Detailed Table */}
                        <div className="glass" style={{ padding: '32px' }}>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold">User License Assignments</h3>
                                <div className="flex items-center gap-4">
                                    <div style={{ position: 'relative' }}>
                                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={filterText}
                                            onChange={(e) => setFilterText(e.target.value)}
                                            className="glass"
                                            style={{ padding: '10px 16px 10px 40px', borderRadius: '12px', fontSize: '0.875rem', width: '280px' }}
                                        />
                                    </div>
                                    <button
                                        onClick={handleDownloadCSV}
                                        className="btn btn-secondary"
                                        style={{ padding: '10px 16px', fontSize: '0.875rem' }}
                                        title="Download CSV"
                                    >
                                        <Download size={16} />
                                        <span>Export</span>
                                    </button>
                                </div>
                            </div>

                            <div className="table-container">
                                <table className="data-table">
                                    <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(16px)' }}>
                                        <tr>
                                            <th>Display Name</th>
                                            <th>Email / UPN</th>
                                            <th>Assigned Licenses</th>
                                            <th style={{ textAlign: 'center' }}>Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredData.length > 0 ? (
                                            filteredData.map((report, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 600 }}>{report.displayName}</td>
                                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{report.emailAddress}</td>
                                                    <td>
                                                        {report.licenses !== 'No License' ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {report.licenses.split(', ').map((lic, idx) => (
                                                                    <span key={idx} className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', fontSize: '10px', textTransform: 'none' }}>
                                                                        {lic}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-dim)', fontSize: '10px' }}>Unlicensed</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                        <span className="font-bold">{report.licenseCount}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" style={{ padding: '80px', textAlign: 'center' }}>
                                                    <div className="flex flex-col items-center gap-4 text-muted">
                                                        <AlertCircle size={48} opacity={0.2} />
                                                        <p>No user license data found matching your search.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default LicensesPage;
