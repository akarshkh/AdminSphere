import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { DevicesService } from '../services/entra';
import { ArrowLeft, Search, Laptop, Monitor, Smartphone, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import styles from './DetailPage.module.css';

const EntraDevices = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');

    useEffect(() => {
        const fetchDevices = async () => {
            if (accounts.length > 0) {
                try {
                    const response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0]
                    });
                    const client = new GraphService(response.accessToken).client;
                    const data = await DevicesService.getAllDevices(client, 100);
                    setDevices(data);
                } catch (error) {
                    console.error("Device fetch error", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchDevices();
    }, [accounts, instance]);

    const filteredDevices = devices.filter(d =>
        d.displayName?.toLowerCase().includes(filterText.toLowerCase())
    );

    const getOsIcon = (os) => {
        const lower = os?.toLowerCase() || '';
        if (lower.includes('window')) return <Monitor style={{ width: '1rem', height: '1rem' }} />;
        if (lower.includes('ios') || lower.includes('iphone')) return <Smartphone style={{ width: '1rem', height: '1rem' }} />;
        if (lower.includes('android')) return <Smartphone style={{ width: '1rem', height: '1rem' }} />;
        return <Laptop style={{ width: '1rem', height: '1rem' }} />;
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className="animate-spin" style={{ width: '2.5rem', height: '2.5rem', color: '#ec4899' }} />
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
                        <Laptop style={{ width: '2rem', height: '2rem', color: '#ec4899' }} />
                        Devices
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Manage organization devices, compliance status, and ownership
                    </p>
                </div>

                <div className={styles.filterBar}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#6b7280' }} />
                        <input
                            type="text"
                            placeholder="Search devices..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className={styles.filterInput}
                            style={{ paddingLeft: '2.75rem' }}
                        />
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Device Inventory</h2>
                        <span className={`${styles.badge}`} style={{ background: 'rgba(236, 72, 153, 0.1)', borderColor: 'rgba(236, 72, 153, 0.3)', color: '#ec4899' }}>
                            {filteredDevices.length} DEVICES
                        </span>
                    </div>

                    {filteredDevices.length > 0 ? (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th>Device Name</th>
                                        <th>OS</th>
                                        <th>Ownership</th>
                                        <th>Last Sign-in</th>
                                        <th>Compliance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDevices.map((device, i) => (
                                        <tr key={i} className={styles.tableRow}>
                                            <td style={{ fontWeight: 500, color: 'white' }}>{device.displayName}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                                                    {getOsIcon(device.operatingSystem)}
                                                    {device.operatingSystem}
                                                </div>
                                            </td>
                                            <td style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                                                {device.isManaged ? 'Managed' : 'Unmanaged'}
                                            </td>
                                            <td style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                                                {device.approximateLastSignInDateTime
                                                    ? new Date(device.approximateLastSignInDateTime).toLocaleDateString()
                                                    : 'Never'}
                                            </td>
                                            <td>
                                                {device.complianceState === 'compliant' ? (
                                                    <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                                                        <CheckCircle style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.375rem' }} />
                                                        Compliant
                                                    </span>
                                                ) : (
                                                    <span className={`${styles.badge} ${styles.badgeWarning}`}>
                                                        <AlertTriangle style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.375rem' }} />
                                                        {device.complianceState || 'Unknown'}
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
                            <div className={styles.emptyIcon} style={{ background: 'rgba(236, 72, 153, 0.08)', borderColor: 'rgba(236, 72, 153, 0.2)' }}>
                                <Laptop style={{ width: '2.5rem', height: '2.5rem', color: '#ec4899' }} />
                            </div>
                            <h3 className={styles.emptyTitle}>No Devices Found</h3>
                            <p className={styles.emptyDescription}>
                                {filterText ? `No devices match "${filterText}"` : "No devices are registered in your organization."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EntraDevices;
