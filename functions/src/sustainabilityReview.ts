import { connectDb } from './index';
import { collection } from './db/collections';
import { ObjectId } from "mongodb";

enum SustainabilityReviewSectionCode {
    GREY,
    RED,
    AMBER,
    GREEN
}


interface SustainabilityReviewSection {
    code: SustainabilityReviewSectionCode,
    note: string | null
}

export interface SustainabilityReviewUpdate {
    title: string,
    completed: boolean,
    deleted: boolean,
    sections: {
        1: SustainabilityReviewSection,
        2: SustainabilityReviewSection,
        3: SustainabilityReviewSection, 
        4: SustainabilityReviewSection,
        5: SustainabilityReviewSection, 
        6: SustainabilityReviewSection, 
        7: SustainabilityReviewSection, 
        8: SustainabilityReviewSection, 
        9: SustainabilityReviewSection,
        10: SustainabilityReviewSection,
        11: SustainabilityReviewSection, 
        12: SustainabilityReviewSection,
        13: SustainabilityReviewSection,
        14: SustainabilityReviewSection, 
        15: SustainabilityReviewSection,
        16: SustainabilityReviewSection, 
    } 
}

export class SustainabilityReview { 
    async create (userId: string | null ) {
        try {
            const mongoDb = await connectDb();
            const newReview = {
                _id: new ObjectId(),
                createdAt: new Date(),
                createdBy: userId ? new ObjectId(userId) : null,
                updatedAt: new Date(),
            }
            console.log('newReview: ', newReview);
            const created = await mongoDb.collection(collection.sustainabilityReview).insertOne(newReview);
            if(created){
                console.log('created :', created);
                return {success: true, id: newReview._id};
            } else {
                return {success: false, message: `review: ${userId}, Error Occurred`};
            }
        } catch(err) {
            return {success: false, message: `An Error Occurred`};
        }
    }

    async update (reviewId: string, userUpdate: SustainabilityReviewUpdate) {
        try {
            // todo: add in check that update in by same user as created review
            console.log('reviewId: ', reviewId);
            const mongoDb = await connectDb();
            const update = {
                title: userUpdate.title,
                sections: userUpdate.sections,
                completed: userUpdate.completed,
                deleted: userUpdate.deleted,
                updateAt: new Date()
            }
            console.log('update :', update);
            const updated = await mongoDb.collection(collection.sustainabilityReview).findOneAndUpdate(
                {_id: new ObjectId(reviewId)}, 
                update
            );
            if(updated) {
                console.log('updated: ', updated);
                return {success: true};
            } else {
                return {success: false, message: `Update reviewId: ${reviewId} failed, Error Occurred`};
            }
        } catch(err) {
            return {success: false, message: `An Error Occurred`};
        }
    }

    async getById (reviewId: string) {
        try {
            console.log('reviewId :', reviewId);
            const mongoDb = await connectDb();
            const review = await mongoDb.collection(collection.sustainabilityReview).findOne({_id: new ObjectId(reviewId)});
            if(review){
                console.log('review: ', review);
                return {success: true, sustainabilityReview: review};
            } else {
                return {success: false, message: `reviewId: ${reviewId}, Error Occurred`};
            }
        } catch(err) {
            return {success: false, message: `An Error Occurred`};
        }
    }

    async getReviewByUser (userId: string) {
        try {
            console.log('userId :', userId);
            const mongoDb = await connectDb();
            const reviews = await mongoDb.collection(collection.sustainabilityReview).find({createdBy: new ObjectId(userId)});
            if(reviews){
                console.log('reviews: ', reviews);
                return {success: true, reviews};
            } else {
                return {success: false, message: `getReviewByUser userId: ${userId}, Error Occurred`};
            }
        } catch(err) {
            return {success: false, message: `An Error Occurred`};
        }
    }
}