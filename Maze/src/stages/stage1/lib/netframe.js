import rpcController from '../shared/controller/controller';
import serverController from '../server/server-controller';
import clientController from '../client/client-controller'
import model from "../shared/model/model";
import {Events} from 'monsterr'
import {NetworkIdentity} from "./entity";

/**---------------------------------------------------------------
| Server variables
----------------------------------------------------------------*/
let server;
let entityCounter = 0;
let timestamp = 0;
let intervalId = -1;
let rpcBuffer = [];

// Callbacks
let updateCallbacks = [];
let clientConnectCallbacks = [];
let entityRemovedCallbacks = [];
let createEntityCallbacks = [];
let updateEntityCallbacks = [];

/**---------------------------------------------------------------
 | Client variables
 ----------------------------------------------------------------*/
let client;
let clientId = -1;
let endStageCallbacks = [];

/**---------------------------------------------------------------
 | Shared variables
 ----------------------------------------------------------------*/

let networkIdentities = [];
let entities = new Map();
let logging = true;
let modelMap = new Map(); //<compiled class name, real class name>

/**---------------------------------------------------------------
 | public server function
 ----------------------------------------------------------------*/
function initServer(serverInstance){
    server = serverInstance;

    entityCounter = 0;
    intervalId = -1;
    timestamp = 0;
    clientId = -1;
    entities = new Map();
    networkIdentities = [];

    generateModelMap();
}

function startLoop(ms){
    if(intervalId === -1) {
        setInterval(update, ms);
        intervalId = -1;
    }
}

function stopLoop(){
    if(intervalId !== -1) {
        clearInterval(intervalId);
    }
}

function createNewEntityId(){
    return ++entityCounter;
}

function makeRPC(rpc, params, clientId){
    let data = {rpc: rpc, params: params};
    log('Sending RPC to all clients with data: ' + JSON.stringify(data));

    log('data package size:' + memorySizeOf(data));

    rpcBuffer.push({clientId: clientId, data: data});
}

function resolveRPCbuffer(){
    rpcBuffer.forEach(rpc => {
        if(rpc.clientId){
            server.send('executeRPC', rpc.data).toClient(rpc.clientId);
        }else{
            server.send('executeRPC', rpc.data).toAll();
        }
    });
    rpcBuffer.length = 0;
}

function clearStateChanges(){
    let changedEntities = publicVars.stateChanges;

    for(let entityIndex in changedEntities){
        changedEntities[entityIndex].clearDirty();
    }

    publicVars.stateChanges = [];
    log('Cleared stateChanges - length: ' + publicVars.stateChanges.length);
}

function addUpdateCallback(callback){
    updateCallbacks.push(callback);
}

function removeUpdateCallback(callback){
    let index = updateCallbacks.indexOf(callback);
    updateCallbacks.splice(index, 1);
}

function addClientConnectedCallback(callback){
    if(!clientConnectCallbacks.some(x => {return x === callback} )){
        clientConnectCallbacks.push(callback);
    }

}

function removeClientConnectedCallback(callback){
    let index = clientConnectCallbacks.indexOf(callback);
    clientConnectCallbacks.splice(index, 1);
}




const serverInterface = {
    init: initServer,
    startLoop: startLoop,
    stopLoop: stopLoop,
    makeRPC: makeRPC,
    clearStateChanges: clearStateChanges,
    addClientConnectedCallback: addClientConnectedCallback,
    addUpdateCallback: addUpdateCallback,
    removeClientConnectedCallback: removeClientConnectedCallback,
    removeUpdateCallback: removeUpdateCallback,
    createNewEntityId: createNewEntityId,
}

/**---------------------------------------------------------------
 | private server functions
 ----------------------------------------------------------------*/
function executeCmdOnEntity(client, data){
    log('Executing command on server with data: ' + JSON.stringify(data));

    // Get entity
    let entity = getEntity(data.entityId);
    if(!entity) {
        log('Did not find entity!');
        return;
    }

    // Validate ownership
    if(client !== entity.owner) {
        log('Client not owner of entity!');
        return;
    }

    if(!serverController.commands.hasOwnProperty(data.command)){
        log('ERROR - Command not found!');
        return;
    }
    serverController.commands[data.command](entity, ...data.params);
}

