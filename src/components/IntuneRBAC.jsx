import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCog } from 'lucide-react';
import styles from './DetailPage.module.css';

const IntuneRBAC = () => {
    const navigate = useNavigate();

    // Placeholder - requires specific RBAC API endpoints
    const adminRoles = [];

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <button onClick={() => navigate('/service/intune')} className={styles.backButton}>
                    <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Back to Dashboard
                </button>

                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>
                        <UserCog style={{ width: '2rem', height: '2rem', color: '#ec4899' }} />
                        RBAC & Admin Access
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Role-based access control and administrator permissions
                    </p>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Admin Roles</h2>
                        <span className={`${styles.badge} ${styles.badgeInfo}`}>
                            {adminRoles.length} ROLES
                        </span>
                    </div>

                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <UserCog style={{ width: '2.5rem', height: '2.5rem', color: '#6b7280' }} />
                        </div>
                        <h3 className={styles.emptyTitle}>RBAC Configuration</h3>
                        <p className={styles.emptyDescription}>
                            Role-based access control data requires additional Microsoft Graph API permissions. Contact your administrator to enable this feature.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntuneRBAC;
