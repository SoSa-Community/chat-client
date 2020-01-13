class ChatMessageHandler {
    message = '';

    constructor(message){this.message = message;}

    render(){
        console.debug('Message rendered: ', this.message);
    }
}

class ChatEventHandler {

    MessageRenderer;
    client;

    constructor(MessageHandler, client) {

        if(MessageHandler === null || MessageHandler === undefined){
            MessageHandler = ChatMessageHandler;
        }
        this.MessageRenderer = MessageHandler;
        this.client = client;
    }

    setupEventHandlers(){
        /* to help resolve scope issues with "this" */
        const client = this.client;

        client.addSocketEventHandler('_error', (eventData) => client.eventHandler.error(eventData, this, client));
        client.addSocketEventHandler('_success', (eventData) => client.eventHandler.success(eventData, this, client));

        client.addSocketEventHandler('connect', (socket) => client.eventHandler.connect(this, client));
        client.addSocketEventHandler('disconnect', (reason) => client.eventHandler.disconnect(reason, this, client));

        client.addSocketEventHandler('message', (eventData) => client.eventHandler.message(eventData, this, client));
    }

    connect(socket, client) {
        console.debug('Connected');
        client.join('someroom');
    }

    success(msg, socket, client){
        console.debug(msg);
    }

    error(msg, socket, client){
        console.debug(msg);
    }

    disconnect(reason, socket, client) {
        console.debug('Disconnected because', reason);
    }

    message(msg, socket, client) {
        console.debug('Message received: ', msg);
        const message = new this.MessageRenderer(msg);
        message.render();

        return message;
    }
}

class ChatClient {

    EventHandler = ChatEventHandler;
    MessageHandler = ChatMessageHandler;

    socket = null;
    eventHandler = null;
    messages = [];

    constructor(EventHandler, MessageHandler){

        if(EventHandler !== null && EventHandler !== undefined){
            if(EventHandler.prototype instanceof ChatEventHandler){
                this.EventHandler = EventHandler;
            }else{
                throw "Message Handler must be Instance of ChatEventHandler"
            }

        }
        if(MessageHandler !== null && MessageHandler !== undefined){
            if(MessageHandler.prototype instanceof ChatMessageHandler){
                this.MessageHandler = MessageHandler;
            }else{
                throw "Message Handler must be Instance of ChatMessageHandler"
            }
        }

        this.eventHandler = new this.EventHandler(this.MessageHandler, this);

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

        this.socket = io(CONFIG.host);
        this.eventHandler.setupEventHandlers();
    }

    join(room){
        this.emit('join',{room:room});
        console.debug('Joined Room:', room);
    }

    send(room, message){
        this.emit('message', {room:room, msg:message});
    }

    emit(type = 'message', data = {}){
        if(typeof(data) !== 'object'){
            data = {};
        }

        data._id = this.generateId();
        this.socket.emit(type, data);
    }

}

