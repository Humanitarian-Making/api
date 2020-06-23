import * as express from 'express';
import { AuthenticatedReq, LanguageOption, CreateTagObject } from '../interfaces';
import { Tag } from '../tag';
import { Auth } from '../auth';


const routes: express.Router = express.Router()
const tagClass = new Tag();
const auth = new Auth();

routes.post('/tag/createRoot', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
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

routes.post('/tag/create', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.get('/rootTags', async (req: AuthenticatedReq, res) => {
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

routes.get('/tag/parents', async (req: AuthenticatedReq, res) => {
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

routes.get('/tag/type/:type', async (req: AuthenticatedReq, res) => {
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

routes.get('/tag/:tagId', async (req: AuthenticatedReq, res) => {
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

routes.get('/tags/selectable', async (req: AuthenticatedReq, res) => {
    try {
        const result = await tagClass.getSelectable(true);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        } 
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.get('/tag/:tagId/children', async (req: AuthenticatedReq, res) => {
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

routes.get('/tag/:tagId/edit', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.put('/tag/:tagId/edit/name', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.put('/tag/:tagId/edit/desc', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.put('/tag/:tagId/edit/userGroup', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

routes.put('/tag/:tagId/edit/selectable', [auth.authenticate], async (req: AuthenticatedReq, res) => {
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

export const tagRoutes = routes;
