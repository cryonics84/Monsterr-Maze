import rpcController from '../shared/controller/controller';
import prox from "./proxy";
import {sharedInterface as netframe} from "./netframe";

// Base class that all entities inherit from
const Entity = (function() {

    //const _privateHello = function() {} //private function
    const _privateVariables = new WeakMap(); //map of private variables

    class Entity {
        constructor(entityId, owner){
            _privateVariables.set(this, {isDirty: false}); //private
            this.id = entityId;
            this.owner = owner;
            this.classConstructor = "test";
            return new prox(this);
        }


        getDirty() {
            return _privateVariables.get(this).isDirty;
        }

        clearDirty(){
            _privateVariables.get(this).isDirty = false;
        }

        stateChanged(){
            if(!_privateVariables.get(this).isDirty){
                _privateVariables.get(this).isDirty = true;
                netframe.publicVars.stateChanges.push(this);
            }
        }
    }
    return Entity;
})();

export class NetworkIdentity {

    constructor(identityId, clientId, name, color){
        this.identityId = identityId;
        this.clientId = clientId;
        this.name = name;
        this.color = color;
        this.state = NetworkStates.JOINED;
    }
}

// JOINED => LOADING
// LOADING => WAITING || PLAYING
// PLAYING => DISCONNECTED || FINISHED
// DISCONNECTED => JOINED
export const NetworkStates = { JOINED: 0, LOADING: 1, WAITING: 2, PLAYING: 3, DISCONNECTED: 4, FINISHED: 5};

export default Entity;