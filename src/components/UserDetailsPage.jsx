import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Shield, ShieldCheck, Key,
    Globe, Phone, Building, Briefcase,
    CheckCircle2, AlertCircle, ArrowLeft,
    LogOut, ExternalLink, Settings
} from 'lucide-react';
import { useMsal } from '@azure/msal-react';

const UserDetailsPage = () => {
    const navigate = useNavigate();
    const { accounts, instance } = useMsal();
    const user = accounts[0] || { name: 'Admin User', username: 'admin@company.onmicrosoft.com' };

    const handleLogout = () => {
        instance.logoutRedirect();
    };

    const permissions = [
        { role: 'Global Administrator', description: 'Full access to all administrative features in Microsoft 365.', status: 'Active' },
        { role: 'Exchange Administrator', description: 'Manage mailboxes, groups, and anti-spam policies.', status: 'Inherited' },
        { role: 'User Administrator', description: 'Reset passwords, manage users and groups.', status: 'Active' },
        { role: 'Security Administrator', description: 'Monitor threats and manage security policies.', status: 'Active' }
    ];

    const profileDetails = [
        { icon: Mail, label: 'Email', value: user.username },
        { icon: Building, label: 'Organization', value: 'Meridian Solutions' },
        { icon: Briefcase, label: 'Job Title', value: 'Security Specialist' },
        { icon: Globe, label: 'Location', value: 'Gurugram, India' },
        { icon: Phone, label: 'Mobile', value: '+91 98XXX XXXXX' },
    ];

    return (
        <div className="animate-in">
            <header className="flex-between spacing-v-4">
                <div className="flex-center flex-gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="btn btn-secondary"
                        style={{ padding: '6px' }}
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="title-gradient" style={{ fontSize: '22px' }}>Account Profile</h1>
                        <p style={{ color: 'var(--text-dim)', fontSize: '11px' }}>Manage your profile and security permissions</p>
                    </div>
                </div>
                <div className="flex-gap-2">
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>
                        <Settings size={14} />
                        Security Settings
                    </button>
                    <button onClick={handleLogout} className="btn btn-error" style={{ padding: '6px 12px', fontSize: '11px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginTop: '24px' }}>
                {/* Left Column: Brief Profile */}
                <div className="flex-column flex-gap-4">
                    <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                        <div className="avatar" style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 16px',
                            fontSize: '24px',
                            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-indigo))'
                        }}>
                            {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{user.name}</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>{user.username}</p>
                        <div style={{
                            marginTop: '16px',
                            padding: '4px 12px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--accent-blue)',
                            borderRadius: '100px',
                            fontSize: '10px',
                            fontWeight: 700,
                            display: 'inline-block',
                            textTransform: 'uppercase'
                        }}>
                            Global Admin
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '16px' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-secondary)' }}>Contact Information</h3>
                        <div className="flex-column flex-gap-4">
                            {profileDetails.map((detail, idx) => (
                                <div key={idx} className="flex-center justify-start flex-gap-3">
                                    <div style={{ padding: '6px', background: 'hsla(0,0%,100%,0.03)', borderRadius: '6px', color: 'var(--text-dim)' }}>
                                        <detail.icon size={14} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{detail.label}</div>
                                        <div style={{ fontSize: '12px', fontWeight: 500 }}>{detail.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Roles & Permissions */}
                <div className="flex-column flex-gap-4">
                    <div className="glass-card" style={{ padding: '20px' }}>
                        <div className="flex-between" style={{ marginBottom: '20px' }}>
                            <div className="flex-center flex-gap-3">
                                <ShieldCheck size={20} color="var(--accent-success)" />
                                <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Roles & Permissions</h3>
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{permissions.length} Roles Assigned</span>
                        </div>

                        <div className="flex-column flex-gap-3">
                            {permissions.map((perm, idx) => (
                                <div key={idx} className="glass-card" style={{
                                    padding: '12px',
                                    background: 'hsla(0,0%,100%,0.01)',
                                    border: '1px solid hsla(0,0%,100%,0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div className="flex-center justify-start flex-gap-2">
                                            <span style={{ fontWeight: 600, fontSize: '13px' }}>{perm.role}</span>
                                            <span style={{
                                                fontSize: '9px',
                                                padding: '2px 8px',
                                                background: perm.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                color: perm.status === 'Active' ? '#10b981' : '#3b82f6',
                                                borderRadius: '4px',
                                                fontWeight: 700
                                            }}>{perm.status}</span>
                                        </div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>{perm.description}</p>
                                    </div>
                                    <button className="btn-secondary" style={{ padding: '6px' }}>
                                        <ExternalLink size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '20px' }}>
                        <div className="flex-center flex-gap-3" style={{ marginBottom: '16px' }}>
                            <Key size={20} color="var(--accent-warning)" />
                            <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Session & Security</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ padding: '12px', background: 'hsla(0,0%,100%,0.02)', borderRadius: '8px', border: '1px solid hsla(0,0%,100%,0.05)' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Password Last Changed</div>
                                <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>14 Days Ago</div>
                            </div>
                            <div style={{ padding: '12px', background: 'hsla(0,0%,100%,0.02)', borderRadius: '8px', border: '1px solid hsla(0,0%,100%,0.05)' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>MFA Status</div>
                                <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: '#10b981' }}>Enabled (Authenticatior)</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsPage;
