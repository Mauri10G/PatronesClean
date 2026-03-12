import mongoose, { Mongoose } from "mongoose";

interface Options {
    dbName: string;
    mongoUrl: string;
}

export class MongoDatabase {

    static async connect(options: Options) {

        const { dbName, mongoUrl } = options;

        try {

            mongoose.connect(mongoUrl, {
                dbName: dbName,
            });

            console.log("MongoDB connected");
            return true;

        } catch (error) {
            console.log("Error connecting to MongoDB:");
            throw error;

        }



    }




}