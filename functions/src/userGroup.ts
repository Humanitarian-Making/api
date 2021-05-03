import { userClass } from './user';
import { collection } from './db/collections';
import { error, connectDb } from './index';
import { ObjectId } from 'mongodb';
import { Utils } from './utils';
import { TagsResponse, UserGroupRes, StandardResponse } from './interfaces';
import { Auth } from './auth';
import { userGroupActions } from './roles';

const utils = new Utils();
const auth = new Auth();

export enum UserGroupRoles {
    admin= 'admin',
    user = 'user'
}

export class UserGroup {
    async getAll(uid): Promise<{ success: boolean, userGroups?:[], message?:string}> {
        try {
            // admin and sysadmin
            return {success: true, userGroups: []}
        } catch(err) {
            error.log(`UserGroup.getAll: uid: ${uid}`, err);
            return {success: false, message: `UID: ${uid}, Error Occurred`};
        }    
    }

    async create(uid): Promise<{ success: boolean, userGroupId?:string, message?:string}> {
        try {
            // admin and sysadmin
            return {success: true, userGroupId: ''}
        } catch(err) {
            error.log(`UserGroup.getAll: uid: ${uid}`, err);
            return {success: false, message: `UID: ${uid}, Error Occurred`};
        }    
    }

    // need to update
    async get(userGroupId): Promise<UserGroupRes> {
        try {
            const mongoDb = await connectDb();
            const userGroupDoc = await mongoDb.collection(collection.userGroups).findOne({_id: new ObjectId(userGroupId)});
            const users = await mongoDb.collection(collection.userGroupUsers).find({userGroup: new ObjectId(userGroupId)}).toArray(); 
            const projects = await mongoDb.collection(collection.projects).find({userGroupId: new ObjectId(userGroupId)}).toArray(); 
            const locations = await mongoDb.collection(collection.locations).find({userGroupId: new ObjectId(userGroupId)}).toArray();
            const resources = await mongoDb.collection(collection.resources).find({userGroupId: new ObjectId(userGroupId)}).toArray();
            if (userGroupDoc) {
                const userGroup = {
                    ... userGroupDoc, 
                    projects,
                    users,
                    locations,
                    resources,
                }
                return { success: true, userGroup }; ;
            } else {
                console.log('tags: err');
                return { success: false, message: `Failed to load tags`};
            } 
        } catch(err) {
            error.log(`UserGroup.getAll: userGroupId: ${userGroupId}`, err);
            return {success: false, message: `UID: ${userGroupId}, Error Occurred`};
        }    
    }

    async getUsers(userId, userGroupId): Promise<any> {
        try {
            const authorised = await auth.authorised('user-group', userGroupActions.canViewUsers, userId, userGroupId);
            console.log('authorised :', authorised);
            if (authorised && authorised.authorised) {
                const mongoDb = await connectDb();
                const userGroup = await mongoDb.collection(collection.userGroups).findOne({_id: new ObjectId(userGroupId)});
                const users = await mongoDb.collection(collection.userGroupUsers).aggregate([
                        { 
                            "$match" : { 
                                "userGroup" : new ObjectId(userGroupId)
                            }
                        }, 
                        { 
                            "$lookup" : { 
                                "from" : "users", 
                                "localField" : "user", 
                                "foreignField" : "_id", 
                                "as" : "user"
                            }
                        }, 
                        { 
                            "$unwind" : { 
                                "path" : "$user", 
                                "preserveNullAndEmptyArrays" : false
                            }
                        }, 
                        { 
                            "$project" : { 
                                "_id" : 1.0, 
                                "user" : { 
                                    "_id" : 1.0, 
                                    "email" : 1.0, 
                                    "displayName" : 1.0, 
                                    "photoURL" : 1.0, 
                                    "language" : 1.0
                                }, 
                                "role" : 1.0
                            }
                        }
                    ], 
                    { 
                        "allowDiskUse" : false
                    }
                ).toArray(); 
                if (userGroup) {
                    const userGroupUsers = {
                        ... userGroup, 
                        users
                    }
                    return { success: true, userGroupUsers }; ;
                } else {
                    console.log('tags: err');
                    return { success: false, message: `Failed to load tags`};
                }
            } else {
                return {success: false, message: `Unauthorised to view User Group Users`};
            }
        } catch(err) {
            error.log(`UserGroup.getAll: userGroupId: ${userGroupId}`, err);
            return {success: false, message: `UID: ${userGroupId}, Error Occurred`};
        }    
    }

