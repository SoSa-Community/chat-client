import {ChatClient, Message, Room} from '../../module.js';

export class Listeners {

    /** @type {ChatClient} */
    client = null;
    hooks = [];


    /**
     * Creates a new Listeners Object
     *
     * @param {ChatClient} client - Client initiating the class
     */
    constructor(client) {
        this.client = client;
    }

    /**
     * Adds a listener to the socket
     * @param {string|object} event - Socket Event you want to listen for
     * @param {function(err, data, request, socket, client)|null} handler - the code to run when we get an _error or _success
     */
    add(event, handler=null){
        let add = (event, handler) => {
            console.log('Adding listener for event', event);
            this.client.socket.on(event, handler);
        };

        if(typeof(event) !== 'string'){
            event.forEach((handler, event) => add(event, handler));
        }else{
            add(event, handler);
        }

    }

    connect(socket, client) {
        console.debug('Connected');
        client.connected = true;

        this.client.middleware.trigger('connected', {}, (data) => {

            data.session_id = client.user.session_id;
            this.client.middleware.trigger('before_authenticate', data, (data) => {

                client.authenticate((err, sessionData) => {
                    data.err = err;
                    data.sessionData = sessionData;

                    this.client.middleware.trigger(
                        'after_authenticate',
                         data,
                        (data) => {

                            if (!data.err) {
                                client.authenticated = true;
                                client.user.username = data.sessionData.username;
                                client.user.nickname = data.sessionData.nickname;
                                client.user.token = data.sessionData.token;

                                this.client.middleware.trigger('after_authenticated', data, () => {
                                        console.debug('Authenticated successful, got username:', data.sessionData.username);
                                });
                            }else{
                                console.debug(data.err);
                            }
                        }
                    );
                }, data.session_id);

            });
        });
    }

    disconnect(reason, socket, client) {
        console.debug('Disconnected because: ', reason);
        client.connected = false;
        this.client.hooks.clear();
    }

    message(message, socket, client) {
        this.client.middleware.trigger('receive_message', message, (message) => {
            console.log(message);
        });
    }

    _success(message, socket, client){
        this.client.hooks.trigger(message, socket, client);
    }

    _error(message, socket, client){
        this.client.hooks.trigger(message, socket, client);
    }

    error(message, socket, client){
        console.debug(message);
    }

    connectError(message, socket, client) {
        console.debug('Connect Error: ', message);
    }

    connectTimeout(message, socket, client) {
        console.debug('Connect timeout: ', message);
    }



}
