import fs from "fs/promises";
import path from "path";
import { BudgetMonth } from "@shared/api";

export interface BudgetStore {
    [key: string]: BudgetMonth;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "budget.json");

// Ensure data directory exists
const ensureDataDir = async () => {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
};

export const loadData = async (): Promise<BudgetStore> => {
    await ensureDataDir();
    try {
        const data = await fs.readFile(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or is invalid, return empty store
        return {};
    }
};

export const saveData = async (data: BudgetStore): Promise<void> => {
    await ensureDataDir();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
};
