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



            this.id = entityId;
            this.owner = owner;
            netframe.addStateChange(this, 'owner', owner);

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

        stateChanged(originObject, targetObj, prop, value){
            if(!this.syncing) return;

            //netframe.log('Property changed: ' + prop + ', of targetObj: ' + JSON.stringify(targetObj) + ', with value ==> ' + targetObj[prop]);

            let propPath = findPropPaths(originObject, (key, path, obj) => key === prop && targetObj[prop] === value && targetObj === obj );
            //netframe.log('Finding path to property: ' + propPath);

            netframe.addStateChange(originObject, propPath, value);

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

function findPropPaths(obj, predicate, targetObj) {  // The function
    const discoveredObjects = []; // For checking for cyclic object
    const path = [];    // The current path being searched
    const results = []; // The array of paths that satify the predicate === true
    if (!obj && (typeof obj !== "object" || Array.isArray(obj))) {
        throw new TypeError("First argument of finPropPath is not the correct type Object");
    }
    if (typeof predicate !== "function") {
        throw new TypeError("Predicate is not a function");
    }
    (function find(obj) {
        for (const key of Object.keys(obj)) {  // use only enumrable own properties.
            if (predicate(key, path, obj) === true) {     // Found a path
                path.push(key);                // push the key
                results.push(path.join("."));  // Add the found path to results
                path.pop();                    // remove the key.
            }
            const o = obj[key];                 // The next object to be searched
            if (o && typeof o === "object" && ! Array.isArray(o)) {   // check for null then type object
                if (! discoveredObjects.find(obj => obj === o)) {  // check for cyclic link
                    path.push(key);
                    discoveredObjects.push(o);
                    find(o);
                    path.pop();
                }
            }
        }
    } (obj));
    return results;
}