import mongoose from "mongoose";

const MONGO_URI_LOCAL = process.env.MONGO_URI_LOCAL
const MONGO_URI_ONLINE = process.env.MONGO_URI_ONLINE

const dbConnection = async () => {
    await mongoose.connect(MONGO_URI_ONLINE).then(() => {
        console.log("Database Connected succefully")
    }).catch(err => {
        console.log(err)
    })
}

export default dbConnection