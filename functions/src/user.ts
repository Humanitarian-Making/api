import { collection } from './db/collections';
import { error, connectDb } from './index';
import { UserGroupsRolesRes } from './interfaces';
import { ObjectId } from 'mongodb';

class User {
    async getAll(uid): Promise<{ success: boolean, users?: [],message?:string}> {
        try {
            // sysadmin, admin
            return {success: true, users: []}
        } catch(err) {
            error.log(`UserGroup.getAll: uid: ${uid}`, err);
            return {success: false, message: `UID: ${uid}, Error Occurred`};
        }    
    }

    async getProfile(uid): Promise<{ success: boolean, profile?: {} ,message?:string}> {
        try {
            // sysadmin, admin, user
            return {success: true, profile: {}}
        } catch(err) {
            error.log(`UserGroup.getAll: uid: ${uid}`, err);
            return {success: false, message: `UID: ${uid}, Error Occurred`};
        }    
    }

    async editDisplayName(uid, displayName): Promise<{ success: boolean, profile?: {} ,message?:string}> {
        try {
            // sysadmin, admin, user
            return {success: true, profile: {}}
        } catch(err) {
            error.log(`UserGroup.getAll: uid: ${uid}`, err);
            return {success: false, message: `UID: ${uid}, Error Occurred`};
        }    
    }

    async getUserProfile(userId): Promise<{ success: boolean, message?:string, user?: any}> {
        try {
            const mongoDb = await connectDb();
            const user = await mongoDb.collection(collection.users).findOne({_id: new Object(userId)})
            if(user) {
                return { success: true, user: user}
            } else {
                return { success: false, message: 'User Not Found'}
            }
        } catch(err) {
            error.log(`UserGroup.getProfile: userId: ${userId}`, err);
            return {success: false, message: `An Error Occurred`};
        }    
    }

    // need to update
    async editProfile(userId, update: {displayName: string, language: string}): Promise<{ success: boolean,message?:string}> {
        try {
            const mongoDb = await connectDb();
            const user = await mongoDb.collection(collection.users).updateOne(
                {_id: new Object(userId)}, 
                {
                    $set: {
                        language: update.language,
                        displayName: update.displayName
                    }
                })
            if(user) {
                return { success: true }
            } else {
                return { success: false, message: 'User Not Found'}
            }
        } catch(err) {
            error.log(`UserGroup.getProfile: userId: ${userId}`, err);
            return {success: false, message: `An Error Occurred`};
        }   
    }

    async editProfilePic(uid): Promise<{ success: boolean, profile?: {} ,message?:string}> {
        try {
            // sysadmin, admin, user
            return {success: true, profile: {}}
        } catch(err) {
            error.log(`UserGroup.getAll: uid: ${uid}`, err);
            return {success: false, message: `UID: ${uid}, Error Occurred`};
        }    
    }

    async getUser(uid, requestedUid): Promise<{ success: boolean, profile?: {} ,message?:string}> {
        try {
            // sysadmin, admin
            return {success: true, profile: {}}
        } catch(err) {
            error.log(`UserGroup.getAll: uid: ${uid}`, err);
            return {success: false, message: `UID: ${uid}, Error Occurred`};
        }    
    }

    async editUserRole(uid, requestedUid, role): Promise<{ success: boolean, profile?: {} ,message?:string}> {
        try {
            // sysadmin, admin
            return {success: true, profile: {}}
        } catch(err) {
            error.log(`UserGroup.getAll: uid: ${uid}`, err);
            return {success: false, message: `UID: ${uid}, Error Occurred`};
        }    
    }

    async createNew(user) {
        try {
            console.log('user: ', user);
            const mongoDb = await connectDb()
            const providerData = user.providerData[0] ? user.providerData[0] : null;
            console.log('providerData :', providerData);
            const email = user.email ? user.email : user.providerData[0].email;
            console.log('email :', email);
            const created = await mongoDb.collection(collection.users).updateOne(
                {email: email}, 
                {
                    $set: {
                        updated: new Date(),
                        photoURL: user.photoURL ? user.photoURL : null,
                    },
                    $addToSet: {
                        providers: {
                            uid: user.uid,
                            providerId: providerData ? providerData.providerId : 'emailAndPassword',
                            providerUid: providerData ? providerData.uid : null
                        }
                    },
                    $setOnInsert: {
                        roles: {
                            user: true,
                            admin: false,
                            sysadmin: false
                        },
                        displayName: user.displayName ? user.displayName : null,
                        created: new Date(),
                        language: 'english'
                    },
                },
                { upsert: true}    
            );
            if(created) {
                console.log('created :', created);
            } else {
                console.log('Error')
            }
        } catch (err) {
            error.log('User.getUIDFromUsername', err);
            return null;;
        }
    }

    async getUserIdFromUid (uid: string) : Promise<string>{
        try {
            console.log('getUserIdFromUid', uid);
            const mongoDb = await connectDb()
            const user: any = await mongoDb.collection(collection.users).findOne({'providers.uid': uid })
            console.log('getUserIdFromUid user:', user);
            if (user) {
                return user._id;
            } else {
                return null;
            }
        } catch (err) {
            console.log('err: ', err);
            return null;
        }
    }

    async getUserFromUid (uid: string) : Promise<string>{
        try {
            console.log('getUserFromUid', uid);
            const mongoDb = await connectDb()
            const user: any = await mongoDb.collection(collection.users).findOne({'providers.uid': uid })
            console.log('getUserFromUid user:', user);
            if (user) {
                return user;
            } else {
                return null;
            }
        } catch (err) {
            console.log('err: ', err);
            return null;
        }
    }

    async getUserUserGroups(userId, includeOpenGroups): Promise<UserGroupsRolesRes> {
        try {
            const mongoDb = await connectDb()
            const closedUserGroups: any = await mongoDb.collection(collection.userGroupUsers).aggregate(
                [
                    { 
                        "$match" : { 
                            "user" : new ObjectId(userId)
                        }
                    }, 
                    { 
                        "$lookup" : { 
                            "from" : "user-groups", 
                            "localField" : "userGroup", 
                            "foreignField" : "_id", 
                            "as" : "userGroup"
                        }
                    }, 
                    { 
                        "$unwind" : { 
                            "path" : "$userGroup", 
                            "preserveNullAndEmptyArrays" : false
                        }
                    }, 
                    { 
                        "$project" : { 
                            "userGroup" : 1.0, 
                            "role" : "$role"
                        }
                    }
                ], 
                { 
                    "allowDiskUse" : false
                }
            ).toArray();
            if (includeOpenGroups) {
                const openUserGroups = await mongoDb.collection(collection.userGroups).find({open: true}).toArray();
                const openUserGroupRole = openUserGroups.map((userGroup) => {
                    return {
                        role: 'user',
                        userGroup: userGroup
                    }
                })
                return {success: true, userGroupRoles: closedUserGroups.concat(openUserGroupRole)}
            }
            return {success: true, userGroupRoles: closedUserGroups}
        } catch (err) {
            console.log('getUserUserGroups err:', err);
            return {success: false, message: 'An Error Occurred'}
        }
    }
}

export const userClass = new User();

