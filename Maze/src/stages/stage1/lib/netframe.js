import rpcController from '../shared/controller/controller';
import serverController from '../server/server-controller';
import clientController from '../client/client-controller'
import model from "../shared/model/model";
import customClientEvents from "../client/client-events";

//===============================================================
// Server variables
//===============================================================
let server;
let entityCounter = 0;
let updateCallbacks = [];
let clientConnectCallbacks = [];
let timestamp = 0;
let intervalId = -1;

//===============================================================
// Client variables
//===============================================================
let clientId = -1;

//===============================================================
// Shared variables
//===============================================================
const NetworkStates = { ENTERING_STAGE: 0, LOADING_LEVEL: 1, WAITING_TO_PLAY: 2, PLAYING: 3, DISCONNECTED: 4};
let networkIdentities = [];
let entities = new Map();
let logging = true;

//===============================================================
// public Server functions and events
//===============================================================
function init(serverInstance){
    server = serverInstance;
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

    if(clientId){
        server.send('executeRPC', data).toClient(clientId);
    }else{
        server.send('executeRPC', data).toAll();
    }
}

function clearStateChanges(){
    let changedEntities = rpcController.publicVars.stateChanges;

    for(let entityIndex in changedEntities){
        changedEntities[entityIndex].clearDirty();
    }

    rpcController.publicVars.stateChanges = [];
    log('Cleared stateChanges - length: ' + rpcController.publicVars.stateChanges.length);
}

function addUpdateCallback(callback){
    updateCallbacks.push(callback);
}

function removeUpdateCallback(callback){
    let index = updateCallbacks.indexOf(callback);
    updateCallbacks.splice(index, 1);
}

function addClientConnectedCallback(callback){
    clientConnectCallbacks.push(callback);
}

function removeClientConnectedCallback(callback){
    let index = clientConnectCallbacks.indexOf(callback);
    clientConnectCallbacks.splice(index, 1);
}

const serverInterface = {
    init: init,
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
//===============================================================
// private Server functions
//===============================================================
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
    log('clientConnected() called on server-controller...');
    //makeRPC('rpcSetClientId', [client], client);
    server.send('setClientId', {clientId: client}).toClient(client);

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
    if(rpcController.publicVars.stateChanges.length > 0){
        log('New state changes found...');

        //<entity, state>
        let changedEntities = rpcController.publicVars.stateChanges;

        // Make a deep copy of the changed entities - don't use Object.create() = shallow copy
        let data = {timestamp: timestamp, stateChanges: JSON.parse(JSON.stringify(changedEntities))};
        log('State data created: ' + JSON.stringify(data));

        rpcController.publicVars.stateHistory.push(data);
        //log('State history: ' + JSON.stringify(rpcController.publicVars.stateHistory));

        server.send('NewStateUpdate', data).toAll();

        clearStateChanges();
    }

    //invoke server updateloop
    updateCallbacks.forEach(callback => {callback()});
}

//===============================================================
// public Client functions
//===============================================================
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

const clientInterface = {
    getClientId: getClientId,
    executeRpc: executeRpc
}

//===============================================================
// private Client functions
//===============================================================
function setClientId(id){
    log('Setting clientId: ' + id);
    clientId = id;
}

//===============================================================
// public Shared functions
//===============================================================
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
    log('Searching for entity: ' + id);
    let entity = entities.get(id);
    if(entity == null) log('Failed to find entity!');
    return entity;
}

function getNetworkIdentityFromClientId(clientId){
    log('Called GetNetworkIdentityFromClientId(). Iterating Network identities...');
    for (const identity in networkIdentities){
        log('Checking identity: ' + JSON.stringify(networkIdentities[identity]));
        if(networkIdentities[identity].clientId === clientId){
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

function setEntity(entity){
    entities.set(entity.id, entity);
}

function getNetworkIdentities(){
    return networkIdentities;
}

export const sharedInterface = {
    shouldLog: shouldLog,
    log: log,
    getEntities: getEntities,
    getEntity: getEntity,
    getNetworkIdentityFromClientId: getNetworkIdentityFromClientId,
    getEntitiesKeys: getEntitiesKeys,
    setEntity: setEntity,
    getNetworkIdentities: getNetworkIdentities
};

//===============================================================
// private Shared functions
//===============================================================
// Create a network identity
function RpcCreateNetworkIdentity(identityId, clientId, name, color){
    log('RpcCreateNetworkIdentity called with identityId: ' + identityId + ', clientId: ' + clientId + 'name: ' + name + ', color: ' + color + ' Current network identities: ' + JSON.stringify(networkIdentities));
    let networkIdentity = new model.NetworkIdentity(identityId, clientId, name, color);
    networkIdentities.push(networkIdentity);
    log('New set of network identities: ' + JSON.stringify(networkIdentities));
    return networkIdentity;
}

//===============================================================
// Events
//===============================================================
const serverEvents = {
    'executeCmd': function (server, client, data) {
        log('Received executeCmd event from client: ' + client + ', with data: ' + JSON.stringify(data));
        executeCmdOnEntity(client, data);
    },
    'ClientConnected': function (server, client, data) {
        server.log(data, {'client_id': client});
        log('Received clientConnected event from client with ID' + client);
        clientConnected(client);
    },
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
};

//===============================================================
// API
//===============================================================
// Shared functions are a part of the interface

export const serverSharedInterface = Object.assign(serverInterface, sharedInterface);

export const clientSharedInterface = Object.assign(clientInterface, sharedInterface);

export function getCombinedServerEvents(events){
    return events ? Object.assign(events, serverEvents): serverEvents;
}

export function getCombinedClientEvents(events){
    return events ? Object.assign(events, clientEvents): clientEvents;
}


