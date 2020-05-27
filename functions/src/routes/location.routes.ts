import * as express from 'express';
import { AuthenticatedReq } from '../interfaces';
import { Location } from '../location';

const routes: express.Router = express.Router()
const location = new Location()

routes.get('/location/nearby', async (req: AuthenticatedReq, res) => {
    try {
        const currentLocation = req.body.currentLocation;
        const result = await location.queryNearby(currentLocation);
        if (result) {
            res.set({ 'Access-Control-Allow-Origin': '*' }).status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.set({ 'Access-Control-Allow-Origin': '*' }).status(400).send({success: false, message: 'An Error Occurred'})
    }
});

export const locationRoutes = routes;
