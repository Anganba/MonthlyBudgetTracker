import fs from "fs/promises";
import path from "path";
import { BudgetMonth } from "@shared/api";

export interface BudgetStore {
    [key: string]: BudgetMonth;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "budget.json");

// In-memory fallback
let memoryStore: BudgetStore = {};

// Ensure data directory exists
const ensureDataDir = async () => {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
};

export const loadData = async (): Promise<BudgetStore> => {
    try {
        await ensureDataDir();
        const data = await fs.readFile(DATA_FILE, "utf-8");
        const fileStore = JSON.parse(data);
        // Sync memory store with file store
        memoryStore = { ...memoryStore, ...fileStore };
        return memoryStore;
    } catch (error) {
        console.warn("Failed to load from file, using memory store:", error);
        return memoryStore;
    }
};

export const saveData = async (data: BudgetStore): Promise<void> => {
    // Always update memory store first
    memoryStore = data;

    try {
        await ensureDataDir();
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (error) {
        console.warn("Failed to save to file (likely read-only environment), data saved to memory only:", error);
    }
};
