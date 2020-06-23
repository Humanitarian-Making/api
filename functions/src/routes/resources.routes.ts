import * as express from 'express';
import { AuthenticatedReq } from '../interfaces';
import { Resource } from '../resource';
import { Auth } from '../auth';

const routes: express.Router = express.Router()
const resource = new Resource()
const auth = new Auth();

routes.get('/user-group/:userGroupId/resources', async (req, res) => {
    try {
        const userGroupId = req.params.userGroupId;
        const result = await resource.getUserGroupResources(userGroupId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});


routes.post('/user-group/:userGroupId/resource/add', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const newResource = req.body.resource;
        const result = await resource.add(userId, userGroupId, newResource);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});


routes.put('/user-group/:userGroupId/resource/:resourceId/delete', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const resourceId = req.params.resourceId;
        const result = await resource.delete(userId, userGroupId, resourceId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/user-group/:userGroupId/resource/:resourceId/name/:name', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const resourceId = req.params.resourceId;
        const name = req.params.name;
        const result = await resource.editName(userId, userGroupId, resourceId, name);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/user-group/:userGroupId/resource/:resourceId/desc/:descId/edit', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const resourceId = req.params.resourceId;
        const descId = req.params.descId;
        const language = req.body.language;
        const text = req.body.text;
        console.log('text :', text);
        const result = await resource.editDesc(userId, userGroupId, resourceId, descId, language, text);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/user-group/:userGroupId/resource/:resourceId/desc/add', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const resourceId = req.params.resourceId;
        const language = req.body.language;
        const text = req.body.text;
        const result = await resource.addDesc(userId, userGroupId, resourceId, language, text);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/resource/:resourceId/desc/:descId/delete', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const resourceId = req.params.resourceId;
        const descId = req.params.descId;
        const result = await resource.deleteDesc(userId, userGroupId, resourceId, descId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

export const resourceRoutes = routes;
