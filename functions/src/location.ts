import { LocationsResponse } from "./interfaces";
import { connectDb } from './index';
import { collection } from './db/collections';

export class Location { 
    async queryNearby (currentLocation): Promise<LocationsResponse> {
        try {
            const mongoDb = await connectDb();
            const locations = await mongoDb.collection(collection.locations).find({}).toArray()
            console.log('queryNearby currentLocation: ', currentLocation);
            return { success: true, locations }
        } catch (err) {
            return { success: false }
        }

    }

}