import { LocationsResponse } from "./interfaces";

export class Location { 
    async queryNearby (currentLocation): Promise<LocationsResponse> {
        try {
            console.log('queryNearby currentLocation: ', currentLocation);
            return { success: true, locations: [] }
        } catch (err) {
            return { success: false }
        }

    }

}