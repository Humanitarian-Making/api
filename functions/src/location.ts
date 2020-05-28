import { LocationsResponse } from "./interfaces";
import { connectDb } from './index';
import { collection } from './db/collections';

export class Location { 
    async queryNearby (reqCoords?, distance?): Promise<LocationsResponse> {
        try {
            const mongoDb = await connectDb();
            const coordinates = reqCoords ? reqCoords : [0, 0];
            console.log('coordinates :', coordinates);
            const geoQuery = {
                $geoNear : { 
                    near : { 
                        type : 'Point', 
                        coordinates : coordinates
                    },  
                    distanceField: 'distance',
                    spherical: true
                }
            }
            if (distance) {
                geoQuery['maxDistance'] = distance;
            }
            console.log('geoQuery :', geoQuery);
            const locations = await mongoDb.collection(collection.locations).aggregate(
                [
                    geoQuery, 
                    { 
                        "$sort" : { 
                            "distance" : 1.0
                        }
                    }, 
                    { 
                        "$limit" : 100.0
                    }
                ], 
                { 
                    "allowDiskUse" : false
                }
            ).toArray()
            return { success: true, locations }
        } catch (err) {
            console.log('queryNearby err: ', err);
            return { success: false }
        }

    }

}