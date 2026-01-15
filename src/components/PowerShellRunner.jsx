import React, { useState } from 'react';

const PowerShellRunner = () => {
    const [command, setCommand] = useState('Get-Date');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const runScript = async () => {
        setLoading(true);
        setOutput('');
        setError('');

        // Start polling for live output every second
        const pollInterval = setInterval(async () => {
            try {
                const res = await fetch('http://localhost:4000/api/script/peek');
                const data = await res.json();
                if (data.stdout) setOutput(data.stdout);
                if (data.stderr) setError(data.stderr);
            } catch (e) { /* ignore */ }
        }, 1000);

        try {
            const response = await fetch('http://localhost:4000/api/script/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command }),
            });

            const data = await response.json();
            clearInterval(pollInterval);

            if (data.success) {
                setOutput(data.stdout || 'No output returned.');
                if (data.stderr) setError(data.stderr);
            } else {
                setError(data.error || data.stderr || 'Unknown error occurred.');
            }
        } catch (err) {
            clearInterval(pollInterval);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetSession = async () => {
        try {
            await fetch('http://localhost:4000/api/script/reset', { method: 'POST' });
            setOutput('');
            setError('Session reset. Ready for new command.');
        } catch (e) {
            setError('Failed to reset session: ' + e.message);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md max-w-2xl mx-auto mt-10">
            <h2 className="text-xl font-bold mb-4">PowerShell Script Runner</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Quick Actions</label>
                <div className="flex gap-2 flex-wrap mb-2">
                    <button onClick={() => setCommand('Get-Date')} className="bg-gray-100 hover:bg-gray-200 px-2 py-1 text-xs rounded border">Check Time</button>
                    <button onClick={() => setCommand('Connect-ExchangeOnline')} className="bg-blue-600 hover:bg-blue-700 px-4 py-1 text-xs rounded border text-white font-bold">Login (Interactive Popup)</button>
                    <button onClick={() => setCommand('Connect-ExchangeOnline -DeviceCode')} className="bg-blue-50 hover:bg-blue-100 px-2 py-1 text-xs rounded border text-blue-700 border-blue-200 font-semibold text-sm">Login (Fallback: Device Code)</button>
                    <button onClick={() => setCommand('Get-OrganizationConfig')} className="bg-green-50 hover:bg-green-100 px-2 py-1 text-xs rounded border text-green-700 border-green-200 font-semibold">Verify Data</button>
                    <button onClick={() => resetSession()} className="bg-red-50 hover:bg-red-100 px-2 py-1 text-xs rounded border text-red-700 border-red-200 font-semibold">Emergency Reset</button>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Command / Script</label>
                <textarea
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    className="w-full p-2 border rounded-md font-mono text-sm bg-gray-50 h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter PowerShell command here..."
                />
            </div>

            <button
                onClick={runScript}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white font-medium ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {loading ? 'Running...' : 'Run Script'}
            </button>

            <button
                onClick={resetSession}
                className="ml-2 px-4 py-2 rounded-md text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 border"
            >
                Reset Session
            </button>

            {output && (
                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Output:</h3>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                        {output}
                    </pre>
                </div>
            )}

            {error && (
                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-red-600 mb-2">Error:</h3>
                    <pre className="bg-red-50 text-red-700 p-4 rounded-md overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                        {error}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default PowerShellRunner;
