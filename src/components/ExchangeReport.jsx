import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download, AlertCircle, Loader2, Shield, HelpCircle, ArrowLeft } from 'lucide-react';

const TableHeader = ({ label, tooltip, center = false }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <th
            className={`relative group cursor-help ${center ? 'text-center' : 'text-left'}`}
            style={{ padding: '16px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`flex items-center gap-2 ${center ? 'justify-center' : ''}`}>
                <span>{label}</span>
                <HelpCircle size={12} style={{ opacity: 0.3 }} />
            </div>
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="glass-panel"
                        style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px', padding: '8px', width: '192px', fontSize: '0.75rem', textAlign: 'center', zIndex: 100 }}
                    >
                        {tooltip}
                    </motion.div>
                )}
            </AnimatePresence>
        </th>
    );
};

const ExchangeReport = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();

    const [reportData, setReportData] = useState([]);
    const [filterText, setFilterText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [isRunningMFA, setIsRunningMFA] = useState(false);
    const [isConcealed, setIsConcealed] = useState(false);

    // Filter states
    const [archiveFilter, setArchiveFilter] = useState('all');
    const [autoExpandFilter, setAutoExpandFilter] = useState('all');
    const [migrationFilter, setMigrationFilter] = useState('all');
    const [retentionFilter, setRetentionFilter] = useState('all');

    const toggleUserSelection = (email) => {
        const newSelection = new Set(selectedUsers);
        if (newSelection.has(email)) {
            newSelection.delete(email);
        } else {
            newSelection.add(email);
        }
        setSelectedUsers(newSelection);
    };

    const toggleAllSelection = () => {
        if (selectedUsers.size === filteredData.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(filteredData.map(u => u.emailAddress)));
        }
    };

    const uniqueRetentionPolicies = [...new Set(reportData.map(item => item.retentionPolicy).filter(Boolean))];

    const filteredData = reportData.filter(item => {
        if (filterText) {
            const searchStr = filterText.toLowerCase();
            const name = item.displayName?.toLowerCase() || '';
            const email = item.emailAddress?.toLowerCase() || '';
            if (!name.includes(searchStr) && !email.includes(searchStr)) {
                return false;
            }
        }
        if (archiveFilter === 'enabled' && !item.archivePolicy) return false;
        if (archiveFilter === 'disabled' && item.archivePolicy) return false;
        if (autoExpandFilter === 'enabled' && !item.autoExpanding) return false;
        if (autoExpandFilter === 'disabled' && item.autoExpanding) return false;
        if (migrationFilter === 'migrated' && item.migrationStatus !== 'Migrated') return false;
        if (migrationFilter === 'not-migrated' && item.migrationStatus === 'Migrated') return false;
        if (retentionFilter !== 'all' && item.retentionPolicy !== retentionFilter) return false;
        return true;
    });

    const hasActiveFilters = archiveFilter !== 'all' || autoExpandFilter !== 'all' || migrationFilter !== 'all' || retentionFilter !== 'all';

    const clearAllFilters = () => {
        setArchiveFilter('all');
        setAutoExpandFilter('all');
        setMigrationFilter('all');
        setRetentionFilter('all');
        setFilterText('');
    };

    const handleDownloadCSV = () => {
        if (filteredData.length === 0) return;
        const headers = ['Display Name', 'Email Address', 'Archive Policy', 'Retention Policy', 'Auto Expanding', 'Mailbox Size', 'Data Migrated', 'Migration Status'];
        const csvRows = [headers.join(',')];
        filteredData.forEach(row => {
            const values = [
                `"${row.displayName || ''}"`,
                `"${row.emailAddress || ''}"`,
                row.archivePolicy ? 'Enabled' : 'Disabled',
                `"${row.retentionPolicy || ''}"`,
                row.autoExpanding ? 'Yes' : 'No',
                `"${row.mailboxSize || ''}"`,
                `"${row.dataMigrated || ''}"`,
                `"${row.migrationStatus || ''}"`
            ];
            csvRows.push(values.join(','));
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'mailbox_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRunMFA = async () => {
        if (selectedUsers.size === 0) return;
        if (!window.confirm(`Enforcing MFA for ${selectedUsers.size} users. Are you sure?`)) return;
        setIsRunningMFA(true);
        try {
            const functionUrl = import.meta.env.VITE_AZURE_MFA_FUNCTION_URL;
            if (!functionUrl) {
                alert("Azure Function URL is not configured.");
                return;
            }
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: Array.from(selectedUsers) })
            });
            if (response.ok) {
                alert("MFA Command sent successfully!");
                setSelectedUsers(new Set());
            } else {
                alert(`Error triggering command: ${await response.text()}`);
            }
        } catch (err) {
            alert("Failed to call Azure Function.");
        } finally {
            setIsRunningMFA(false);
        }
    };

    const handleGenerateScript = (type) => {
        if (selectedUsers.size === 0) return;
        let scriptContent = `# Exchange Online Bulk Update Script\n# Generated by M365 Portal\n\n`;
        scriptContent += `$users = @(\n    "${Array.from(selectedUsers).join('",\n    "')}"\n)\n\nforeach ($user in $users) {\n`;
        switch (type) {
            case 'enable_archive': scriptContent += `    Enable-Mailbox -Identity $user -Archive\n`; break;
            case 'disable_archive': scriptContent += `    Disable-Mailbox -Identity $user -Archive -Confirm:$false\n`; break;
            case 'enable_autoexpand': scriptContent += `    Set-Mailbox -Identity $user -AutoExpandingArchive $true\n`; break;
            case 'disable_autoexpand': scriptContent += `    Set-Mailbox -Identity $user -AutoExpandingArchive $false\n`; break;
        }
        scriptContent += `}\n`;
        const blob = new Blob([scriptContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `bulk_${type}.ps1`);
        link.click();
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (accounts.length === 0) return;
            const response = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
            const graphService = new GraphService(response.accessToken);
            const { reports, isConcealed: concealedFlag } = await graphService.getExchangeMailboxReport();
            setReportData(reports);
            setIsConcealed(concealedFlag);
        } catch (err) {
            setError("Failed to fetch data from MS Graph.");
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (accounts.length > 0) fetchData(); }, [accounts]);

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

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Exchange Mailbox Report</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Real-time mailbox analytics</p>
                    </div>
                    <button onClick={fetchData} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>

                <AnimatePresence>
                    {isConcealed && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass mb-8"
                            style={{ padding: '24px', background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)' }}
                        >
                            <div className="flex gap-4">
                                <Shield color="var(--accent-orange)" size={32} />
                                <div>
                                    <h4 style={{ color: 'var(--accent-orange)', marginBottom: '8px' }}>M365 Privacy Settings Detected</h4>
                                    <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '16px' }}>Microsoft is concealing user identity in report telemetry.</p>
                                    <div className="glass-panel" style={{ padding: '16px', fontSize: '0.75rem' }}>
                                        <p style={{ fontWeight: 700, marginBottom: '8px' }}>TO FIX THIS:</p>
                                        <p>M365 Admin Center &gt; Settings &gt; Org Settings &gt; Reports &gt; Uncheck "Display concealed user, group, and site names".</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="glass" style={{ padding: '32px' }}>
                    <div className="flex flex-col gap-6 mb-8">
                        <div className="flex justify-between items-end gap-4 flex-wrap">
                            <div>
                                <h3 className="mb-1">Mailbox Grid</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Showing {filteredData.length} mailboxes</p>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    className="glass"
                                    style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '0.875rem', width: '240px' }}
                                />
                                <button onClick={handleDownloadCSV} className="btn btn-secondary" style={{ padding: '10px' }}>
                                    <Download size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 flex-wrap items-center">
                            <select
                                value={archiveFilter}
                                onChange={(e) => setArchiveFilter(e.target.value)}
                                className="glass"
                                style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '0.875rem' }}
                            >
                                <option value="all">All Archive</option>
                                <option value="enabled">Enabled</option>
                                <option value="disabled">Disabled</option>
                            </select>
                            <select
                                value={autoExpandFilter}
                                onChange={(e) => setAutoExpandFilter(e.target.value)}
                                className="glass"
                                style={{ padding: '8px 12px', borderRadius: '10px', fontSize: '0.875rem' }}
                            >
                                <option value="all">All Auto-Expand</option>
                                <option value="enabled">Enabled</option>
                                <option value="disabled">Disabled</option>
                            </select>
                            {hasActiveFilters && (
                                <button onClick={clearAllFilters} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', fontSize: '0.875rem', cursor: 'pointer' }}>
                                    Clear All
                                </button>
                            )}

                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                {selectedUsers.size > 0 && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleGenerateScript('enable_archive')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '8px 12px' }}>Enable Archive</button>
                                        <button onClick={handleRunMFA} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '8px 16px' }}>Enforce MFA ({selectedUsers.size})</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="table-container" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 size={48} className="animate-spin" color="var(--accent-blue)" />
                                <p style={{ color: 'var(--text-secondary)' }}>Loading telemetry...</p>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)' }}>
                                    <tr>
                                        <th style={{ width: '48px', padding: '16px' }}>
                                            <input type="checkbox" checked={selectedUsers.size === filteredData.length && filteredData.length > 0} onChange={toggleAllSelection} />
                                        </th>
                                        <th>Display Name</th>
                                        <th>UPN / Email</th>
                                        <th>Mailbox Size</th>
                                        <th style={{ textAlign: 'center' }}>Archive</th>
                                        <th>Migration</th>
                                        <th>Retention Policy</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((row, i) => (
                                        <tr key={i}>
                                            <td style={{ padding: '16px' }}>
                                                <input type="checkbox" checked={selectedUsers.has(row.emailAddress)} onChange={() => toggleUserSelection(row.emailAddress)} />
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{row.displayName}</td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{row.emailAddress}</td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{row.mailboxSize}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className={`badge ${row.archivePolicy ? 'badge-success' : 'badge-disabled'}`} style={{ opacity: row.archivePolicy ? 1 : 0.5 }}>
                                                    {row.archivePolicy ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', textTransform: 'none' }}>{row.migrationStatus}</span>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>{row.retentionPolicy || 'None'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExchangeReport;
