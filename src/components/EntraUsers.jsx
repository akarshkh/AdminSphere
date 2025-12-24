import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { ArrowLeft, Search, Download, User, Shield, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const EntraUsers = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedUsers = React.useMemo(() => {
        let sortableItems = [...users];
        if (filterText) {
            sortableItems = sortableItems.filter(user =>
                user.displayName.toLowerCase().includes(filterText.toLowerCase()) ||
                user.userPrincipalName.toLowerCase().includes(filterText.toLowerCase())
            );
        }
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key] || '';
                const bVal = b[sortConfig.key] || '';
                if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [users, filterText, sortConfig]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                if (accounts.length > 0) {
                    const response = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
                    const graphService = new GraphService(response.accessToken);
                    const data = await graphService.getExchangeMailboxReport();
                    setUsers(data.reports || []);
                }
            } catch (error) {
                console.error("User fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        if (accounts.length > 0) fetchUsers();
    }, [accounts, instance]);

    const handleDownloadCSV = () => {
        const headers = ['Display Name', 'User Principal Name', 'User Type', 'Account Enabled', 'City', 'Country', 'Department', 'Job Title'];
        const rows = sortedUsers.map(u => [`"${u.displayName}"`, `"${u.userPrincipalName}"`, `"${u.userType || 'Member'}"`, u.accountEnabled, `"${u.city}"`, `"${u.country}"`, `"${u.department}"`, `"${u.jobTitle}"`]);
        const blob = new Blob([[headers.join(','), ...rows.map(r => r.join(','))].join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'entra_users.csv';
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

                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>User Identities</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Lifecycle management and audit for all directory users</p>
                    </div>
                    <div className="flex gap-4">
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
                        <button onClick={handleDownloadCSV} className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '0.875rem' }}>
                            <Download size={16} />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin" size={48} color="var(--accent-blue)" />
                        <p style={{ color: 'var(--text-secondary)' }}>Synchronizing identity directory...</p>
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
                                        <th onClick={() => requestSort('displayName')} style={{ cursor: 'pointer' }}>
                                            <div className="flex items-center gap-1">Display Name {sortConfig.key === 'displayName' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}</div>
                                        </th>
                                        <th onClick={() => requestSort('userPrincipalName')} style={{ cursor: 'pointer' }}>
                                            <div className="flex items-center gap-1">UPN / Email {sortConfig.key === 'userPrincipalName' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}</div>
                                        </th>
                                        <th onClick={() => requestSort('city')} style={{ cursor: 'pointer' }}>
                                            <div className="flex items-center gap-1">Location {sortConfig.key === 'city' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}</div>
                                        </th>
                                        <th onClick={() => requestSort('accountEnabled')} style={{ cursor: 'pointer' }}>
                                            <div className="flex items-center gap-1">Status {sortConfig.key === 'accountEnabled' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}</div>
                                        </th>
                                        <th onClick={() => requestSort('jobTitle')} style={{ cursor: 'pointer' }}>
                                            <div className="flex items-center gap-1">Role / Dept {sortConfig.key === 'jobTitle' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}</div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedUsers.length > 0 ? sortedUsers.map((user, i) => (
                                        <tr key={i}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="avatar" style={{ background: 'rgba(59, 130, 246, 0.05)', color: 'var(--accent-blue)', fontSize: '10px', width: '32px', height: '32px' }}>
                                                        {user.displayName.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight: 600 }}>{user.displayName}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{user.userPrincipalName}</td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user.city ? `${user.city}, ${user.country}` : <span style={{ opacity: 0.3 }}>Cloud Native</span>}</td>
                                            <td>
                                                <span className={`badge ${user.accountEnabled === 'Yes' ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '10px' }}>
                                                    {user.accountEnabled === 'Yes' ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{user.jobTitle || <span style={{ opacity: 0.3 }}>-</span>}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.department}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '80px', textAlign: 'center' }}>
                                                <div className="flex flex-col items-center gap-4 text-muted">
                                                    <Search size={48} opacity={0.2} />
                                                    <p>No users found matching your search.</p>
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

export default EntraUsers;
