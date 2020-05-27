import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import { AuthenticatedReq, CreateTagObject, LanguageOption } from './interfaces';
import { Tag } from './tag';
import { userClass } from './user';
import { ErrorLog } from './error';
import { Auth } from './auth';
import { MongoClient, Db } from 'mongodb';
import { locationRoutes } from './routes/location.routes';
import { projectRoutes } from './routes/project.routes'
import { userGroupRoutes } from './routes/user-group.routes';

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

// locations routes
app.use(locationRoutes);
app.use(projectRoutes);
app.use(userGroupRoutes);


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

