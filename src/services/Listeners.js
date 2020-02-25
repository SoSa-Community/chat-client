import {ChatClient, Message} from '../../module.js';

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
     * @param {function(err, data, request, client)|null} handler - the code to run when we get an _error or _success
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

    connect() {
        console.debug('Connected');

        let client = this.client;

        client.connected = true;
        client.middleware.trigger('connected', {}, (data) => {

            data.session_id = client.user.session_id;
            client.middleware.trigger('before_authenticate', data, (data) => {

                client.authenticate((err, sessionData) => {
                    data.err = err;
                    data.sessionData = sessionData;

                    client.middleware.trigger(
                        'after_authenticate',
                         data,
                        (data) => {

                            if (!data.err) {
                                client.authenticated = true;
                                client.user.username = data.sessionData.username;
                                client.user.nickname = data.sessionData.nickname;
                                client.user.token = data.sessionData.token;

                                client.middleware.trigger('after_authenticated', data, () => {
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

    disconnect(reason) {
        this.client.middleware.trigger('disconnected', reason, (reason) => {
            console.debug('Disconnected because: ', reason);
            this.client.connected = false;
            this.client.hooks.clear();
        });
    }

    message(message) {

        let messageInstance = Message.fromJSON(message);

        this.client.parsers.parse(messageInstance, (messageInstance) => {
            this.client.middleware.trigger('receive_message', messageInstance, (messageInstance) => {
                console.debug('Message', messageInstance);
            });
        });
    }

    _success(packet){
        this.client.middleware.trigger('_success', packet, (packet) => {
            this.client.hooks.trigger(packet);
        });
    }

    _error(packet){
        this.client.middleware.trigger('_error', packet, (packet) => {
            this.client.hooks.trigger(packet);
        });
    }

    error(message){
        this.client.middleware.trigger('error', message, (message) => {
            console.debug(message);
        });
    }

    connectError(message) {
        this.client.middleware.trigger('connection_error', message, (message) => {
            console.debug('Connect Error: ', message);
        });
    }

    connectTimeout(message) {
        this.client.middleware.trigger('connection_timeout', message, (message) => {
            console.debug('Connect timeout: ', message);
        });
    }

    rooms() {
        const client = this.client;
        return {
            join: (userData) => {
                client.middleware.trigger('rooms/join', userData, (user) => {
                    console.debug('User Joined: ', user);
                });
            },
            leave: (userData) => {
                client.middleware.trigger('rooms/leave', userData, (user) => {
                    console.debug('User Left: ', user);
                });
            }
        }

    }



}
