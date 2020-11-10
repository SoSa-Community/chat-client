import { SoSaError } from '../../entities/SoSaError.js';
import { Client } from "../../Client.js";

export class CallbackHooks {
    
    provider = null;
    hooks = [];

    /**
     * Creates a new Listeners Object
     *
     * @param {RequestProvider} provider - Client initiating the class
     */
    constructor(provider) {
        this.provider = provider;
        this.clear();
    }

    trigger({request, error, data}){
        const { _id: id } = request;
        
        if(id && typeof(this.hooks[id]) === 'function'){
            try{
                this.hooks[id](
                            error ? new SoSaError(error.code, error.message) : null,
                            data ? data : null,
                            request ? request : null
                );
            }catch(e){
                console.debug('Hook failed', e);
            }
            this.remove(id);
        }
    }

    add(id, callback){
        console.debug('Adding hook', id);
        this.hooks[id] = callback;
        setTimeout(() => {this.remove(id)}, 10000);
    }
    
    remove(id){
        if(typeof(this.hooks[id]) === 'function'){
            delete this.hooks[id];
            console.debug('Hook deleted', id);
        }
    }

    clear(){this.hooks = [];}
}
