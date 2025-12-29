import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { IntuneService } from '../services/intune';
import { ArrowLeft, Search, Rocket, Loader2 } from 'lucide-react';
import styles from './DetailPage.module.css';

const IntuneAutopilot = () => {
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
                    const data = await IntuneService.getAutopilotDevices(client);
                    setDevices(data);
                } catch (error) {
                    console.error("Autopilot device fetch error:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchDevices();
    }, [accounts, instance]);

    const filteredDevices = devices.filter(device =>
        (device.serialNumber || '').toLowerCase().includes(filterText.toLowerCase()) ||
        (device.model || '').toLowerCase().includes(filterText.toLowerCase())
    );

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className="animate-spin" style={{ width: '2.5rem', height: '2.5rem', color: '#6366f1' }} />
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <button onClick={() => navigate('/service/intune')} className={styles.backButton}>
                    <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Back to Dashboard
                </button>

                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>
                        <Rocket style={{ width: '2rem', height: '2rem', color: '#6366f1' }} />
                        Autopilot & Enrollment
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Windows Autopilot devices and enrollment status
                    </p>
                </div>

                <div className={styles.filterBar}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: '#6b7280' }} />
                        <input
                            type="text"
                            placeholder="Search autopilot devices..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className={styles.filterInput}
                            style={{ paddingLeft: '2.75rem' }}
                        />
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Autopilot Devices</h2>
                        <span className={`${styles.badge} ${styles.badgeInfo}`}>
                            {filteredDevices.length} DEVICES
                        </span>
                    </div>

                    {filteredDevices.length > 0 ? (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th>Serial Number</th>
                                        <th>Model</th>
                                        <th>Manufacturer</th>
                                        <th>Enrollment State</th>
                                        <th>Last Contacted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDevices.map((device, i) => (
                                        <tr key={i} className={styles.tableRow}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <Rocket style={{ width: '1.25rem', height: '1.25rem', color: '#6366f1' }} />
                                                    <span style={{ fontWeight: 500, color: 'white' }}>{device.serialNumber || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: '#d1d5db', fontSize: '0.875rem' }}>{device.model || 'Unknown'}</td>
                                            <td style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{device.manufacturer || 'Unknown'}</td>
                                            <td>
                                                <span className={`${styles.badge} ${device.enrollmentState === 'enrolled' ? styles.badgeSuccess : styles.badgeNeutral}`}>
                                                    {device.enrollmentState || 'Unknown'}
                                                </span>
                                            </td>
                                            <td style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                                                {device.lastContactedDateTime ? new Date(device.lastContactedDateTime).toLocaleString() : 'Never'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <Rocket style={{ width: '2.5rem', height: '2.5rem', color: '#6b7280' }} />
                            </div>
                            <h3 className={styles.emptyTitle}>No Autopilot Devices</h3>
                            <p className={styles.emptyDescription}>
                                No Windows Autopilot devices found or no devices match your search.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IntuneAutopilot;
