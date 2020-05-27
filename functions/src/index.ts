import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import { AuthenticatedReq, CreateTagObject, LanguageOption } from './interfaces';
import { Tag } from './tag';
import { userClass } from './user';
import { UserGroup } from './userGroup';
import { ErrorLog } from './error';
import { Auth } from './auth';
import { MongoClient, Db } from 'mongodb';
import { locationRoutes } from './routes/location.routes';
import { projectRoutes } from './routes/project.routes'

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
            console.log(`Connected to ${dbUrl}/${dbName} with User: ${dbUser}`);
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

const auth = new Auth();
export const error = new ErrorLog(true);

//initialize express server
export const app = express();
const main = express();

main.use(cors({ origin: true }));
//main.use(authenticate);

//add the path to receive request and set json as bodyParser to process the body 
main.use('/v1', app);

main.use(express.json());
main.use(express.urlencoded());

//initialize the database and the collection 

const tagClass = new Tag();

const userGroupClass = new UserGroup();



// locations routes
app.use(locationRoutes);
app.use(projectRoutes);

app.post('/test', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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


app.get('/user-groups', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.post('/user-group/create', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.get('/user-group/:userGroupId', async (req: AuthenticatedReq, res) => {
    try {
        const userGroupId = req.params.userGroupId;
        const result = await userGroupClass.get(userGroupId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.post('/user-group/:userGroupId/user/add', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        if (req.user) {
            const userId = req.user._id;
            const user = req.body.user;
            const result = await userGroupClass.addUser(userId, user);
            if (result) {
                res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
            } 
        } else {
            const err = new Error('No Req.user');
            throw err;
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.put('/user-group/:userGroupId/user/remove', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.put('/user-group/:userGroupId/user/leave', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.post('/user-group/:userGroupId/request/join', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.put('/user-group/:userGroupId/request/:requestId', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.get('/user-group/:userGroupId/tags', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.get('/user-group/:userGroupId/projects', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.get('/user-group/:userGroupId/resources', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.post('/tag/createRoot', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.post('/tag/create', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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


app.get('/tag/:tagId/edit', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.put('/tag/:tagId/edit/name', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.put('/tag/:tagId/edit/desc', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.put('/tag/:tagId/edit/userGroup', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.put('/tag/:tagId/edit/selectable', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.get('/users', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.get('/user/profile', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        if(req.user) {
            console.log('req.user :', req.user);
            const userId = req.user._id;
            const result = await userClass.getUserProfile(userId);
            if (result) {
                res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
            }
        }  else {
            const err = new Error('No Req.user');
            throw err;
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

app.get('/user/user-groups', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.put('/user/edit', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.put('/user/edit/profilePic', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.get('/user/:userId', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

app.get('/user/:userId/edit/role', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

