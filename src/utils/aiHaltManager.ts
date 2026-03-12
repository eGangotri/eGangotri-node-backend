export class AIHaltManager {
    static haltedCommonRunIds = new Set<string>();
    static haltedRunIds = new Set<string>();
    static haltedSrcFolders = new Set<string>();
    static haltedGDriveLinks = new Set<string>();
    static globalHalt = false;

    static shouldHalt(params: { commonRunId?: string; runId?: string; srcFolder?: string; gDriveLink?: string }): boolean {
        if (this.globalHalt) return true;
        if (params.commonRunId && this.haltedCommonRunIds.has(params.commonRunId)) return true;
        if (params.runId && this.haltedRunIds.has(params.runId)) return true;
        if (params.srcFolder && this.haltedSrcFolders.has(params.srcFolder)) return true;
        if (params.gDriveLink && this.haltedGDriveLinks.has(params.gDriveLink)) return true;
        return false;
    }

    static halt(params: { commonRunId?: string; runId?: string; srcFolder?: string; gDriveLink?: string; all?: boolean }) {
        if (params.all) {
            this.globalHalt = true;
            return;
        }
        if (params.commonRunId) this.haltedCommonRunIds.add(params.commonRunId);
        if (params.runId) this.haltedRunIds.add(params.runId);
        if (params.srcFolder) this.haltedSrcFolders.add(params.srcFolder);
        if (params.gDriveLink) this.haltedGDriveLinks.add(params.gDriveLink);
    }

    static clearHalt(params: { commonRunId?: string; runId?: string; srcFolder?: string; gDriveLink?: string; all?: boolean }) {
        if (params.all) {
            this.globalHalt = false;
            this.haltedCommonRunIds.clear();
            this.haltedRunIds.clear();
            this.haltedSrcFolders.clear();
            this.haltedGDriveLinks.clear();
            return;
        }
        if (params.commonRunId) this.haltedCommonRunIds.delete(params.commonRunId);
        if (params.runId) this.haltedRunIds.delete(params.runId);
        if (params.srcFolder) this.haltedSrcFolders.delete(params.srcFolder);
        if (params.gDriveLink) this.haltedGDriveLinks.delete(params.gDriveLink);
    }
}
