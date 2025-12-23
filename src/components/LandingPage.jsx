import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { motion } from 'framer-motion';
import { Shield, Zap, ArrowRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

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
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Login failed. Please ensure your Azure App Registration is configured correctly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Side: Branding & Info */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col space-y-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="grid grid-cols-2 gap-1">
              <div className="w-4 h-4 bg-[#f25022]"></div>
              <div className="w-4 h-4 bg-[#7fba00]"></div>
              <div className="w-4 h-4 bg-[#00a4ef]"></div>
              <div className="w-4 h-4 bg-[#ffb900]"></div>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white font-['Outfit']">M365 Portal</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight text-white">
            Unified <span className="primary-gradient">Operations</span> for the Modern Cloud
          </h1>

          <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
            Gain deeper visibility and safer execution for your Microsoft 365 environment.
            Connect your Microsoft account to securely manage your tenant.
          </p>
        </motion.div>

        {/* Right Side: Signin Card */}
        <motion.div
          layout
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="glass p-8 md:p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/20 blur-3xl rounded-full"></div>

          <motion.div layout className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Enterprise Sign In</h2>
            <p className="text-gray-400">Sign in with your Microsoft 365 Work Account</p>
          </motion.div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="btn-primary w-full py-6 text-lg flex items-center justify-center space-x-4 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-2 h-2 bg-[#f25022]"></div>
                    <div className="w-2 h-2 bg-[#7fba00]"></div>
                    <div className="w-2 h-2 bg-[#00a4ef]"></div>
                    <div className="w-2 h-2 bg-[#ffb900]"></div>
                  </div>
                  <span>Sign in with Microsoft</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-500 italic">
              Secure enterprise connection via Microsoft Identity platform
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-12 text-gray-600 text-sm flex space-x-6"
      ></motion.div>
    </div>
  );
};

export default LandingPage;
