import * as express from 'express';
import { AuthenticatedReq } from '../interfaces';
import { Auth } from '../auth';
import { UserGroup } from './../userGroup';

const routes: express.Router = express.Router()
const userGroupClass = new UserGroup();
const auth = new Auth();

routes.get('/user-groups', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.post('/user-group/create', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.get('/user-group/:userGroupId', async (req: AuthenticatedReq, res) => {
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

routes.get('/user-group/:userGroupId/users', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const result = await userGroupClass.getUsers(userId, userGroupId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.post('/user-group/:userGroupId/user/add', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        if (req.user) {
            const userId = req.user._id;
            const userGroupId = req.params.userGroupId;
            const email = req.body.email;
            const role = req.body.role;
            const result = await userGroupClass.addUser(userId, userGroupId, email, role);
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

routes.put('/user-group/:userGroupId/user/:userId/remove', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const removeUserId = req.params.userId;
        const result = await userGroupClass.removeUser(userId, userGroupId, removeUserId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/user-group/:userGroupId/user/:userId/role/:role/edit', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const editUserId = req.params.userId;
        const role = req.params.role;
        const result = await userGroupClass.updateUserRole(userId, userGroupId, editUserId, role);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/user-group/:userGroupId/user/leave', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.post('/user-group/:userGroupId/request/join', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.put('/user-group/:userGroupId/request/:requestId', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.get('/user-group/:userGroupId/tags', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.get('/user-group/:userGroupId/projects', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.get('/user-group/:userGroupId/locations', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const result = await userGroupClass.getLocations(userId, userGroupId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

export const userGroupRoutes = routes;
