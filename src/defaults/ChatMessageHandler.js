class ChatMessageHandler {
    message = '';

    constructor(message){this.message = message;}

    render(){
        console.debug('Message rendered: ', this.message);
    }
}
