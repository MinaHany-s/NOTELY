
import "dotenv/config";
import dbConnection from "../db/connectionDB.js";
import User from "../db/models/users.model.js";

const createAdmin = async () => {
    try {
        await dbConnection();

        if (!process.env.ADMIN_PASSWORD) {
            throw new Error("ADMIN_PASSWORD is missing in .env");
        }

        const email = "admin@notely.com";

        const existingAdmin = await User.findOne({ email });

        if (existingAdmin) {
            console.log("Admin already exists");
            return;
        }

        const admin = await User.create({
            firstName: "Admin",
            lastName: "Notely",
            email,
            password: process.env.ADMIN_PASSWORD,
            role: "admin",
        });

        console.log("Admin created successfully:", admin.email);

    } catch (error) {
        console.error("Error:", error);
    }
};

createAdmin();