function clientConnected(client){
    log('clientConnected() called on server-controller with client: ' + client);

    server.send('setClientId', {clientId: client}).toClient(client);

    //Check if client was already connected, else create network ID
    let networkIdentity = networkIdentities.find(networkIdentity => networkIdentity.clientId === client);
    if(networkIdentity){
        //Client exists so we feed him game state
        log('Existing client.');
        //send him networkIdentities
        networkIdentities.forEach(networkIdentity => server.send('createNetworkIdentity', {networkIdentity: networkIdentity}).toClient(client));

        sendGameStateToClient(client, getSerializedGameState());
    }else{
        // Client needs new network identity
        log('New client');
        createNetworkIdentity(client)
    }
}

function createNetworkIdentity(client){
    let randomName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);

    log('Creating network identity...');
    // Create entity
    let identityId = getNetworkIdentities().length;
    //let networkIdentity = rpcController.RpcCreateNetworkIdentity(identityId, client, randomName, rpcController.getNetworkIdentityColors()[identityId]);
    let networkIdentity = RpcCreateNetworkIdentity(identityId, client, randomName, rpcController.getNetworkIdentityColors()[identityId]);

    server.send('createNetworkIdentity', {networkIdentity: networkIdentity}).toAll();

    clientConnectCallbacks.forEach(callback => {callback(client, networkIdentity)});
}

function update(){
    timestamp++;

    //resolve all changes by updating clients
    if(Object.keys(publicVars.stateChanges).length > 0){
        log('New state changes found: ' + JSON.stringify(publicVars.stateChanges));

        //let serializedStateChanges = publicVars.stateChanges.map(x => getSerializedEntity(x));
        //let serializedStateChanges = JSON.stringify(publicVars.stateChanges);
        //log('StateChanges JSON: ' + serializedStateChanges);
        let data = {gameState: publicVars.stateChanges};
        publicVars.stateHistory.push(data);
        log('data package size:' + memorySizeOf(data));
        server.send('newStateUpdate', data).toAll();

        //clearStateChanges();
    }

    if(rpcBuffer.length > 0){
        resolveRPCbuffer();
    }

    //invoke server updateloop
    updateCallbacks.forEach(callback => {callback()});

    publicVars.stateChanges = {};
}

function getSerializedGameState(){
    log('Serializing game state...');

    let gameState = [];
    for(let entity of entities.values()){
        gameState.push(getSerializedEntity(entity));
    }
    log('Finished serializing game state:\n' + JSON.stringify(gameState));
    return gameState;
}

function getSerializedEntity(entity){
    log('Serializing entity: ' + JSON.stringify(entity));
    let entityJSON = JSON.parse(JSON.stringify(entity));
    log(entity.constructor);
    let className =  modelMap.get(entity.constructor);
    log('className: ' + JSON.stringify(className));
    entityJSON["_class"] = className;
    log('Finished serializing entity: ' + JSON.stringify(entityJSON));
    return entityJSON;
}

function sendGameStateToClient(client, gameState){
    log('sendGameStateToClient() called with client: ' + client + ' and gameState:\n' + JSON.stringify(gameState));
    server.send('newGameState', {gameState: gameState}).toClient(client);
}

/**---------------------------------------------------------------
 | public client functions
 ----------------------------------------------------------------*/

function initClient(clientRef){
    client = clientRef;
    generateModelMap();
    getClient().send('ClientConnected');
}

function getClient(){
    return client;
}

function getClientId(){
    log('Getting clientId : ' + clientId);
    return clientId;
}

// Call RPC function on clients
function executeRpc(data){
    log('Executing RPC on client with data: ' + JSON.stringify(data));
    if(!clientController.rpcs.hasOwnProperty(data.rpc)){
        log('RPC not found.');
        return;
    }
    clientController.rpcs[data.rpc](...data.params);
}

function addCreateEntityCallback(callback){
    createEntityCallbacks.push(callback);
}

function removeCreateEntityCallback(callback){
    let index = createEntityCallbacks.indexOf(callback);
    createEntityCallbacks.splice(index, 1);
}

function addUpdateEntityCallback(callback){
    updateEntityCallbacks.push(callback);
}

function removeUpdateEntityCallback(callback){
    let index = updateEntityCallbacks.indexOf(callback);
    updateEntityCallbacks.splice(index, 1);
}