    async getLocations(userId, userGroupId): Promise<any> {
        try {
            const authorised = await auth.authorised('user-group', userGroupActions.canViewLocations, userId, userGroupId);
            console.log('authorised :', authorised);
            if (authorised && authorised.authorised) {
                const mongoDb = await connectDb();
                const userGroup = await mongoDb.collection(collection.userGroups).findOne({_id: new ObjectId(userGroupId)});
                const locations = await mongoDb.collection(collection.locations).find({ userGroupId : new ObjectId(userGroupId) }).toArray(); 
                if (userGroup) {
                    const userGroupLocations = {
                        ... userGroup, 
                        locations
                    }
                    return { success: true, userGroupLocations }; ;
                } else {
                    console.log('tags: err');
                    return { success: false, message: `Failed to load tags`};
                }
            } else {
                return {success: false, message: `Unauthorised to view User Group Users`};
            }
        } catch(err) {
            error.log(`UserGroup.getAll: userGroupId: ${userGroupId}`, err);
            return {success: false, message: `UID: ${userGroupId}, Error Occurred`};
        }    
    }

    async addUser(userId: string, userGroupId: string, email: string, role: string): Promise<StandardResponse> {
        try {
            const authorised = await auth.authorised('user-group', userGroupActions.canAddUser, userId, userGroupId);
            if (authorised && authorised.authorised) {
                const newUserId = await userClass.getUserIdFromEmail(email);
                const roleExists = UserGroupRoles[role] === null ? false : true;
                if (newUserId && roleExists) {
                    const mongoDb = await connectDb();
                    const added = await mongoDb.collection(collection.userGroupUsers).updateOne(
                        {
                            userGroup: new ObjectId(userGroupId), 
                            user: new ObjectId(newUserId)
                        },
                        {
                            $set: {
                                role: role,
                                update: new Date(),
                                updatedBy: new ObjectId(userId)
                            }, 
                            $setOnInsert: {
                                added: new Date(),
                                addedBy: new ObjectId(userId)
                            }
                        }, 
                        { upsert: true });
                    console.log('addUser added: ', added);
                    return { success: true}
                } else {
                    return { success: false, message: `No user with email address of ${email} exists.`}
                }
            } else {
                return {success: false, message: `Unauthorised to add a user to this User Group`};
            }
        } catch(err) {
            error.log(`UserGroup.addOrUpdateUser: userId: ${userId}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        }    
    }

    async updateUserRole(userId: string, userGroupId: string, editUserId: string, role: string): Promise<StandardResponse> {
        try {
            const authorised = await auth.authorised('user-group', userGroupActions.canEditUserRole, userId, userGroupId);
            if (authorised && authorised.authorised) {
                const roleExists = UserGroupRoles[role] === null ? false : true;
                if (roleExists) {
                    const mongoDb = await connectDb();
                    const update = await mongoDb.collection(collection.userGroupUsers).updateOne(
                        {
                            userGroup: new ObjectId(userGroupId), 
                            user: new ObjectId(editUserId)
                        },
                        {
                            $set: {
                                role: role,
                                update: new Date(),
                                updatedBy: new ObjectId(userId)
                            }, 
                            $setOnInsert: {
                                added: new Date(),
                                addedBy: new ObjectId(userId)
                            }
                        }, 
                        { upsert: true });
                    console.log('updateUserRole update: ', update);
                    return { success: true}
                } else {
                    return { success: false, message: `No role selected does not exist .`}
                }
            } else {
                return {success: false, message: `Unauthorised to add a user to this User Group`};
            }
        } catch(err) {
            error.log(`UserGroup.updateUserRole: userId: ${userId}, userGroupId: ${userGroupId}, role: ${role}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        }    
    }

    async removeUser(userId: string, userGroupId: string, removeUserId: string): Promise<StandardResponse> {
        try {
            const authorised = await auth.authorised('user-group', userGroupActions.canDeleteUser, userId, userGroupId);
            if (authorised && authorised.authorised) {
                const mongoDb = await connectDb();
                const update = await mongoDb.collection(collection.userGroupUsers).deleteMany(
                    {
                        userGroup: new ObjectId(userGroupId), 
                        user: new ObjectId(removeUserId)
                    });
                console.log('update: ', update);
                return { success: true}
            } else {
                return {success: false, message: `Unauthorised to remove a user to this User Group`};
            }
        } catch(err) {
            error.log(`UserGroup.addOrUpdateUser: userId: ${userId}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        }     
    }

    async leave(uid): Promise<{ success: boolean, message?:string}> {
        try {
            // user
            return {success: true}
        } catch(err) {
            error.log(`UserGroup.getAll: uid: ${uid}`, err);
            return {success: false, message: `UID: ${uid}, Error Occurred`};
        }    
    }

    async requestJoin(uid): Promise<{ success: boolean, message?:string}> {
        try {
            // user
            return {success: true}
        } catch(err) {
            error.log(`UserGroup.getAll: uid: ${uid}`, err);
            return {success: false, message: `UID: ${uid}, Error Occurred`};
        }    
    }

    async requestResponse(uid, requestId): Promise<{ success: boolean, message?:string}> {
        try {
            // sysadmin
            // userGroup admin
            return {success: true}
        } catch(err) {
            error.log(`UserGroup.getAll: uid: ${uid}`, err);
            return {success: false, message: `UID: ${uid}, Error Occurred`};
        }    
    }

    async tags (userId, userGroupId): Promise<TagsResponse> {
        const mongoDb = await connectDb();
        const authorised = await auth.authorised('user-group', userGroupActions.canViewTags, userId, userGroupId);
        if(authorised) {
            if(authorised.authorised) {
                const tags = await mongoDb.collection(collection.tags).find({}).toArray();
                if (tags) {
                    return { success: true, tags}; ;
                } else {
                    console.log('tags: err');
                    return { success: false, message: `Failed to load tags`};
                } 
            } else {
                return { success: false, message: `Unauthorised`};
            }
        } else {
            return { success:false, message: `Failed to get Authorisation`};
        }
    }

    async projects(userGroupId): Promise<{ success: boolean, userGroupProjects?: any[], message?:string}> {
        try {
            const mongoDb = await connectDb();
            const userGroup = await mongoDb.collection(collection.userGroups).findOne({_id: new ObjectId(userGroupId)});
            const projects = await mongoDb.collection('projects').aggregate([
                    { 
                        "$match" : { 
                            "userGroupId" : new ObjectId(userGroupId)
                        }
                    }, 
                    { 
                        "$lookup" : { 
                            "from" : "tags", 
                            "localField" : "tags", 
                            "foreignField" : "_id", 
                            "as" : "tags"
                        }
                    }, 
                    { 
                        "$unwind" : { 
                            "path" : "$tags", 
                            "preserveNullAndEmptyArrays" : true
                        }
                    }, 
                    { 
                        "$lookup" : { 
                            "from" : "tags", 
                            "localField" : "tags.parent", 
                            "foreignField" : "_id", 
                            "as" : "tags.parent"
                        }
                    }, 
                    { 
                        "$unwind" : { 
                            "path" : "$tags.parent", 
                            "preserveNullAndEmptyArrays" : true
                        }
                    }, 
                    { 
                        "$group" : { 
                            "_id" : "$_id", 
                            "tags" : { 
                                "$push" : "$tags"
                            }, 
                            "name" : { 
                                "$first" : "$name"
                            }, 
                            "userGroupId" : { 
                                "$first" : "$userGroupId"
                            }, 
                            "created" : { 
                                "$first" : "$created"
                            }, 
                            "updated" : { 
                                "$first" : "$updated"
                            }, 
                            "updatedBy" : { 
                                "$first" : "$updatedBy"
                            }, 
                            "desc" : { 
                                "$first" : "$desc"
                            }, 
                            "imageUrl" : { 
                                "$first" : "$imageUrl"
                            }, 
                            "projectUrl" : { 
                                "$first" : "$projectUrl"
                            },
                            "published" : { 
                                "$first" : "$published"
                            },
                            "featured" : { 
                                "$first" : "$featured"
                            }
                        }
                    }, 
                    { 
                        "$project" : { 
                            "_id" : 1.0, 
                            "tags" : { 
                                "_id" : 1.0, 
                                "name" : 1.0, 
                                "parent" : { 
                                    "_id" : 1.0, 
                                    "name" : 1.0
                                }
                            }, 
                            "name" : 1.0, 
                            "userGroupId" : 1.0, 
                            "created" : 1.0, 
                            "updated" : 1.0, 
                            "updatedBy" : 1.0, 
                            "desc" : 1.0, 
                            "imageUrl" : 1.0,
                            "projectUrl" : 1.0,  
                            "published" : 1.0,
                            "featured" : 1.0,

                        }
                    }, 
                    { 
                        "$lookup" : { 
                            "from" : "user-groups", 
                            "localField" : "userGroupId", 
                            "foreignField" : "_id", 
                            "as" : "userGroup"
                        }
                    }, 
                    { 
                        "$unwind" : { 
                            "path" : "$userGroup", 
                            "preserveNullAndEmptyArrays" : true
                        }
                    },
                    { "$sort" : { created : -1 } }
                ], 
                { 
                    "allowDiskUse" : false
                }
            ).toArray();
            if (userGroup) {
                const userGroupProjects = {
                    ... userGroup, 
                    projects
                }
                return { success: true, userGroupProjects }; ;
            } else {
                console.log('tags: err');
                return { success: false, message: `Failed to load tags`};
            }
        } catch(err) {
            error.log(`UserGroup.getAll: uid: ${userGroupId}`, err);
            return {success: false, message: `UID: ${userGroupId}, Error Occurred`};
        }    
    }

    async resources(uid?): Promise<{ success: boolean, resources?: [],message?:string}> {
        try {
            // public
            return { success: true, resources: [] }
        } catch(err) {
            error.log(`UserGroup.getAll: uid: ${uid}`, err);
            return {success: false, message: `UID: ${uid}, Error Occurred`};
        }    
    }


    async getUserGroupRole(userId, userGroupId): Promise<string> {
        try {
            console.log('userId: ', userId)
            console.log('userGroupId: ', userGroupId)
            const mongoDb = await connectDb();
            const userGroup = await mongoDb.collection(collection.userGroups).findOne({_id: new ObjectId(userGroupId)});
            const userGroupUser = await mongoDb.collection(collection.userGroupUsers).findOne({userGroup: new ObjectId(userGroupId), user: new ObjectId(userId)});
            console.log('userGroupUser: ', userGroupUser)
            console.log('userGroup: ', userGroup)
            if (userGroupUser && userGroup) {
                return userGroupUser.role;
            } else {
                if (userGroup.open) {
                    return 'user';
                } else {
                    return null
                }
            }
        } catch(err) {
            error.log(`UserGroup.getUserGroupRole: userId: ${userId}, userGroupId: ${userGroupId}`, err);
            return null;
        }    
    }


    async actionUserGroupRoleAuthorised(resource, action, userId, userGroupId): Promise<{authorised: boolean, requiredRoles?: string[], message?: string}> {
        try {
            const mongoDb = await connectDb();
            const userGroupRoles = await mongoDb.collection(collection.actionRoles).findOne({type: resource});
            const requiredUserGroupRoles = userGroupRoles[action];
            const userGroupRole = await this.getUserGroupRole(userId, userGroupId);
            const authorised = utils.isRoleInRolesRequired(userGroupRole, requiredUserGroupRoles);
            if (authorised) {
                return {
                    authorised: true
                };
            } else {
                return {
                    authorised: false, 
                    requiredRoles: requiredUserGroupRoles, 
                    message: `User Role missing from User Group`};
                }
        } catch(err) {
            error.log(`UserGroup.actionUserGroupRoleAuthorised, resource: ${resource}, action: ${action}, uid: ${userId}, userGroupId: ${userGroupId}`)
            return {authorised: false};
        }
    }

}



