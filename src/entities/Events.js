import {ChatClient, Message, Room} from '../import.js';

export class Events {

    _client = ChatClient;
    hooks = [];

    /**
     * Creates a new Events Object
     *
     * @param {ChatClient} client - Client initiating the class
     */
    constructor(client) {
        this._client = client;
        this.clearHooks();
    }

    setupEventHandlers(){
        /* to help resolve scope issues with "this" */
        const client = this._client;
        const handler = this;

        client.addSocketEventHandler('_error', (eventData) => handler.error(eventData, this, client));
        client.addSocketEventHandler('_success', (eventData) => handler.success(eventData, this, client));

        client.addSocketEventHandler('connect', (socket) => handler.connect(this, client));
        client.addSocketEventHandler('disconnect', (reason) => handler.disconnect(reason, this, client));

        client.addSocketEventHandler('message', (eventData) => handler.message(eventData, this, client));
    }

    connect(socket, client) {
        console.debug('Connected');
        client.connected = true;
    }

    success(msg, socket, client){
        console.debug('Success:', msg);
        this.triggerHook(msg, socket, client);
    }

    error(msg, socket, client){
        console.debug('Error: ', msg);
        this.triggerHook(msg, socket, client);
    }

    disconnect(reason, socket, client) {
        console.debug('Disconnected because: ', reason);
        client.connected = false;
        this.clearHooks();
    }

    message(msg, socket, client) {
        console.debug('Message received: ', msg);
        const message = new Message(msg);
        message.render();

        return message;
    }

    triggerHook(msg, socket, client){
        console.debug('Trigger hook',msg);

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

    addHook(messageID, callback){
        console.debug('Adding hook', messageID);
        this.hooks[messageID] = callback;
    }

    clearHooks(){
        this.hooks = [];
    }
}
