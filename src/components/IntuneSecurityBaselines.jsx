import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import styles from './DetailPage.module.css';

const IntuneSecurityBaselines = () => {
    const navigate = useNavigate();
    const [filterText, setFilterText] = useState('');

    // Placeholder data - actual API endpoint may vary
    const baselines = [];

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <button onClick={() => navigate('/service/intune')} className={styles.backButton}>
                    <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Back to Dashboard
                </button>

                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>
                        <Lock style={{ width: '2rem', height: '2rem', color: '#eab308' }} />
                        Security Baselines
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Security baseline policies and compliance status
                    </p>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Security Baselines</h2>
                        <span className={`${styles.badge} ${styles.badgeWarning}`}>
                            {baselines.length} BASELINES
                        </span>
                    </div>

                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Lock style={{ width: '2.5rem', height: '2.5rem', color: '#6b7280' }} />
                        </div>
                        <h3 className={styles.emptyTitle}>Security Baselines</h3>
                        <p className={styles.emptyDescription}>
                            Security baseline data requires additional Microsoft Graph API permissions. Contact your administrator to enable this feature.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntuneSecurityBaselines;
