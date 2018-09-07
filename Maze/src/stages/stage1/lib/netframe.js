import rpcController from '../controller/controller';
import serverController from '../server/server-controller';
import clientController from '../client/client-controller'

let server;

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
    let entity = rpcController.GetEntity(data.entityId);
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
}

export const clientEvents = {
    'executeRPC': function (client, data) {
        console.log('Received executeRpc event from server with data: ' + JSON.stringify(data));
        executeRpc(data);

    },
}


