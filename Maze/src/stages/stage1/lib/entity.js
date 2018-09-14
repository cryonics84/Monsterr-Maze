import rpcController from '../shared/controller/controller';
import prox from "./proxy";
import {sharedInterface as netframe} from "./netframe";

function makePrivVar(obj, name){
    Object.defineProperty(obj, name, {
        enumerable: false,
        writable: true
    });
}

// Base class that all entities inherit from
const Entity = (function() {

    class Entity {

        constructor(entityId, owner){
            makePrivVar(this, 'syncing');
            this.syncing = true;
            makePrivVar(this, 'dirty');
            this.dirty = false;

            this.id = entityId;
            this.owner = owner;

            return new prox(this);
        }


        shouldSync(sync){
            //_privateVariables.get(this).syncing = sync;
            this.syncing = sync;
        }

        isSyncing(){
            //return _privateVariables.get(this).syncing;
            return this.syncing;
        }

        getDirty() {
            //return _privateVariables.get(this).isDirty;
            return this.dirty;
        }

        clearDirty(){
            //_privateVariables.get(this).isDirty = false;
            this.dirty = false;
        }

        stateChanged(){
            if(!this.syncing) return;

            if(!this.dirty){
                this.dirty = true;
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

