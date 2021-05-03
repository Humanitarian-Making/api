import * as express from 'express';
import { SustainabilityReview, SustainabilityReviewUpdate } from '../sustainabilityReview';

const routes: express.Router = express.Router()
const sustainabilityReview = new SustainabilityReview

routes.post('/sustainability-review/create', async (req, res) => {
    try {
        const userId = req.body && req.body.userId ? req.body.userId : null;
        const result = await sustainabilityReview.create(userId);
        if (result) {
            res.status(200).send(result);
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.get('/sustainability-review/:sustainabilityReviewId', async (req, res) => {
    try {
        const reviewId = req.params.sustainabilityReviewId;
        if (reviewId) {
            const result = await sustainabilityReview.getById(reviewId);
            if (result) {
                res.status(200).send(result);
            } else {
                res.status(400).send({success: false, message: 'Sustainability Review Not Found'}) 
            }
        } else {
            res.status(400).send({success: false, message: 'Missing Sustainability Review Id'})
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});

routes.post('/sustainability-review/:sustainabilityReviewId/update', async (req, res) => {
    try {
        const reviewId = req.params.sustainabilityReviewId;
        console.log('reviewId: ', reviewId);
        const update: SustainabilityReviewUpdate = req.body;
        const result = await sustainabilityReview.update(reviewId, update);
        if (result) {
            res.status(200).send(result);
        } else {
            res.status(400).send({success: false, message: 'Failed to Update Sustainability Review'})
        }
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});


routes.get('/sustainability-review/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log('userId: ', userId);
        // Still to do
        res.status(200).send(
            {success: true, review: []}
        );
    } catch (error) {
        console.error(error)
        res.status(400).send({success: false, message: 'An Error Occurred'})
    }
});
export const sustainabilityReviewRoutes = routes;
