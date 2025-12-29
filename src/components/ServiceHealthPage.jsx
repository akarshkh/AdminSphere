/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { Activity, Loader2, CheckCircle2, AlertTriangle, ArrowLeft, ChevronDown, ChevronRight, AlertOctagon, Info, XCircle } from 'lucide-react';
import styles from './ServiceHealthPage.module.css';

const ServiceHealthPage = () => {
    const { instance, accounts } = useMsal();
    const navigate = useNavigate();
    const [health, setHealth] = useState([]);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState('All');
    const [expandedIssue, setExpandedIssue] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (accounts.length > 0) {
                try {
                    const response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0]
                    });
                    const graphService = new GraphService(response.accessToken);
                    const [healthData, issuesData] = await Promise.all([
                        graphService.getServiceHealth(),
                        graphService.getServiceIssues()
                    ]);
                    setHealth(healthData || []);
                    setIssues(issuesData || []);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [instance, accounts]);

    const filteredIssues = selectedService === 'All'
        ? issues
        : issues.filter(i => i.service === selectedService);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className="animate-spin text-green-500" size={40} />
            </div>
        );
    }

    const unhealthyServices = health.filter(s => s.status !== 'ServiceOperational');

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <button onClick={() => navigate('/service/admin')} className={styles.backButton}>
                    <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Back to Dashboard
                </button>

                <div className={styles.headerSection}>
                    <div className={styles.headerTop}>
                        <div className={styles.titleGroup}>
                            <h1 className={styles.pageTitle}>
                                <Activity style={{ width: '2rem', height: '2rem', color: '#22c55e' }} />
                                Service Health
                            </h1>
                            <p className={styles.pageSubtitle}>
                                Real-time status monitoring for your Microsoft 365 environment
                            </p>
                        </div>

                        {unhealthyServices.length > 0 ? (
                            <div className={`${styles.statusCard} ${styles.statusCardIssues}`}>
                                <div className={`${styles.statusIcon} ${styles.statusIconIssues}`}>
                                    <AlertTriangle style={{ width: '1.5rem', height: '1.5rem', color: '#f87171' }} />
                                </div>
                                <div className={styles.statusContent}>
                                    <span className={styles.statusTitle} style={{ color: '#f87171' }}>
                                        {unhealthyServices.length} Service{unhealthyServices.length > 1 ? 's' : ''} Impacted
                                    </span>
                                    <span className={styles.statusSubtitle} style={{ color: '#f87171' }}>
                                        Action required for normal operations
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className={`${styles.statusCard} ${styles.statusCardHealthy}`}>
                                <div className={`${styles.statusIcon} ${styles.statusIconHealthy}`}>
                                    <CheckCircle2 style={{ width: '1.5rem', height: '1.5rem', color: '#22c55e' }} />
                                </div>
                                <div className={styles.statusContent}>
                                    <span className={styles.statusTitle} style={{ color: '#22c55e' }}>
                                        All Systems Operational
                                    </span>
                                    <span className={styles.statusSubtitle} style={{ color: '#22c55e' }}>
                                        No incidents reported
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Service Filters */}
                <div className={styles.filterSection}>
                    <div className={styles.filterScroll}>
                        <button
                            onClick={() => setSelectedService('All')}
                            className={`${styles.filterButton} ${selectedService === 'All' ? styles.filterButtonActive : styles.filterButtonInactive}`}
                        >
                            All Services
                        </button>
                        <div className={styles.filterDivider} />
                        {health.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedService(s.service)}
                                className={`${styles.filterButton} ${selectedService === s.service ? styles.filterButtonActive : styles.filterButtonInactive}`}
                            >
                                {s.service}
                                {s.status !== 'ServiceOperational' && <span className={styles.statusIndicator} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Issues Table */}
                <div className={styles.issuesCard}>
                    <div className={styles.issuesHeader}>
                        <h2 className={styles.issuesTitle}>
                            <AlertOctagon style={{ width: '1.5rem', height: '1.5rem', color: '#fb923c' }} />
                            Active Issues & Advisories
                        </h2>
                        <span className={styles.issuesCount}>
                            {filteredIssues.length} ACTIVE
                        </span>
                    </div>

                    {filteredIssues.length > 0 ? (
                        <div className={styles.tableContainer}>
                            <table className={styles.issuesTable}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th>Classification</th>
                                        <th>Service</th>
                                        <th>Title</th>
                                        <th>ID</th>
                                        <th>Last Updated</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredIssues.map((issue) => (
                                        <React.Fragment key={issue.id}>
                                            <tr
                                                onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                                                className={`${styles.tableRow} ${expandedIssue === issue.id ? styles.tableRowExpanded : ''}`}
                                            >
                                                <td>
                                                    <span className={`${styles.badge} ${issue.classification === 'Incident' ? styles.badgeIncident : styles.badgeAdvisory}`}>
                                                        {issue.classification === 'Incident' ? (
                                                            <XCircle style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.375rem' }} />
                                                        ) : (
                                                            <Info style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.375rem' }} />
                                                        )}
                                                        {issue.classification}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 500, color: '#d1d5db' }}>{issue.service}</td>
                                                <td style={{ fontWeight: 500, color: 'white', maxWidth: '28rem' }} title={issue.title}>
                                                    {issue.title}
                                                </td>
                                                <td style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                                                    {issue.id}
                                                </td>
                                                <td style={{ color: '#9ca3af', fontSize: '0.9375rem' }}>
                                                    {new Date(issue.lastModifiedDateTime).toLocaleDateString()}
                                                </td>
                                                <td style={{ color: '#6b7280', textAlign: 'right' }}>
                                                    {expandedIssue === issue.id ? (
                                                        <ChevronDown style={{ width: '1.25rem', height: '1.25rem', marginLeft: 'auto' }} />
                                                    ) : (
                                                        <ChevronRight style={{ width: '1.25rem', height: '1.25rem', marginLeft: 'auto', opacity: 0.5 }} />
                                                    )}
                                                </td>
                                            </tr>
                                            {expandedIssue === issue.id && (
                                                <tr className={styles.expandedRow}>
                                                    <td colSpan={6} style={{ padding: 0 }}>
                                                        <div className={styles.expandedContent}>
                                                            <div className={styles.expandedInner}>
                                                                <div className={styles.detailSection}>
                                                                    <h4 className={styles.detailLabel}>Description</h4>
                                                                    <div className={`${styles.detailContent} ${styles.detailContentCode}`}>
                                                                        {issue.description}
                                                                    </div>
                                                                </div>
                                                                {issue.impactDescription && (
                                                                    <div className={styles.detailSection}>
                                                                        <h4 className={styles.detailLabel}>User Impact</h4>
                                                                        <p className={styles.detailContent}>{issue.impactDescription}</p>
                                                                    </div>
                                                                )}
                                                                <a
                                                                    href={`https://admin.microsoft.com/Adminportal/Home#/servicehealth/:/alerts/${issue.id}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={styles.externalLink}
                                                                >
                                                                    View in Microsoft 365 Admin Center
                                                                    <ArrowLeft style={{ width: '0.875rem', height: '0.875rem', transform: 'rotate(180deg)' }} />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <CheckCircle2 style={{ width: '2.5rem', height: '2.5rem', color: '#22c55e' }} />
                            </div>
                            <h3 className={styles.emptyTitle}>No Active Issues</h3>
                            <p className={styles.emptyDescription}>
                                {selectedService === 'All'
                                    ? "All services are running normally. There are no active incidents or advisories at this time."
                                    : `Good news! There are no active incidents reported for ${selectedService}.`}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceHealthPage;
