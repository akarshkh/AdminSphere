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
    TrendingUp, Loader2
} from 'lucide-react';

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
        autopilotDevices: 0,
        securityBaselines: 0,
        adminRoles: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (accounts.length > 0) {
                try {
                    const response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0]
                    });
                    const client = new GraphService(response.accessToken).client;

                    const dashboardStats = await IntuneService.getDashboardStats(client);
                    setStats(dashboardStats);
                } catch (error) {
                    console.error("Intune dashboard fetch error:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchDashboardData();
    }, [accounts, instance]);

    const tiles = [
        {
            label: 'All Managed Devices',
            value: stats.totalDevices.toLocaleString(),
            trend: 'Manage',
            color: 'text-blue-400',
            path: '/service/intune/devices',
            icon: Smartphone,
            description: 'Total devices under management'
        },
        {
            label: 'Non-Compliant Devices',
            value: stats.nonCompliantDevices.toLocaleString(),
            trend: 'High-Risk',
            color: 'text-red-400',
            path: '/service/intune/non-compliant',
            icon: AlertTriangle,
            description: 'Devices failing compliance'
        },
        {
            label: 'Inactive Devices',
            value: stats.inactiveDevices.toLocaleString(),
            trend: '>30 Days',
            color: 'text-orange-400',
            path: '/service/intune/inactive',
            icon: Clock,
            description: 'Stale devices not syncing'
        },
        {
            label: 'Compliance Policies',
            value: stats.compliancePolicies.toLocaleString(),
            trend: 'Active',
            color: 'text-green-400',
            path: '/service/intune/compliance-policies',
            icon: Shield,
            description: 'Compliance policy rules'
        },
        {
            label: 'Configuration Profiles',
            value: stats.configProfiles.toLocaleString(),
            trend: 'Deployed',
            color: 'text-purple-400',
            path: '/service/intune/config-profiles',
            icon: Settings,
            description: 'Device configuration policies'
        },
        {
            label: 'Applications',
            value: stats.mobileApps.toLocaleString(),
            trend: 'Managed',
            color: 'text-cyan-400',
            path: '/service/intune/applications',
            icon: Package,
            description: 'Mobile app inventory'
        },
        {
            label: 'Autopilot & Enrollment',
            value: stats.autopilotDevices.toLocaleString(),
            trend: 'Provisioned',
            color: 'text-indigo-400',
            path: '/service/intune/autopilot',
            icon: Rocket,
            description: 'Windows Autopilot devices'
        },
        {
            label: 'Security Baselines',
            value: stats.securityBaselines.toLocaleString(),
            trend: 'Applied',
            color: 'text-yellow-400',
            path: '/service/intune/security-baselines',
            icon: Lock,
            description: 'Security baseline policies'
        },
        {
            label: 'User → Devices View',
            value: 'Search',
            trend: 'Enabled',
            color: 'text-teal-400',
            path: '/service/intune/user-devices',
            icon: Users,
            description: 'Find devices by user'
        },
        {
            label: 'RBAC & Admin Access',
            value: stats.adminRoles.toLocaleString(),
            trend: 'Roles',
            color: 'text-pink-400',
            path: '/service/intune/rbac',
            icon: UserCog,
            description: 'Role-based access control'
        },
        {
            label: 'Audit & Activity Logs',
            value: 'Recent',
            trend: 'Live',
            color: 'text-gray-400',
            path: '/service/intune/audit-logs',
            icon: FileText,
            description: 'Admin action history'
        },
        {
            label: 'Reports & Insights',
            value: 'Analytics',
            trend: 'Trends',
            color: 'text-emerald-400',
            path: '/service/intune/reports',
            icon: TrendingUp,
            description: 'Compliance and device trends'
        }
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <div className="w-full">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-['Outfit'] bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent leading-tight mb-2">
                        Microsoft Intune
                    </h1>
                    <p className="text-sm text-gray-400">Device management and mobile application management</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                    >
                        {tiles.map((tile, i) => (
                            <div
                                key={i}
                                onClick={() => navigate(tile.path)}
                                className="glass p-6 cursor-pointer hover:bg-white/5 transition-all hover:scale-[1.02]"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-gray-400 text-sm">{tile.label}</p>
                                    <tile.icon className={`w-5 h-5 ${tile.color}`} />
                                </div>

                                <p className="text-3xl font-bold">{tile.value}</p>

                                <div className={`mt-4 flex items-center text-xs ${tile.color}`}>
                                    <span className="font-bold">{tile.trend}</span>
                                    <span className="ml-2 text-gray-500 text-[10px] uppercase tracking-wider">Source: Microsoft Graph</span>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default IntuneMonitoring;
