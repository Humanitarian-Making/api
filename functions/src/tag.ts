import { error, connectDb } from './index';
import { CreateTagObject,  CreateRootTagObject, StandardResponse, EditableTagRes, EditableTag, TagObj, LanguageOption, CreateTagRes, TagUpdateResponse, TagRes, TagsRes } from './interfaces';
import { Auth } from './auth';
import { UserGroup } from './userGroup';
import { ObjectId } from 'mongodb';
import { tagActions, userGroupActions } from './roles';
import { collection } from './db/collections';

const auth = new Auth();
const userGroup = new UserGroup();

export class Tag {
    async createRoot(userId: string, tag: CreateRootTagObject): Promise<CreateTagRes> {
        try {
            console.log('Tag.createRootTag: userId: ', userId, ' tag: ', tag);
            const mongoDb = await connectDb();
            const authorised = await auth.authorised('user-group', userGroupActions.canCreateRootTag, userId, tag.userGroupId);
            if(authorised) {
                if(authorised.authorised) {
                    const newTag: TagObj = {
                        name: tag.name,
                        desc: tag.desc,
                        parent: null,
                        children: [],
                        selectable: tag.selectable,
                        userGroupId: new ObjectId(tag.userGroupId),
                        createdBy: new ObjectId(userId),
                        createdDate: new Date(),
                        updatedDate: new Date(),
                        updatedBy: new ObjectId(userId)
                    }
                    const createdTag = await mongoDb.collection(collection.tags).insertOne(newTag);
                    if(createdTag && createdTag.insertedId) {
                        const createdTagId = createdTag.insertedId;
                        console.log('Created: ', createdTag);
                        return {success: true, message: 'Created', tagId: createdTagId} // need to add id
                       
                    } else {
                        return {success: false, message: 'Failed to Create Root Tag'}
                    }
                } else {
                    return { success: false, message: `Unauthorised`};
                }
            } else {
                return { success:false, message: `Failed to get Authorisation`};
            }
        } catch (err) {
            error.log('Tag.createRootTag', err)
            return { success: false, message: 'An Error Occurred'}
        }
    }

    async create(userId: string, tag: CreateTagObject): Promise<CreateTagRes> {
        try {
            const mongoDb = await connectDb();
            const parent = await mongoDb.collection(collection.tags).findOne({ _id: new ObjectId(tag.parentId) });
            if(parent){
                console.log('Tag.create: userId: ', userId, ' tag: ', tag, parent);
                const authorised = await auth.authorised('tag', tagActions.canCreateChildTag, userId, parent.userGroupId);
                if(authorised) {
                    if(authorised.authorised) {
                        const newTag: TagObj = {
                            name: tag.name,
                            desc: tag.desc,
                            parent: new ObjectId(tag.parentId),
                            children: [],
                            selectable: tag.selectable,
                            userGroupId: new ObjectId(parent.userGroupId),
                            createdBy: new ObjectId(userId),
                            createdDate: new Date(),
                            updatedDate: new Date(),
                            updatedBy: new ObjectId(userId)
                        }
                        const createdTag = await mongoDb.collection(collection.tags).insertOne(newTag)
                        console.log('createdTag: ', createdTag)
                        if(createdTag && createdTag.insertedId) {
                            const createdTagId = createdTag.insertedId;
                            const parentUpdate = { 
                                $set: { 
                                    updated: new Date,
                                    updatedBy: new ObjectId(userId)
                                },
                                $addToSet: {
                                    'children': new ObjectId(createdTagId)
                                }
                            }
                            
                            console.log('parentUpdate: ', parentUpdate);
                            const updatedParent = await mongoDb.collection(collection.tags).updateOne(
                                { _id: new ObjectId(tag.parentId) }, 
                                parentUpdate);
                            if(updatedParent){
                                // console.log('updatedParent: ', updatedParent)
                                if(updatedParent.modifiedCount === 1) {
                                    return {success: true, message: 'Created', tagId: createdTagId}
                                } else {
                                    return {success: true, message: 'Created but failed to update parent', tagId: createdTagId}
                                }
                            } else {
                                return {success: true, message: 'Created but failed to update parent', tagId: createdTagId}
                            }
                            
                        } else {
                            return {success: false, message: 'Failed to Create Tag'}
                        }
                    } else {
                        return { success: false, message: `Unauthorised`};
                    }
                } else {
                    return { success:false, message: `Failed to get Authorisation`};
                }
            } else {
                return { success:false, message: `Could not find Parent Tag`};
            } 
        } catch (err) {
            error.log('Tag.createTag', err)
            return { success: false, message: 'An Error Occurred'}
        }
    }

