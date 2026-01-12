import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Zap, Shield, BarChart3, Cloud, HelpCircle } from 'lucide-react';
import './DocumentationPage.css';

const DocumentationPage = () => {
    const sections = [
        {
            title: "Getting Started",
            icon: Zap,
            tag: "Basics",
            color: "var(--accent-blue)",
            content: "Welcome to the Unified M365 Reporting Portal. This platform provides real-time telemetry across your Microsoft 365 environment, including Entra ID, Intune, Exchange, and Purview."
        },
        {
            title: "Performance & Caching",
            icon: BarChart3,
            tag: "Core",
            color: "var(--accent-cyan)",
            content: "We use a sophisticated 3-layer caching strategy (Memory, LocalStorage, and Disk) to ensure instant loading. Data is automatically refreshed in the background using the Stale-While-Revalidate pattern."
        },
        {
            title: "Security & Monitoring",
            icon: Shield,
            tag: "Safe",
            color: "var(--accent-indigo)",
            content: "Monitor your Secure Score, active threats, and failed sign-ins. The portal integrates directly with Microsoft Graph API to fetch security events and audit logs."
        },
        {
            title: "Cloud Management",
            icon: Cloud,
            tag: "Admin",
            color: "var(--accent-purple)",
            content: "Manage domains, licenses, and deleted users directly from the Admin Center view. Our tools simplify complex M365 administrative tasks with one-click actions."
        }
    ];

    const faqs = [
        {
            q: "How often is the data refreshed?",
            a: "The portal automatically syncs data every 30 minutes in the background. You can also trigger a manual refresh using the Sync & Refresh button (circular icon) on any dashboard."
        },
        {
            q: "Is my data saved on the server?",
            a: "During development, JSON persistence is used locally to speed up navigation. In production, data remains in-memory and local to your browser session for security."
        },
        {
            q: "What counts as a 'Failed Sign-in'?",
            a: "We monitor Entra ID sign-in logs specifically for error codes related to incorrect passwords, account lockouts, and conditional access failures."
        }
    ];

    return (
        <div className="doc-container animate-in">
            <header className="doc-header">
                <div>
                    <h1 className="title-gradient" style={{ fontSize: '32px' }}>System Documentation</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Advanced operational guide and feature reference</p>
                </div>
            </header>

            <div className="doc-grid">
                {sections.map((section, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-card doc-card"
                        style={{ borderLeftColor: section.color }}
                    >
                        <div className="doc-icon-box" style={{ background: `${section.color}15`, color: section.color }}>
                            <section.icon size={22} />
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            <span className="tag-label" style={{ background: `${section.color}20`, color: section.color }}>{section.tag}</span>
                        </div>
                        <h3 className="doc-title">{section.title}</h3>
                        <p className="doc-content">
                            {section.content}
                        </p>
                    </motion.div>
                ))}
            </div>

            <div className="glass-card faq-section">
                <h2 style={{ marginBottom: '32px', fontSize: '24px' }} className="title-gradient">Frequently Asked Questions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {faqs.map((faq, i) => (
                        <div key={i} className="faq-item">
                            <div className="faq-question">
                                <HelpCircle size={20} className="faq-icon" />
                                <div>
                                    <h4 className="faq-text-q">{faq.q}</h4>
                                    <p className="faq-answer">{faq.a}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <footer className="doc-footer">
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                    M365 REPORTING PORTAL V2.4 • ENTERPRISE EDITION • DEPLOYED FOR MERIDIAN SOLUTIONS
                </p>
            </footer>
        </div>
    );
};

export default DocumentationPage;
