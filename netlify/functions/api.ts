import serverless from "serverless-http";

import { createServer } from "../../server";
import { connectDB } from "../../server/db";

let api: any;
let serverlessHandler: any;
let initError: Error | null = null;

try {
    api = createServer();
    serverlessHandler = serverless(api);
} catch (e: any) {
    console.error("Server initialization failed:", e);
    initError = e;
}

export const handler = async (event: any, context: any) => {
    context.callbackWaitsForEmptyEventLoop = false;

    if (initError) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Server initialization failed",
                error: initError.message
            }),
        };
    }

    try {
        await connectDB();
    } catch (e: any) {
        console.error("Database connection failed:", e);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Database connection failed",
                error: e.message
            }),
        };
    }

    return serverlessHandler(event, context);
};
