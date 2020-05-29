import {Listeners, ResponseHooks, Middleware, MessageParsers, Message, Room} from './module.js';

/**
 * Object.prototype.forEach() polyfill
 * Refactored from https://gomakethings.com/looping-through-objects-with-es6/
 * @author Chris Ferdinandi
 * @author James Mahy
 * @license MIT
 */

if (!Object.prototype.forEach) {
    Object.defineProperty(Object.prototype, 'forEach', {
        value: function (callback, thisArg) {
            if (this == null) throw new TypeError('Not an object');

            for (let key in this) {
                if (this.hasOwnProperty(key)) callback.call(thisArg, this[key], key, this);
            }
        },
        writable: true
    });

}

export class ChatClient {

    config = {
        host: '',
        api_key: ''
    };

    socketIO = null;

    socket = null;
    listeners = new Listeners(this);
    hooks = new ResponseHooks(this);
    middleware = new Middleware(this);
    parsers = new MessageParsers(this);

    connected = false;
    authenticated = false;
    getSession = () => {return null};

    constructor(config, socketIO, getSession){
        this.config = config;
        this.socketIO = socketIO;
        if(typeof(getSession) === 'function'){
            this.getSession = getSession;
        }
    }

    generateRand() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    generateId() {
        return `${this.generateRand()}-${this.generateRand()}-${this.generateRand()}-${this.generateRand()}-${this.generateRand()}`;
    }

    connect() {
        this.socket = this.socketIO(this.config.host,{
            forceNew: true,
            transports: ['websocket'],
            pingTimeout: 30000,
            query: {api_key: this.config.api_key}
        });

        this.listeners.add( {
            'connect': (socket) => this.listeners.connect(),
            'disconnect': (reason) => this.listeners.disconnect(reason),
            'message': (message) => this.listeners.message(message),
            'error': (error) => this.listeners.error(error),
            'connect_error': (error) => this.listeners.connectError(error),
            'connect_timeout': (error) => this.listeners.connectTimeout(error),
            '_error': (errorData) => this.listeners._error(errorData),
            '_success': (errorData) => this.listeners._success(errorData),
            'rooms/join': (userData) => this.listeners.rooms().join(userData),
            'rooms/leave': (userData) => this.listeners.rooms().leave(userData)
        });

    }

    disconnect() {
        this.socket.disconnect();
    }

    /**
     * Authenticate with the server before the timeout
     *
     * @param {function(err, data)} callback
     * @param sessionToken
     */
    authenticate(callback) {
        this.getSession((sessionData) => {
            console.log(sessionData);
            this.emit('authenticate', {session_token: sessionData.token, device_id: sessionData.deviceId}, callback);
        });
    }

    /**
     * Emit's data to the socket
     * @param {string} type - type of emit to create
     * @param {object} data - Data to send
     * @callback {function(err, data, request, socket, client)} hook - callback if the call requires data back (through _error or _success)
     */
    emit(type = 'message', data = {}, hook=null){
        if(this.connected){
            if(typeof(data) !== 'object')   data = {};
            data._id = this.generateId();

            if(hook) this.hooks.add(data._id, hook);

            this.socket.emit(type, data);

            return data._id;
        }else{
            console.debug('Not connected to the server');
        }
    }

    rooms(){
        const client = this;
        return {
            /**
             * Retrieves the list of rooms for the specified community
             * @param {function(err, data, request, socket, client)} callback - what to do when we get the list back
             * @param communityID - Community ID that you want to get the rooms for
             */
            list: (callback, communityID) => {
                return client.emit('rooms/list', {community_id: communityID}, callback);
            },

            /**
             * Joins a room, on success / failure server will emit back to the callback
             *
             * @param {function(err, Room)} callback - this will run when you've successfully joined the room / if there is a response from server (eg bad permissions / password etc)
             * @param {string} communityID - Community ID you want to join a room in
             * @param {string} roomID - Room ID you want to join
             * @param {string} password - password required to join the room
             * @param {Room} room - Room object
             */
            join: (callback, communityID, roomID, password='', room= null) => {
                let data = {community_id: communityID, room_id:roomID};
                if(password && password.length > 0) data.password = password;

                return client.emit(
                    'rooms/join',
                     data,
                    (err, data) => {
                        let userList = [];

                        if(!err){
                            if(!room) room = new Room(this)
                            room.parseJSON(data.room);
                            userList = data.user_list;
                        }
                        callback(err, room, userList);
                    }
                );
            },

            /**
             * leaves a room, on success / failure server will emit back to the callback
             *
             * @param {function(err, Room)} callback - this will run when you've successfully joined the room / if there is a response from server (eg bad permissions / password etc)
             * @param {string} communityID - Community ID you want to leave a room in
             * @param {string} roomID - Room ID you want to leave
             */
            leave: (callback, communityID, roomID) => {
                let data = {community_id: communityID, room_id:roomID};
                return client.emit(
                    'rooms/leave',
                    data,
                    (err, data) => callback(err)
                );
            },

            /**
             * Get's the online users
             *
             * @param {function(err, userList)} callback - this will run when you've successfully joined the room / if there is a response from server (eg bad permissions / password etc)
             * @param {string} communityID - Community ID you want to join a room in
             * @param {string} roomID - Room ID you want to join
             */
            online: (callback, communityID, roomID) => {
                let data = {community_id: communityID, room_id:roomID};
                return client.emit(
                    'rooms/online',
                    data,
                    (err, data, request, client) => {
                        let ret = [];
                        if(!err) ret = data.user_list;

                        callback(err, ret);
                    }
                );
            },

            /**
             * Send a message to the specified room, on success server will emit back to the callback
             * this can be used along side a timer to validate message success
             *
             * @param {function(err, message)} callback - runs when the message is successfully sent. This also triggers on error.
             * @param {string} communityID - Community ID you want to send a message to
             * @param {string} roomID - Room ID you want to send a message to
             * @param {string} message - Message you wish to send
             * @param {string} uuid - a unique ID if you'd like to trace this message
             */
            send: (callback, communityID='', roomID='', message='', uuid='') => {
                if(!uuid) uuid = this.generateId();
                let id = client.emit('rooms/message', {community_id: communityID, room_id:roomID, message:message, uuid:uuid}, (err, message) => {
                    let messageInstance = null;
                    if(message !== null && typeof(message) === 'object'){
                        message._id = id;
                        messageInstance = Message.fromJSON(message);
                    }
                    callback(err, messageInstance);
                });
            }
        }
    }

}

