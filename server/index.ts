import express from 'express';
import bodyParser from 'body-parser';
import { executeExchangeJobSync } from '../jobs/exchange.sync';
import { listAudits } from '../shared/logging/exchangeAudit';

// If Redis is available, ensure worker is started
try {
    import('../jobs/workers/exchange.worker').catch(() => {
        console.warn('BullMQ worker not started (Redis may not be available). Using sync mode.');
    });
} catch (e) {
    // Worker optional
}

const app = express();
app.use(bodyParser.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

/**
 * Enqueue and execute Get-OrganizationConfig synchronously (no BullMQ needed)
 * Returns result immediately
 */
app.post('/api/jobs/org-config', async (_req, res) => {
    try {
        const result = await executeExchangeJobSync({ action: 'Get-OrganizationConfig' });
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ success: false, error: String(err) });
    }
});

app.get('/api/audits', async (req, res) => {
    try {
        const limit = parseInt(String(req.query.limit || '50'), 10);
        const rows = await listAudits(limit);
        res.json({ success: true, audits: rows });
    } catch (err: any) {
        res.status(500).json({ success: false, error: String(err) });
    }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Exchange admin server listening on http://localhost:${port}`));
