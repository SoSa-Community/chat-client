export class Request {

	namespace = '';
	call = '';
	method = 'POST';
	payload = null;
	response = null;

	requireAuth = false;
	provider = '';

	constructor(provider, namespace, call, payload, method='POST', requireAuth) {
		this.provider = provider;

		this.id = provider.client.generateUUID();

		this.namespace = namespace;
		this.call = call;
		this.payload = payload;
		this.method = method;
		this.requireAuth = requireAuth;
	}

	run = () => {
	    console.debug('Request', this);
	    const { provider: { client : { sessionHandler: { getSession, updateSession } }, request: handleRequest } } = this;
		
	    return handleRequest(this).then((json) => {
			this.response = json;
			
			if(json && json.response){
                const { response } = json;
                const { session, user } = response || {};
                const { username, nickname } = user || {};
                
                if(session || username || nickname){
                    return getSession().then(sessionInstance => {
                        
                        if(session) sessionInstance.parseJSON(session);
                        
                        if(username) sessionInstance.username = username;
                        if(nickname) sessionInstance.nickname = nickname;
                        
                        return updateSession(sessionInstance).then(() => json).finally(() => json);
                    });
                }
            }
            return json;
		});
	}

}
