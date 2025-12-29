import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { Shield, Loader2, ArrowLeft, TrendingUp, Target, CheckCircle2 } from 'lucide-react';
import styles from './DetailPage.module.css';

const SecureScorePage = () => {
    const { instance, accounts } = useMsal();
    const navigate = useNavigate();
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (accounts.length > 0) {
                try {
                    const response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0]
                    });
                    const graphService = new GraphService(response.accessToken);
                    const data = await graphService.getSecureScore();
                    setScore(data);
                } catch (err) {
                    console.error(err);
                    setError("Failed to fetch Secure Score.");
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [instance, accounts]);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className="animate-spin" style={{ width: '2.5rem', height: '2.5rem', color: '#3b82f6' }} />
            </div>
        );
    }

    const percentage = score ? Math.round((score.currentScore / score.maxScore) * 100) : 0;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <button onClick={() => navigate('/service/admin')} className={styles.backButton}>
                    <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Back to Dashboard
                </button>

                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>
                        <Shield style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
                        Microsoft Secure Score
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Monitor and improve your organization's security posture with actionable recommendations
                    </p>
                </div>

                {error ? (
                    <div className={`${styles.alert} ${styles.alertError}`}>
                        <AlertCircle style={{ width: '1.5rem', height: '1.5rem', flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                ) : score ? (
                    <>
                        {/* Score Overview Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2 className={styles.cardTitle}>
                                    <Target style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
                                    Your Security Score
                                </h2>
                            </div>
                            <div className={styles.cardBody}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '3rem', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ color: '#9ca3af', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                            Current Score
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
                                            <span style={{ fontSize: '4rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>
                                                {score.currentScore}
                                            </span>
                                            <span style={{ fontSize: '1.5rem', color: '#6b7280' }}>
                                                / {score.maxScore}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '0.75rem', border: '1px solid rgba(59, 130, 246, 0.2)', width: 'fit-content' }}>
                                            <TrendingUp style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
                                            <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#3b82f6' }}>
                                                {percentage}% Achieved
                                            </span>
                                        </div>
                                    </div>

                                    {/* Circular Progress */}
                                    <div style={{ position: 'relative', width: '12rem', height: '12rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg className="transform -rotate-90" style={{ width: '100%', height: '100%' }} viewBox="0 0 36 36">
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="rgba(255,255,255,0.05)"
                                                strokeWidth="3"
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#3b82f6"
                                                strokeWidth="3"
                                                strokeDasharray={`${percentage}, 100`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div style={{ position: 'absolute', textAlign: 'center' }}>
                                            <CheckCircle2 style={{ width: '2.5rem', height: '2.5rem', color: '#3b82f6', margin: '0 auto' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Improvement Actions Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2 className={styles.cardTitle}>
                                    Improvement Actions
                                </h2>
                                <span className={styles.badge} style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#3b82f6' }}>
                                    Coming Soon
                                </span>
                            </div>
                            <div className={styles.cardBody}>
                                <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9375rem' }}>
                                    Full breakdown of improvement actions and security recommendations will be displayed here.
                                    This requires fetching additional control scores from the Microsoft Graph Security API.
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Shield style={{ width: '2.5rem', height: '2.5rem', color: '#6b7280' }} />
                        </div>
                        <h3 className={styles.emptyTitle}>No Secure Score Data</h3>
                        <p className={styles.emptyDescription}>
                            Secure Score data is not available for your organization. This may require additional permissions or licensing.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecureScorePage;
