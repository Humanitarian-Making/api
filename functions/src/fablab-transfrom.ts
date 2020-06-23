import { Location, LocationType } from './interfaces';

import * as fs from 'fs';
import { ObjectId } from 'mongodb';


fs.readFile('../src/fablabs.json', (err, data) => {
    if (err) throw err;
    const json = JSON.parse(data.toString());
    const newData = JSON.stringify(transform(json));
    fs.writeFileSync('../src/transformed-fablabs.json', newData);
});

export function transform(data: any[]): Location[] {
    return data.filter((location) => {
        if (location.latitude !== null && location.longitude !== null) {
            return location;
        }
    }).map((location) => {
        return  {
            _id: new ObjectId(),
            name: location.name,
            desc: [{language: 'english', text: location.blurb}],
            websiteUrl: location.links[0] && location.links[0].url ? location.links[0].url : null,
            userGroupId: new ObjectId('5ee8bb5161f23128ff469ad0'),
            location: {
                type: LocationType.Point,
                coordinates: [location.longitude, location.latitude]
            }, 
            tags: [],
            created: new Date(),
            createdBy: new ObjectId('5ec15dc77e8279676a6d025b'),
            updated: new Date(),
            updatedBy: new ObjectId('5ec15dc77e8279676a6d025b')
        };
    })
}