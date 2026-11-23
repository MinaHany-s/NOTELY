import mongoose from "mongoose";

const dbConnection = async () => {
    console.log("DB Connection State Before:", mongoose.connection.readyState);

    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (mongoose.connection.readyState === 2) {
        return mongoose.connection.asPromise();
    }

    try {
        await mongoose.connect(process.env.MONGO_URI_ONLINE);

        console.log("Database Connected Successfully");
        console.log("DB Connection State After:", mongoose.connection.readyState);

    } catch (error) {
        console.error("Database Connection Failed:", error);
        throw error;
    }
};

export default dbConnection;