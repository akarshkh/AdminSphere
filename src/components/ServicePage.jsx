import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { motion } from 'framer-motion';
import { Settings, RefreshCw, Filter, Download, AlertCircle, CheckCircle2, XCircle, Loader2, Shield, Activity, AlertTriangle } from 'lucide-react';

const ServicePage = ({ serviceId: propServiceId }) => {
    const params = useParams();
    const serviceId = propServiceId || params.serviceId;
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();

    const [reportData, setReportData] = useState([]);
    const [exchangeData, setExchangeData] = useState([]);
    const [domainsCount, setDomainsCount] = useState(0);
    const [groupsCount, setGroupsCount] = useState(0);
    const [emailActivity, setEmailActivity] = useState({ sent: 0, received: 0, date: null });
    const [filterText, setFilterText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // New Features State
    const [secureScore, setSecureScore] = useState(null);
    const [serviceHealth, setServiceHealth] = useState([]);
    const [failedSignIns, setFailedSignIns] = useState([]);
    const [deviceSummary, setDeviceSummary] = useState({ total: 0, compliant: 0 });
    const [inactiveUsers, setInactiveUsers] = useState(0);
    const [appsCount, setAppsCount] = useState(0);
    const [auditLogs, setAuditLogs] = useState([]);
    const [caPolicies, setCaPolicies] = useState([]);
    const [globalAdmins, setGlobalAdmins] = useState([]);

    const serviceNames = {
        admin: 'Admin',
        entra: 'Microsoft Entra ID',
        intune: 'Microsoft Intune',
        purview: 'Microsoft Purview',
        licensing: 'Licensing & Billing'
    };

    const name = serviceNames[serviceId] || 'Service Module';
    const isAdmin = serviceId === 'admin';
    const isEntra = serviceId === 'entra';
    const isLicensing = serviceId === 'licensing';

    const [licensingSummary, setLicensingSummary] = useState([]);

    const filteredData = reportData.filter(item => {
        if (!filterText) return true;
        const searchStr = filterText.toLowerCase();
        const name = item.displayName?.toLowerCase() || '';
        const email = item.emailAddress?.toLowerCase() || '';
        const raw = String(item).toLowerCase();
        return name.includes(searchStr) || email.includes(searchStr) || raw.includes(searchStr);
    });

    const filteredExchangeData = exchangeData.filter(item => {
        if (!filterText) return true;
        const searchStr = filterText.toLowerCase();
        const name = item.displayName?.toLowerCase() || '';
        const email = item.emailAddress?.toLowerCase() || '';
        return name.includes(searchStr) || email.includes(searchStr);
    });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (accounts.length === 0) return;

            const response = await instance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0]
            });

            const graphService = new GraphService(response.accessToken);

            if (isAdmin) {
                // Fetch both Exchange and Licensing data
                const [exchangeResult, licensingResult] = await Promise.all([
                    graphService.getExchangeMailboxReport().catch(() => ({ reports: [] })),
                    graphService.getLicensingData().catch(() => ({ skus: [], users: [] }))
                ]);

                setExchangeData(exchangeResult.reports || []);

                const { skus, users } = licensingResult;
                setLicensingSummary(skus || []);

                // Fetch Email Activity - Use User Detail for accurate sums
                graphService.getEmailActivityUserDetail('D7').then(activity => {
                    const sent = activity.reduce((acc, curr) => acc + (parseInt(curr.sendCount) || 0), 0);
                    const received = activity.reduce((acc, curr) => acc + (parseInt(curr.receiveCount) || 0), 0);
                    const latestDate = activity.length > 0 ? activity[0].reportRefreshDate : null;
                    setEmailActivity({ sent, received, date: latestDate });
                    console.log("Email Activity Data:", activity); // Debug log
                });

                // Fetch Domains Count
                graphService.getDomains().then(domains => {
                    setDomainsCount(domains.length);
                });

                // Fetch Groups Count
                graphService.getGroups().then(groups => {
                    setGroupsCount(groups.length);
                });

                // Process licensing users for the table

                // Process licensing users for the table
                const skuMap = new Map();
                (skus || []).forEach(sku => skuMap.set(sku.skuId, sku.skuPartNumber));

                const processedUsers = (users || []).map(user => ({
                    displayName: user.displayName,
                    emailAddress: user.userPrincipalName,
                    licenses: user.assignedLicenses.map(l => skuMap.get(l.skuId) || 'Unknown SKU').join(', ') || 'No License',
                    licenseCount: user.assignedLicenses.length
                }));
                setReportData(processedUsers);
            } else if (isEntra) {
                const apps = await graphService.getApplications();
                setAppsCount(apps ? apps.length : 0);

                const groups = await graphService.getGroups();
                setGroupsCount(groups ? groups.length : 0);

                // Fetch Users for Count
                const usersData = await graphService.getExchangeMailboxReport();
                setExchangeData(usersData.reports || []);

                // Use domains count too
                const domains = await graphService.getDomains();
                setDomainsCount(domains ? domains.length : 0);

                // Fetch Advanced Entra Features
                const [audits, policies, admins] = await Promise.all([
                    graphService.getDirectoryAudits(),
                    graphService.getConditionalAccessPolicies(),
                    graphService.getGlobalAdmins()
                ]);

                if (audits?.value) setAuditLogs(audits.value);
                if (policies) setCaPolicies(policies);
                if (admins) setGlobalAdmins(admins);

            } else if (isEntra) {
                const apps = await graphService.getApplications();
                setAppsCount(apps ? apps.length : 0);
                const groups = await graphService.getGroups();
                setGroupsCount(groups ? groups.length : 0);

                // Fetch Users for Count and Table
                const usersData = await graphService.getExchangeMailboxReport();
                const uList = usersData.reports || [];
                setExchangeData(uList);
                setReportData(uList); // Populate main table with rich user data

                const domains = await graphService.getDomains();
                setDomainsCount(domains ? domains.length : 0);

                const [audits, policies, admins] = await Promise.all([
                    graphService.getDirectoryAudits(),
                    graphService.getConditionalAccessPolicies(),
                    graphService.getGlobalAdmins()
                ]);
                if (audits?.value) setAuditLogs(audits.value);
                if (policies) setCaPolicies(policies);
                if (admins) setGlobalAdmins(admins);

            } else if (isLicensing) {
                const { skus, users } = await graphService.getLicensingData();
                setLicensingSummary(skus);

                // create a map of SKU Id to SKU Part Number for easy lookup
                const skuMap = new Map();
                skus.forEach(sku => skuMap.set(sku.skuId, sku.skuPartNumber));

                // Process users for the table
                const processedUsers = users.map(user => ({
                    displayName: user.displayName,
                    emailAddress: user.userPrincipalName,
                    licenses: user.assignedLicenses.map(l => skuMap.get(l.skuId) || 'Unknown SKU').join(', ') || 'No License',
                    licenseCount: user.assignedLicenses.length
                }));
                setReportData(processedUsers);
            } else {
                setReportData([]);
            }
        } catch (err) {
            console.error("Data Fetch Error:", err);
            setError("Failed to fetch real-time data from Microsoft Graph. Please check permissions.");
            // Fallback to empty if real fetch fails
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accounts.length > 0) {
            fetchData();
        }
    }, [serviceId, instance, accounts]);

    let stats = [];
    if (isAdmin) {
        // Combined stats for Admin page
        const totalSeats = licensingSummary.reduce((acc, sku) => acc + (sku.prepaidUnits?.enabled || 0), 0);
        const assignedSeats = licensingSummary.reduce((acc, sku) => acc + (sku.consumedUnits || 0), 0);
        stats = [
            { label: 'Total Mailboxes', value: exchangeData.length.toString(), trend: 'Real-time', color: 'accent-blue' },
            { label: 'Emails Sent (7d)', value: emailActivity.sent.toLocaleString(), trend: emailActivity.date ? `As of ${emailActivity.date}` : 'Activity*', color: 'accent-purple' },
            { label: 'Emails Received (7d)', value: emailActivity.received.toLocaleString(), trend: emailActivity.date ? `As of ${emailActivity.date}` : 'Activity*', color: 'accent-blue' },
            { label: 'Licenses Used', value: assignedSeats.toLocaleString(), trend: totalSeats > 0 ? Math.round((assignedSeats / totalSeats) * 100) + '%' : '0%', color: 'accent-orange', path: '/service/admin/licenses' },
            { label: 'Groups', value: groupsCount.toString(), trend: 'Manage', path: '/service/admin/groups', color: 'accent-purple' },
            { label: 'Domains', value: domainsCount.toString(), trend: 'Manage', path: '/service/admin/domains', color: 'accent-green' },
            /* Admin Extras */
            { label: 'Inactive Users', value: inactiveUsers.toString(), trend: '> 30 Days', color: 'accent-red' },
            { label: 'Device Compliance', value: deviceSummary.total > 0 ? Math.round((deviceSummary.compliant / deviceSummary.total) * 100) + '%' : 'No Data', trend: `${deviceSummary.compliant}/${deviceSummary.total}`, color: 'accent-cyan' }
        ];
    } else if (isEntra) {
        stats = [
            { label: 'Total Users', value: exchangeData.length.toString(), trend: 'Manage', path: '/service/entra/users', color: 'accent-blue' },
            { label: 'Groups', value: groupsCount.toString(), trend: 'Manage', path: '/service/entra/groups', color: 'accent-purple' },
            { label: 'Applications', value: appsCount.toString(), trend: 'Manage', path: '/service/entra/apps', color: 'accent-cyan' },
            { label: 'Global Admins', value: globalAdmins.length.toString(), trend: 'Security', color: 'accent-red' },
            { label: 'CA Policies', value: caPolicies.length.toString(), trend: `${caPolicies.filter(p => p.state === 'enabled').length} Active`, color: 'accent-orange' }
        ];
    } else if (isLicensing) {
        // Calculate license stats
        const totalSeats = licensingSummary.reduce((acc, sku) => acc + (sku.prepaidUnits?.enabled || 0), 0);
        const assignedSeats = licensingSummary.reduce((acc, sku) => acc + (sku.consumedUnits || 0), 0);
        const availableSeats = totalSeats - assignedSeats;

        stats = [
            { label: 'Total Licenses', value: totalSeats.toLocaleString(), trend: 'Capacity', color: 'accent-purple' },
            { label: 'Assigned', value: assignedSeats.toLocaleString(), trend: Math.round((assignedSeats / totalSeats) * 100) + '% Used', color: 'accent-blue' },
            { label: 'Available', value: availableSeats.toLocaleString(), trend: 'Free', color: 'accent-green' }
        ];
    } else {
        stats = [];
    }

    const handleDownloadCSV = () => {
        if (filteredData.length === 0) return;

        let headers = [];
        let csvRows = [];

        if (isLicensing) {
            headers = ['Display Name', 'Email / UPN', 'Assigned Licenses', 'Count'];
            csvRows.push(headers.join(','));

            filteredData.forEach(row => {
                const values = [
                    `"${row.displayName || ''}"`,
                    `"${row.emailAddress || ''}"`,
                    `"${row.licenses || ''}"`,
                    `"${row.licenseCount || 0}"`
                ];
                csvRows.push(values.join(','));
            });
        } else {
            // Generic Fallback
            headers = ['User / Resource', 'Status', 'Activity', 'Time'];
            csvRows.push(headers.join(','));

            filteredData.forEach(row => {
                const values = [
                    `"User Resource ${row}"`,
                    '"Active"',
                    '"Policy modification detected"',
                    `"${row}h ago"`
                ];
                csvRows.push(values.join(','));
            });
        }

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${serviceId}_report.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadExchangeReport = () => {
        if (exchangeData.length === 0) return;

        const headers = [
            'Display Name',
            'User Principal Name',
            'Job Title',
            'Department',
            'Office Location',
            'City',
            'Country',
            'Account Enabled',
            'Created Date',
            'Last Activity Date',
            'Item Count',
            'Deleted Item Count',
            'Mailbox Size Used',
            'Quota Used %',
            'Issue Warning Quota',
            'Prohibit Send Quota',
            'Prohibit Send/Receive Quota',
            'Archive Status',
            'Retention Policy',
            'Auto Expanding',
            'Migration Status'
        ];

        const csvRows = [headers.join(',')];

        exchangeData.forEach(row => {
            const values = [
                `"${row.displayName || ''}"`,
                `"${row.userPrincipalName || ''}"`,
                `"${row.jobTitle || ''}"`,
                `"${row.department || ''}"`,
                `"${row.officeLocation || ''}"`,
                `"${row.city || ''}"`,
                `"${row.country || ''}"`,
                `"${row.accountEnabled || ''}"`,
                `"${row.createdDateTime || ''}"`,
                `"${row.lastActivityDate || ''}"`,
                `"${row.itemCount || 0}"`,
                `"${row.deletedItemCount || 0}"`,
                `"${row.mailboxSize || ''}"`,
                `"${row.quotaUsedPct || ''}"`,
                `"${row.issueWarningQuota || ''}"`,
                `"${row.prohibitSendQuota || ''}"`,
                `"${row.prohibitSendReceiveQuota || ''}"`,
                row.archivePolicy ? 'Enabled' : 'Disabled',
                `"${row.retentionPolicy || ''}"`,
                `"${row.autoExpanding || ''}"`,
                `"${row.migrationStatus || ''}"`
            ];
            csvRows.push(values.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'full_exchange_report.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="app-container">
            <div className="main-content">
                <div className="mb-8">
                    <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                        {name}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage and monitor resources</p>
                </div>

                {error && (
                    <div style={{ marginBottom: '32px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
                        <AlertCircle size={24} />
                        <span>{error}</span>
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="stats-grid"
                >
                    {stats.map((stat, i) => (
                        <div
                            key={i}
                            onClick={stat.path ? () => navigate(stat.path) : undefined}
                            className={`glass stat-card glass-hover relative overflow-hidden ${stat.path ? 'cursor-pointer' : ''}`}
                        >
                            {/* Ambient Glow */}
                            <div
                                className="ambient-glow"
                                style={{
                                    background: stat.color ? `var(--accent-${stat.color.split('-')[1]})` : 'var(--accent-blue)',
                                    width: '120px',
                                    height: '120px',
                                    top: '-60px',
                                    right: '-60px',
                                    opacity: 0.15
                                }}
                            />

                            <p className="stat-label">{stat.label}</p>
                            <h3 className="stat-value">{stat.value}</h3>

                            <div className="mt-4 flex items-center justify-between" style={{ fontSize: '0.75rem' }}>
                                <span className={`badge`} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    color: stat.color ? `var(--accent-${stat.color.split('-')[1]})` : 'var(--accent-green)',
                                    fontSize: '10px'
                                }}>
                                    {stat.trend}
                                </span>
                                <span style={{ color: 'var(--text-dim)', fontSize: '10px', fontWeight: 600 }}>GRAPH API</span>
                            </div>
                        </div>
                    ))}
                </motion.div>

                <div className="text-xs text-gray-500 mb-8 -mt-8 text-right px-2 italic">
                    * Metrics reflect available reports (typically 24-48h delayed)
                </div>



                {(isLicensing) && licensingSummary.length > 0 && (
                    <div className="mb-12">
                        <h3 className="mb-6">License Breakdown</h3>
                        <div className="stats-grid">
                            {licensingSummary.map((sku, i) => (
                                <div key={i} className="glass stat-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
                                    <p className="stat-label truncate" title={sku.skuPartNumber}>{sku.skuPartNumber}</p>
                                    <div className="flex justify-between items-end mt-4">
                                        <div>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Assigned</p>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{sku.consumedUnits}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total</p>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{sku.prepaidUnits?.enabled || 0}</p>
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
                                    <p style={{ fontSize: '0.75rem', textAlign: 'right', marginTop: '4px', color: 'var(--text-muted)' }}>
                                        {Math.round((sku.consumedUnits / (sku.prepaidUnits?.enabled || 1)) * 100)}% Used
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Advanced Admin Tiles */}
                {isAdmin && (
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Security & Health Pulse</h3>
                            <span className="text-[10px] text-gray-500 italic">
                                * Metrics typically 24-48h delayed
                            </span>
                        </div>

                        <div className="stats-grid">
                            {/* Secure Score Tile */}
                            <div className="glass stat-card glass-hover relative overflow-hidden">
                                <div className="ambient-glow" style={{ background: 'var(--accent-blue)', width: '120px', height: '120px', top: '-60px', right: '-60px', opacity: 0.1 }} />
                                <p className="stat-label">Secure Score</p>
                                {secureScore ? (
                                    <h3 className="stat-value">{Math.round((secureScore.currentScore / secureScore.maxScore) * 100)}%</h3>
                                ) : (
                                    <h3 className="stat-value text-muted" style={{ fontSize: '1.25rem', opacity: 0.5 }}>Telemetry Unavailable</h3>
                                )}
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', fontSize: '10px' }}>
                                        {secureScore ? `${secureScore.currentScore} / ${secureScore.maxScore}` : 'Access Blocked'}
                                    </span>
                                    {!secureScore && <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>Requires SecurityEvents.Read.All</span>}
                                </div>
                            </div>

                            {/* Audit Events Tile */}
                            <div className="glass stat-card glass-hover relative overflow-hidden">
                                <div className="ambient-glow" style={{ background: 'var(--accent-red)', width: '120px', height: '120px', top: '-60px', right: '-60px', opacity: 0.1 }} />
                                <p className="stat-label">Critical Audit Events</p>
                                <h3 className="stat-value">{failedSignIns.length > 0 ? failedSignIns.length : '0'}</h3>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className={`badge ${failedSignIns.length > 0 ? 'badge-error' : 'badge-success'}`} style={{ fontSize: '10px' }}>
                                        {failedSignIns.length > 0 ? 'Failures Detected' : 'No recent failures'}
                                    </span>
                                    <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>7D Window</span>
                                </div>
                            </div>

                            {/* Service Health Tile */}
                            <div className="glass stat-card glass-hover relative overflow-hidden">
                                <div className="ambient-glow" style={{ background: 'var(--accent-green)', width: '120px', height: '120px', top: '-60px', right: '-60px', opacity: 0.1 }} />
                                <p className="stat-label">Service Health</p>
                                {serviceHealth.length > 0 ? (
                                    <h3 className="stat-value">{serviceHealth.filter(s => s.status === 'ServiceOperational').length} / {serviceHealth.length}</h3>
                                ) : (
                                    <h3 className="stat-value text-muted" style={{ fontSize: '1.25rem', opacity: 0.5 }}>Data Blocked</h3>
                                )}
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', fontSize: '10px' }}>
                                        {serviceHealth.length > 0 ? 'Connected' : 'Access Denied'}
                                    </span>
                                    {serviceHealth.length === 0 && <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>Requires ServiceHealth.Read.All</span>}
                                </div>
                            </div>
                        </div>

                        {/* Expandable Details for Admin (Only if data exists) */}
                        {(secureScore || failedSignIns.length > 0 || serviceHealth.length > 0) && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                                {secureScore && (
                                    <div className="glass-panel p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-24 h-24 flex items-center justify-center">
                                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                    <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                                    <circle cx="18" cy="18" r="16" fill="none" stroke="var(--accent-blue)" strokeWidth="3" strokeDasharray={`${(secureScore.currentScore / secureScore.maxScore) * 100}, 100`} strokeLinecap="round" />
                                                </svg>
                                                <span className="absolute text-xl font-bold">{Math.round((secureScore.currentScore / secureScore.maxScore) * 100)}%</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">Microsoft Secure Score</p>
                                                <p className="text-xs text-gray-500 mt-1">Based on identity and device security configurations.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {failedSignIns.length > 0 && (
                                    <div className="glass-panel p-6">
                                        <p className="text-sm font-bold mb-4">Recent Audit Logs</p>
                                        <div className="space-y-2 max-h-[100px] overflow-y-auto custom-scrollbar">
                                            {failedSignIns.map((log, i) => (
                                                <div key={i} className="flex justify-between text-[11px] p-2 bg-white/5 rounded">
                                                    <span className="truncate w-2/3">{log.userPrincipalName}</span>
                                                    <span className="text-red-400 font-bold">{log.status?.failureReason?.split('.')[0]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Entra Specific Dashboards */}
                {isEntra && (
                    <div className="stats-grid">
                        {/* Directory Audits */}
                        <div className="glass" style={{ padding: '24px' }}>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-400" />
                                Recent Directory Audits
                            </h3>
                            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {auditLogs.length > 0 ? auditLogs.map((log, i) => (
                                    <div key={i} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.activityDisplayName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                                                by {log.initiatedBy?.user?.userPrincipalName || 'System'}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.activityDateTime).toLocaleTimeString()}</div>
                                            <span className={`badge ${log.result === 'success' ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '9px', marginTop: '4px' }}>
                                                {log.result}
                                            </span>
                                        </div>
                                    </div>
                                )) : <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem', textAlign: 'center', padding: '20px' }}>No audit logs available (Requires AuditLog.Read.All).</div>}
                            </div>
                        </div>

                        {/* Conditional Access */}
                        <div className="glass" style={{ padding: '24px' }}>
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-orange-400" />
                                Conditional Access Policies
                            </h3>
                            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {caPolicies.length > 0 ? caPolicies.map((policy, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${policy.state === 'enabled' ? 'bg-green-500' :
                                                policy.state === 'disabled' ? 'bg-red-500' : 'bg-yellow-500'
                                                }`} style={{ boxShadow: `0 0 8px ${policy.state === 'enabled' ? '#10b981' : '#ef4444'}` }} />
                                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{policy.displayName}</span>
                                        </div>
                                        <span className="badge badge-secondary" style={{ fontSize: '9px', textTransform: 'uppercase' }}>{policy.state}</span>
                                    </div>
                                )) : <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem', textAlign: 'center', padding: '20px' }}>No policies found or access denied.</div>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Exchange Section for Admin */}
                {isAdmin && (
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Exchange Mailboxes</h3>
                            <button
                                onClick={handleDownloadExchangeReport}
                                className="btn btn-primary"
                                style={{ padding: '8px 20px', fontSize: '0.875rem', borderRadius: '10px' }}
                            >
                                <Download size={16} />
                                <span>Download Full Report</span>
                            </button>
                        </div>
                        {loading ? (
                            <div className="glass flex items-center justify-center" style={{ padding: '64px' }}>
                                <Loader2 className="animate-spin" size={32} color="var(--accent-blue)" />
                            </div>
                        ) : exchangeData.length > 0 ? (
                            <div style={{ marginBottom: '32px' }}>
                                <div className="stats-grid" style={{ marginBottom: '24px' }}>
                                    <div className="glass glass-hover stat-card relative overflow-hidden">
                                        <div className="ambient-glow" style={{ background: 'var(--accent-blue)', width: '100px', height: '100px', top: '-50px', right: '-50px', opacity: 0.1 }} />
                                        <p className="stat-label">Total Mailboxes</p>
                                        <p className="stat-value">{exchangeData.length}</p>
                                        <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase">Provisioned</p>
                                    </div>
                                    <div className="glass glass-hover stat-card relative overflow-hidden">
                                        <div className="ambient-glow" style={{ background: 'var(--accent-purple)', width: '100px', height: '100px', top: '-50px', right: '-50px', opacity: 0.1 }} />
                                        <p className="stat-label">Archive Enabled</p>
                                        <p className="stat-value">{exchangeData.filter(r => r.archivePolicy).length}</p>
                                        <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase">Policy Active</p>
                                    </div>
                                    <div className="glass glass-hover stat-card relative overflow-hidden">
                                        <div className="ambient-glow" style={{ background: 'var(--accent-cyan)', width: '100px', height: '100px', top: '-50px', right: '-50px', opacity: 0.1 }} />
                                        <p className="stat-label">Auto-Expanding</p>
                                        <p className="stat-value">{exchangeData.filter(r => r.autoExpanding).length}</p>
                                        <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase">Storage Scale</p>
                                    </div>
                                </div>
                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Display Name</th>
                                                <th>Email</th>
                                                <th style={{ textAlign: 'center' }}>Archive</th>
                                                <th>Size</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {exchangeData.slice(0, 5).map((mailbox, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 500 }}>{mailbox.displayName}</td>
                                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{mailbox.emailAddress}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className={`badge ${mailbox.archivePolicy ? 'badge-success' : 'badge-disabled'}`} style={{ background: mailbox.archivePolicy ? '' : 'rgba(255,255,255,0.05)', color: mailbox.archivePolicy ? '' : 'var(--text-muted)' }}>
                                                            {mailbox.archivePolicy ? 'Enabled' : 'Disabled'}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{mailbox.mailboxSize || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {exchangeData.length > 5 && (
                                        <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => navigate('/service/admin/report')}
                                                style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.875rem' }}
                                            >
                                                View all {exchangeData.length} mailboxes →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="glass flex items-center justify-center text-muted" style={{ padding: '32px' }}>
                                <p>No exchange data available</p>
                            </div>
                        )}
                    </div>
                )}

                {!isAdmin && (
                    <div className="glass" style={{ padding: '32px', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '100%' }}>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold">{isAdmin ? 'User License Assignments' : isLicensing ? 'User License Assignments' : 'Latest Reports'}</h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleDownloadCSV}
                                        className="btn btn-secondary"
                                        style={{ padding: '8px' }}
                                        title="Download CSV"
                                    >
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="table-container" style={{ minHeight: '300px', maxHeight: 'calc(100vh - 500px)' }}>
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <Loader2 className="animate-spin" size={48} color="var(--accent-blue)" />
                                        <p style={{ color: 'var(--text-secondary)' }}>Fetching Real-time Telemetry...</p>
                                    </div>
                                ) : (
                                    <table className="data-table">
                                        <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
                                            <tr>
                                                {(isLicensing || isAdmin) ? (
                                                    <>
                                                        <th>Display Name</th>
                                                        <th>Email / UPN</th>
                                                        <th>Assigned Licenses</th>
                                                        <th style={{ textAlign: 'center' }}>Count</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th>User / Resource</th>
                                                        <th>Status</th>
                                                        <th>Activity</th>
                                                        <th>Time</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData.length > 0 ? filteredData.map((report, i) => (
                                                <tr key={i}>
                                                    {(isLicensing || isAdmin) ? (
                                                        <>
                                                            <td style={{ fontWeight: 500 }}>{report.displayName}</td>
                                                            <td style={{ color: 'var(--text-secondary)' }}>{report.emailAddress}</td>
                                                            <td style={{ color: 'var(--text-secondary)' }}>
                                                                {report.licenses !== 'No License' ? (
                                                                    <span>{report.licenses}</span>
                                                                ) : (
                                                                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unlicensed</span>
                                                                )}
                                                            </td>
                                                            <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{report.licenseCount}</td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="avatar" style={{ fontSize: '10px' }}>UR</div>
                                                                    <span style={{ fontWeight: 500 }}>User Resource {typeof report === 'object' ? 'Unknown' : report}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="badge badge-success">Active</span>
                                                            </td>
                                                            <td style={{ color: 'var(--text-secondary)' }}>Policy modification detected</td>
                                                            <td style={{ color: 'var(--text-muted)' }}>{typeof report === 'object' ? '0' : report}h ago</td>
                                                        </>
                                                    )}
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={4} style={{ padding: '80px', textAlign: 'center' }}>
                                                        <div className="flex flex-col items-center gap-4">
                                                            <AlertCircle size={48} color="var(--text-muted)" />
                                                            <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No real-time data found. Ensure Graph API permissions are granted.</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServicePage;
