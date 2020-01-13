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
