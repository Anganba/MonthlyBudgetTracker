
import { handler } from "./netlify/functions/api";

async function test() {
    console.log("Running error handling verification...");

    // Ensure MONGODB_URI is missing to trigger the error
    delete process.env.MONGODB_URI;

    try {
        // Mock event and context
        const result = await handler({}, { callbackWaitsForEmptyEventLoop: true });

        console.log("Result:", JSON.stringify(result, null, 2));

        if (result.statusCode === 500 && result.body.includes("Server initialization failed")) {
            console.log("PASS: Caught initialization error and returned 500.");
        } else {
            console.error("FAIL: Did not return expected 500 error.");
        }

    } catch (error) {
        console.error("FAIL: Handler crashed instead of returning error object:", error);
    }
}

test();
