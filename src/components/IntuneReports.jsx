import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';
import styles from './DetailPage.module.css';

const IntuneReports = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <button onClick={() => navigate('/service/intune')} className={styles.backButton}>
                    <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Back to Dashboard
                </button>

                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>
                        <TrendingUp style={{ width: '2rem', height: '2rem', color: '#10b981' }} />
                        Reports & Insights
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Analytics, trends, and compliance insights
                    </p>
                </div>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>
                            <BarChart3 style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                            Compliance Trend
                        </div>
                        <div className={styles.statValue}>-</div>
                        <p className={styles.textMuted} style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            Track compliance over time
                        </p>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>
                            <TrendingUp style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />
                            Device Growth
                        </div>
                        <div className={styles.statValue}>-</div>
                        <p className={styles.textMuted} style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            Monitor enrollment trends
                        </p>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>
                            <PieChart style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />
                            OS Distribution
                        </div>
                        <div className={styles.statValue}>-</div>
                        <p className={styles.textMuted} style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            Platform adoption metrics
                        </p>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>
                            <Activity style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />
                            App Failures
                        </div>
                        <div className={styles.statValue}>-</div>
                        <p className={styles.textMuted} style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            Installation failure trends
                        </p>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Available Reports</h2>
                    </div>

                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <TrendingUp style={{ width: '2.5rem', height: '2.5rem', color: '#6b7280' }} />
                        </div>
                        <h3 className={styles.emptyTitle}>Reports & Analytics</h3>
                        <p className={styles.emptyDescription}>
                            Advanced reporting and analytics features will be available here. This includes compliance trends, device growth metrics, OS adoption analysis, and application deployment statistics.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntuneReports;
