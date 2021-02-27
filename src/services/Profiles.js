import { Client } from "../Client.js";
import { SoSaError, Request } from "../../index.js";
import { Profile } from "../entities/Profile.js";


export class ProfileService {
    
    /** @type {Client} */
    client = null;
    provider = null;
    
    constructor(client) {
        this.client = client;
        this.provider = client.getProvider('meetups');
    }
    
    get(id) {
        return new Request(this.provider, 'profiles', 'get', {id})
            .run()
            .then(({data}) => {
                const { profile } = data;
                return Profile.fromJSON(profile);
            })
    }

}
