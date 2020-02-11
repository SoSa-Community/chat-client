import {Events, Room} from './import.js';

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
        }
    });

}

export class ChatClient {

    socket = null;
    eventHandler = null;
    messages = [];
    connected = false;
    authenticated = false;
    user = {
        session_id: this.generateId(),
        username: null,
        nickname: null,
        token: null
    };

    constructor(){
        this.eventHandler = new Events(this);
    }

    generateRand() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    generateId() {
        return `${this.generateRand()}-${this.generateRand()}-${this.generateRand()}-${this.generateRand()}-${this.generateRand()}`;
    }

    addSocketEventHandler(event, handler){
        this.socket.on(event, handler);
    }

    connect() {
        const client = this;

        this.socket = io(CONFIG.host,{
            query: {api_key: CONFIG.api_key}
        });
        this.eventHandler.setupEventHandlers();
    }

    /**
     * Authenticate with the server before the timeout
     *
     * @param {function(err, data)} callback
     * @param sessionID
     */
    authenticate(callback, sessionID) {
        this.emit('authenticate', {session_id: sessionID}, callback);
    }

    /**
     * Emit's data to the socket
     * @param {string} type - type of emit to create
     * @param {object} data - Data to send
     * @callback {function(err, data, request, socket, client)} hookCallback - callback if the call requires data back (through _error or _success)
     */
    emit(type = 'message', data = {}, hookCallback=null){
        if(this.connected){
            if(typeof(data) !== 'object')   data = {};

            data._id = this.generateId();
            if(hookCallback) this.eventHandler.addHook(data._id, hookCallback);

            console.debug('Emitting', type, data);

            this.socket.emit(type, data);
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
                client.emit('rooms/list', {community_id: communityID}, callback);
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
            join: (callback, communityID, roomID, password, room= new Room(this)) => {
                let data = {community_id: communityID, room_id:roomID};
                if(password && password.length > 0) data.password = password;

                client.emit(
                    'rooms/join',
                     data,
                    (err, data, request, socket, client) => {
                        if(!err) room.parseJSON(data);
                        callback(err, room);
                    }
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
                client.emit(
                    'rooms/online',
                    data,
                    (err, data, request, socket, client) => {
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
             * @param {function(err, data, request, socket, client)} callback - runs when the message is successfully sent. This also triggers on error.
             * @param {string} communityID - Community ID you want to send a message to
             * @param {string} roomID - Room ID you want to send a message to
             * @param {string} message - Message you wish to send
             */
            send: (callback, communityID='', roomID='', message='') => {
                client.emit('rooms/message', {community_id: communityID, room_id:roomID, message:message});
            }
        }
    }

}

