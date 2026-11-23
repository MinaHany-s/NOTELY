import mongoose from "mongoose";

const MONGO_URI_LOCAL = process.env.MONGO_URI_LOCAL;
const MONGO_URI_ONLINE = process.env.MONGO_URI_ONLINE;

const dbConnection = async () => {
    try {
        await mongoose.connect(MONGO_URI_ONLINE);

        console.log("Database Connected Successfully");
    } catch (error) {
        console.error("Database Connection Failed:", error);
        throw error;
    }
};

export default dbConnection;