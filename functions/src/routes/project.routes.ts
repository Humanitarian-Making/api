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
            res.status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.get('/projects/featured/limit/:limit', async (req: AuthenticatedReq, res) => {
    try {
        const limit = Number(req.params.limit);
        const result = await projectClass.getFeatured(limit);
        if (result) {
            res.status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/projects/search', async (req: AuthenticatedReq, res) => {
    try {
        const tags = req.body.tags;
        const text = req.body.text;
        const result = await projectClass.search(text, tags);
        if (result) {
            res.status(200).send(result);
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
            res.status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.get('/project/:projectId/edit', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const projectId = req.params.projectId;
        const result = await projectClass.getEditable(userId, projectId);
        if (result) {
            res.status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/user-group/:userGroupId/project/:projectId/edit/name/language/:language', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const projectId = req.params.projectId;
        const language = req.params.language;
        const text = req.body.text;
        const result = await projectClass.editName(userId, userGroupId, projectId, language, text);
        if (result) {
            res.status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/user-group/:userGroupId/project/:projectId/edit/desc/language/:language', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const projectId = req.params.projectId;
        const language = req.params.language;
        const text = req.body.text;
        const result = await projectClass.editDesc(userId, userGroupId, projectId, language, text);
        if (result) {
            res.status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/user-group/:userGroupId/project/:projectId/edit/projectUrl', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const projectId = req.params.projectId;
        const projectUrl = req.body.text;
        const result = await projectClass.editProjectUrl(userId, userGroupId, projectId, projectUrl);
        if (result) {
            res.status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/project/:projectId/edit/userGroup', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const projectId = req.params.projectId;
        const newUserGroupId = req.body.userGroupId;
        const result = await projectClass.editUserGroup(userId, projectId, newUserGroupId);
        if (result) {
            res.status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/user-group/:userGroupId/project/:projectId/edit/published', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const projectId = req.params.projectId;
        const published = req.body.state;
        const result = await projectClass.editPublished(userId, userGroupId, projectId, published);
        if (result) {
            res.status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/user-group/:userGroupId/project/:projectId/edit/featured', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const projectId = req.params.projectId;
        const featured = req.body.state;
        const result = await projectClass.editFeatured(userId, userGroupId, projectId, featured);
        if (result) {
            res.status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
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
            res.status(200).send(addTagToProjectRes);
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
            res.status(200).send(result);
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
            res.status(200).send(result);
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
            res.status(200).send(synced);
        } else {
            res.status(400).send(synced);
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
            res.status(200).send(synced);
        } else {
            res.status(400).send(synced);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

export const projectRoutes = routes;
