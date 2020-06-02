import * as express from 'express';
import { AuthenticatedReq } from '../interfaces';
import { userClass } from '../user';
import { Auth } from '../auth';

const routes: express.Router = express.Router()
const auth = new Auth();

routes.get('/users', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.get('/user/profile', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        if(req.user) {
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

routes.get('/user/user-groups', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
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

routes.put('/user/edit', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.put('/user/edit/profilePic', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.get('/user/:userId', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.get('/user/:userId/edit/role', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

export const userRoutes = routes;
