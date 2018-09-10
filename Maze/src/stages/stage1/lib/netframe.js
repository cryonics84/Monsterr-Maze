import rpcController from '../controller/controller';
import serverController from '../server/server-controller';
import clientController from '../client/client-controller'
import model from "../model/model";

let server;
const NetworkStates = { ENTERING_STAGE: 0, LOADING_LEVEL: 1, WAITING_TO_PLAY: 2, PLAYING: 3, DISCONNECTED: 4};
let networkIdentities = [];
let entities = new Map();

export function init(serverInstance){
    server = serverInstance;
}


export function makeRPC(rpc, params, clientId){
    let data = {rpc: rpc, params: params};
    console.log('Sending RPC to all clients with data: ' + JSON.stringify(data));

    if(clientId){
        server.send('executeRPC', data).toClient(clientId);
    }else{
        server.send('executeRPC', data).toAll();
    }
}

// Call RPC function on clients
export function executeRpc(data){
    console.log('Executing RPC on client with data: ' + JSON.stringify(data));
    if(!clientController.rpcs.hasOwnProperty(data.rpc)){
        console.log('RPC not found.');
        return;
    }
    clientController.rpcs[data.rpc](...data.params);
}

export function executeCmdOnEntity(client, data){
    console.log('Executing command on server with data: ' + JSON.stringify(data));

    // Get entity
    let entity = GetEntity(data.entityId);
    if(!entity) {
        console.log('Did not find entity!');
        return;
    }

    // Validate ownership
    if(client !== entity.owner) {
        console.log('Client not owner of entity!');
        return;
    }

    if(!serverController.commands.hasOwnProperty(data.command)){
        console.log('ERROR - Command not found!');
        return;
    }
    serverController.commands[data.command](entity, ...data.params);
}

export const serverEvents = {
    'executeCmd': function (server, client, data) {
        console.log('Received executeCmd event from client: ' + client + ', with data: ' + JSON.stringify(data));
        executeCmdOnEntity(client, data);
    },
    'ClientConnected': function (server, client, data) {
        server.log(data, {'client_id': client});
        console.log('Received clientConnected event from client with ID' + client);
        clientConnected(client);
    },
}

export const clientEvents = {
    'executeRPC': function (client, data) {
        console.log('Received executeRpc event from server with data: ' + JSON.stringify(data));
        executeRpc(data);
    },
    'createNetworkIdentity': function (client, data) {
        console.log('Received createNetworkIdentity event from server with data: ' + JSON.stringify(data));
        RpcCreateNetworkIdentity(data.networkIdentity.identityId, data.networkIdentity.clientId, data.networkIdentity.name, data.networkIdentity.color);
    },

}

// Create a network identity
function RpcCreateNetworkIdentity(identityId, clientId, name, color){
    console.log('RpcCreateNetworkIdentity called with identityId: ' + identityId + ', clientId: ' + clientId + 'name: ' + name + ', color: ' + color + ' Current network identities: ' + JSON.stringify(networkIdentities));
    let networkIdentity = new model.NetworkIdentity(identityId, clientId, name, color);
    networkIdentities.push(networkIdentity);
    console.log('New set of network identities: ' + JSON.stringify(networkIdentities));
    return networkIdentity;
}

function clientConnected(client){
    console.log('clientConnected() called on server-controller...');
    makeRPC('rpcSetClientId', [client], client);

    let randomName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);

    console.log('Creating network identity...');
    // Create entity
    let identityId = GetNetworkIdentities().length;
    //let networkIdentity = rpcController.RpcCreateNetworkIdentity(identityId, client, randomName, rpcController.getNetworkIdentityColors()[identityId]);
    let networkIdentity = RpcCreateNetworkIdentity(identityId, client, randomName, rpcController.getNetworkIdentityColors()[identityId]);

    server.send('createNetworkIdentity', {networkIdentity: networkIdentity}).toAll();

    serverController.clientConnected(client, networkIdentity);
}

export function getEntities(){
    return entities;
}
export function GetEntity(id){
    console.log('Searching for entity: ' + id);
    let entity = entities.get(id);
    if(entity == null) console.log('Failed to find entity!');
    return entity;
}

export function GetNetworkIdentityFromClientId(clientId){
    console.log('Called GetNetworkIdentityFromClientId(). Iterating Network identities...');
    for (const identity in networkIdentities){
        console.log('Checking identity: ' + JSON.stringify(networkIdentities[identity]));
        if(networkIdentities[identity].clientId === clientId){
            console.log('Found network identity: ' + networkIdentities[identity] + ' from clientId: ' + clientId);
            return networkIdentities[identity];
        }
    }

    console.log('Failed to find network identity belonging to clientId: ' + clientId);
    return null;
}

export function getEntitiesKeys(){
    return Array.from( entities.keys() );
}

export function setEntity(entity){
    entities.set(entity.id, entity);
}

function update(){

}

//Getter
export function GetNetworkIdentities(){
    return networkIdentities;
}