function updateGameState(stateChanges){
    log('Reconstructing game state...');

    for (let idString in stateChanges) {
        let id = parseInt(idString);
        let prop = stateChanges[id];
        log(id + ' = ' + JSON.stringify(prop));

        //Check if the entity already exists
        let entity = getEntity(id);

        if(!entity){
            log('Creating entity data...');
            entity = {id: id};
            entity = assignClassProtoType(entity, prop['_class']);
        }

        log('Assigning all changed properties to the entity');
        // Assign all changed properties to the entity
        for (let stateChange in prop) {
            if(stateChange === '_class') continue;

            log('finding prop of propString: ' + stateChange + ', and settings its value to : ' + prop[stateChange]) ;
            setPath(entity, stateChange, prop[stateChange]);
        }
        log('New values of entity:\n ' + JSON.stringify(entity));
        updateEntity(id, entity);
    }
}

function reconstructGameState(gameState){
    let entities = gameState.map(state => reconstitute(state));

    log('Reconstruction finished. Updating entities...');
    entities.forEach(entity => {
        log('Updating: ' + entity.id);
        updateEntity(entity.id, entity);
    });

}

const setPath = (object, path, value) => path
    .split('.')
    .reduce((o,p) => o[p] = path.split('.').pop() === p ? value : o[p] || {}, object)


function getModelMap(){
    return modelMap;
}

function addEndStageCallback(callback){
    endStageCallbacks.push(callback);
}

function removeEndStageCallback(callback){
    let index = endStageCallbacks.indexOf(callback);
    endStageCallbacks.splice(index, 1);
}

function resetClient(){
    modelMap = new Map();
    entities = new Map();
    networkIdentities = [];
}

function makeCmd(cmd, params, entityId){
    let data = {command: cmd, params: params, entityId: entityId};
    getClient().send('executeCmd', data);
}

const clientInterface = {
    getClient: getClient,
    getClientId: getClientId,
    executeRpc: executeRpc,
    addCreateEntityCallback: addCreateEntityCallback,
    removeCreateEntityCallback: removeCreateEntityCallback,
    addUpdateEntityCallback: addUpdateEntityCallback,
    removeUpdateEntityCallback: removeUpdateEntityCallback,
    getModelMap: getModelMap,
    init: initClient,
    reset: resetClient,
    addEndStageCallback: addEndStageCallback,
    removeEndStageCallback: removeEndStageCallback,
    makeCmd: makeCmd
}

/**---------------------------------------------------------------
 | private client functions
 ----------------------------------------------------------------*/
function setClientId(id){
    log('Setting clientId: ' + id);
    clientId = id;
}

/**
 * Dynamically create an object from a JSON string of properties.
 * Assumes the presence of a _class meta-property that names the
 * resulting class.
 */
function reconstitute(obj) {
    log('reconstituting called on: ' + JSON.stringify(obj));
    let cls = model[obj['_class']];
    log('found class: ' + cls);

    delete obj['_class'];  // remove meta-property
    return Object.setPrototypeOf(obj, cls.prototype);
}

function assignClassProtoType(obj, className){
    let cls = model[className];
    return Object.setPrototypeOf(obj, cls.prototype);
}

/**---------------------------------------------------------------
 | public shared functions
 ----------------------------------------------------------------*/

function shouldLog(bool){
    logging = bool;
}

function log(msg){
    if(logging){
        console.log(msg);
    }
}

function getEntities(){
    return entities;
}

function getEntity(id){
    log('Searching for entity: ' + id + ', current entities: ' + getEntitiesKeys());
    log('Type of ID: ' + (typeof id));
    let entity = entities.get(Math.floor(id));
    if(!entity) log('Failed to find entity!');
    return entity;
}

function getNetworkIdentityFromClientId(clientId){
    log('Called GetNetworkIdentityFromClientId(). Iterating Network identities...');
    for (const identity in networkIdentities){
        log('Checking identity: ' + JSON.stringify(networkIdentities[identity]));
        if(networkIdentities[identity].clientId == clientId){
            log('Found network identity: ' + networkIdentities[identity] + ' from clientId: ' + clientId);
            return networkIdentities[identity];
        }
    }

    log('Failed to find network identity belonging to clientId: ' + clientId);
    return null;
}

function getEntitiesKeys(){
    return Array.from( entities.keys() );
}

