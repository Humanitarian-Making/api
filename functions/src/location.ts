import { LocationsResponse, StandardResponse } from "./interfaces";
import { connectDb, error } from './index';
import { collection } from './db/collections';
import { ObjectId, UpdateWriteOpResult } from "mongodb";
import { Auth } from "./auth";
import { locationsActions } from "./roles";
const auth = new Auth();

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

    async editName (userId: string, userGroupId: string, locationId: string, name: string): Promise<StandardResponse> {
        try {
            const mongoDb = await connectDb();
            const authorised = await auth.authorised('location', locationsActions.canEditName, userId, userGroupId);
            if(authorised && authorised.authorised) {
                const updated = await mongoDb.collection(collection.locations).updateOne({_id: new ObjectId(locationId)}, {
                    $set: {
                        name,
                        updatedDate: new Date(), 
                        updatedBy: new ObjectId(userId)   
                    }
                })
                if(updated){
                    return {success: true};
                } else {
                    return {success: false, message: `userId: ${userId}, Error Occurred`};
                }
            } else {
                return {success: false, message: `Failed to get Authorisation`};
            }
        } catch(err) {
            error.log(`Location.editName: userId: ${userId}, locationId: ${locationId}, name: ${name}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        } 
    }

    async editWebsite (userId: string, userGroupId: string, locationId: string, websiteUrl: string): Promise<StandardResponse> {
        try {
            const mongoDb = await connectDb();
            const authorised = await auth.authorised('location', locationsActions.canEditWebsite, userId, userGroupId);
            if(authorised && authorised.authorised) {
                const updated = await mongoDb.collection(collection.locations).updateOne({_id: new ObjectId(locationId)}, {
                    $set: {
                        websiteUrl,
                        updatedDate: new Date(), 
                        updatedBy: new ObjectId(userId)   
                    }
                })
                if(updated){
                    return {success: true};
                } else {
                    return {success: false, message: `userId: ${userId}, Error Occurred`};
                }
            } else {
                return {success: false, message: `Failed to get Authorisation`};
            }
        } catch(err) {
            error.log(`Location.editWebsite: userId: ${userId}, locationId: ${locationId}, name: ${name}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        } 
    }

    async editDesc (userId: string, locationId: string, descId: string, language: string, text: string): Promise<StandardResponse> {
        try {
            const mongoDb = await connectDb();
            const location: any = await mongoDb.collection(collection.locations).findOne({_id: new ObjectId(locationId)}); 
            if(location) {
                const locationUserGroupId = location.userGroupId;
                const authorised = await auth.authorised('location', locationsActions.canEditDesc, userId, locationUserGroupId);
                if(authorised && authorised.authorised) {
                    const updated: UpdateWriteOpResult = await mongoDb.collection(collection.locations).updateOne(
                        {
                            _id: new ObjectId(locationId), 
                            "desc._id": new ObjectId(descId)
                        }, {
                        $set: {
                            "desc.$.text": text,
                            "desc.$.language": language,
                            updatedDate: new Date(), 
                            updatedBy: new ObjectId(userId)   
                        }
                    })
                    console.log('updated :', updated);

                    if(updated && updated.modifiedCount > 0){
                        return {success: true};
                    } else {
                        return {success: false, message: `userId: ${userId}, Error Occurred`};
                    }
                } else {
                    return {success: false, message: `Failed to get Authorisation`};
                }
            } else {
                return {success: false, message: `Location (${locationId}) not found`};
            }
        } catch(err) {
            error.log(`Location.editDesc: userId: ${userId}, projectId: ${locationId}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        } 
    }

    async addDesc (userId: string, locationId: string, language: string, text: string): Promise<StandardResponse> {
        try {
            const mongoDb = await connectDb();
            const location: any = await mongoDb.collection(collection.locations).findOne({_id: new ObjectId(locationId)}); 
            if(location) {
                const locationUserGroupId = location.userGroupId;
                const authorised = await auth.authorised('location', locationsActions.canAddDesc, userId, locationUserGroupId);
                if(authorised && authorised.authorised) {
                    const newDescId = new ObjectId();
                    const updated = await mongoDb.collection(collection.locations).updateOne(
                        {
                            _id: new ObjectId(locationId)
                        }, {
                        $set: {
                            updatedDate: new Date(), 
                            updatedBy: new ObjectId(userId)   
                        },
                        $addToSet: {
                            desc: {_id: newDescId, language, text}
                        }
                    })
                    if(updated){
                        return {success: true, message: newDescId.toString()};
                    } else {
                        return {success: false, message: `userId: ${userId}, Error Occurred`};
                    }
                } else {
                    return {success: false, message: `Failed to get Authorisation`};
                }
            } else {
                return {success: false, message: `Location (${locationId}) not found`};
            }
        } catch(err) {
            error.log(`Location.addDesc: userId: ${userId}, projectId: ${locationId}, name: ${name}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        } 
    }

    async deleteDesc (userId: string, locationId: string, descId: string): Promise<StandardResponse> {
        try {
            const mongoDb = await connectDb();
            const location: any = await mongoDb.collection(collection.locations).findOne({_id: new ObjectId(locationId)}); 
            if(location) {
                const locationUserGroupId = location.userGroupId;
                const authorised = await auth.authorised('location', locationsActions.canDeleteDesc, userId, locationUserGroupId);
                if(authorised && authorised.authorised) {
                    const updated = await mongoDb.collection(collection.locations).updateOne(
                        {
                            _id: new ObjectId(locationId)
                        }, {
                        $set: {
                            updatedDate: new Date(), 
                            updatedBy: new ObjectId(userId)   
                        },
                        $pull: {
                            desc: { _id: new ObjectId(descId) }
                        }
                    })
                    if(updated){
                        return {success: true};
                    } else {
                        return {success: false, message: `userId: ${userId}, Error Occurred`};
                    }
                } else {
                    return {success: false, message: `Failed to get Authorisation`};
                }
            } else {
                return {success: false, message: `Location (${locationId}) not found`};
            }
        } catch(err) {
            error.log(`Location.deleteDesc: userId: ${userId}, projectId: ${locationId}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        } 
    }
}