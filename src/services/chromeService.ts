import axios from 'axios';
import CDP from 'chrome-remote-interface';

// ─── Configuration ────────────────────────────────────────────────────────────

/** Ports assigned to Chrome instances launched by the Groovy Selenium code.
 *  Each instance must have been started with --remote-debugging-port=<port>.
 *  Add / remove ports here to match your Groovy launcher configuration.
 */
export const CHROME_DEBUG_PORTS: number[] = [9222, 9223, 9224, 9225, 9226, 9227, 9228, 9229, 9230, 9231, 9232, 9233, 9234, 9235, 9236, 9237, 9238, 9239, 9240, 9241, 9242, 9243, 9244, 9245, 9246, 9247, 9248, 9249, 9250];

const CDP_HOST = '127.0.0.1'; // use explicit IPv4 — on Windows, 'localhost' resolves to ::1 (IPv6) which Chrome CDP does not bind to
const ARCHIVE_ORG_PREFIX = 'https://archive.org';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChromeTab {
    id: string;
    title: string;
    url: string;
    type: string;
    webSocketDebuggerUrl?: string;
}

export interface TabInspectionResult {
    port: number;
    tabId: string;
    title: string;
    url: string;
    isArchiveOrg: boolean;
    documentReadyState?: string;
    dialogInfo?: DialogInfo | null;
    error?: string;
}

export interface DomModalInfo {
    detected: boolean;
    headline?: string;      // visible heading text, e.g. "There is a network problem"
    buttonText?: string;    // label of the primary action button found
    clicked?: boolean;      // true if the button was programmatically clicked
}

export interface DialogInfo {
    detected: boolean;
    type?: string;          // 'alert' | 'confirm' | 'prompt' | 'beforeunload'
    message?: string;
    dismissed?: boolean;
    dismissAction?: string; // 'accepted' | 'declined'
    domModal?: DomModalInfo; // custom HTML modal on the page (not a native JS dialog)
}

export interface PortScanResult {
    port: number;
    reachable: boolean;
    tabCount?: number;
    tabs?: ChromeTab[];
    error?: string;
}

export interface ChromeInspectionSummary {
    scannedPorts: number[];
    reachablePorts: number[];
    totalTabs: number;
    archiveOrgTabs: number;
    results: TabInspectionResult[];
    portScanDetails: PortScanResult[];
}

// ─── Port / Tab Discovery ─────────────────────────────────────────────────────

/**
 * Probe a single CDP port and return all its tabs.
 */
export async function scanPort(port: number): Promise<PortScanResult> {
    try {
        const { data: tabs } = await axios.get<ChromeTab[]>(
            `http://${CDP_HOST}:${port}/json`,
            { timeout: 1000 }
        );
        const pageTabs = tabs.filter(t => t.type === 'page');
        return { port, reachable: true, tabCount: pageTabs.length, tabs: pageTabs };
    } catch (err: any) {
        return { port, reachable: false, error: err?.code || err?.message || 'unreachable' };
    }
}

/**
 * Scan all configured debug ports and return live tabs grouped by port.
 */
export async function scanAllPorts(ports: number[] = CHROME_DEBUG_PORTS): Promise<PortScanResult[]> {
    return Promise.all(ports.map(scanPort));
}

// ─── Tab Inspection ───────────────────────────────────────────────────────────

