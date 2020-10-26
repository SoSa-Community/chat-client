import {RequestProvider} from "../core/RequestProvider.js";
import {SoSaError} from "../entities/SoSaError.js";
import {Listeners} from "../core/Sockets/Listeners.js";
import {CallbackHooks} from "../core/Sockets/CallbackHooks.js";
import {Request} from "../core/Request.js";

export class GeneralProvider extends RequestProvider {
    socket = null;

    connecting = false;
    authenticated = false;

    listeners = new Listeners(this);
    hooks = new CallbackHooks(this);
    
    constructor(client, config) {
        super(client, config);
        this.connect();
    }
    
    request = (request) => {
        let { id, namespace, call, payload, method, requireAuth } = request;
        
        return new Promise((resolve, reject) => {
            console.info('Client::GeneralProvider::request', request);
            this.connect()
                .then(() => {
                    console.info('Client::GeneralProvider::request::connected');
                    let {hooks, socket} = this;
                    if(Object.prototype.toString.call(payload) !== '[object Object]') payload = {};
                    
                    payload._id = id;

                    hooks.add(id, (error, data) => {
                        if(error) reject(error);
                        else resolve({data, request});
                    });

                    let uri = [];
                    if(namespace) uri.push(namespace);
                    if(call) uri.push(call);

                    socket.emit(uri.join('/'), payload);
                });
            });
    };

    connect = () => {
        return new Promise((resolve, reject) => {
            const { socket } = this;
            let { listeners } = this;

            if(socket && socket.connected){
                console.info('Client::GeneralProvider::connect::already_connected');
                resolve();
            }else {
                if(!this.connecting){
                    this.connecting = true;
                    
                    const { client: { socketIO }, config: { host, api_key } } = this;
                    console.info('Client::GeneralProvider::connect', this.config);
                    
                    
                    
                    this.socket = socketIO(host, {
                        forceNew: true,
                        transports: ['websocket'],
                        pingTimeout: 30000,
                        query: { api_key }
                    });
                    
                    listeners.add( {
                        'event': (packet) => {
                            const { client: { middleware }, hooks } = this;
                            const { request: {_id: id} } = packet;
                            const { type } = packet;
        
                            if(id) hooks.trigger(packet);
                            
                            return middleware.trigger(`event`, packet).then((packet) => {
                                console.debug('event', packet);
                            });
                        },
                        'connect': (socket) => {
                            const { client: { middleware } } = this;
                            this.connected = true;
    
                            console.info('Client::GeneralProvider::connect::connected');
    
                            return middleware.trigger('connected', {})
                                .then(data => middleware.trigger('before_authenticate', data))
                                .then(() => this.authenticate())
                                .then(data => {
                                        console.info('Client::GeneralProvider::connect::authenticated');
                                        
                                        this.authenticated = true;
                                        return middleware.trigger('authentication_successful', data);
                                })
                                .catch(error => {
                                    console.info('Client::GeneralProvider::connect::authentication_failed', error);
                                    return middleware.trigger('authentication_failed', error);
                                }).finally(() => {
                                    resolve();
                                });
                        },
                        'disconnect': (reason) => {
                            const { client: { middleware } } = this;
    
                            return middleware.trigger('disconnected', reason).then((reason) => {
                                console.debug('Disconnected because: ', reason);
                                this.connected = false;
                                this.hooks.clear();
                            });
                        },
                        'error': (error) => {
                            const { client: { middleware } } = this;
    
                            return middleware.trigger('error', error).then((error) => {
                                console.debug(error);
                            });
                        },
                        'connect_error': (error) => {
                            const { client: { middleware } } = this;
                            console.debug('Connect timeout: ', error);
                            middleware.trigger('connection_error', error).then((error) => {
                                console.debug('Connect Error: ', error);
                            });
                        },
                        'connect_timeout': (error) => {
                            const { client: { middleware } } = this;
                            console.debug('Connect timeout: ', error);
                            return middleware.trigger('connection_timeout', error).then((error) => {
                                console.debug('Connect timeout: ', error);
                            });
                        }
                    });
                }
            }
        });
    };
   
    disconnect() {
        if(this.socket) this.socket.disconnect();
    }
    /**
     * Authenticate with the server before the timeout
     *
     * @param {function(err, data)} callback
     * @param reauthAttempted
     */
    authenticate(reauthAttempted) {
        const { client: { sessionHandler } }  = this;
        
        return this.getAuthEntities(true, true)
            .then(({device, session, jwt}) => {
                console.info('Client::GeneralProvider::authenticate', device, session, jwt);
                
                if(!device || !session || !jwt) throw new SoSaError('invalid_session');

                let payload = {session_token: jwt};

                if(device.isBot) payload.bot_id = device.id;
                else{
                    payload.device_id = device.id;
                }

                return new Request(this, '','authenticate', payload)
                    .run()
                    .catch((error) => {
                        
                        console.info('Client::GeneralProvider::authenticate::failed', error);
                        
                        if(!reauthAttempted && typeof(sessionHandler) === 'function') {
                            sessionHandler.reauth()
                                .then(() => this.authenticate(true))
                                .catch((error) => {
                                    try{
                                        sessionHandler.authFailed();
                                    }catch(e){
                                        console.debug('Auth failed callback failed', e);
                                    }
                                    throw new Error(error);
                                });
                        }else{
                            throw new Error(error);
                        }
                    });
            });
    };
}
