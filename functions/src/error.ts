import { Firestore, WriteResult } from '@google-cloud/firestore'
const firestore = new Firestore();
const errRef =  firestore.collection('errors');


export class ErrorLog {
    display = false;

    constructor(display: boolean){
        this.display = display;
    }

    log(name: string, err?: Error): void {
        if(this.display){
            console.error(name);
            console.error(err);
        } 
        errRef.doc(Date.now().toString()).set({
            name: name,
            timestamp: new Date().toString(),
            error: err
        })
            .then((res: WriteResult) => {
                console.log(name + 'Error Logged')
            })   
            .catch((e) => {
                console.error(name + 'Error Logging Failed: ' +  e);
            });
    }



 }