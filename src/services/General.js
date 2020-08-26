import {ChatClient} from '../module.js';


export class GeneralService {

    /** @type {ChatClient} */
    client = null;

    constructor(client) {
        this.client = client;
    }

    prepareUpload(callback, communityID) {
        return client.emit(
            'content/prepareUpload',
            {community_id: communityID},
            callback
        );
    }

}
