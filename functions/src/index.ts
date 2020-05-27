// npm modules
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import { ErrorLog } from './error';
import { MongoClient, Db } from 'mongodb';

// routes
import { locationRoutes } from './routes/location.routes';
import { projectRoutes } from './routes/project.routes'
import { userGroupRoutes } from './routes/user-group.routes';
import { userRoutes } from './routes/user.routes';
import { tagRoutes } from './routes/tag.routes';

// classes
import { userClass } from './user';

// configurations
const config = functions.config();
const dbUrl = config.db.url;
console.log('dbUrl :', dbUrl);
const dbName = config.db.name;
console.log('dbName :', dbName);
const dbUser = config.db.user;
console.log('dbUser :', dbUser);
const dbPassword = encodeURIComponent(config.db.password); 


// database
let cachedDb = null;

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
            console.log(`Failed to to ${dbUrl}/${dbName} with User: ${dbUser}`);
            return null;
        });
    }
}

export const mongo: Promise<Db> = connectDb()

// error logging
export const error = new ErrorLog(true);

admin.initializeApp();

//initialize express server
export const app = express();
const main = express();
main.use(cors({ origin: true }));

//add the path to receive request and set json as bodyParser to process the body 
main.use('/v1', app);

main.use(express.json());
main.use(express.urlencoded());

// routes
app.use(locationRoutes);
app.use(projectRoutes);
app.use(userGroupRoutes);
app.use(userRoutes);
app.use(tagRoutes)


//define google cloud function name
export const api = functions.https.onRequest(main);

// on auth sign up create new record in users
exports.createUser = functions.auth.user().onCreate((user) => {
    return userClass.createNew(user);
});
