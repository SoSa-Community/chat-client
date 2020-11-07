import {Client} from "../Client.js";
import {Message} from "../entities/Message";
import {Request} from "../core/Request";

export class GeneralService {

    /** @type {Client} */
    client = null;
    
    constructor(client) {
        this.client = client;
        this.provider = client.getProvider('content');
    }
    

    prepareUpload(communityID) {
        return new Request(this.provider, 'content', 'prepareUpload', {community_id: communityID}, 'POST', true).run().then((response) => response.data);
    }

}