// ─── DOM-modal detector ────────────────────────────────────────────────────
// archive.org shows a custom HTML overlay (not a native JS dialog) on network
// errors during upload, e.g. "There is a network problem / Resume Uploading".
// This helper queries the DOM for such overlays and optionally clicks the
// primary action button ("Resume Uploading").
async function detectAndHandleDomModal(
    Runtime: any,
    dismissMode: 'accept' | 'decline' | 'none'
): Promise<DomModalInfo> {
    // The JS payload runs inside the browser page context.
    // It looks for the archive.org upload-error overlay by searching for
    //   - any element whose visible text contains "network problem" (case-insensitive)
    //   - the "Resume Uploading" button nearby
    // Returns a plain object that gets serialised by CDP.
    // NOTE: dismissMode is interpolated here in Node.js by the template literal
    // so the browser receives a plain string literal, not a variable reference.
    const shouldClick = dismissMode === 'accept';
    const expression = `
    (function() {
        const allEls = Array.from(document.querySelectorAll('*'));

        // Find a visible element whose text signals a network error modal
        const modalRoot = allEls.find(el => {
            if (el.children.length > 10) return false; // skip big containers
            const txt = (el.innerText || el.textContent || '').toLowerCase();
            return txt.includes('network problem') || txt.includes('503') || txt.includes('slow down');
        });

        if (!modalRoot) return { detected: false };

        const headline = (modalRoot.innerText || modalRoot.textContent || '').trim().split('\\n')[0];

        // Look for a button to click (prefer "Resume Uploading")
        const btns = Array.from(modalRoot.querySelectorAll('button, input[type=button], input[type=submit], a[role=button]'));
        const resumeBtn = btns.find(b => /(resume|retry|try again)/i.test(b.innerText || b.value || b.textContent || ''));
        const primaryBtn = resumeBtn || btns[0] || null;

        if (!primaryBtn) return { detected: true, headline, buttonText: null };

        const buttonText = (primaryBtn.innerText || primaryBtn.value || primaryBtn.textContent || '').trim();

        if (${shouldClick}) {
            primaryBtn.click();
            return { detected: true, headline, buttonText, clicked: true };
        }

        return { detected: true, headline, buttonText, clicked: false };
    })()
    `;

    try {
        const evalResult = await Runtime.evaluate({ expression, returnByValue: true, awaitPromise: false });
        const val = evalResult?.result?.value;
        if (val && typeof val === 'object') {
            return val as DomModalInfo;
        }
    } catch {
        // Swallow — page may be navigating
    }
    return { detected: false };
}

/**
 * Connect to a single tab via CDP and collect:
 *  - document.readyState
 *  - any pending JS dialog (alert / confirm / prompt)
 *  - any custom DOM modal (e.g. archive.org "There is a network problem")
 *
 * @param dialogDismissMode
 *   'accept'  – click OK / primary-action button on any dialog/modal found
 *   'decline' – click Cancel / dismiss
 *   'none'    – detect only, do NOT interact
 */
export async function inspectTab(
    tab: ChromeTab,
    port: number,
    dialogDismissMode: 'accept' | 'decline' | 'none' = 'none',
    listenMs = 1500
): Promise<TabInspectionResult> {

    const base: TabInspectionResult = {
        port,
        tabId: tab.id,
        title: tab.title,
        url: tab.url,
        isArchiveOrg: tab.url.startsWith(ARCHIVE_ORG_PREFIX),
    };

    if (!tab.webSocketDebuggerUrl) {
        return { ...base, error: 'No webSocketDebuggerUrl – tab may be protected' };
    }

    let client: any;
    try {
        client = await CDP({ target: tab.webSocketDebuggerUrl });
        const { Page, Runtime } = client;

        await Page.enable();

        // ── Detect / dismiss dialog ────────────────────────────────────────
        let dialogInfo: DialogInfo = { detected: false };

        // ── Helper: dismiss with a hard timeout so CDP never blocks us ────
        const DISMISS_TIMEOUT_MS = 2000;
        const dismissDialog = (accept: boolean): Promise<void> =>
            Promise.race([
                Page.handleJavaScriptDialog({ accept }).then(() => {
                    /* resolved – dialog was dismissed */
                }),
                new Promise<void>((_, reject) =>
                    setTimeout(() => reject(new Error('handleJavaScriptDialog timed out')), DISMISS_TIMEOUT_MS)
                ),
            ]).catch((e: any) => {
                // Either no dialog was open (CDP error) or the call timed out.
                // Both are acceptable; just log if it was a real timeout.
                if (e?.message === 'handleJavaScriptDialog timed out') {
                    console.warn(`[inspectTab] dismissDialog timed out for tab ${tab.id}`);
                }
            });

        // Register the event listener FIRST so we don't miss dialogs that
        // open *after* we connect (e.g. triggered by a page action).
        const dialogPromise = new Promise<void>((resolve) => {
            Page.javascriptDialogOpening(async (params: any) => {
                dialogInfo = {
                    detected: true,
                    type: params.type,
                    message: params.message,
                };

                if (dialogDismissMode !== 'none') {
                    const accept = dialogDismissMode === 'accept';
                    await dismissDialog(accept);
                    // Only mark as dismissed if dialogInfo.dismissed wasn't already set
                    // by the pre-emptive call below.
                    if (!dialogInfo.dismissed) {
                        dialogInfo.dismissed = true;
                        dialogInfo.dismissAction = accept ? 'accepted' : 'declined';
                    }
                }
                resolve();
            });
        });

        // ── PRE-EMPTIVELY dismiss any dialog that is ALREADY open ─────────
        // A native JS dialog (alert/confirm/prompt) blocks ALL JavaScript
        // execution in the renderer. If one is already open when we connect,
        // Runtime.evaluate('document.readyState') will hang forever.
        // Strategy:
        //   1. Wait 200 ms for Page.javascriptDialogOpening event to fire (it
        //      captures dialog details when the dialog is already open).
        //   2. Call handleJavaScriptDialog unconditionally (guarded by its own
        //      2-second timeout). This clears the dialog if one is present.
        //   3. Only AFTER step 2 completes do we call Runtime.evaluate — now
        //      safe because the renderer is no longer blocked by a dialog.
        if (dialogDismissMode !== 'none') {
            const accept = dialogDismissMode === 'accept';

            // Allow the event listener to capture dialog details first.
            await new Promise(r => setTimeout(r, 200));

            // fully await the dismissal — do NOT proceed to Runtime.evaluate
            // until this promise settles (it has its own 2 s timeout).
            await dismissDialog(accept);

            // Reconcile dialogInfo state.
            if (dialogInfo.detected && !dialogInfo.dismissed) {
                dialogInfo.dismissed = true;
                dialogInfo.dismissAction = accept ? 'accepted' : 'declined';
            }
        }

        // ── Read document state (safe now — dialog is dismissed) ──────────
        // Additional timeout guard in case the page is in an unusual state.
        const EVAL_TIMEOUT_MS = 3000;
        const readyStateResult = await Promise.race([
            Runtime.evaluate({ expression: 'document.readyState' }),
            new Promise<null>((resolve) =>
                // resolve (not reject) so the outer catch does not trigger
                setTimeout(() => {
                    console.warn(`[inspectTab] readyState eval timed out for tab ${tab.id}`);
                    resolve(null);
                }, EVAL_TIMEOUT_MS)
            ),
        ]);

        // Short window for any dialog that fires AFTER our evaluate
        // (e.g. triggered by the page itself). 500 ms is plenty.
        await Promise.race([
            dialogPromise,
            new Promise(r => setTimeout(r, Math.min(listenMs, 500))),
        ]);

        // ── Detect (and optionally dismiss) DOM-rendered modals ───────────
        // Runs AFTER the JS-dialog wait so both detection paths are covered.
        const domModal = await detectAndHandleDomModal(Runtime, dialogDismissMode);
        if (domModal.detected) {
            dialogInfo.domModal = domModal;
        }

        return {
            ...base,
            documentReadyState: (readyStateResult as any)?.result?.value ?? 'unknown',
            dialogInfo,
        };

    } catch (err: any) {
        return { ...base, error: err?.message || String(err) };
    } finally {
        if (client) {
            try { await client.close(); } catch { /* ignore */ }
        }
    }
}

