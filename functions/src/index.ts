import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import { AuthenticatedReq, CreateTagObject, LanguageOption } from './interfaces';
import { Tag } from './tag';
import { Project } from './project';
import { userClass } from './user';
import { UserGroup } from './userGroup';
import { ErrorLog } from './error';
import { MongoClient, Db } from 'mongodb';

let cachedDb = null;

const config = functions.config();
const dbUrl = config.db.url;
console.log('dbUrl :', dbUrl);
const dbName = config.db.name;
console.log('dbName :', dbName);
const dbUser = config.db.user;
console.log('dbUser :', dbUser);
const dbPassword = encodeURIComponent(config.db.password);

export async function connectDb (): Promise<Db> {
    const uri = `mongodb+srv://${dbUser}:${dbPassword}@${dbUrl}/test?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    if (cachedDb) {
        console.log('=> using cached database instance');
        return Promise.resolve(cachedDb);
    } else {
        return client.connect()
        .then((db1) => {
            console.log(`Connected to ${dbName} with User: ${dbUser}`);
            cachedDb = db1.db(dbName);
            return cachedDb;
        })
        .catch((err) => {
            console.log('Failed to Connect to Database');
            return null;
        });
    }
}

export const mongo: Promise<Db> = connectDb()

admin.initializeApp();

export const error = new ErrorLog(true);

//initialize express server
const app = express();
const main = express();

main.use(cors({ origin: true }));
//main.use(authenticate);

//add the path to receive request and set json as bodyParser to process the body 
main.use('/v1', app);

main.use(express.json());
main.use(express.urlencoded());

//initialize the database and the collection 

const tagClass = new Tag();
const projectClass = new Project();
const userGroupClass = new UserGroup();


function authenticate (req, res, next) {
    const authToken = validateHeaders(req);
    if (!authToken) {
        return res.status(403).send('Unauthorized: Missing auth token')
    }
    decodeAuthToken(authToken)
        .then((decodedToken) => { 
            console.log('decodedToken: ', decodedToken)
            userClass.getUserFromUid(decodedToken.uid).then(user => {
                req.user = user;
                next();
            }).catch((err) => {
                console.log('failed getUserFromUid')
            })
        })
        .catch((err) => {
            console.log('Token: Invalid', err);
            res.status(403).send('Unauthorized')
        });
}

app.post('/test', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const result = userId //await auth.authorised('project', 'canEdit', userId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});


app.get('/user-groups', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const result = await userGroupClass.getAll(userId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.post('/user-group/create', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const result = await userGroupClass.create(userId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/user-group/:userGroupId', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const result = await userGroupClass.get(userId, userGroupId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.post('/user-group/:userGroupId/user/add', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const user = req.body.user;
        const result = await userGroupClass.addUser(userId, user);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/user-group/:userGroupId/user/remove', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const user = req.body.user;
        const result = await userGroupClass.removeUser(userId, user);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/user-group/:userGroupId/user/leave', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const result = await userGroupClass.leave(userId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.post('/user-group/:userGroupId/request/join', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const result = await userGroupClass.requestJoin(userId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/user-group/:userGroupId/request/:requestId', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const requestId = req.params.requestId
        const result = await userGroupClass.requestResponse(userId, requestId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/user-group/:userGroupId/tags', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const result = await userGroupClass.tags(userId, userGroupId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/user-group/:userGroupId/projects', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const result = await userGroupClass.projects(userId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/user-group/:userGroupId/resources', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const result = await userGroupClass.resources(userId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.post('/tag/createRoot', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        console.log(req.body);
        const tag = req.body.rootTag;
        const createResult = await tagClass.createRoot(userId, tag);
        if (createResult) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(createResult);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.post('/tag/create', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const tag: CreateTagObject = req.body.tag;
        const createResult = await tagClass.create(userId, tag);
        if (createResult) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(createResult);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/rootTags', async (req: AuthenticatedReq, res) => {
    try {
        const result = await tagClass.getRootTags();
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/tag/parents', async (req: AuthenticatedReq, res) => {
    try {
        const result = await tagClass.getParentTags();
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/tag/type/:type', async (req: AuthenticatedReq, res) => {
    try {
        const tagType = req.params.type;
        const result = await tagClass.getTagsOfType(tagType)
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/tag/:tagId', async (req: AuthenticatedReq, res) => {
    try {
        const tagId: string = req.params.tagId;
        const result = await tagClass.get(tagId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/tag/:tagId/children', async (req: AuthenticatedReq, res) => {
    try {
        const tagId: string = req.params.tagId;
        const result = await tagClass.getChildren(tagId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});


app.get('/tag/:tagId/edit', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const tagId = req.params.tagId;
        const result = await tagClass.getEditable(userId, tagId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/tag/:tagId/edit/name', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const tagId = req.params.tagId;
        const name: LanguageOption[] = req.body.name;
        const result = await tagClass.editName(userId, tagId, name);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/tag/:tagId/edit/desc', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const tagId = req.params.tagId;
        const desc = req.body.desc;
        const result = await tagClass.editDesc(userId, tagId, desc);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/tag/:tagId/edit/userGroup', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const tagId = req.params.tagId;
        const newUserGroupId = req.body.userGroupId;
        const result = await tagClass.editUserGroup(userId, tagId, newUserGroupId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/tag/:tagId/edit/selectable', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const tagId = req.params.tagId;
        const selectable = req.body.selectable;
        const result = await tagClass.editSelectable(userId, tagId, selectable);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/projects', async (req: AuthenticatedReq, res) => {
    try {
        const result = await projectClass.getAll();
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/projects/filter', async (req: AuthenticatedReq, res) => {
    try {
        const tags = req.body.tags
        const result = await projectClass.filterByTags(tags);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/project/:projectId', async (req: AuthenticatedReq, res) => {
    try {
        const projectId = req.params.projectId;
        const result = await projectClass.get(projectId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/project/:projectId/edit', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        console.log('/project/:projectId/edit: ', req.params.projectId, req.user._id);
        const userId = req.user._id;
        const projectId = req.params.projectId;
        const result = await projectClass.getEditable(userId, projectId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/project/:projectId/edit/name', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        console.log('/project/:projectId/edit: ', req.params.projectId, req.user._id);
        const userId = req.user._id;
        const projectId = req.params.projectId;
        const name = req.body.name;
        const result = await projectClass.editName(userId, projectId, name);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/project/:projectId/edit/desc', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        console.log('/project/:projectId/edit: ', req.params.projectId, req.user._id);
        const userId = req.user._id;
        const projectId = req.params.projectId;
        const desc = req.body.desc;
        const result = await projectClass.editDesc(userId, projectId, desc);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/project/:projectId/edit/published', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        console.log('/project/:projectId/edit: ', req.params.projectId, req.user._id);
        const userId = req.user._id;
        const projectId = req.params.projectId;
        const desc = req.body.desc;
        const result = await projectClass.editDesc(userId, projectId, desc);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/project/:projectId/edit/userGroup', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        console.log('/project/:projectId/edit/userGroup: ', req.params.projectId, req.user._id);
        const userId = req.user._id;
        const projectId = req.params.projectId;
        const newUserGroupId = req.body.userGroupId;
        const result = await projectClass.editUserGroup(userId, projectId, newUserGroupId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/project/:projectId/tag/:tagId/add', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        console.log('/project/{projectId}/tag/:tagId/add: ', req.params, req.user._id);
        console.log('req.params :', req.params);
        const userId = req.user._id;
        const tagId = req.params.tagId;
        const projectId = req.params.projectId;
        console.log('/project/{projectId}/addTag: ', userId, tagId, userId);
        const addTagToProjectRes = await projectClass.addTag(projectId, tagId, userId);
        if (addTagToProjectRes) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(addTagToProjectRes);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/project/:projectId/tag/:tagId/remove', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        console.log('/project/:projectId/:tagId/remove: ', req.params, req.user._id);
        const userId = req.user._id;
        const tagId = req.params.tagId;
        const projectId = req.params.projectId;
        console.log('removeTag: ', userId, tagId, userId);
        const result = await projectClass.removeTag(projectId, tagId, userId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/project/:projectId/tags/reorder', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        console.log('/project/:projectId/tags/reorder: ', req.body, req.user._id);
        const userId = req.user._id;
        const tags = req.body.tags;
        const projectId = req.params.projectId;
        console.log('removeTag: ', userId, tags, userId);
        const result = await projectClass.reorderTags(projectId, tags, userId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/projects/sync', async (req: AuthenticatedReq, res) => {
    try {
        console.log('/projects/sync')
        const synced =  await projectClass.updateAll();
        if (synced) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(synced);
        } else {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send(synced);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/users', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const result = await userClass.getAll(userId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/user/profile', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const result = await userClass.getUserProfile(userId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/user/user-groups', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        console.log('req.query: ', req);
        const includeOpenGroups = true; //string = req.query.includeOpenGroups;
        const result = await userClass.getUserUserGroups(userId, includeOpenGroups);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/user/edit', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const update = req.body.update;
        const result = await userClass.editProfile(userId, update);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/user/edit/profilePic', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const result = await userClass.editProfilePic(userId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/user/:userId', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const requestedUid = req.body.requestedUid;
        const result = await userClass.getUser(userId, requestedUid);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/user/:userId/edit/role', authenticate, async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const requestedUid = req.body.requestedUid;
        const role = req.body.role;
        const result = await userClass.editUserRole(userId, requestedUid, role);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});



//define google cloud function name
export const api = functions.https.onRequest(main);

// on auth sign up create new record in users
exports.createUser = functions.auth.user().onCreate((user) => {
    return userClass.createNew(user);
});

function validateHeaders(req) {
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        console.log('auth header found');
        return req.headers.authorization.split('Bearer ')[1];
    } else {
        return null;
    }
}

function decodeAuthToken(authToken) {
    return admin.auth()
        .verifyIdToken(authToken)
        .then(decodedToken => {
            return decodedToken;
        })
}