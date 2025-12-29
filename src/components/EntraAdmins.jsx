import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { RolesService } from '../services/entra';
import { ArrowLeft, ShieldCheck, ChevronDown, ChevronRight, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './DetailPage.module.css';

const EntraAdmins = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRole, setExpandedRole] = useState(null);

    useEffect(() => {
        const fetchRoles = async () => {
            if (accounts.length > 0) {
                try {
                    const response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0]
                    });
                    const client = new GraphService(response.accessToken).client;
                    const data = await RolesService.getRoles(client);
                    const activeRoles = data.filter(r => r.members && r.members.length > 0);
                    setRoles(activeRoles);
                } catch (error) {
                    console.error("Role fetch error", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchRoles();
    }, [accounts, instance]);

    const toggleExpand = (roleId) => {
        setExpandedRole(expandedRole === roleId ? null : roleId);
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className="animate-spin" style={{ width: '2.5rem', height: '2.5rem', color: '#ef4444' }} />
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <button onClick={() => navigate('/service/entra')} className={styles.backButton}>
                    <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Back to Dashboard
                </button>

                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>
                        <ShieldCheck style={{ width: '2rem', height: '2rem', color: '#ef4444' }} />
                        Admin Roles
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Manage privileged role assignments and administrative permissions
                    </p>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Privileged Roles</h2>
                        <span className={`${styles.badge} ${styles.badgeError}`}>
                            {roles.length} ACTIVE ROLES
                        </span>
                    </div>

                    {roles.length > 0 ? (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th style={{ width: '3rem' }}></th>
                                        <th>Role Name</th>
                                        <th>Description</th>
                                        <th style={{ textAlign: 'center' }}>Assigned Users</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roles.map((role) => (
                                        <React.Fragment key={role.id}>
                                            <tr
                                                className={styles.tableRow}
                                                onClick={() => toggleExpand(role.id)}
                                                style={{ cursor: 'pointer', background: expandedRole === role.id ? 'rgba(255, 255, 255, 0.05)' : undefined }}
                                            >
                                                <td style={{ textAlign: 'center' }}>
                                                    {expandedRole === role.id ? (
                                                        <ChevronDown style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                                                    ) : (
                                                        <ChevronRight style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <ShieldCheck style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />
                                                        <span style={{ fontWeight: 500, color: 'white' }}>{role.displayName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ color: '#9ca3af', fontSize: '0.875rem', maxWidth: '30rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {role.description}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={`${styles.badge} ${styles.badgeError}`}>
                                                        {role.members ? role.members.length : 0}
                                                    </span>
                                                </td>
                                            </tr>
                                            <AnimatePresence>
                                                {expandedRole === role.id && role.members && (
                                                    <motion.tr
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        style={{ background: 'rgba(0, 0, 0, 0.3)' }}
                                                    >
                                                        <td colSpan="4" style={{ padding: 0 }}>
                                                            <div style={{ padding: '2rem', paddingLeft: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                                                {role.members.map(member => (
                                                                    <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                                                        <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: 'rgba(107, 114, 128, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            <User style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
                                                                        </div>
                                                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                                                            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                {member.displayName}
                                                                            </div>
                                                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                {member.userPrincipalName || 'N/A'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon} style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                                <ShieldCheck style={{ width: '2.5rem', height: '2.5rem', color: '#ef4444' }} />
                            </div>
                            <h3 className={styles.emptyTitle}>No Admin Roles Found</h3>
                            <p className={styles.emptyDescription}>
                                No privileged roles with active assignments found.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EntraAdmins;
