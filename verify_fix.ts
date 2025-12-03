
import { createServer } from "./server/index";

async function test() {
    console.log("Running verification test...");

    // 1. Test: MONGODB_URI is missing
    console.log("\nTest 1: MONGODB_URI is missing");
    const originalUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;

    try {
        createServer();
        console.error("FAIL: createServer should have thrown an error but didn't.");
    } catch (error: any) {
        if (error.message === "MONGODB_URI is not defined in environment variables") {
            console.log("PASS: Caught expected error: " + error.message);
        } else {
            console.error("FAIL: Caught unexpected error:", error);
        }
    }

    // Restore env
    if (originalUri) {
        process.env.MONGODB_URI = originalUri;
    }
}

test();
