import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { InteractionStatus } from "@azure/msal-browser";
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
    const { accounts, inProgress } = useMsal();

    // Check if authentication interaction is in progress
    if (inProgress !== InteractionStatus.None && accounts.length === 0) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-gray-400 font-medium">Restoring session...</p>
                </div>
            </div>
        );
    }

    const isAuthenticated = accounts.length > 0;

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
