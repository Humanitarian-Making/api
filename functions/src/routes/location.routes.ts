import * as express from 'express';
import { AuthenticatedReq } from '../interfaces';
import { Location } from '../location';
import { Auth } from '../auth';

const routes: express.Router = express.Router()
const location = new Location()
const auth = new Auth();

routes.put('/location/nearby', async (req: AuthenticatedReq, res) => {
    try {
        const currentLocation = req.body.currentLocation;
        const distance = req.body.distance;
        const result = await location.queryNearby(currentLocation, distance);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/user-group/:userGroupId/location/:locationId/edit/name', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const locationId = req.params.locationId;
        const name = req.body.text;
        const result = await location.editName(userId, userGroupId, locationId, name);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/user-group/:userGroupId/location/:locationId/edit/website', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const userGroupId = req.params.userGroupId;
        const locationId = req.params.locationId;
        const websiteUrl = req.body.text;
        const result = await location.editWebsite(userId, userGroupId, locationId, websiteUrl);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/location/:locationId/desc/:descId/edit', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const locationId = req.params.locationId;
        console.log('locationId :', locationId);
        const descId = req.params.descId;
        const language = req.body.language;
        console.log('language :', language);
        const text = req.body.text;
        console.log('text :', text);
        const result = await location.editDesc(userId, locationId, descId, language, text);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/location/:locationId/desc/add', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const locationId = req.params.locationId;
        const language = req.body.language;
        const text = req.body.text;
        const result = await location.addDesc(userId,locationId, language, text);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.put('/location/:locationId/desc/:descId/delete', [auth.authenticate], async (req: AuthenticatedReq, res) => {
    try {
        const userId = req.user._id;
        const locationId = req.params.locationId;
        const descId = req.params.descId;
        const result = await location.deleteDesc(userId,locationId, descId);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

export const locationRoutes = routes;