function updateEntity(entityId, entity){
    // check if entity already exists - if not we need to create it aka. calling view
    if(entities.has(entityId)){
        //Key exist - Update it
        log('Entity exist.');
        entities.set(entityId, entity);
        updateEntityCallbacks.forEach(callback => {callback(entity)});
    }else{
        //Key does not exist - Create it
        log('Entity does not exist. Adding ID: ' + entityId + ", with entity value: " + JSON.stringify(entity));
        entities.set(entityId, entity);
        createEntityCallbacks.forEach(callback => callback(entity));
    }
}

function getNetworkIdentities(){
    return networkIdentities;
}

function getEntitiesOwnedBy(owner){
    return entities.find(obj => {return obj.owner === owner});
}

function addEntitiesRemovedCallback(callback){
    entityRemovedCallbacks.push(callback);
}

function removeEntitiesRemovedCallback(callback){
    let index = entityRemovedCallbacks.indexOf(callback);
    entityRemovedCallbacks.splice(index, 1);
}

function getClassNameOfEntity(entity){
    return getModelMap().get(entity.constructor);
}

function getModelMap(){
    return modelMap;
}

function addStateChange(obj, path, value){

    if(!publicVars.stateChanges.hasOwnProperty(obj.id)){
        // First time (this cycle) that this entity changes
        publicVars.stateChanges[obj.id] = {}// {_class: getModelMap().get(obj.constructor)}

        //if this is a new entity then pass along the _class
        if(!getEntity(obj.id)){
            publicVars.stateChanges[obj.id]['_class'] =  getModelMap().get(obj.constructor);
        }
    }

    publicVars.stateChanges[obj.id][path] = value;
}

const publicVars = {
    stateChanges: {},
    stateHistory: [],
    fullStateHistory: [],
    timestamp: 0
};

export const sharedInterface = {
    shouldLog: shouldLog,
    log: log,
    getEntities: getEntities,
    getEntity: getEntity,
    getNetworkIdentityFromClientId: getNetworkIdentityFromClientId,
    getEntitiesKeys: getEntitiesKeys,
    updateEntity: updateEntity,
    getNetworkIdentities: getNetworkIdentities,
    getEntitiesOwnedBy: getEntitiesOwnedBy,
    addEntitiesRemovedCallback: addEntitiesRemovedCallback,
    removeEntitiesRemovedCallback: removeEntitiesRemovedCallback,
    getClassNameOfEntity: getClassNameOfEntity,
    getModelMap: getModelMap,
    addStateChange: addStateChange,
    publicVars: publicVars
};

/**---------------------------------------------------------------
 | private shared functions
 ----------------------------------------------------------------*/
// Create a network identity
function RpcCreateNetworkIdentity(identityId, clientId, name, color){
    log('RpcCreateNetworkIdentity called with identityId: ' + identityId + ', clientId: ' + clientId + 'name: ' + name + ', color: ' + color + ' Current network identities: ' + JSON.stringify(networkIdentities));
    let networkIdentity = new NetworkIdentity(identityId, clientId, name, color);
    networkIdentities.push(networkIdentity);
    log('New set of network identities: ' + JSON.stringify(networkIdentities));
    return networkIdentity;
}
function RpcRemoveEntities(entitiesId){
    log('RpcRemoveEntities() called with: ' + entitiesId);

    for(let index in entitiesId){
        let entity = entities.get(entitiesId[index]);

        // Tell server and client listeners that an entity is removed
        entityRemovedCallbacks.forEach(callback => {callback(entity)});

        //Remove entity from Map
        entities.delete(entitiesId[index]);
    }


}
function generateModelMap(){
    log('Generating modelMap...');
    for(let key in model) {
        let value = model[key];
        log('\nKey: ' + key + ', \nValue:' + value);
        modelMap.set(value, key);
    }

    log('Finished generating modelMap: \n');
    for(let [key,value] of modelMap){
        log('Key: ' + key + ', Value: ' + value);
    }
}
function memorySizeOf(obj) {
    let bytes = 0;

    function sizeOf(obj) {
        if(obj !== null && obj !== undefined) {
            switch(typeof obj) {
                case 'number':
                    bytes += 8;
                    break;
                case 'string':
                    bytes += obj.length * 2;
                    break;
                case 'boolean':
                    bytes += 4;
                    break;
                case 'object':
                    var objClass = Object.prototype.toString.call(obj).slice(8, -1);
                    if(objClass === 'Object' || objClass === 'Array') {
                        for(var key in obj) {
                            if(!obj.hasOwnProperty(key)) continue;
                            sizeOf(obj[key]);
                        }
                    } else bytes += obj.toString().length * 2;
                    break;
            }
        }
        return bytes;
    };

    function formatByteSize(bytes) {
        if(bytes < 1024) return bytes + " bytes";
        else if(bytes < 1048576) return(bytes / 1024).toFixed(3) + " KiB";
        else if(bytes < 1073741824) return(bytes / 1048576).toFixed(3) + " MiB";
        else return(bytes / 1073741824).toFixed(3) + " GiB";
    };

    return formatByteSize(sizeOf(obj));
};

