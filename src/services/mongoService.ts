import { ArchiveItem } from "../models/ArchiveItem";
import { GDriveItem } from "../models/GDriveItem";

export async function getListOfGDriveSources() {
    const items = await GDriveItem.distinct('source')
    return items;
}

export async function getListOfArchiveSources() {
    const items = await ArchiveItem.distinct('source')
    return items;
}

export async function getListOfArchiveAccts() {
    const items = await ArchiveItem.distinct('acct')
    return items;
}