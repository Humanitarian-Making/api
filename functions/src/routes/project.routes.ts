import * as express from 'express';
import { AuthenticatedReq } from '../interfaces';
import { Project } from '../project';
import { Auth } from '../auth';


const routes: express.Router = express.Router()
const projectClass = new Project();
const auth = new Auth();

routes.get('/projects', async (req: AuthenticatedReq, res) => {
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

routes.put('/projects/filter', async (req: AuthenticatedReq, res) => {
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

routes.get('/project/:projectId', async (req, res) => {
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

routes.get('/project/:projectId/edit', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
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

routes.put('/project/:projectId/edit/name', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
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

routes.put('/project/:projectId/edit/desc', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
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

routes.put('/project/:projectId/edit/published', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
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

routes.put('/project/:projectId/edit/userGroup', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
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

routes.put('/project/:projectId/tag/:tagId/add', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.put('/project/:projectId/tag/:tagId/remove', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const tagId = req.params.tagId;
        const projectId = req.params.projectId;
        const result = await projectClass.removeTag(projectId, tagId, userId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/project/:projectId/tags/reorder', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const tags = req.body.tags;
        const projectId = req.params.projectId;
        const result = await projectClass.reorderTags(projectId, tags, userId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.get('/sync/projects', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const synced =  await projectClass.syncWithWikifactory(req.user._id);
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

routes.get('/sync/reports', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const synced =  await projectClass.getSyncReports();
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

export const projectRoutes = routes;
