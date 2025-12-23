import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import { GraphService } from '../services/graphService';
import { Loader2, ArrowLeft, Download, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const LicensesPage = () => {
    const navigate = useNavigate();
    const { instance, accounts } = useMsal();
    const [licensingSummary, setLicensingSummary] = useState([]);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterText, setFilterText] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (accounts.length === 0) return;
            setLoading(true);
            try {
                const response = await instance.acquireTokenSilent({
                    ...loginRequest,
                    account: accounts[0]
                });
                const graphService = new GraphService(response.accessToken);
                const { skus, users } = await graphService.getLicensingData();
                setLicensingSummary(skus || []);

                const skuMap = new Map();
                (skus || []).forEach(sku => skuMap.set(sku.skuId, sku.skuPartNumber));

                const processedUsers = (users || []).map(user => ({
                    displayName: user.displayName,
                    emailAddress: user.userPrincipalName,
                    licenses: user.assignedLicenses.map(l => skuMap.get(l.skuId) || 'Unknown SKU').join(', ') || 'No License',
                    licenseCount: user.assignedLicenses.length
                }));
                setReportData(processedUsers);
            } catch (err) {
                console.error("Error fetching license data:", err);
                setError("Failed to load license data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [instance, accounts]);

    const filteredData = reportData.filter(item => {
        if (!filterText) return true;
        const searchStr = filterText.toLowerCase();
        const name = item.displayName?.toLowerCase() || '';
        const email = item.emailAddress?.toLowerCase() || '';
        return name.includes(searchStr) || email.includes(searchStr);
    });

    const handleDownloadCSV = () => {
        if (filteredData.length === 0) return;
        const headers = ['Display Name', 'Email / UPN', 'Assigned Licenses', 'Count'];
        const csvRows = [headers.join(',')];

        filteredData.forEach(row => {
            const values = [
                `"${row.displayName || ''}"`,
                `"${row.emailAddress || ''}"`,
                `"${row.licenses || ''}"`,
                `"${row.licenseCount || 0}"`
            ];
            csvRows.push(values.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'licensing_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh] text-blue-400">
            <Loader2 className="w-10 h-10 animate-spin" />
        </div>
    );

    if (error) return (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400">
            <AlertCircle className="w-6 h-6 mr-2 inline-block" />
            {error}
        </div>
    );

    return (
        <div className="w-full text-white">
            <button
                onClick={() => navigate('/service/admin')}
                className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Admin
            </button>

            <div className="mb-8">
                <h1 className="text-3xl font-bold font-['Outfit'] bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight mb-2">
                    License Assignments
                </h1>
                <p className="text-sm text-gray-400">Manage user licenses and view available seats.</p>
            </div>

            {/* License Breakdown Cards */}
            {licensingSummary.length > 0 && (
                <div className="mb-12">
                    <h3 className="text-xl font-bold mb-6">License Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {licensingSummary.map((sku, i) => (
                            <div key={i} className="glass p-6 border-l-4 border-l-blue-500">
                                <p className="text-gray-300 font-medium mb-1 truncate" title={sku.skuPartNumber}>{sku.skuPartNumber}</p>
                                <div className="flex justify-between items-end mt-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Assigned</p>
                                        <p className="text-2xl font-bold">{sku.consumedUnits}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Total</p>
                                        <p className="text-2xl font-bold">{sku.prepaidUnits?.enabled || 0}</p>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-700/50 h-1.5 mt-4 rounded-full overflow-hidden">
                                    <div
                                        className="bg-blue-500 h-full rounded-full"
                                        style={{ width: `${Math.min(((sku.consumedUnits / (sku.prepaidUnits?.enabled || 1)) * 100), 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-right mt-1 text-gray-500">
                                    {Math.round((sku.consumedUnits / (sku.prepaidUnits?.enabled || 1)) * 100)}% Used
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* User List Table */}
            <div className="glass p-8 relative min-h-[400px]">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold">User License Assignments</h3>
                    <div className="flex items-center space-x-3">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-sm focus:outline-none focus:border-blue-500/50"
                        />
                        <button
                            onClick={handleDownloadCSV}
                            className="p-2 hover:bg-white/10 rounded-lg border border-white/10"
                            title="Download CSV"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                            <tr>
                                <th className="pb-4 pt-4 px-4 font-semibold">Display Name</th>
                                <th className="pb-4 pt-4 px-4 font-semibold">Email / UPN</th>
                                <th className="pb-4 pt-4 px-4 font-semibold">Assigned Licenses</th>
                                <th className="pb-4 pt-4 px-4 font-semibold text-center">Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {filteredData.length > 0 ? (
                                filteredData.map((report, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-4 font-medium text-white/90">{report.displayName}</td>
                                        <td className="py-4 px-4 text-gray-400">{report.emailAddress}</td>
                                        <td className="py-4 px-4 text-gray-300">
                                            {report.licenses !== 'No License' ? (
                                                <span className="text-gray-300 text-sm">{report.licenses}</span>
                                            ) : (
                                                <span className="text-gray-500 italic">Unlicensed</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-center text-gray-400">{report.licenseCount}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-gray-500 italic">
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LicensesPage;
