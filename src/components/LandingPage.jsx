import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { motion } from 'framer-motion';
import { Shield, Zap, ArrowRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const LandingPage = () => {
  const navigate = useNavigate();
  const { instance } = useMsal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const loginResponse = await instance.loginPopup(loginRequest);
      localStorage.setItem('m365_user', loginResponse.account.name || loginResponse.account.username.split('@')[0]);
      navigate('/service/admin');
    } catch (err) {
      console.error(err);
      setError('Login failed. Please ensure your Azure App Registration is configured correctly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-hero">

      {/* Enhanced Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="ambient-glow glow-blue"
          style={{ top: '-10%', right: '-10%' }}
        />
        <motion.div
          animate={{
            x: [0, -30, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="ambient-glow glow-purple"
          style={{ bottom: '-10%', left: '-10%' }}
        />
        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, -20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="ambient-glow glow-cyan"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
      </div>

      <div className="hero-grid">
        {/* Left Side: Branding & Info */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}
          >
            <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', padding: '8px' }}>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#f25022', borderRadius: '4px' }}></div>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#7fba00', borderRadius: '4px' }}></div>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#00a4ef', borderRadius: '4px' }}></div>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#ffb900', borderRadius: '4px' }}></div>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              M365 Portal
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', lineHeight: 1.1, marginBottom: '24px' }}
          >
            Unified <span className="primary-gradient-text">Operations</span><br />for the Modern Cloud
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '480px' }}
          >
            Gain deeper visibility and safer execution for your Microsoft 365 environment.
            Connect your Microsoft account to securely manage your tenant.
          </motion.p>
        </motion.div>

        {/* Right Side: Signin Card */}
        <motion.div
          layout
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass"
          style={{ padding: '48px', position: 'relative', overflow: 'hidden' }}
        >
          <div className="ambient-glow glow-blue" style={{ width: '256px', height: '256px', top: '-80px', right: '-80px', opacity: 0.2 }}></div>
          <div className="ambient-glow glow-purple" style={{ width: '256px', height: '256px', bottom: '-80px', left: '-80px', opacity: 0.2 }}></div>

          <motion.div layout style={{ marginBottom: '40px', position: 'relative', zIndex: 10 }}>
            <h2 style={{ fontSize: '1.875rem', marginBottom: '12px' }}>
              Enterprise Sign In
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Sign in with your Microsoft 365 Work Account</p>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginBottom: '24px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: '#f87171', fontSize: '0.875rem' }}
              >
                <AlertCircle size={20} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 10 }}>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '24px' }}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px', padding: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#f25022', borderRadius: '1px' }}></div>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#7fba00', borderRadius: '1px' }}></div>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#00a4ef', borderRadius: '1px' }}></div>
                    <div style={{ width: '8px', height: '8px', backgroundColor: '#ffb900', borderRadius: '1px' }}></div>
                  </div>
                  <span>Sign in with Microsoft</span>
                  <ArrowRight size={20} />
                </>
              )}
            </motion.button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Shield size={12} />
              <span>Secure enterprise connection via Microsoft Identity platform</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;
