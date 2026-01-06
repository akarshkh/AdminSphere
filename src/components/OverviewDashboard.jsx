import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { AggregationService } from '../services/aggregation.service';
import { motion } from 'framer-motion';
import {
    PieChart, Pie, BarChart, Bar, LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Treemap, ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer, Label, LabelList
} from 'recharts';
import {
    Users, Smartphone, CreditCard, Shield, Activity,
    TrendingUp, AlertTriangle, Mail, Loader2, Download,
    ShieldCheck, Lock, LayoutGrid
} from 'lucide-react';

const OverviewDashboard = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOverviewData = async () => {
            if (accounts.length === 0) return;
            try {
                const response = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
                const client = new GraphService(response.accessToken).client;
                const overviewData = await AggregationService.getOverviewData(client);
                setData(overviewData);
            } catch (err) {
                console.error('Overview fetch error:', err);
                setError('Failed to load overview data');
            } finally {
                setLoading(false);
            }
        };
        fetchOverviewData();
    }, [accounts, instance]);

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '60vh' }}>
                <Loader2 className="animate-spin" size={48} color="var(--accent-purple)" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <AlertTriangle size={48} color="var(--accent-error)" style={{ marginBottom: '16px' }} />
                <h3 style={{ marginBottom: '8px' }}>Unable to Load Dashboard</h3>
                <p style={{ color: 'var(--text-dim)' }}>{error}</p>
            </div>
        );
    }

    const quickStats = [
        {
            label: 'Total Users',
            value: data?.quickStats.totalUsers || 0,
            icon: Users,
            color: 'var(--accent-blue)',
            gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            path: '/service/entra/users'
        },
        {
            label: 'Managed Devices',
            value: data?.quickStats.totalDevices || 0,
            icon: Smartphone,
            color: 'var(--accent-purple)',
            gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',
            path: '/service/intune/devices'
        },
        {
            label: 'Active Licenses',
            value: data?.quickStats.totalLicenses || 0,
            icon: CreditCard,
            color: 'var(--accent-cyan)',
            gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
            path: '/service/admin/licenses'
        },
        {
            label: 'Secure Score',
            value: data?.quickStats.secureScore ? `${Math.round((data.quickStats.secureScore / data.quickStats.maxSecureScore) * 100)}%` : '0%',
            icon: Shield,
            color: 'var(--accent-success)',
            gradient: 'linear-gradient(135deg, #10b981, #059669)',
            path: '/service/admin/secure-score'
        }
    ];


    // Enhanced Premium Tooltip with Glassmorphism
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(31, 41, 55, 0.98))',
                        padding: '18px 20px',
                        border: '1.5px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '16px',
                        backdropFilter: 'blur(30px)',
                        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1), 0 0 20px rgba(139, 92, 246, 0.15)',
                        minWidth: '180px'
                    }}
                >
                    {label && (
                        <p style={{
                            fontWeight: 700,
                            marginBottom: '12px',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            letterSpacing: '0.3px',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            paddingBottom: '8px'
                        }}>
                            {label}
                        </p>
                    )}
                    {payload.map((entry, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginTop: index === 0 ? '0' : '8px'
                        }}>
                            <div style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: entry.color || entry.fill,
                                boxShadow: `0 0 10px ${entry.color || entry.fill}50`,
                                flexShrink: 0
                            }}></div>
                            <span style={{
                                fontSize: '13px',
                                color: 'var(--text-secondary)',
                                flex: 1,
                                fontWeight: 500
                            }}>
                                {entry.name}:
                            </span>
                            <span style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                background: `linear-gradient(135deg, ${entry.color || entry.fill}, ${entry.color || entry.fill}cc)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                            </span>
                        </div>
                    ))}
                </motion.div>
            );
        }
        return null;
    };

    // Custom label renderer with percentages
    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

        if (percent < 0.05) return null;

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: '14px', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };


    return (
        <div className="animate-in">
            {/* Charts Grid with Enhanced Designs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '32px' }}>

                {/* Enhanced Service Health - Radial Chart */}
                {data?.charts.serviceHealth?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="glass-card"
                        style={{ padding: '28px' }}
                    >
                        <div className="flex-center justify-start flex-gap-4 spacing-v-8">
                            <div style={{ padding: '10px', background: 'linear-gradient(135deg, var(--accent-success), var(--accent-cyan))', borderRadius: '10px' }}>
                                <Activity size={20} color="white" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Service Health</h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Real-time Status</p>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <defs>
                                    <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                                        <stop offset="95%" stopColor="#059669" stopOpacity={0.9} />
                                    </linearGradient>
                                    <linearGradient id="gradError" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9} />
                                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0.9} />
                                    </linearGradient>
                                </defs>
                                <Pie
                                    data={data.charts.serviceHealth}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomLabel}
                                    outerRadius={100}
                                    innerRadius={60}
                                    paddingAngle={4}
                                    dataKey="value"
                                    animationBegin={0}
                                    animationDuration={1000}
                                >
                                    {data.charts.serviceHealth.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Operational' ? 'url(#gradSuccess)' : 'url(#gradError)'} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* Enhanced User Distribution - Donut with Animation */}
                {data?.charts.userDistribution?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="glass-card"
                        style={{ padding: '28px' }}
                    >
                        <div className="flex-center justify-start flex-gap-4 spacing-v-8">
                            <div style={{ padding: '10px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-indigo))', borderRadius: '10px' }}>
                                <Users size={20} color="white" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>User Distribution</h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Active vs Inactive</p>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <defs>
                                    <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#059669" stopOpacity={1} />
                                    </linearGradient>
                                    <linearGradient id="gradInactive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#d97706" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <Pie
                                    data={data.charts.userDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomLabel}
                                    outerRadius={100}
                                    innerRadius={60}
                                    paddingAngle={4}
                                    dataKey="value"
                                    animationBegin={100}
                                    animationDuration={1000}
                                >
                                    {data.charts.userDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Active' ? 'url(#gradActive)' : 'url(#gradInactive)'} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* Enhanced Device Compliance - Rounded Bars with Gradients */}
                {data?.charts.deviceCompliance?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="glass-card"
                        style={{ padding: '28px' }}
                    >
                        <div className="flex-center justify-start flex-gap-4 spacing-v-8">
                            <div style={{ padding: '10px', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))', borderRadius: '10px' }}>
                                <Shield size={20} color="white" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Device Compliance</h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Security Posture</p>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.charts.deviceCompliance} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="compGradSuccess" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#059669" stopOpacity={0.8} />
                                    </linearGradient>
                                    <linearGradient id="compGradError" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#dc2626" stopOpacity={0.8} />
                                    </linearGradient>
                                    <linearGradient id="compGradWarning" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="var(--text-dim)" style={{ fontSize: '12px' }} />
                                <YAxis stroke="var(--text-dim)" style={{ fontSize: '12px' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" radius={[12, 12, 0, 0]} animationDuration={1000}>
                                    <LabelList dataKey="value" position="top" style={{ fill: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }} />
                                    {data.charts.deviceCompliance.map((entry, index) => {
                                        const fillGrad = entry.name === 'Compliant' ? 'url(#compGradSuccess)' :
                                            entry.name === 'Non-Compliant' ? 'url(#compGradError)' : 'url(#compGradWarning)';
                                        return <Cell key={`cell-${index}`} fill={fillGrad} />;
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* Enhanced License Utilization - Stacked Bars with Better Colors */}
                {data?.charts.licenseUsage?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="glass-card"
                        style={{ padding: '28px' }}
                    >
                        <div className="flex-center justify-start flex-gap-4 spacing-v-8">
                            <div style={{ padding: '10px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', borderRadius: '10px' }}>
                                <CreditCard size={20} color="white" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>License Utilization</h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Top 5 SKUs</p>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.charts.licenseUsage} layout="horizontal" margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="licGradAssigned" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#9333ea" stopOpacity={0.9} />
                                    </linearGradient>
                                    <linearGradient id="licGradAvailable" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.9} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" stroke="var(--text-dim)" style={{ fontSize: '12px' }} />
                                <YAxis type="category" dataKey="name" stroke="var(--text-dim)" style={{ fontSize: '11px' }} width={140} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '13px' }} />
                                <Bar dataKey="assigned" fill="url(#licGradAssigned)" radius={[0, 8, 8, 0]} animationDuration={1000} />
                                <Bar dataKey="available" fill="url(#licGradAvailable)" radius={[0, 8, 8, 0]} animationDuration={1200} />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* Enhanced Email Activity - Area Chart */}
                {data?.charts.emailTrend?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="glass-card"
                        style={{ padding: '28px' }}
                    >
                        <div className="flex-center justify-start flex-gap-4 spacing-v-8">
                            <div style={{ padding: '10px', background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))', borderRadius: '10px' }}>
                                <Mail size={20} color="white" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Email Activity</h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Last 7 Days</p>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.charts.emailTrend} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="emailGradSent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#9333ea" stopOpacity={0.8} />
                                    </linearGradient>
                                    <linearGradient id="emailGradReceived" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="var(--text-dim)" style={{ fontSize: '12px' }} />
                                <YAxis stroke="var(--text-dim)" style={{ fontSize: '12px' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '13px' }} />
                                <Bar dataKey="sent" fill="url(#emailGradSent)" radius={[12, 12, 0, 0]} animationDuration={1000}>
                                    <LabelList dataKey="sent" position="top" style={{ fill: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }} formatter={(value) => value.toLocaleString()} />
                                </Bar>
                                <Bar dataKey="received" fill="url(#emailGradReceived)" radius={[12, 12, 0, 0]} animationDuration={1200}>
                                    <LabelList dataKey="received" position="top" style={{ fill: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }} formatter={(value) => value.toLocaleString()} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* Enhanced Device by Platform - Gradient Bars */}
                {data?.charts.deviceByPlatform?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="glass-card"
                        style={{ padding: '28px' }}
                    >
                        <div className="flex-center justify-start flex-gap-4 spacing-v-8">
                            <div style={{ padding: '10px', background: 'linear-gradient(135deg, var(--accent-success), var(--accent-cyan))', borderRadius: '10px' }}>
                                <Smartphone size={20} color="white" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Devices by Platform</h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Operating Systems</p>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.charts.deviceByPlatform} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="platformGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#059669" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="var(--text-dim)" style={{ fontSize: '12px' }} />
                                <YAxis stroke="var(--text-dim)" style={{ fontSize: '12px' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" fill="url(#platformGrad)" radius={[12, 12, 0, 0]} animationDuration={1000}>
                                    <LabelList dataKey="value" position="top" style={{ fill: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}
            </div>

            {/* NEW SECTION: Advanced Multi-Dimensional Charts */}
            <div style={{ marginTop: '48px' }}>
                <h2 style={{ fontSize: '28px', marginBottom: '8px', fontWeight: 700, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Advanced Analytics
                </h2>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '32px' }}>
                    Multi-dimensional views and complex correlations
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '32px' }}>

                    {/* Security Posture Radar Chart */}
                    {data?.charts.securityRadar && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="glass-card"
                            style={{ padding: '28px' }}
                        >
                            <div className="flex-center justify-start flex-gap-4 spacing-v-8">
                                <div style={{ padding: '10px', background: 'linear-gradient(135deg, var(--accent-error), var(--accent-warning))', borderRadius: '10px' }}>
                                    <Shield size={20} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Security Posture</h3>
                                    <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>5-Dimensional View</p>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <RadarChart data={data.charts.securityRadar}>
                                    <defs>
                                        <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0.3} />
                                        </linearGradient>
                                    </defs>
                                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                    <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" style={{ fontSize: '12px' }} />
                                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="var(--text-dim)" style={{ fontSize: '11px' }} />
                                    <Radar name="Security Score" dataKey="value" stroke="#3b82f6" fill="url(#radarGrad)" fillOpacity={0.6} strokeWidth={2} dot={{ fill: '#3b82f6', r: 5 }} animationDuration={1500} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}

                    {/* User Growth Trend - Stacked Area Chart */}
                    {data?.charts.userGrowthTrend && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.7 }}
                            className="glass-card"
                            style={{ padding: '28px' }}
                        >
                            <div className="flex-center justify-start flex-gap-4 spacing-v-8">
                                <div style={{ padding: '10px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))', borderRadius: '10px' }}>
                                    <TrendingUp size={20} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>User Growth Trend</h3>
                                    <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>5-Week History</p>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <AreaChart data={data.charts.userGrowthTrend} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="areaActive" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                        </linearGradient>
                                        <linearGradient id="areaInactive" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="week" stroke="var(--text-dim)" style={{ fontSize: '11px' }} />
                                    <YAxis stroke="var(--text-dim)" style={{ fontSize: '12px' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                                    <Area type="monotone" dataKey="active" stackId="1" stroke="#10b981" fill="url(#areaActive)" strokeWidth={2} animationDuration={1500} />
                                    <Area type="monotone" dataKey="inactive" stackId="1" stroke="#f59e0b" fill="url(#areaInactive)" strokeWidth={2} animationDuration={1700} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}

                    {/* License Distribution Treemap */}
                    {data?.charts.licenseTreemap && data.charts.licenseTreemap.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                            className="glass-card"
                            style={{ padding: '28px' }}
                        >
                            <div className="flex-center justify-start flex-gap-4 spacing-v-8">
                                <div style={{ padding: '10px', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-indigo))', borderRadius: '10px' }}>
                                    <LayoutGrid size={20} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>License Distribution</h3>
                                    <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Treemap View</p>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <Treemap
                                    data={data.charts.licenseTreemap}
                                    dataKey="size"
                                    stroke="#fff"
                                    strokeWidth={2}
                                    fill="#8884d8"
                                    content={({ x, y, width, height, index, name, size, fill }) => {
                                        if (width < 60 || height < 40) return null;
                                        return (
                                            <g>
                                                <rect
                                                    x={x}
                                                    y={y}
                                                    width={width}
                                                    height={height}
                                                    style={{
                                                        fill: fill,
                                                        stroke: 'rgba(255,255,255,0.2)',
                                                        strokeWidth: 2,
                                                        opacity: 0.9
                                                    }}
                                                />
                                                <text
                                                    x={x + width / 2}
                                                    y={y + height / 2 - 10}
                                                    textAnchor="middle"
                                                    fill="#fff"
                                                    style={{ fontSize: '12px', fontWeight: 600 }}
                                                >
                                                    {name}
                                                </text>
                                                <text
                                                    x={x + width / 2}
                                                    y={y + height / 2 + 10}
                                                    textAnchor="middle"
                                                    fill="rgba(255,255,255,0.8)"
                                                    style={{ fontSize: '14px', fontWeight: 700 }}
                                                >
                                                    {size?.toLocaleString()}
                                                </text>
                                            </g>
                                        );
                                    }}
                                    animationDuration={1000}
                                />
                            </ResponsiveContainer>
                        </motion.div>
                    )}

                    {/* Enrollment Funnel */}
                    {data?.charts.enrollmentFunnel && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.9 }}
                            className="glass-card"
                            style={{ padding: '28px' }}
                        >
                            <div className="flex-center justify-start flex-gap-4 spacing-v-8">
                                <div style={{ padding: '10px', background: 'linear-gradient(135deg, var(--accent-success), var(--accent-blue))', borderRadius: '10px' }}>
                                    <Users size={20} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Enrollment Funnel</h3>
                                    <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>User Journey</p>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={data.charts.enrollmentFunnel} layout="horizontal" margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                    <defs>
                                        {data.charts.enrollmentFunnel.map((item, idx) => (
                                            <linearGradient key={`funnel${idx}`} id={`funnelGrad${idx}`} x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="5%" stopColor={item.fill} stopOpacity={1} />
                                                <stop offset="95%" stopColor={item.fill} stopOpacity={0.7} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" stroke="var(--text-dim)" style={{ fontSize: '12px' }} />
                                    <YAxis type="category" dataKey="stage" stroke="var(--text-dim)" style={{ fontSize: '12px' }} width={130} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" radius={[0, 12, 12, 0]} animationDuration={1400}>
                                        <LabelList dataKey="count" position="right" style={{ fill: 'var(--text-primary)', fontSize: '13px', fontWeight: 700 }} formatter={(val) => val.toLocaleString()} />
                                        {data.charts.enrollmentFunnel.map((entry, idx) => (
                                            <Cell key={`cell-${idx}`} fill={`url(#funnelGrad${idx})`} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}

                    {/* License Trend - Composed Chart (Bar + Line) */}
                    {data?.charts.licenseTrendComposed && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 1.0 }}
                            className="glass-card"
                            style={{ padding: '28px' }}
                        >
                            <div className="flex-center justify-start flex-gap-4 spacing-v-8">
                                <div style={{ padding: '10px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', borderRadius: '10px' }}>
                                    <CreditCard size={20} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700 }}>License Trend</h3>
                                    <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Utilization Over Time</p>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <ComposedChart data={data.charts.licenseTrendComposed} margin={{ top: 20, right: 40, left: 0, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="compAssigned" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={1} />
                                            <stop offset="95%" stopColor="#9333ea" stopOpacity={0.8} />
                                        </linearGradient>
                                        <linearGradient id="compAvailable" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={1} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="month" stroke="var(--text-dim)" style={{ fontSize: '11px' }} />
                                    <YAxis yAxisId="left" stroke="var(--text-dim)" style={{ fontSize: '12px' }} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" style={{ fontSize: '12px' }} domain={[0, 100]} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                                    <Bar yAxisId="left" dataKey="assigned" fill="url(#compAssigned)" radius={[8, 8, 0, 0]} animationDuration={1000} />
                                    <Bar yAxisId="left" dataKey="available" fill="url(#compAvailable)" radius={[8, 8, 0, 0]} animationDuration={1200} />
                                    <Line yAxisId="right" type="monotone" dataKey="utilization" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 5 }} activeDot={{ r: 7 }} animationDuration={1400}>
                                        <LabelList dataKey="utilization" position="top" formatter={(val) => `${val}%`} style={{ fill: '#f59e0b', fontSize: '12px', fontWeight: 700 }} />
                                    </Line>
                                </ComposedChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default OverviewDashboard;
