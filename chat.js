class ChatMessage {
    message = '';

    constructor(message){
        this.message = message;
    }

    render(){
        console.log(this.message);
    }
}

class ChatEventHandlers {
    
    client;

    error(msg, socket, client){
        console.log(msg);
    }

    success(msg, socket, client){
        console.log(msg);
    }

    message(msg, socket, client) {
        const message = new ChatMessage(msg);
        
        message.render();
        return message;
    }

    connect(socket, client) {
        console.debug('Connected');
        client.join('someroom');
    }

    disconnect(socket, client) {
        console.debug('Disconnected');
    }
}

class ChatClient {    
    
    socket = null;
    eventHandlers = null;
    messages = [];

    constructor(eventHandlers){
        if(!(eventHandlers instanceof ChatEventHandlers))   eventHandlers = new ChatEventHandlers(this);
        this.eventHandlers = eventHandlers;
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
        
        this.socket.on('_error', (msg) => {
            client.eventHandlers.error(msg, this, client);
        });

        this.socket.on('_success', (msg) => {
            client.eventHandlers.success(msg, this, client);
        });
        
        this.socket.on('message', (msg) => {
            client.eventHandlers.message(msg, this, client);
        });
        
        this.socket.on('connect', () => {
                client.eventHandlers.connect(this, client);
        });

        this.socket.on('disconnect', (msg) => {
            client.eventHandlers.disconnect(this, client);
        });
    }    

    join(room){
        this.emit('join',{room:room});
        console.debug('Joined room', room);
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

