import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { Loader2, CheckCircle2, XCircle, Globe, ShieldCheck, ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const DomainsPage = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDomains = async () => {
            if (accounts.length === 0) return;
            setLoading(true);
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
                setError("Failed to synchronize organization domains from Microsoft Graph.");
            } finally {
                setLoading(false);
            }
        };

        fetchDomains();
    }, [instance, accounts]);

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

                <div className="mb-10">
                    <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                        Verified Domains
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Management and verification for all organizational custom domains</p>
                </div>

                {error && (
                    <div style={{ marginBottom: '32px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
                        <XCircle size={24} />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin" size={48} color="var(--accent-blue)" />
                        <p style={{ color: 'var(--text-secondary)' }}>Synchronizing domain registry...</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass"
                        style={{ padding: '32px' }}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold">Domain Directory</h3>
                            <div className="badge badge-secondary" style={{ textTransform: 'none' }}>
                                {domains.length} Total Domains
                            </div>
                        </div>

                        <div className="table-container">
                            <table className="data-table">
                                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)' }}>
                                    <tr>
                                        <th>Domain Name</th>
                                        <th>Status</th>
                                        <th>Authentication</th>
                                        <th style={{ textAlign: 'center' }}>Default</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {domains.map((domain) => (
                                        <tr key={domain.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="avatar" style={{ background: 'rgba(59, 130, 246, 0.05)', color: 'var(--accent-blue)', width: '32px', height: '32px' }}>
                                                        <Globe size={14} />
                                                    </div>
                                                    <span style={{ fontWeight: 600 }}>{domain.id}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {domain.isVerified ? (
                                                    <span className="badge badge-success" style={{ fontSize: '10px' }}>
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-orange)', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '10px' }}>
                                                        Unverified
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>
                                                {domain.authenticationType}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {domain.isDefault && (
                                                    <span className="badge badge-success" style={{ borderRadius: '50%', padding: '4px', display: 'inline-flex' }}>
                                                        <CheckCircle2 size={12} />
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default DomainsPage;
