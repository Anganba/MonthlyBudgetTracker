import serverless from "serverless-http";

import { createServer } from "../../server";
import { connectDB } from "../../server/db";

const api = createServer();
const serverlessHandler = serverless(api);

export const handler = async (event: any, context: any) => {
    context.callbackWaitsForEmptyEventLoop = false;
    await connectDB();
    return serverlessHandler(event, context);
};
