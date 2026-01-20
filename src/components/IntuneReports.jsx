import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { ArrowLeft, TrendingUp, RefreshCw, BarChart3, PieChart, Activity } from 'lucide-react';
import { IntuneService } from '../services/intune';
import { GraphService } from '../services/graphService';
import Loader3D from './Loader3D';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const IntuneReports = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        complianceRate: 0,
        totalDevices: 0,
        osDistribution: {},
        appFailures: 0
    });

    useEffect(() => {
        if (accounts.length > 0) {
            loadData();
        }
    }, [accounts, instance]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Initialize Graph Client
            const client = GraphService.getClient(instance, accounts);

            // Re-use the existing dashboard stats service which now has OS data
            const dashboardStats = await IntuneService.getDashboardStats(client);

            // Transform osDistribution for charts
            const osDist = dashboardStats.osDistribution || {};
            const osChartData = Object.keys(osDist).map(key => ({
                name: key,
                value: osDist[key]
            })).filter(d => d.value > 0);

            // Mock historical data for trend charts (since we lack a history API right now)
            // In a real app, this would come from a dedicated reporting endpoint

            setStats({
                ...dashboardStats,
                osChartData,
                // Compliance calculation if missing
                complianceRate: dashboardStats.complianceRate ||
                    (dashboardStats.totalDevices > 0 ? ((dashboardStats.totalDevices - dashboardStats.nonCompliantDevices) / dashboardStats.totalDevices * 100) : 100)
            });
        } catch (error) {
            console.error("Failed to load report data", error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    // Mock trend data for visualization
    const trendData = [
        { name: 'Mon', value: 92 },
        { name: 'Tue', value: 93 },
        { name: 'Wed', value: 91 },
        { name: 'Thu', value: 94 },
        { name: 'Fri', value: 95 },
        { name: 'Sat', value: 95 },
        { name: 'Sun', value: stats.complianceRate || 96 },
    ];

    if (loading) return <Loader3D showOverlay={true} />;

    return (
        <div className="animate-in" style={{ paddingBottom: '40px' }}>
            <header className="flex-between spacing-v-8">
                <div>
                    <h1 className="title-gradient" style={{ fontSize: '32px' }}>Reports & Insights</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Deep dive into device compliance and inventory analytics</p>
                </div>
                <div className="flex-gap-2">
                    <button className="sync-btn" onClick={loadData} title="Refresh Data">
                        <RefreshCw size={16} />
                    </button>
                    <button onClick={() => navigate('/service/intune')} className="btn-back">
                        <ArrowLeft size={16} style={{ marginRight: '8px' }} />
                        Back to Dashboard
                    </button>
                </div>
            </header>

            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {/* OS Distribution Chart */}
                <div className="glass-card" style={{ minHeight: '300px' }}>
                    <div className="flex-between" style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                <PieChart size={20} />
                            </div>
                            <span style={{ fontWeight: 600 }}>OS Distribution</span>
                        </div>
                    </div>

                    <div style={{ height: '220px', width: '100%' }}>
                        <ResponsiveContainer>
                            <RechartsPie>
                                <Pie
                                    data={stats.osChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(stats.osChartData || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                                <Legend />
                            </RechartsPie>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Compliance Trend Chart */}
                <div className="glass-card" style={{ minHeight: '300px' }}>
                    <div className="flex-between" style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                <TrendingUp size={20} />
                            </div>
                            <span style={{ fontWeight: 600 }}>Compliance Trend (7 Days)</span>
                        </div>
                        <span className="badge badge-success">{stats.complianceRate?.toFixed(1)}% Current</span>
                    </div>

                    <div style={{ height: '220px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-dim)" fontSize={12} tickLine={false} axisLine={false} domain={[80, 100]} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                                />
                                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Inventory Summary */}
                <div className="glass-card" style={{ minHeight: '300px' }}>
                    <div className="flex-between" style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                                <Activity size={20} />
                            </div>
                            <span style={{ fontWeight: 600 }}>Inventory Health</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ padding: '16px', background: 'var(--glass-bg-hover)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Total Managed Devices</div>
                                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.totalDevices}</div>
                            </div>
                            <div style={{ height: '8px', width: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>
                        </div>

                        <div style={{ padding: '16px', background: 'var(--glass-bg-hover)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Non-Compliant</div>
                                <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>{stats.nonCompliantDevices}</div>
                            </div>
                            <div style={{ height: '8px', width: '8px', borderRadius: '50%', background: '#ef4444' }}></div>
                        </div>

                        <div style={{ padding: '16px', background: 'var(--glass-bg-hover)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Inactive ({'>'}30 Days)</div>
                                <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>{stats.inactiveDevices}</div>
                            </div>
                            <div style={{ height: '8px', width: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntuneReports;
