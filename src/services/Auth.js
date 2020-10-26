import {Client} from "../Client.js";
import { SoSaError } from "../entities/SoSaError.js";
import {Request} from "../core/Request.js";

export class AuthService {

	/** @type {Client} */
	client = null;
    provider = null;
    
    constructor(client) {
        this.client = client;
        this.provider = client.getProvider('auth');
    }

    handleAuthRequest = (namespace, call, data) => {
        const { client : { sessionHandler: { getDevice, updateDevice } } } = this;
        
        return new Request(this.provider, namespace, call, data, call === 'validate' ? 'GET' : 'POST', true)
            .run()
            .then((json) => {
                const { error } = json;
                if(error) throw new SoSaError(error.message);
                
                const { response: { device_id } } = json;
                if(typeof(device_id) === 'string'){
                    return getDevice().then(deviceInstance => {
                        deviceInstance.id = device_id;
                        return updateDevice(deviceInstance).then(() => json);
                    }).then(({response})=> response);
                }else{
                    return json.response;
                }
            });
    };

	login = (username, password) => {
		return this.handleLoginRegister(username, password);
	};

	register = (username, password, email) => {
        if(!email) throw new SoSaError('provide_email');
        return this.handleLoginRegister(username, password, email);
	};

	handleLoginRegister = (username, password, email) => {
        
        if(!username) throw new SoSaError('provide_username');
        if(!password) throw new SoSaError('provide_password');
        
        const { client : { sessionHandler: { getDevice } } } = this;
        
        return getDevice().then(deviceInstance => {
            let call = 'login';
            
            let data = {
                username: username,
                password: password,
                device_secret: deviceInstance.secret,
                device_name: deviceInstance.name,
                device_platform: deviceInstance.platform
            };
    
            if(email){
                call = 'register';
                data.email = email;
                data.login = true;
            }
            
            return this.handleAuthRequest('', call, data);
        });
	};

	deviceLogin = (deviceId) => {
        const { client : { sessionHandler: { generateJWT } } } = this;
	    let data = {device_id: deviceId};
	    
        return generateJWT(data).then(token => {
            data.token = token;
            return this.handleAuthRequest('device', 'login', data);
        })
	};
    
    validateSession = () => {
        return this.handleAuthRequest( '', 'validate', {});
    };
    
    logout = () => {
        const { client : { sessionHandler: { updateSession } } } = this;
        
        return new Request(this.provider, '', 'logout', false, 'POST', true)
            .run()
            .then((json) => {
                if(json.error) throw new SoSaError(json.error.message);
                return updateSession(null).then(() => true);
            });
    }

	createPreauth = () => {
        const { client : { sessionHandler: { getDevice } } } = this;
        
        return getDevice().then(deviceInstance => {
            let data = {
                device_secret: deviceInstance.secret,
                device_name: deviceInstance.name,
                device_platform: deviceInstance.platform
            };
            return new Request(this.provider, 'preauth', 'create', data)
                .run()
                .then(json => {
                    const {error} = json;
                    if(error) throw new SoSaError(error.message);
                    
                    return json?.response;
                });
        });
	};
    
    linkPreauth = (preauthId, linkToken) => {
        const { client : { sessionHandler: { generateJWT } } } = this;
        
        return generateJWT({link_token: linkToken}).then(token => {
            return new Request(this.provider, 'login', 'link', { preauth_id: preauthId, token: token })
                .run()
                .then(({response})=> response);
        });
    };

	confirmWelcome = (username, email) => {
        
        return new Request(this.provider, 'login', 'welcome', {username, email}, 'POST', true)
            .run()
            .then(json => {
                if(Array.isArray(json?.errors)){
                    throw json?.errors.map((error) => SoSaError.fromJSON(error));
                }
                return json?.response;
            });
	}
}