// ─── High-level orchestration ─────────────────────────────────────────────────

/**
 * Main entry point used by the route.
 *
 * Scans all configured debug ports, inspects every page-type tab, and
 * returns a summary with per-tab detail.
 *
 * @param ports             Ports to scan (defaults to CHROME_DEBUG_PORTS)
 * @param archiveOrgOnly    If true, only inspect archive.org tabs
 * @param dialogDismissMode How to handle open dialogs
 */
export async function inspectAllChromeTabs(
    ports: number[] = CHROME_DEBUG_PORTS,
    archiveOrgOnly = false,
    dialogDismissMode: 'accept' | 'decline' | 'none' = 'none'
): Promise<ChromeInspectionSummary> {

    const portScanDetails = await scanAllPorts(ports);

    const reachablePorts = portScanDetails
        .filter(p => p.reachable)
        .map(p => p.port);

    // Collect all tabs across all reachable ports
    const allTabs: Array<{ tab: ChromeTab; port: number }> = [];
    for (const scan of portScanDetails) {
        if (scan.reachable && scan.tabs) {
            for (const tab of scan.tabs) {
                if (!archiveOrgOnly || tab.url.startsWith(ARCHIVE_ORG_PREFIX)) {
                    allTabs.push({ tab, port: scan.port });
                }
            }
        }
    }

    // Inspect all matched tabs (sequential to avoid overwhelming CDP)
    const results: TabInspectionResult[] = [];
    for (const { tab, port } of allTabs) {
        const result = await inspectTab(tab, port, dialogDismissMode);
        results.push(result);
    }

    const archiveOrgCount = results.filter(r => r.isArchiveOrg).length;

    return {
        scannedPorts: ports,
        reachablePorts,
        totalTabs: results.length,
        archiveOrgTabs: archiveOrgCount,
        results,
        portScanDetails,
    };
}