    async getBatch(tagId: string): Promise<TagRes> {
        try {
            const mongoDb = await connectDb();
            const tag = await mongoDb.collection(collection.tags).findOne({_id: new ObjectId(tagId)});
            if(tag) {
                return {success: true, tag: tag};
            } else {
                return {success: false, message: 'Tag Not Found'};
            } 
        } catch (err) {
            error.log('Tag.get', err)
            return { success: false, message: 'An Error Occurred'}
        }
    }

    async get(tagId: string): Promise<TagRes> {
        try {
            const mongoDb = await connectDb();
            const tag = await mongoDb.collection(collection.tags).aggregate(
                [
                    { 
                        "$match" : { 
                            "_id" : new ObjectId(tagId)
                        }
                    }, 
                    { 
                        "$lookup" : { 
                            "from" : "tags", 
                            "localField" : "parent", 
                            "foreignField" : "_id", 
                            "as" : "parent"
                        }
                    }, 
                    { 
                        "$unwind" : { 
                            "path" : "$parent", 
                            "preserveNullAndEmptyArrays" : true
                        }
                    }, 
                    { 
                        "$lookup" : { 
                            "from" : "tags", 
                            "localField" : "children", 
                            "foreignField" : "_id", 
                            "as" : "children"
                        }
                    }, 
                    { 
                        "$project" : { 
                            "_id" : 1.0, 
                            "name" : 1.0, 
                            "desc" : 1.0, 
                            "selectable" : 1.0, 
                            "userGroupId" : 1.0, 
                            "createdDate" : 1.0, 
                            "updatedDate" : 1.0, 
                            "createdBy" : 1.0, 
                            "updatedBy" : 1.0, 
                            "parent" : { 
                                "_id" : 1.0, 
                                "name" : 1.0, 
                                "desc" : 1.0
                            }, 
                            "children" : { 
                                "_id" : 1.0, 
                                "name" : 1.0, 
                                "desc" : 1.0
                            }
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
                    }
                ], 
                { 
                    "allowDiskUse" : false
                }
            ).toArray();
            if(tag.length > 0) {
                return {success: true, tag: tag[0]};
            } else {
                return {success: false, message: 'Tag Not Found'};
            } 
        } catch (err) {
            error.log('Tag.get', err)
            return { success: false, message: 'An Error Occurred'}
        }
    }

    async getRootTags(): Promise<TagsRes> {
        try {
            const mongoDb = await connectDb();
            const tags = await mongoDb.collection(collection.tags).find({parent : null}, {projection: { 'name': 1, 'desc': 1}}).toArray();
            if(tags) {
                return {success: true, tags: tags};
            } else {
                return {success: false, message: 'tags Not Found'};
            } 
        } catch (err) {
            error.log('Tag.getRootTags', err)
            return { success: false, message: 'An Error Occurred'}
        }
    }

    async getParentTags(): Promise<TagsRes> {
        try {
            const mongoDb = await connectDb();
            const tags = await mongoDb.collection(collection.tags).aggregate(
                [
                    { 
                        "$match" : { 
            
                        }
                    }, 
                    { 
                        "$project" : { 
                            "numChildren" : { 
                                "$size" : "$children"
                            }, 
                            "name" : 1.0, 
                            "desc" : 1.0
                        }
                    }, 
                    { 
                        "$match" : { 
                            "numChildren" : { 
                                "$gt" : 0.0
                            }
                        }
                    }
                ], 
                { 
                    "allowDiskUse" : false
                }
            ).toArray();
            if(tags) {
                return {success: true, tags: tags};
            } else {
                return {success: false, message: 'tags Not Found'};
            } 
        } catch (err) {
            error.log('Tag.getParentTags', err)
            return { success: false, message: 'An Error Occurred'}
        }
    }

    async getChildren(tagId): Promise<TagsRes> {
        try {
            const mongoDb = await connectDb();
            const tags = await mongoDb.collection(collection.tags).find({parent : new ObjectId(tagId)}, {projection: { 'name': 1, 'desc': 1}}).toArray();
            if(tags) {
                return {success: true, tags: tags};
            } else {
                return {success: false, message: 'tags Not Found'};
            } 
        } catch (err) {
            error.log('Tag.getChildren', err)
            return { success: false, message: 'An Error Occurred'}
        }
    }

    async getTagsOfType(tagType): Promise<TagsRes> {
        try {
            const mongoDb = await connectDb();
            const tags = await mongoDb.collection(collection.tags).aggregate(
                [
                    { 
                        "$match" : { 
                            "type" : tagType
                        }
                    }, 
                    { 
                        "$lookup" : { 
                            "from" : "tags", 
                            "localField" : "parent", 
                            "foreignField" : "_id", 
                            "as" : "parent"
                        }
                    }, 
                    { 
                        "$unwind" : { 
                            "path" : "$parent", 
                            "preserveNullAndEmptyArrays" : true
                        }
                    }
                ], 
                { 
                    "allowDiskUse" : false
                }
            ).toArray();
            if(tags) {
                return {success: true, tags: tags};
            } else {
                return {success: false, message: 'tags Not Found'};
            } 
        } catch (err) {
            error.log('Tag.getChildren', err)
            return { success: false, message: 'An Error Occurred'}
        }   
    }

    async getEditable(userId, tagId): Promise<EditableTagRes> {
        try {
            // sysadmin
            const tagRes: any = await this.get(tagId);
            const tag = tagRes.tag;
            if(tag && userId) {
                const tagUserGroupId = tag.userGroupId;
                const authorised = await auth.authorised('tag', tagActions.canEdit, userId, tagUserGroupId);
                if(authorised.authorised) {
                    const userGroupRole = await userGroup.getUserGroupRole(userId, tagUserGroupId);
                    if (userGroupRole) {
                        const tagActionAuthorised = await auth.getAuthActionsList(userGroupRole, 'project');
                        const editableProject: EditableTag = {
                            ...tag,
                            ...tagActionAuthorised
                        }
                        return {success: true, tag: editableProject }
                    } else {
                        return {success: false, message: `Unauthorised`}
                    }
                } else {
                    return {success: false, message: `Unauthorised`}
                }
            } else {
                return {success: false, message: `tagId (${tagId}) not found`}
            }
        } catch(err) {
            error.log(`UserGroup.getAll: userId: ${userId}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        }  
    } 

    async editName(userId, tagId, names:LanguageOption[]): Promise<TagUpdateResponse> {
        try {
            const mongoDb = await connectDb();
            const tag: any = await mongoDb.collection(collection.tags).findOne({_id: new ObjectId(tagId)}); 
            if(tag) {
                const tagUserGroupId = tag.userGroupId;
                const authorised = await auth.authorised('tag', tagActions.canEditName, userId, tagUserGroupId);
                if(authorised) {
                    if(authorised.authorised) {
                        const nameUpdate = [];
                        names.forEach(name => {
                            if ('language' in name && 'text' in name){
                                nameUpdate.push(name)
                            }
                        });
                        const updated = await mongoDb.collection(collection.tags).updateOne({_id: new ObjectId(tagId)}, {
                            $set: {
                                name: nameUpdate, 
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
                        return {success: false, message: `Unauthorised`};
                    }
                } else {
                    return {success: false, message: `Failed to get Authorisation`};
                }
            } else {
                return {success: false, message: `tag (${tagId}) not found`};
            }
        } catch(err) {
            error.log(`Tag.editName: userId: ${userId}, tagId: ${tagId}, names: ${names}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        }   
    } 

    async editDesc(userId, tagId, descs): Promise<TagUpdateResponse> {
        try {
            const mongoDb = await connectDb();
            const tag: any = await mongoDb.collection(collection.tags).findOne({_id: new ObjectId(tagId)}); 
            if(tag) {
                const tagUserGroupId = tag.userGroupId;
                const authorised = await auth.authorised('tag', tagActions.canEditDesc, userId, tagUserGroupId);
                if(authorised) {
                    if(authorised.authorised) {
                        const descUpdate = [];
                        descs.forEach(desc => {
                            if('language' in desc && 'text' in desc){
                                descUpdate.push(desc)
                            }
                        });
                        const updated = await mongoDb.collection(collection.tags).updateOne({_id: new ObjectId(tagId)}, {
                            desc: descUpdate, 
                            updatedDate: new Date(), 
                            updatedBy: new ObjectId(userId)
                        })
                        if(updated){
                            return {success: true};
                        } else {
                            return {success: false, message: `userId: ${userId}, Error Occurred`};
                        }
                    } else {
                        return {success: false, message: `Unauthorised`};
                    }
                } else {
                    return {success: false, message: `Failed to get Authorisation`};
                }
            } else {
                return {success: false, message: `tag (${tagId}) not found`};
            }
        } catch(err) {
            error.log(`Tag.editDesc: userId: ${userId}, tagId: ${tagId}, descs: ${descs}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        }  
    } 

    async editUserGroup(userId, tagId, newUserGroupId): Promise<StandardResponse> {
        try {
            const mongoDb = await connectDb();
            const tag: any = await mongoDb.collection(collection.tags).findOne({_id: new ObjectId(tagId)}); 
            if(tag) {
                const tagUserGroupId = tag.userGroupId;
                const currentUserGroupAuthorised = await auth.authorised('tag', tagActions.canChangeUserGroup, userId, tagUserGroupId);
                const newUserGroupAuthorised = await auth.authorised('tag', tagActions.canChangeUserGroup, userId, newUserGroupId);
                if(currentUserGroupAuthorised && newUserGroupAuthorised) {
                    if(currentUserGroupAuthorised.authorised && newUserGroupAuthorised.authorised) {
                        const updated = await mongoDb.collection(collection.tags).updateOne({_id: new ObjectId(tagId)}, {
                            userGroupId: new ObjectId(newUserGroupId), 
                            updatedDate: new Date(), 
                            updatedBy: new ObjectId(userId)
                        });
                        if(updated){
                            return {success: true};
                        } else {
                            return {success: false};
                        }
                    } else {
                        return {success: false, message: `Unauthorised`};
                    }
                } else {
                    return {success: false, message: `Failed to get Authorisation`};
                }
            } else {
                return {success: false, message: `Tag (${tagId}) not found`};
            }
        } catch(err) {
            error.log(`Tag .editUserGroup: userId: ${userId}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        }      
    } 

    async editSelectable(userId, tagId, selectable): Promise<StandardResponse> {
        try {
            const mongoDb = await connectDb();
            const tag: any = await mongoDb.collection(collection.tags).findOne({_id: new ObjectId(tagId)}); 
            if(tag) {
                const tagUserGroupId = tag.userGroupId;
                const tagUserGroupAuthorised = await auth.authorised('tag', tagActions.canEditSelectable, userId, tagUserGroupId);
                if(tagUserGroupAuthorised) {
                    if(tagUserGroupAuthorised.authorised) {
                        const updated = await mongoDb.collection(collection.tags).updateOne({_id: new ObjectId(tagId)}, {
                            $set: {
                                selectable: selectable, 
                                updatedDate: new Date(), 
                                updatedBy: new ObjectId(userId)
                            }
                        });
                        if(updated){
                            return {success: true};
                        } else {
                            return {success: false};
                        }
                    } else {
                        return {success: false, message: `Unauthorised`};
                    }
                } else {
                    return {success: false, message: `Failed to get Authorisation`};
                }
            } else {
                return {success: false, message: `Tag (${tagId}) not found`};
            }
        } catch(err) {
            error.log(`UserGroup.getAll: userId: ${userId}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        }    
    }

}
