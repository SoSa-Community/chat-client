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
        const handler = this;

        client.addSocketEventHandler('_error', (eventData) => handler.error(eventData, this, client));
        client.addSocketEventHandler('_success', (eventData) => handler.success(eventData, this, client));

        client.addSocketEventHandler('connect', (socket) => handler.connect(this, client));
        client.addSocketEventHandler('disconnect', (reason) => handler.disconnect(reason, this, client));

        client.addSocketEventHandler('message', (eventData) => handler.message(eventData, this, client));
    }

    connect(socket, client) {
        console.debug('Connected');
    }

    success(msg, socket, client){
        console.debug('Success:', msg);
    }

    error(msg, socket, client){
        console.debug('Error: ', msg);
    }

    disconnect(reason, socket, client) {
        console.debug('Disconnected because: ', reason);
    }

    message(msg, socket, client) {
        console.debug('Message received: ', msg);
        const message = new this.MessageRenderer(msg);
        message.render();

        return message;
    }
}
