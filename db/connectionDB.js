
import mongoose from "mongoose";

const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI_ONLINE);

        console.log("Database Connected Successfully");
    } catch (error) {
        console.error("Database Connection Failed:", error);
        throw error;
    }
};

export default dbConnection;
