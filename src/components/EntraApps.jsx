import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { ArrowLeft, Search, Download, Box, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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

    return (
        <div className="app-container">
            <div className="main-content">
                <button
                    onClick={() => navigate('/service/entra')}
                    className="btn-back"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Entra ID</span>
                </button>

                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                            App Registrations
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Full visibility into directory integrated enterprise applications</p>
                    </div>
                    <div className="flex gap-4">
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                            <input
                                type="text"
                                placeholder="Search apps..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className="glass"
                                style={{ padding: '10px 16px 10px 40px', borderRadius: '12px', fontSize: '0.875rem', width: '280px' }}
                            />
                        </div>
                        <button onClick={handleDownloadCSV} className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '0.875rem' }}>
                            <Download size={16} />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin" size={48} color="var(--accent-blue)" />
                        <p style={{ color: 'var(--text-secondary)' }}>Synchronizing application manifest...</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass"
                        style={{ padding: '32px' }}
                    >
                        <div className="table-container">
                            <table className="data-table">
                                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)' }}>
                                    <tr>
                                        <th>Display Name</th>
                                        <th>Application (Client) ID</th>
                                        <th>Created</th>
                                        <th>Audience</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredApps.length > 0 ? (
                                        filteredApps.map((app, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="avatar" style={{ background: 'rgba(34, 211, 238, 0.05)', color: 'var(--accent-cyan)', width: '32px', height: '32px' }}>
                                                            <Box size={14} />
                                                        </div>
                                                        <span style={{ fontWeight: 600 }}>{app.displayName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: 'monospace' }}>{app.appId}</td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{new Date(app.createdDateTime).toLocaleDateString()}</td>
                                                <td>
                                                    <span className="badge badge-secondary" style={{ fontSize: '10px', textTransform: 'none' }}>
                                                        {app.signInAudience}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '80px', textAlign: 'center' }}>
                                                <div className="flex flex-col items-center gap-4 text-muted">
                                                    <Search size={48} opacity={0.2} />
                                                    <p>No applications found matching your search.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default EntraApps;
