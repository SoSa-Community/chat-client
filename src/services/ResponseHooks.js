import {ChatClient, SoSaError} from '../../module.js';

export class ResponseHooks {

    client = ChatClient;
    hooks = [];


    /**
     * Creates a new Listeners Object
     *
     * @param {ChatClient} client - Client initiating the class
     */
    constructor(client) {
        this.client = client;
        this.clear();
    }

    trigger(msg){
        if(msg.request && msg.request._id && this.hooks[msg.request._id]){
            let callback = this.hooks[msg.request._id];
            try{
                callback(
                            msg.error ? new SoSaError(msg.error.code, msg.error.message) : null,
                            msg.data ? msg.data : null,
                            msg.request ? msg.request : null,
                            this.client
                );
            }catch(e){
                console.debug('Hook failed', e);
            }
            delete this.hooks[msg.request._id];
        }
    }

    add(messageID, callback){
        console.debug('Adding hook', messageID);
        this.hooks[messageID] = callback;
    }

    clear(){this.hooks = [];}
}
