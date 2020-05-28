import * as express from 'express';
import { AuthenticatedReq } from '../interfaces';
import { Location } from '../location';

const routes: express.Router = express.Router()
const location = new Location()

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

export const locationRoutes = routes;
