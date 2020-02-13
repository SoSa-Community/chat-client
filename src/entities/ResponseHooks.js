import {ChatClient, Message, Room} from '../../module.js';

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

    trigger(msg, socket, client){
        if(msg.request && msg.request._id && this.hooks[msg.request._id]){
            let callback = this.hooks[msg.request._id];
            delete this.hooks[msg.request._id];

            let errorMessage = '';
            if(msg.error && msg.error.code){
                errorMessage += msg.error.code;

                if(msg.error.message && msg.error.message !== msg.error.code){
                    errorMessage += `: ${msg.error.message}`;
                }
            }

            try{
                callback(
                            errorMessage.length > 0 ? new Error(errorMessage) : null,
                            msg.data ? msg.data : null,
                            msg.request ? msg.request : null,
                            socket,
                            client
                );
            }catch(e){
                console.debug('Hook failed', e);
            }
        }
    }

    add(messageID, callback){
        console.debug('Adding hook', messageID);
        this.hooks[messageID] = callback;
    }

    clear(){this.hooks = [];}
}
