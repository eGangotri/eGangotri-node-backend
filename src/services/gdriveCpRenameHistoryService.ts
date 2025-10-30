import { GDriveCpRenameHistory } from "../models/GDriveCpRenameHistory";

export type GDriveCpRenameHistoryInput = {
  commonRunId: string;
  runId: string;
  success: boolean;
  googleDriveLink: string;
  fileId?: string;
  oldName?: string;
  newName?: string;
  error?: string;
  mainGDriveLink: string;
};

export async function recordGDriveCpRenameHistory(input: GDriveCpRenameHistoryInput): Promise<void> {
  try {
    await GDriveCpRenameHistory.create(input);
  } catch (e) {
  }
}