/**---------------------------------------------------------------
 | Events
 ----------------------------------------------------------------*/
const serverEvents = {
    'executeCmd': function (server, client, data) {
        log('Received executeCmd event from client: ' + client + ', with data: ' + JSON.stringify(data));
        executeCmdOnEntity(client, data);
    },
    'ClientConnected': function (server, client, data) {
        server.log(data, {'client_id': client});
        log('Received clientConnected event from client with ID: ' + client);
        clientConnected(client);
    },
    [Events.CLIENT_RECONNECTED]: (monsterr, clientId) => {
        log(clientId, 'reconnected! Hello there :-)');

        // Set client state to server stage - this will invoke ClientConnected event on Client
        setTimeout(function(){
            server.send(Events.START_STAGE, server.getCurrentStage().number).toClient(clientId)
        }, 1000);

    },
    [Events.CLIENT_DISCONNECTED]: (monsterr, clientId) => {
        console.log(clientId, 'disconnected! Bye bye...');

        //remove client owned assets

        let entitiesId = [];
        for (let [key, value] of entities.entries()) {
            if(value.owner === clientId) entitiesId.push(key);
        }
        log('Removing entities: ' + entitiesId);
        RpcRemoveEntities(entitiesId);
        server.send('removeEntities', {entitiesId: entitiesId}).toAll();

        //remove network identity
        let networkIdentityIndex = networkIdentities.findIndex(obj => obj.clientId === clientId);
        log('Removing network identity: ' + JSON.stringify(networkIdentities[networkIdentityIndex]));
        networkIdentities.splice(networkIdentityIndex, 1);
    }
};

const clientEvents = {
    'executeRPC': function (client, data) {
        log('Received executeRpc event from server with data: ' + JSON.stringify(data));
        executeRpc(data);
    },
    'createNetworkIdentity': function (client, data) {
        log('Received createNetworkIdentity event from server with data: ' + JSON.stringify(data));
        RpcCreateNetworkIdentity(data.networkIdentity.identityId, data.networkIdentity.clientId, data.networkIdentity.name, data.networkIdentity.color);
    },
    'setClientId': function (client, data) {
        log('Received setClientId event from server with data: ' + JSON.stringify(data));
        setClientId(data.clientId);
    },
    'newStateUpdate': function (client, data) {
        log('Received newStateUpdate event from server with data: ' + JSON.stringify(data));
        updateGameState(data.gameState);
        //applyStateChanges(data.stateChanges);

    },
    'removeEntities': function (client, data) {
        log('Received removeEntities event from server with data: ' + JSON.stringify(data));
        RpcRemoveEntities(data.entitiesId);
    },
    'newGameState': function (client, data) {
        log('Received newGameState event from server with data: ' + JSON.stringify(data));
        reconstructGameState(data.gameState);
    },
    [Events.END_STAGE]: (monsterr, clientId) => {
        log('Stage Ended...');
        endStageCallbacks.forEach(callback => {callback()});
    }


};

const serverCommands = {

};

/**---------------------------------------------------------------
 | interfaces
 ----------------------------------------------------------------*/
// Shared functions are a part of the interface

export const serverSharedInterface = Object.assign(serverInterface, sharedInterface);

export const clientSharedInterface = Object.assign(clientInterface, sharedInterface);

export function getCombinedServerEvents(events){
    return events ? Object.assign(events, serverEvents): serverEvents;
}

export function getCombinedClientEvents(events){
    return events ? Object.assign(events, clientEvents): clientEvents;
}

export function getCombinedServerCommands(commands){
    return commands ? Object.assign(commands, serverCommands): serverCommands;
}


