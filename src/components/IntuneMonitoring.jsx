import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { IntuneService } from '../services/intune';
import { motion } from 'framer-motion';
import {
    Smartphone, AlertTriangle, Clock, Shield, Settings,
    Package, Rocket, Lock, Users, UserCog, FileText,
    TrendingUp, Loader2, ArrowRight, RefreshCw
} from 'lucide-react';
import { DataPersistenceService } from '../services/dataPersistence';

const IntuneMonitoring = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();

    const [stats, setStats] = useState({
        totalDevices: 0,
        nonCompliantDevices: 0,
        inactiveDevices: 0,
        compliancePolicies: 0,
        configProfiles: 0,
        mobileApps: 0,
        securityBaselines: 0,
        adminRoles: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async (isManual = false) => {
        if (accounts.length === 0) return;
        setLoading(true);
        try {
            const response = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
            const client = new GraphService(response.accessToken).client;
            const dashboardStats = await IntuneService.getDashboardStats(client);

            // Map to our persistence schema
            const persistenceData = {
                intune: {
                    devices: {
                        total: dashboardStats.totalDevices,
                        non_compliant: dashboardStats.nonCompliantDevices,
                        inactive: dashboardStats.inactiveDevices
                    },
                    policies: {
                        compliance: dashboardStats.compliancePolicies,
                        configuration: dashboardStats.configProfiles
                    },
                    apps: {
                        total_managed: dashboardStats.mobileApps
                    },
                    security: {
                        baselines: dashboardStats.securityBaselines,
                        admin_roles: dashboardStats.adminRoles
                    }
                },
                raw: dashboardStats
            };

            await DataPersistenceService.save('Intune', persistenceData);
            setStats(dashboardStats);
        } catch (error) {
            console.error("Intune dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadData = async () => {
        const cached = await DataPersistenceService.load('Intune');
        if (cached && cached.raw) {
            setStats(cached.raw);
            setLoading(false);

            if (DataPersistenceService.isExpired('Intune', 30)) {
                fetchDashboardData(false);
            }
        } else {
            fetchDashboardData(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [accounts, instance]);

    const tiles = [
        {
            label: 'All Managed Devices',
            value: stats.totalDevices,
            trend: 'Manage',
            color: 'var(--accent-blue)',
            path: '/service/intune/devices',
            icon: Smartphone
        },
        {
            label: 'Non-Compliant Devices',
            value: stats.nonCompliantDevices,
            trend: 'High-Risk',
            color: 'var(--accent-error)',
            path: '/service/intune/non-compliant',
            icon: AlertTriangle
        },
        {
            label: 'Inactive Devices',
            value: stats.inactiveDevices,
            trend: '>30 Days',
            color: 'var(--accent-warning)',
            path: '/service/intune/inactive',
            icon: Clock
        },
        {
            label: 'Compliance Policies',
            value: stats.compliancePolicies,
            trend: 'Active',
            color: 'var(--accent-success)',
            path: '/service/intune/compliance-policies',
            icon: Shield
        },
        {
            label: 'Configuration Profiles',
            value: stats.configProfiles,
            trend: 'Deployed',
            color: 'var(--accent-purple)',
            path: '/service/intune/config-profiles',
            icon: Settings
        },
        {
            label: 'Applications',
            value: stats.mobileApps,
            trend: 'Managed',
            color: 'var(--accent-cyan)',
            path: '/service/intune/applications',
            icon: Package
        },
        {
            label: 'Security Baselines',
            value: stats.securityBaselines,
            trend: 'Applied',
            color: 'var(--accent-warning)',
            path: '/service/intune/security-baselines',
            icon: Lock
        },
        {
            label: 'User → Devices View',
            value: 'Search',
            trend: 'Enabled',
            color: 'var(--accent-cyan)',
            path: '/service/intune/user-devices',
            icon: Users
        },
        {
            label: 'RBAC & Admin Access',
            value: stats.adminRoles,
            trend: 'Roles',
            color: 'var(--accent-purple)',
            path: '/service/intune/rbac',
            icon: UserCog
        },
        {
            label: 'Audit & Activity Logs',
            value: 'Recent',
            trend: 'Live',
            color: 'var(--accent-blue)',
            path: '/service/intune/audit-logs',
            icon: FileText
        },
        {
            label: 'Reports & Insights',
            value: 'Analytics',
            trend: 'Trends',
            color: 'var(--accent-success)',
            path: '/service/intune/reports',
            icon: TrendingUp
        }
    ];

    return (
        <div className="animate-in">
            <header className="flex-between spacing-v-8">
                <div>
                    <h1 className="title-gradient" style={{ fontSize: '32px' }}>Microsoft Intune</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Device management and mobile application management</p>
                </div>
                <div className="flex-gap-2">
                    <button className={`sync-btn ${loading ? 'spinning' : ''}`} onClick={() => fetchDashboardData(true)} title="Sync & Refresh">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex-center" style={{ height: '400px' }}>
                    <Loader2 className="animate-spin" size={40} color="var(--accent-blue)" />
                </div>
            ) : (
                <div className="stat-grid">
                    {tiles.map((tile, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -5 }}
                            className="glass-card stat-card"
                            onClick={() => navigate(tile.path)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="flex-between spacing-v-4">
                                <span className="stat-label">{tile.label}</span>
                                <tile.icon size={20} style={{ color: tile.color }} />
                            </div>
                            <div className="stat-value">{typeof tile.value === 'number' ? tile.value.toLocaleString() : tile.value}</div>
                            <div className="flex-between mt-4" style={{ marginTop: '16px' }}>
                                <span className="badge badge-info">{tile.trend}</span>
                                <ArrowRight size={14} style={{ color: 'var(--text-dim)' }} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default IntuneMonitoring;
