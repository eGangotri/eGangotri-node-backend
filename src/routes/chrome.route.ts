import * as express from 'express';
import {
    CHROME_DEBUG_PORTS,
    inspectAllChromeTabs,
    scanAllPorts,
    checkAndCloseValidArchiveTabs,
} from '../services/chromeService';

export const chromeRoute = express.Router();

/**
 * GET /chrome/inspectTabs
 *
 * Query params:
 *   ports            Comma-separated list of debug ports to scan.
 *                    Defaults to the configured CHROME_DEBUG_PORTS list.
 *                    Example: ?ports=9222,9223,9224
 *
 *   archiveOrgOnly   If "true", only inspect tabs whose URL begins with
 *                    https://archive.org. Defaults to true.
 *                    Example: ?archiveOrgOnly=false
 *
 *   dismissDialogs   How to handle any open JS dialog found in each tab:
 *                      "accept"  – click OK / Yes (default)
 *                      "decline" – click Cancel / No
 *                      "none"    – detect only, do NOT interact
 *                    Example: ?dismissDialogs=none
 *
 * Response shape: ChromeInspectionSummary (see chromeService.ts)
 */
//GET /chrome/inspectTabs?archiveOrgOnly=true&dismissDialogs=accept
chromeRoute.get('/inspectTabs', async (req: any, res: any) => {
    try {
        // ── Parse query params ────────────────────────────────────────────
        const portsParam = req.query.ports as string | undefined;
        const ports: number[] = portsParam
            ? portsParam.split(',').map(p => parseInt(p.trim(), 10)).filter(n => !isNaN(n))
            : CHROME_DEBUG_PORTS;

        const archiveOrgOnly = req.query.archiveOrgOnly !== 'false';

        const dismissParam = (req.query.dismissDialogs as string || 'accept').toLowerCase();
        const dialogDismissMode: 'accept' | 'decline' | 'none' =
            dismissParam === 'none' ? 'none'
                : dismissParam === 'decline' ? 'decline'
                    : 'accept';

        console.log(
            `[chromeRoute] inspectTabs | ports=${ports} | archiveOrgOnly=${archiveOrgOnly} | dismissDialogs=${dialogDismissMode}`
        );

        const summary = await inspectAllChromeTabs(ports, archiveOrgOnly, dialogDismissMode);

        return res.status(200).json({ response: summary });

    } catch (err: any) {
        console.error('[chromeRoute] inspectTabs error:', err);
        return res.status(500).json({
            response: { status: 'error', message: err?.message || String(err) }
        });
    }
});

/**
 * GET /chrome/scanPorts
 *
 * Quick health-check: just probe configured (or specified) debug ports and
 * return the list of tabs found on each, without performing any CDP inspection.
 *
 * Query params:
 *   ports   Comma-separated port list. Defaults to CHROME_DEBUG_PORTS.
 */
chromeRoute.get('/scanPorts', async (req: any, res: any) => {
    try {
        const portsParam = req.query.ports as string | undefined;
        const ports: number[] = portsParam
            ? portsParam.split(',').map(p => parseInt(p.trim(), 10)).filter(n => !isNaN(n))
            : CHROME_DEBUG_PORTS;

        console.log(`[chromeRoute] scanPorts | ports=${ports}`);

        const scanResults = await scanAllPorts(ports);

        const reachable = scanResults.filter(s => s.reachable);
        return res.status(200).json({
            response: {
                scannedPorts: ports,
                reachableCount: reachable.length,
                totalTabsFound: reachable.reduce((sum, s) => sum + (s.tabCount ?? 0), 0),
                details: scanResults,
            }
        });

    } catch (err: any) {
        console.error('[chromeRoute] scanPorts error:', err);
        return res.status(500).json({
            response: { status: 'error', message: err?.message || String(err) }
        });
    }
});

/**
 * GET /chrome/closeSuccessfullyUploaded
 *
 * Checks all archive.org URLs and closes tabs that pass checkArchiveUrlValidity.
 * This is useful for closing tabs after successful uploads.
 *
 * Query params:
 *   ports   Comma-separated list of debug ports to scan.
 *           Defaults to the configured CHROME_DEBUG_PORTS list.
 *           Example: ?ports=9222,9223,9224
 *
 * Response shape: Object with scan results and tab closure details
 */
chromeRoute.get('/closeSuccessfullyUploaded', async (req: any, res: any) => {
    try {
        // ── Parse query params ────────────────────────────────────────────
        const portsParam = req.query.ports as string | undefined;
        const ports: number[] = portsParam
            ? portsParam.split(',').map(p => parseInt(p.trim(), 10)).filter(n => !isNaN(n))
            : CHROME_DEBUG_PORTS;

        console.log(`[chromeRoute] closeSuccessfullyUploaded | ports=${ports}`);

        const result = await checkAndCloseValidArchiveTabs(ports);

        return res.status(200).json({ response: result });

    } catch (err: any) {
        console.error('[chromeRoute] closeSuccessfullyUploaded error:', err);
        return res.status(500).json({
            response: { status: 'error', message: err?.message || String(err) }
        });
    }
});
