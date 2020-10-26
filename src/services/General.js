import {Client} from "../Client.js";

export class GeneralService {

    /** @type {Client} */
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
