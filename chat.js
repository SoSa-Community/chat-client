class ChatMessageHandler {
    message = '';

    constructor(message){this.message = message;}

    render(){
        console.debug('Message rendered: ', this.message);
    }
}

class ChatEventHandler {
    
    MessageRenderer;

    constructor(MessageHandler) {

        if(MessageHandler === null || MessageHandler === undefined){
            MessageHandler = ChatMessageHandler;
        }
        this.MessageRenderer = MessageHandler;
    }

    connect(socket, client) {
        console.debug('Connected');
        client.join('someroom');
    }

    message(msg, socket, client) {
        console.debug('Message received: ', msg);
        const message = new this.MessageRenderer(msg);
        message.render();

        return message;
    }

    success(msg, socket, client){
        console.debug(msg);
    }

    error(msg, socket, client){
        console.debug(msg);
    }

    disconnect(socket, client) {
        console.debug('Disconnected');
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

        this.eventHandler = new this.EventHandler(this.MessageHandler);
    }

    generateRand() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    generateId() {
        return `${this.generateRand()}-${this.generateRand()}-${this.generateRand()}-${this.generateRand()}-${this.generateRand()}`;
    }

    connect(){
        const client = this;

        this.socket = io(CONFIG.host);

        this.socket.on('_error', (msg) => client._error(msg, this, client));
        this.socket.on('_success', (msg) => client._success(msg, this, client));
        this.socket.on('message', (msg) => client._message(msg, this, client));
        this.socket.on('connect', () => client._connect(this, client));
        this.socket.on('disconnect', () => client._disconnect(this, client));
    }

    _error(msg, socket, client) { client.eventHandler.message(msg, socket, client); }
    _success(msg, socket, client){ client.eventHandler.success(msg, socket, client); }
    _message(msg, socket, client) { client.eventHandler.message(msg, socket, client); }
    _connect(socket, client) { client.eventHandler.connect(socket, client) };
    _disconnect(socket, client) { client.eventHandler.disconnect(socket, client); }

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

