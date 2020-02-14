import {ChatClient} from '../../module.js';

export class Middleware {

    client = ChatClient;
    middleware = [];

    /**
     * Creates a new Listeners Object
     *
     * @param {ChatClient} client - Listeners class initiating the class
     */
    constructor(client) {
        this.client = client;
        this.clear();
    }

    /***
     * Adds middleware to a specified event
     *
     * @param {string} event - What event will the middleware trigger for
     * @param {function(data, client, event)} middleware - Middleware code to run
     * @param {string} signature - Not required, but useful if you need to remove this middleware independently
     */
    add(event, middleware, signature=''){
        console.debug('Adding middleware to event:', event, signature);
        if(!this.middleware[event]) this.middleware[event] = {};

        if(signature.length === 0) signature = this.client.generateId();

        this.middleware[event][signature] = middleware;
    }

    clear(){this.middleware = [];}

    /**
     * Searches
     *
     * @param {string} event - event triggered
     * @param {object} data - sent from the triggering command
     * @param {function(data, socket, client)} callback - Callback after all middleware has run
     */
    trigger(event, data, callback){

        if(event && this.middleware[event]){
            let callbacks = this.middleware[event];
            callbacks.forEach((middleware) => {
                try{
                    data = middleware(data, this.client, event);
                }catch(e){
                    console.debug('Middleware failed', e);
                }
            });
        }
        callback(data, this.client);
    }
}
