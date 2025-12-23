import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, Download, AlertCircle, CheckCircle2, XCircle, Loader2, Archive, Database, HelpCircle } from 'lucide-react';

const TableHeader = ({ label, tooltip, center = false }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <th
            className={`pb-4 font-semibold px-4 ${center ? 'text-center' : 'text-left'} relative group cursor-help`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`flex items-center space-x-1 ${center ? 'justify-center' : 'justify-start'}`}>
                <span>{label}</span>
                <HelpCircle className="w-3 h-3 text-white/20 group-hover:text-blue-400 transition-colors" />
            </div>
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl text-xs text-gray-200 font-medium normal-case text-center pointer-events-none"
                    >
                        {tooltip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-800/95"></div>
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

    const filteredData = reportData.filter(item => {
        if (!filterText) return true;
        const searchStr = filterText.toLowerCase();
        const name = item.displayName?.toLowerCase() || '';
        const email = item.emailAddress?.toLowerCase() || '';
        return name.includes(searchStr) || email.includes(searchStr);
    });

    const handleDownloadCSV = () => {
        if (filteredData.length === 0) return;

        const headers = ['Display Name', 'Email Address', 'Archive Policy', 'Retention Policy', 'Auto Expanding', 'Mailbox Size', 'Data Migrated', 'Migration Status', 'Created Date'];
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
                `"${row.migrationStatus || ''}"`,
                `"${row.createdDate || ''}"`
            ];
            csvRows.push(values.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'mailbox_report.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRunMFA = async () => {
        if (selectedUsers.size === 0) return;

        const confirmResult = window.confirm(`Enforcing MFA for ${selectedUsers.size} users. Are you sure?`);
        if (!confirmResult) return;

        setIsRunningMFA(true);
        try {
            // Placeholder URL - User needs to update this in .env or code
            const functionUrl = import.meta.env.VITE_AZURE_MFA_FUNCTION_URL;

            if (!functionUrl) {
                alert("Azure Function URL is not configured. Please set VITE_AZURE_MFA_FUNCTION_URL in .env");
                console.log("Mock Run: Would send to Azure Function", Array.from(selectedUsers));
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
                const text = await response.text();
                alert(`Error triggering command: ${text}`);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to call Azure Function.");
        } finally {
            setIsRunningMFA(false);
        }
    };

    const handleGenerateScript = (type) => {
        if (selectedUsers.size === 0) return;

        let scriptContent = `# Exchange Online Bulk Update Script\n# Generated by M365 Portal\n\n`;
        scriptContent += `Write-Host "Connecting to Exchange Online..."\n`;
        scriptContent += `if (-not (Get-Command Connect-ExchangeOnline -ErrorAction SilentlyContinue)) { Write-Error "Please install ExchangeOnlineManagement module."; exit }\n`;
        scriptContent += `try { Get-Mailbox -Identity "${Array.from(selectedUsers)[0]}" -ErrorAction SilentlyContinue } catch { Connect-ExchangeOnline }\n\n`;
        scriptContent += `$users = @(\n    "${Array.from(selectedUsers).join('",\n    "')}"\n)\n\n`;
        scriptContent += `foreach ($user in $users) {\n    Write-Host "Processing $user ..."\n`;

        switch (type) {
            case 'enable_archive':
                scriptContent += `    try { Enable-Mailbox -Identity $user -Archive -ErrorAction Stop; Write-Host " - Archive Enabled" -ForegroundColor Green } catch { Write-Warning " - Failed: $_" }\n`;
                break;
            case 'disable_archive':
                scriptContent += `    try { Disable-Mailbox -Identity $user -Archive -Confirm:$false -ErrorAction Stop; Write-Host " - Archive Disabled" -ForegroundColor Yellow } catch { Write-Warning " - Failed: $_" }\n`;
                break;
            case 'enable_autoexpand':
                scriptContent += `    try { Set-Mailbox -Identity $user -AutoExpandingArchive $true -ErrorAction Stop; Write-Host " - Auto-Expand Enabled" -ForegroundColor Green } catch { Write-Warning " - Failed: $_" }\n`;
                break;
            case 'disable_autoexpand':
                scriptContent += `    try { Set-Mailbox -Identity $user -AutoExpandingArchive $false -ErrorAction Stop; Write-Host " - Auto-Expand Disabled" -ForegroundColor Yellow } catch { Write-Warning " - Failed: $_" }\n`;
                break;
        }

        scriptContent += `}\n\nWrite-Host "Done." -ForegroundColor Cyan\nRead-Host "Press Enter to exit"`;

        const blob = new Blob([scriptContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `bulk_${type}_${selectedUsers.size}_users.ps1`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
            const { reports, isConcealed: concealedFlag } = await graphService.getExchangeMailboxReport();
            setReportData(reports);
            setIsConcealed(concealedFlag);
        } catch (err) {
            console.error("Data Fetch Error:", err);
            setError("Failed to fetch real-time data from Microsoft Graph. Please check permissions.");
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accounts.length > 0) {
            fetchData();
        }
    }, [instance, accounts]);

    const UsageBar = ({ used, quota }) => {
        const usedVal = parseFloat(used);
        const quotaVal = parseFloat(quota);

        if (isNaN(usedVal) || isNaN(quotaVal)) {
            return <span className="text-[10px] text-gray-500 italic opacity-50">No usage data</span>;
        }

        const percentage = quotaVal > 0 ? (usedVal / quotaVal) * 100 : 0;
        const color = percentage > 90 ? '#ef4444' : percentage > 70 ? '#f59e0b' : '#3b82f6';

        return (
            <div className="w-full max-w-[120px]">
                <div className="flex justify-between text-[10px] mb-1 text-gray-400">
                    <span>{usedVal.toFixed(1)} GB</span>
                    {/* Percentage removed for cleaner UI */}
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percentage, 100)}%` }}
                        className="h-full rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)] transition-colors duration-500"
                        style={{ backgroundColor: color }}
                    />
                </div>
            </div>
        );
    };

    const stats = [
        { label: 'Total Mailboxes', value: reportData.length.toString(), trend: 'Real-time', icon: <Database className="w-4 h-4" /> },
        { label: 'Archive Enabled', value: reportData.filter(r => r.archivePolicy).length.toString(), trend: 'Active', icon: <Archive className="w-4 h-4" /> },
        { label: 'Cloud Synchronized', value: reportData.filter(r => r.migrationStatus === 'Migrated').length.toString(), trend: '100% Sync', icon: <RefreshCw className="w-4 h-4" />, color: 'text-green-400' }
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white font-['Inter'] selection:bg-blue-500/30">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full" />
            </div>

            <header className="glass sticky top-0 z-40 rounded-none border-x-0 border-t-0 bg-black/40 backdrop-blur-2xl px-8 py-5 border-b border-white/5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/service/exchange')}
                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 shadow-lg"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </motion.button>
                        <div>
                            <h1 className="text-2xl font-bold font-['Outfit'] tracking-tight">
                                Exchange Mailbox Report
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={fetchData}
                            className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-sm font-medium"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-8 relative z-10">
                {/* Stats Grid - Unified with Licensing Style */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                >
                    {stats.map((stat, i) => (
                        <div key={i} className="glass p-6 group hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-400 text-sm">{stat.label}</p>
                                <div className="p-2 bg-white/5 rounded-lg text-gray-400 group-hover:text-blue-400 transition-colors">
                                    {stat.icon}
                                </div>
                            </div>
                            <p className="text-3xl font-bold">{stat.value}</p>
                            <div className={`mt-4 flex items-center text-[10px] font-bold tracking-widest uppercase ${stat.color || 'text-blue-400'}`}>
                                <span>{stat.trend}</span>

                            </div>
                        </div>
                    ))}
                </motion.div>

                <AnimatePresence>
                    {isConcealed && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -20 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -20 }}
                            className="mb-8"
                        >
                            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start space-x-5 backdrop-blur-md">

                                <div className="flex-1">
                                    <h4 className="text-amber-200 font-bold text-lg mb-1">Privacy Masking Detected</h4>
                                    <p className="text-amber-200/60 text-sm leading-relaxed mb-4">
                                        Identifiable information is currently hidden by M365 privacy settings. This restricts usage mapping for specific mailboxes.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3 text-xs bg-black/40 p-5 rounded-2xl border border-white/5">
                                            <p className="font-bold text-amber-100 uppercase tracking-widest flex items-center">
                                                <AlertCircle className="w-3 h-3 mr-2" /> Action Required
                                            </p>
                                            <ol className="space-y-2 text-amber-100/50 list-decimal list-inside">
                                                <li>Open <span className="text-amber-200">M365 Admin Center</span></li>
                                                <li>Go to <span className="text-amber-200">Settings &gt; Org Settings</span></li>
                                                <li>Select <span className="text-amber-200">Reports</span> tab</li>
                                                <li>Uncheck <span className="text-amber-200">"Display concealed user names"</span></li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {error && (
                    <div className="mb-8 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center space-x-3 text-red-400 backdrop-blur-md">
                        <AlertCircle className="w-6 h-6 opacity-60" />
                        <span className="font-medium">{error}</span>
                    </div>
                )}

                <div className="glass p-1 rounded-3xl border border-white/5 overflow-hidden">
                    <div className="p-7">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                            <div className="relative group max-w-md w-full">

                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.05] transition-all placeholder:text-gray-600"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <AnimatePresence>
                                    {selectedUsers.size > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, x: 20 }}
                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                            className="flex items-center gap-2 pr-4 border-r border-white/10 mr-2"
                                        >
                                            <div className="flex flex-col gap-1.5">
                                                <button
                                                    onClick={() => handleGenerateScript('enable_archive')}
                                                    className="px-4 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold rounded-xl border border-emerald-500/20 transition-all flex items-center space-x-1.5"
                                                >
                                                    <Archive className="w-3 h-3" /> <span>Archive On</span>
                                                </button>
                                                <button
                                                    onClick={() => handleGenerateScript('enable_autoexpand')}
                                                    className="px-4 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[11px] font-bold rounded-xl border border-blue-500/20 transition-all flex items-center space-x-1.5"
                                                >
                                                    <Database className="w-3 h-3" /> <span>Auto-Exp On</span>
                                                </button>
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-bold uppercase vertical-text ml-1">{selectedUsers.size} Selected</div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleRunMFA}
                                    disabled={selectedUsers.size === 0 || isRunningMFA}
                                    className={`flex items-center space-x-2 px-6 py-2.5 rounded-2xl border transition-all text-sm font-bold shadow-lg ${selectedUsers.size > 0 && !isRunningMFA
                                        ? 'bg-gradient-to-br from-indigo-600 to-blue-700 border-white/10 hover:shadow-indigo-500/20 text-white'
                                        : 'bg-white/5 border-white/5 text-gray-600 cursor-not-allowed'
                                        }`}
                                >

                                    <span>{isRunningMFA ? 'Processing...' : 'Enforce MFA'}</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleDownloadCSV}
                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group"
                                    title="Export to CSV"
                                >
                                    <Download className="w-4 h-4 text-gray-400 group-hover:text-white" />
                                </motion.button>
                            </div>
                        </div>

                        <div className="overflow-x-auto min-h-[400px]">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                                    <div className="relative">
                                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin opacity-40" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-6 h-6 bg-blue-500 rounded-full animate-ping" />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-300 font-bold text-lg">Fetching Telemetry</p>
                                        <p className="text-gray-500 text-sm mt-1">Please wait while we sync with Microsoft Graph...</p>
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/10 text-gray-400 text-[11px] font-bold uppercase tracking-wider">
                                            <th className="pb-4 font-semibold px-4 w-12 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={filteredData.length > 0 && selectedUsers.size === filteredData.length}
                                                    onChange={toggleAllSelection}
                                                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500 focus:ring-offset-black transition-all cursor-pointer"
                                                />
                                            </th>
                                            <th className="pb-4 font-semibold px-4">Mailbox Identity</th>
                                            <th className="pb-4 font-semibold px-4">Usage Analytics</th>
                                            <th className="pb-4 font-semibold px-4">MailboxSize</th>
                                            <th className="pb-4 font-semibold px-4">Created Date</th>
                                            <th className="pb-4 font-semibold px-4">Infrastructure</th>
                                            <th className="pb-4 font-semibold px-4 text-center">Archive Status</th>
                                            <th className="pb-4 font-semibold px-4">Retention</th>
                                            <th className="pb-4 font-semibold px-4 text-center">Auto-Exp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm">
                                        {filteredData.length > 0 ? filteredData.map((report, i) => {
                                            const [used, quota] = report.mailboxSize.split(' / ').map(v => v.replace(' GB', ''));
                                            return (
                                                <tr
                                                    key={i}
                                                    className="group hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <td className="py-4 px-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedUsers.has(report.emailAddress)}
                                                            onChange={() => toggleUserSelection(report.emailAddress)}
                                                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500 focus:ring-offset-black transition-all cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white/90 tracking-tight">
                                                                {report.displayName}
                                                            </span>
                                                            <span className="text-[11px] text-gray-500 font-medium truncate max-w-[180px]">
                                                                {report.emailAddress}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <UsageBar used={used} quota={quota} />
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className="text-[10px] text-gray-400">{quota && !isNaN(parseFloat(quota)) ? `${quota} GB` : 'N.A.'}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className="text-[10px] text-gray-400/60 font-medium">
                                                            {report.createdDate}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border space-x-1 ${report.migrationStatus === 'Migrated'
                                                            ? 'text-purple-400 bg-purple-400/5 border-purple-500/20'
                                                            : 'text-sky-400 bg-sky-400/5 border-sky-500/20'
                                                            }`}>
                                                            <span>{report.migrationStatus.toUpperCase()}</span>
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        {report.archivePolicy ?
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border text-emerald-400 bg-emerald-400/5 border-emerald-500/20">
                                                                Enabled
                                                            </span> :
                                                            <span className="text-[10px] text-gray-500 font-bold uppercase opacity-50">Disabled</span>
                                                        }
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center text-[11px] text-gray-400">

                                                            {report.retentionPolicy}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <span className="text-[10px] text-gray-600 font-black opacity-30 select-none">Can't Fetch</span>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan="9" className="py-32 text-center">
                                                    <div className="flex flex-col items-center space-y-4">
                                                        <div className="p-4 bg-white/5 rounded-full border border-white/5 text-gray-700">
                                                            <Filter className="w-12 h-12" />
                                                        </div>
                                                        <div className="text-gray-500 font-medium tracking-wide">No mailboxes found matching your search.</div>
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
            </main>
        </div>
    );
};

export default ExchangeReport;
