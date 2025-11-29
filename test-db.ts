import mongoose from "mongoose";

const uriBad = "mongodb+srv://anganba:@nGu9903@sananu.cai9lr7.mongodb.net/?appName=Sananu";
const uriGood = "mongodb+srv://anganba:%40nGu9903@sananu.cai9lr7.mongodb.net/?appName=Sananu";

const testConnection = async (uri: string, label: string) => {
    console.log(`Testing ${label} URI...`);
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log(`SUCCESS: ${label} URI connected!`);
        await mongoose.disconnect();
    } catch (error: any) {
        console.log(`FAILURE: ${label} URI failed.`);
        console.log(`Error: ${error.message}`);
    }
};

const run = async () => {
    await testConnection(uriBad, "Raw (Bad)");
    console.log("---");
    await testConnection(uriGood, "Encoded (Good)");
};

run();
