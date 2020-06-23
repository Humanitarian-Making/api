import { StandardResponse, AddResource } from "./interfaces";
import { connectDb, error } from './index';
import { collection } from './db/collections';
import { ObjectId, UpdateWriteOpResult } from "mongodb";
import { Auth } from "./auth";
import { resourceActions } from "./roles";
const auth = new Auth();

export class Resource { 
    async getUserGroupResources(userGroupId) {
        try {
            console.log('getUserGroupResources :', userGroupId);

            const mongoDb = await connectDb();
            const userGroup = await mongoDb.collection(collection.userGroups).findOne({_id: new ObjectId(userGroupId)});
            console.log('userGroup :', userGroup);
            const resources = await mongoDb.collection(collection.resources).find({ userGroupId : new ObjectId(userGroupId) }).toArray(); 
            if (userGroup) {
                const userGroupResources = {
                    ... userGroup, 
                    resources
                }
                return { success: true, userGroupResources }; ;
            } else {
                console.log('tags: err');
                return { success: false, message: `An Error Occurred`};
            }
        } catch(err) {
            return {success: false, message: `An Error Occurred`};
        }
    }

    async getNewResourceId(userId, userGroupId) {
        try {
            const authorised = await auth.authorised('resource', resourceActions.canAdd, userId, userGroupId);
            if(authorised && authorised.authorised) {
                return { success: true, message: new ObjectId() };
            } else {
                return {success: false, message: `Failed to get Authorisation`};
            }
        } catch(err) {
            return {success: false, message: `An Error Occurred`};
        }
    }

    async add(userId, userGroupId, newResource: AddResource ) {
        try {
            const mongoDb = await connectDb();
            const authorised = await auth.authorised('resource', resourceActions.canAdd, userId, userGroupId);
            if(authorised && authorised.authorised) {
                const added = await mongoDb.collection(collection.resources).find(
                    {
                        _id: new ObjectId(),
                        userGroupId: new ObjectId(userGroupId),
                        name: newResource.name,
                        desc: [
                            {
                                _id: new ObjectId(), 
                                text: newResource.desc,
                                language: 'english'
                            }
                        ], 
                        type: newResource.type,
                        resourceUrl: newResource.resourceUrl,
                        created: new Date(),
                        createdBy: new ObjectId(userId),
                        updated: new Date(),
                        updatedBy: new ObjectId(userId)
                    }
                );
                if(added){
                    return {success: true};
                } else {
                    return {success: false, message: `userId: ${userId}, Error Occurred`};
                }
                
            } else {
                return {success: false, message: `Failed to get Authorisation`};
            }
        } catch(err) {
            return {success: false, message: `An Error Occurred`};
        }
    }

    async delete(userId, userGroupId, resourceId ) {
        try {
            const mongoDb = await connectDb();
            const authorised = await auth.authorised('resource', resourceActions.canDelete, userId, userGroupId);
            if(authorised && authorised.authorised) {
                const deleted = await mongoDb.collection(collection.resources).findOneAndDelete({_id: new ObjectId(resourceId)});
                if(deleted){
                    return {success: true};
                } else {
                    return {success: false, message: `userId: ${userId}, Error Occurred`};
                }
                
            } else {
                return {success: false, message: `Failed to get Authorisation`};
            }
        } catch(err) {
            return {success: false, message: `An Error Occurred`};
        }
    }

    async editName (userId, userGroupId,resourceId, name): Promise<StandardResponse> {
        try {
            const mongoDb = await connectDb();
            const authorised = await auth.authorised('resource', resourceActions.canEditName, userId, userGroupId);
            if (authorised && authorised.authorised) {
                const updated = await mongoDb.collection(collection.resources).updateOne({_id: new ObjectId(resourceId)}, {
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
            error.log(`Resource.editName: userId: ${userId}, projectId: ${resourceId}, name: ${name}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        } 
    }

    async editDesc (userId: string, userGroupId: string, resourceId: string, descId: string, language: string, text: string): Promise<StandardResponse> {
        try {
            const mongoDb = await connectDb();
            const authorised = await auth.authorised('resource', resourceActions.canEditDesc, userId, userGroupId);
                if(authorised && authorised.authorised) {
                    const updated: UpdateWriteOpResult = await mongoDb.collection(collection.resources).updateOne(
                        {
                            _id: new ObjectId(resourceId), 
                            "desc._id": new ObjectId(descId)
                        }, {
                        $set: {
                            "desc.$.text": text,
                            "desc.$.language": language,
                            updatedDate: new Date(), 
                            updatedBy: new ObjectId(userId)   
                        }
                    })

                    if(updated && updated.modifiedCount > 0){
                        return {success: true};
                    } else {
                        return {success: false, message: `userId: ${userId}, Error Occurred`};
                    }
                } else {
                    return {success: false, message: `Failed to get Authorisation`};
                }
        } catch(err) {
            error.log(`Resource.editDesc: userId: ${userId}, projectId: ${resourceId}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        } 
    }

    async addDesc (userId: string, userGroupId: string, resourceId: string, language: string, text: string): Promise<StandardResponse> {
        try {
            const mongoDb = await connectDb();
            const authorised = await auth.authorised('resource', resourceActions.canAddDesc, userId, userGroupId);
            if(authorised && authorised.authorised) {
                const newDescId = new ObjectId();
                const updated = await mongoDb.collection(collection.resources).updateOne(
                    {
                        _id: new ObjectId(resourceId)
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
        } catch(err) {
            error.log(`Resource.addDesc: userId: ${userId}, projectId: ${resourceId}, name: ${name}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        } 
    }

    async deleteDesc (userId: string, userGroupId: string, resourceId: string, descId: string): Promise<StandardResponse> {
        try {
            const mongoDb = await connectDb();
            const authorised = await auth.authorised('resource', resourceActions.canDeleteDesc, userId, userGroupId);
                if(authorised && authorised.authorised) {
                    const updated = await mongoDb.collection(collection.resources).updateOne(
                        {
                            _id: new ObjectId(resourceId)
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
        } catch(err) {
            error.log(`Resource.deleteDesc: userId: ${userId}, projectId: ${resourceId}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        } 
    }

    async canEditResource (userId: string, userGroupId: string, resourceId: string, resourceUrl: string): Promise<StandardResponse> {
        try {
            const mongoDb = await connectDb();
            const authorised = await auth.authorised('resource', resourceActions.canEditResource, userId, userGroupId);
                if(authorised && authorised.authorised) {
                    const updated = await mongoDb.collection(collection.resources).updateOne(
                        {
                            _id: new ObjectId(resourceId)
                        }, {
                        $set: {
                            resourceUrl: resourceUrl,
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
            error.log(`Resource.deleteDesc: userId: ${userId}, projectId: ${resourceId}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        } 
    }

    async canDeleteResource (userId: string, userGroupId: string, resourceId: string): Promise<StandardResponse> {
        try {
            const mongoDb = await connectDb();
            const authorised = await auth.authorised('resource', resourceActions.canEditResource, userId, userGroupId);
                if(authorised && authorised.authorised) {
                    const updated = await mongoDb.collection(collection.resources).updateOne(
                        {
                            _id: new ObjectId(resourceId)
                        }, {
                        $set: {
                            resourceUrl: null,
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
            error.log(`Resource.deleteDesc: userId: ${userId}, projectId: ${resourceId}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        } 
    }
}