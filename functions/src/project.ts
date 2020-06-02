import { request } from 'graphql-request';
import { ProjectWiki, EditableProject, GetEditableProjectRes,  StandardResponse } from './interfaces';
import { configs } from './config'
import { error, connectDb } from './index';
import { Auth } from './auth';
import { UserGroup } from './userGroup';
import { ObjectId, UpdateWriteOpResult } from 'mongodb';
import { projectActions } from './roles';
import { collection } from './db/collections';
import * as _ from "lodash";

const auth = new Auth();
const userGroup = new UserGroup();

export class Project {
    async get(projectId): Promise<{ success: boolean, project?: any, message?:string}> {
        try {
            const mongoDb = await connectDb();
            const projects = await mongoDb.collection('projects').aggregate(
                [
                    { 
                        "$match" : { 
                            "_id" : new ObjectId(projectId)
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
                            "published" : 1.0
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
            if (projects) {
                return {success: true, project: projects[0]}
            } else {
                console.log('projects: err');
                return {success: false }
            } 
            
        } catch(err) {
            error.log(`UserGroup.getAll: projectId: ${projectId}`, err);
            return {success: false, message: `projectId: ${projectId}, Error Occurred`};
        }    
    } 

    async getAll(): Promise<{ success: boolean, projects?: any[], message?:string}> {
        try {
            const mongoDb = await connectDb();
            const projects = await mongoDb.collection('projects').find({}).toArray();
            if (projects) {
                return {success: true, projects: projects}
            } else {
                return {success: false }
            } 
            
        } catch(err) {
            error.log(`UserGroup.getAll Error`, err);
            return {success: false, message: `An Error Occurred`};
        }    
    } 

    async filterByTags(tags): Promise<{ success: boolean, projects?: any[], message?:string}> {
        try {
            const mongoDb = await connectDb();
            const projects = await mongoDb.collection('projects').find(
                {tags: {$all: tags.map(x => new ObjectId(x))}})
                .toArray();
            if (projects) {
                return {success: true, projects: projects}
            } else {
                return {success: false }
            } 
            
        } catch(err) {
            return {success: false, message: `An Error Occurred`};
        }    
    }

    async getEditable(userId, projectId): Promise<GetEditableProjectRes> {
        try {
            const projectRes = await this.get(projectId);
            const project = projectRes.project;
            const projectUserGroupId = project.userGroupId;
            const authorised = await auth.authorised('project', projectActions.canEdit, userId, projectUserGroupId);
            if(authorised && authorised.authorised) {
                const userGroupRole = await userGroup.getUserGroupRole(userId, projectUserGroupId);
                if (userGroupRole) {
                    const projectActionAuthorised = await auth.getAuthActionsList(userGroupRole, 'project');
                    const editableProject: EditableProject = {
                        ...project,
                        ...projectActionAuthorised
                    }
                    return {success: true, project: editableProject }
                } else {
                    return {success: false, message: `Unauthorised`}
                }
            } else {
                return {success: false, message: `Unauthorised`}
            }
            
        } catch(err) {
            error.log(`UserGroup.getEditable: userId: ${userId}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        }
    }

    async editName(userId, projectId, names): Promise<GetEditableProjectRes> {
        try {
            const mongoDb = await connectDb();
            const project: any = await mongoDb.collection(collection.projects).findOne({_id: new ObjectId(projectId)}); 
            if(project) {
                const projectUserGroupId = project.userGroupId;
                const authorised = await auth.authorised('project', projectActions.canEditName, userId, projectUserGroupId);
                if(authorised) {
                    if(authorised.authorised) {
                        const nameUpdate = [];
                        names.forEach(name => {
                            if('language' in name && 'text' in name){
                                nameUpdate.push(name)
                            }
                        });
                        const updated = await mongoDb.collection(collection.projects).updateOne({_id: new ObjectId(projectId)}, {
                            name: nameUpdate,
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
                return {success: false, message: `Project (${projectId}) not found`};
            }
        } catch(err) {
            error.log(`Project.editName: userId: ${userId}, projectId: ${projectId}, names: ${names}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        } 
    } 
    
    async editDesc(userId, projectId, descs): Promise<StandardResponse> {
        try {
            const mongoDb = await connectDb();
            const project: any = await mongoDb.collection(collection.projects).findOne({_id: new ObjectId(projectId)}); 
            if(project) {
                const projectUserGroupId = project.userGroupId;
                const authorised = await auth.authorised('project', projectActions.canEditDesc, userId, projectUserGroupId);
                if(authorised) {
                    if(authorised.authorised) {
                        const descUpdate = [];
                        descs.forEach(desc => {
                            if('language' in desc && 'text' in desc){
                                descUpdate.push(desc)
                            }
                        });
                        
                        const updated = await mongoDb.collection(collection.projects).updateOne({_id: projectId}, {
                            desc: descUpdate, 
                            updatedDate: new Date(), 
                            updatedBy: userId
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
                return {success: false, message: `Project (${projectId}) not found`};
            }
        } catch(err) {
            error.log(`UserGroup.getAll: userId: ${userId}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        }    
    } 

    async editUserGroup(userId: string, projectId: string, newUserGroupId: string): Promise<StandardResponse> {
        try {
            const mongoDb = await connectDb();
            const newUserGroupDoc = await mongoDb.collection(collection.userGroups).findOne({_id: new ObjectId(newUserGroupId)}); 
            if(newUserGroupDoc) {
                const project: any = await mongoDb.collection(collection.projects).findOne({_id: new ObjectId(projectId)});
                if(project) {
                    const projectUserGroupId = project.userGroupId;
                    const currentUserGroupAuthorised = await auth.authorised('project', 'canChangeUserGroup', userId, projectUserGroupId);
                    const newUserGroupAuthorised = await auth.authorised('project', 'canChangeUserGroup', userId, newUserGroupId);
                    if(currentUserGroupAuthorised && newUserGroupAuthorised) {
                        if(currentUserGroupAuthorised.authorised && newUserGroupAuthorised.authorised) {
                            const updated = await mongoDb.collection(collection.projects).updateOne({_id: new ObjectId(projectId)}, {
                                $set: {
                                    userGroupId: new ObjectId(newUserGroupId), 
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
                    return {success: false, message: `Project (${projectId}) not found`};
                }
            } else {
                return {success: false, message: `New User Group (${newUserGroupId}) does not exist`};
            }
        } catch(err) {
            error.log(`UserGroup.getAll: userId: ${userId}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        }   
    } 

    async editPublished(userId, projectId, published: boolean): Promise<StandardResponse> {
        try {
            const mongoDb = await connectDb();
            const project: any = await mongoDb.collection(collection.projects).find({_id: new ObjectId(projectId)}); 
            if(project) {
                const projectUserGroupId = project.userGroupId;
                const userGroupAuthorised = await auth.authorised('project', 'canEditPublished', userId, projectUserGroupId);
                if(userGroupAuthorised) {
                    if(userGroupAuthorised.authorised) {
                        const updated = await mongoDb.collection(collection.projects).updateOne({ _id: new ObjectId(projectId) }, {
                            $set: {
                                published: published, 
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
                return {success: false, message: `Project (${projectId}) not found`};
            }
        } catch(err) {
            error.log(`UserGroup.getAll: userId: ${userId}`, err);
            return {success: false, message: `userId: ${userId}, Error Occurred`};
        }     
    } 

    async addTag(projectId:string, tagId: string, userId: string): Promise<StandardResponse> {
        try {
            console.log('Project.addTag: ', projectId, tagId, userId);
            const mongoDb = await connectDb();
            const project = await mongoDb.collection(collection.projects).findOne({_id: new ObjectId(projectId)});
            console.log('project :', project);
            const projectUserGroupId = project.userGroupId;
            const projectAuthorized = await auth.authorised('project', 'canAddTag', userId, projectUserGroupId);
            console.log('projectAuthorized :', projectAuthorized);

            const tag = await mongoDb.collection(collection.tags).findOne({_id: new ObjectId(tagId)});
            console.log('tag :', tag);
            const tagUserGroupId = tag.userGroupId;
            const tagAuthorised = await auth.authorised('tag', 'canAddTagReference', userId, tagUserGroupId)
            console.log('tagAuthorised :', tagAuthorised);

            if (projectAuthorized.authorised && tagAuthorised.authorised) {
                const updatedProject = await mongoDb.collection(collection.projects).updateOne({_id: new ObjectId(projectId)}, {
                    $addToSet: {
                        tags: new ObjectId(tagId)
                    },
                    $set: {
                        updated: new Date(),
                        updatedBy: new ObjectId(userId)
                    }
                })
                if (updatedProject) {
                    return {success: true, message: 'Tag Added to Project'}
                } else {
                    return {success: false, message: 'Failed to add tag to Project'}
                }
            } else {
                return { success: false, message: `You do not have authorization`} // need to say from what
            }
        } catch (err) {
            error.log('Tag.addTag', err)
            return { success: false, message: 'An Error Occurred'}
        }
    }

    async removeTag(projectId:string, tagId: string, userId: string): Promise<StandardResponse> {
        try {
            console.log('Project.removeTag: ', projectId, tagId, userId);
            const mongoDb = await connectDb();
            const project = await mongoDb.collection(collection.projects).findOne({_id: new ObjectId(projectId)});
            const projectUserGroupId = project.userGroupId;
            const projectAuthorized = await auth.authorised('project', projectActions.canDeleteTag, userId, projectUserGroupId);

            if (projectAuthorized.authorised) {
                const updatedProject = await mongoDb.collection(collection.projects).updateOne({_id: new ObjectId(projectId)}, {
                    $pull: {
                        tags: new ObjectId(tagId)
                    },
                    $set: {
                        updated: new Date(),
                        updatedBy: new ObjectId(userId)
                    }
                })
                if (updatedProject) {
                    return {success: true, message: 'Tag Removed from Project'}
                } else {
                    return {success: false, message: 'Failed to remove tag from Project'}
                }
            } else {
                return { success: false, message: `You do not have authorization`} // need to say from what
            }
        } catch (err) {
            error.log('Tag.createTag', err)
            return { success: false, message: 'An Error Occurred'}
        }
    }

    async reorderTags(projectId:string, tagIds: string[], userId: string): Promise<StandardResponse> {
        try {
            console.log('Project.reorder: ', projectId, tagIds, userId);
            const mongoDb = await connectDb();
            const project = await mongoDb.collection(collection.projects).findOne({_id: new ObjectId(projectId)});
            console.log('project :', project);
            const oldOrder = project.tags;
            console.log('oldOrder :', oldOrder);
            const projectUserGroupId = project.userGroupId;
            const projectAuthorized = await auth.authorised('project', projectActions.canEditTagOrder, userId, projectUserGroupId);
            console.log('projectAuthorized :', projectAuthorized);

            if (projectAuthorized.authorised) {
                const same = _.isEmpty(_.xor(oldOrder, tagIds));  // check same elements
                console.log('same :', same);
                if (same) {
                    const updatedProject = await mongoDb.collection(collection.projects).updateOne({_id: new ObjectId(projectId)}, {
                        $set: {
                            tags: tagIds,
                            updated: new Date(),
                            updatedBy: new ObjectId(userId)
                        }
                    })
                    if (updatedProject) {
                        return {success: true, message: 'Tag Added to Project'}
                    } else {
                        return {success: false, message: 'Failed to reorder tags'}
                    }
                } else {
                    error.log(`Project.reorderTags: ${projectId}, ${tagIds}, ${userId}`, )
                    return {success: false, message: 'Failed to reorder tags'}
                }
            } else {
                return { success: false, message: `You do not have authorization`} // need to say from what
            }
        } catch (err) {
            error.log('Tag.reorderTags', err)
            return { success: false, message: 'An Error Occurred'}
        }
    }

    async getFromWikifactory(projectSlug, orgSlug): Promise<ProjectWiki> {
        try {
            const variables = {
                slug: projectSlug,
                space: orgSlug 
            };
            const query = `fragment projectFields on Project {
                id
                image {
                    url
                }
                name
                slug
                descriptionSnippet
                space {
                    id
                    spaceType
                    content {
                        id
                        slug
                        __typename
                    }
                }
            }
            
            query Project($space: String, $slug: String) {
                project(space: $space, slug: $slug) {
                    result {
                        ...projectFields
                    }
                }
            }`; 
            return request(configs.wikifactoryEndpoint, query, variables)
                .then((data: any) => { 
                    const pro = data.project.result
                    if (pro !== null) {
                        const res: ProjectWiki = {
                            slug: projectSlug,
                            organisation: orgSlug,
                            name: pro.name,
                            desc: pro.description,
                            imageUrl: pro.image.url,
                            projectUrl: 'https://projects.humanitarianmaking.org/' + orgSlug + '/' + projectSlug 
                        }
                        return res; 
                    } else {
                        throw new Error(`Project with slug of ${projectSlug} does not exit`)
                    } 
                })
                .catch((err) => {
                    throw err;
                })
        } catch (err) {
            error.log('Project.getFromWikifactory', err);
            return err;
        }
    } 

    async getProject (projectId: string): Promise<any> {
        try {
            const mongoDb = await connectDb();
            const project = await mongoDb.collection(collection.projects).findOne({_id: projectId});
            if (project) {
                return project
            } else {
                return null;
            } 
        }
        catch (err) {
            error.log('Project.getProject', err);
            return null;
        }
    }


    /**************************************************************************************/
    /******************************    WIKIFACTORY SYNC     *******************************/
    /**************************************************************************************/
    async updateOrCreateOne(project: ProjectWiki): Promise<ProjectUpdate> {
        try {
            console.log('project: ', project);

            const projectId = this.generateProjectId(project);
            const mongoDb = await connectDb();
            const userGroupId = await this.getUserGroupIdFromName(project.organisation);
            const projectToCreate = {
                slug: projectId,        
                published: false,
                name: [{language: 'english', text: project.name}],
                desc: [{language: 'english', text: project.desc}],
                tags: [],
                created: new Date(),
            };

            const proj: UpdateWriteOpResult = await mongoDb.collection('projects').updateOne(
                {slug: projectId}, 
                {
                    $set: {
                        userGroupId: userGroupId,
                        imageUrl: project.imageUrl,
                        projectUrl: project.projectUrl,
                        updated: new Date()
                    },
                    $setOnInsert: projectToCreate,
                },
                { upsert: true}
            );
            if (proj) {
                if(proj.result.nModified === 1) {
                    return { projectId: projectId, status: 'updated'};
                } else if(proj.upsertedCount === 1) {
                    return { projectId: projectId, status: 'created'};
                } else {
                    return { projectId: projectId, status: 'error'};
                }
            } else {
                console.log('Project not updated');
                return { projectId: projectId, status: 'failed'};
            }
        } catch (err) {
            error.log('Project.updateOrCreateOne', err);
            return { projectId: project.name, status: 'Error occurred: failed to created'};
        }
    }

    generateProjectId(project: ProjectWiki): string {
        try {
            return project.organisation + '-' + project.slug;
        } catch (err){
            error.log('Project.generateProjectId', err);
            return null;
        }
    }

    async getUserGroupIdFromName(name): Promise<string> {
        try {
            const mongoDb = await connectDb();
            const existingUserGroup = await mongoDb.collection(collection.userGroups).findOne({ name: name });
            if (existingUserGroup) {
                return existingUserGroup._id;
            } else {
                const createdUserGroup = await this.upsertUserGroup(name);
                if (createdUserGroup) {
                    return createdUserGroup;
                } else {
                    return null
                }
            }
        } catch (err) {
            error.log('Project.getUserGroupIdFromName', err);
            return null;
        }
    }

    async upsertUserGroup(name): Promise<string> {
        console.log('upsertUserGroup name :', name);

        const mongoDb = await connectDb();
        const upsertedUserGroup = await mongoDb.collection(collection.userGroups).updateOne(
            {name: name}, 
            {
                $setOnInsert: {
                    created: new Date(),
                    open: false
                }
            }, 
            {upsert: true}
        );
        if (upsertedUserGroup && upsertedUserGroup.upsertedId) {
            console.log('upsertedUserGroup :', upsertedUserGroup);
            console.log('upsertedUserGroup.upsertedId :', upsertedUserGroup.upsertedId);
            return upsertedUserGroup.upsertedId._id.toString();
        } else {
            return null;
        }
    }

    async getAllFromWikifactory(): Promise<ProjectWiki[]> {
        try {
            const query = `
            fragment contentFields on Content {
                whitelabel
            }
            
            fragment projectListFields on Project {
                image {
                    url
                }
                slug
                descriptionSnippet
                content {
                    ...contentFields
                    __typename
                }
                name
                parentContent {
                    title
                    whitelabel
                    slug
                }
                space {
                    content {
                        slug
                    }
                }
            }
                                
            fragment projectConnectionFields on ProjectConnection {
                pageInfo {
                    startCursor
                    endCursor
                    hasNextPage
                }
                totalCount
                edges {
                    node {
                        ...projectListFields
                    }
                }
            }
            
            query WhiteLabelProjects(
                $batchSize: Int, 
                $cursor: String, 
                $sortBy: String, 
                $contains: [String!], 
                $notContains: [[String]], 
                $filterBy: [[String!]], 
                $whitelabels: [String]
            ) {
                projects(
                    first: $batchSize, 
                    after: $cursor, 
                    sortBy: $sortBy, 
                    contains: $contains, 
                    notContains: $notContains, 
                    filterBy: $filterBy, 
                    whitelabels: $whitelabels
                ) {
                    result {
                        ...projectConnectionFields
                    }
                }
            }`; 

            const variables = {
                "sortBy": "discover_recent",
                "batchSize": 100,
                "cursor": null,
                "filterBy": [
                    ["whitelabel", "humanitarian-makers-projects"]
                ],
                "contains": [],
                "notContains": [],
                "whitelabels": []
            }

            return request(configs.wikifactoryEndpoint, query, variables)
                .then((data: any) => { 
                    const projects: any[] = data.projects.result.edges;
                    const projectsArray: ProjectWiki[] = [];
                    projects.forEach(project => {
                        const proNode = project.node;
                        const imageUrl = proNode.image ? proNode.image.url : null
                        const projWiki: ProjectWiki = {
                            slug: proNode.slug,
                            organisation: '+' + proNode.parentContent.slug,
                            name: proNode.name,
                            desc: proNode.descriptionSnippet,
                            imageUrl: imageUrl,
                            projectUrl: 'https://projects.humanitarianmaking.org/' + '+' + proNode.parentContent.slug + '/' + proNode.slug
                        }
                        projectsArray.push(projWiki);
                    });
                    return projectsArray;
                })
                .catch((err) => {
                    throw err;
                })
        } catch (err) {
            error.log('Project.getFromWikifactory', err);
            return err;
        }
    }    

    async updateAll(): Promise<any> {
        return new Promise( async (resolve, reject) => {
            try {
                const projectWikis: ProjectWiki[] = await this.getAllFromWikifactory();
                const array = []
                projectWikis.forEach((project) => {
                    array.push(this.updateOrCreateOne(project));   
                });
                Promise.all(array)
                    .then((res) => resolve(res))
                    .catch((err) => {throw err})
                
            } catch(err) {
                error.log('Project.updateAll', err);
                reject(err);
            }
        })
    }
}

interface ProjectUpdate {
    projectId: string;
    status: string
}


