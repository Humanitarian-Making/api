import { error, connectDb } from './index';
import { ObjectId } from 'mongodb';
import { Utils } from './utils';
import { TagsResponse, UserGroupRes } from './interfaces';
import { Auth } from './auth';
import { userGroupActions } from './roles';

const utils = new Utils();
const auth = new Auth();

const userGroupCollection = 'user-groups';
const userGroupUserCollection = 'user-group-users';
const actionRolesCollection = 'action-roles';
const tagCollection = 'tags';
const projectCollection = 'projects';
const locationCollection = 'locations';
const resourceCollection = 'resources';

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
            const userGroupDoc = await mongoDb.collection(userGroupCollection).findOne({_id: new ObjectId(userGroupId)});
            const users = await mongoDb.collection(userGroupUserCollection).find({userGroup: new ObjectId(userGroupId)}).toArray(); 
            const projects = await mongoDb.collection(projectCollection).find({userGroupId: new ObjectId(userGroupId)}).toArray(); 
            const locations = await mongoDb.collection(locationCollection).find({userGroupId: new ObjectId(userGroupId)}).toArray();
            const resources = await mongoDb.collection(resourceCollection).find({userGroupId: new ObjectId(userGroupId)}).toArray();
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

    async addUser(uid, user): Promise<{ success: boolean, message?:string}> {
        try {
            // sysadmin
            // userGroup admin
            return {success: true}
        } catch(err) {
            error.log(`UserGroup.getAll: uid: ${uid}`, err);
            return {success: false, message: `UID: ${uid}, Error Occurred`};
        }    
    }

    async removeUser(uid, user): Promise<{ success: boolean, message?:string}> {
        try {
            // sysadmin
            // userGroup admin
            return {success: true}
        } catch(err) {
            error.log(`UserGroup.getAll: uid: ${uid}`, err);
            return {success: false, message: `UID: ${uid}, Error Occurred`};
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
                const tags = await mongoDb.collection(tagCollection).find({}).toArray();
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

    async projects(uid?): Promise<{ success: boolean, projects?: [],message?:string}> {
        try {
            // public
            return { success: true, projects: [] }
        } catch(err) {
            error.log(`UserGroup.getAll: uid: ${uid}`, err);
            return {success: false, message: `UID: ${uid}, Error Occurred`};
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
            const userGroup = await mongoDb.collection(userGroupCollection).findOne({_id: new ObjectId(userGroupId)});
            const userGroupUser = await mongoDb.collection(userGroupUserCollection).findOne({userGroup: new ObjectId(userGroupId), user: new ObjectId(userId)});
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
            const userGroupRoles = await mongoDb.collection(actionRolesCollection).findOne({type: resource});
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



