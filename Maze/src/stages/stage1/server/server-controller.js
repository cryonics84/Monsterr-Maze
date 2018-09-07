import model from '../model/model'
import rpcController from '../controller/controller'
import {hasMixin} from "../lib/mixwith";
import * as netframe from '../lib/netframe';

const commands = {
    'cmdMovePlayer': cmdMovePlayer,
}

let server;

// W = wall, E = empty, P = player spawn points
let level = [
    ['w', 'w', 'w', 'e', 'e', 'e', 'e'],
    ['e', 'p', 'e', 'p', 'e', 'e', 'e'],
    ['e', 'w', 'p', 'e', 'e', 'e', 'e'],
    ['e', 'e', 'e', 'w', 'e', 'e', 'e'],
    ['e', 'w', 'w', 'e', 'e', 'e', 'e'],
    ['e', 'e', 'e', 'e', 'p', 'e', 'e'],
    ['e', 'e', 'e', 'e', 'e', 'e', 'e']
];

let entityCounter = 0;

// 2D array of tiles
let tiles = [];

let timestamp = 0;

function init(serverInstance){
    server = serverInstance;
    netframe.init(serverInstance);

    //server generates level on startup - clients generate it when they arrive at the stage
    generateTiles(level);
    clearStateChanges();
    // rpcController.RpcGenerateTiles(level);

    setInterval(update, 10);
}

function update(){
    //resolve all changes by updating clients
    if(rpcController.publicVars.stateChanges.length > 0){
        console.log('New state changes found...');

        //<entity, state>
        let changedEntities = rpcController.publicVars.stateChanges;

        // Make a deep copy of the changed entities - don't use Object.create() = shallow copy
        let data = {timestamp: timestamp, stateChanges: JSON.parse(JSON.stringify(changedEntities))};
        console.log('State data created: ' + JSON.stringify(data));

        rpcController.publicVars.stateHistory.push(data);
        //console.log('State history: ' + JSON.stringify(rpcController.publicVars.stateHistory));

        server.send('NewStateUpdate', data).toAll();

        clearStateChanges();

    }
    timestamp++;
}

function clearStateChanges(){
    let changedEntities = rpcController.publicVars.stateChanges;

    for(let entityIndex in changedEntities){
        changedEntities[entityIndex].clearDirty();
    }

    rpcController.publicVars.stateChanges = [];
    console.log('Cleared stateChanges - length: ' + rpcController.publicVars.stateChanges.length);
}

function clientConnected(client){
    console.log('clientConnected() called on server-controller...');
    netframe.makeRPC('rpcSetClientId', [client]);

    let randomName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);

    console.log('Creating network identity...');
    // Create entity
    let identityId = rpcController.GetNetworkIdentities().length;
    let networkIdentity = rpcController.RpcCreateNetworkIdentity(identityId, client, randomName, rpcController.getNetworkIdentityColors()[identityId]);
    //server.send('SetNetworkIdentity', {networkIdentity: networkIdentity}).toAll();
    netframe.makeRPC('rpcCreateNetworkIdentity', [networkIdentity]);

    console.log('Telling clients to build tiles...');
    // Tell clients to update tiles
    //server.send('SetTiles', {tiles: rpcController.GetTiles()}).toAll();
    netframe.makeRPC('rpcCreateTiles', [rpcController.GetTiles()]);

    console.log('Creating player...');
    // Create player
    createPlayer(server, client, networkIdentity.name, 90, {x:1,y:2});

    if(rpcController.GetNetworkIdentities().length >= 2){
        spawnBox();
    }

}

function cmdMovePlayer(entity, direction){
    console.log('called movePlayer() on server');

    // Check that entity is capable of moving
    if(!(hasMixin(entity, model.MoveMixin))){
        console.log('Entity is not able to move...');
        return;
    }

    rpcController.RpcMoveEntity(entity, direction);
}

function createPlayer(server, owner, name, health){
    console.log('createPlayer() called on server.');
    let randomSpawnPoint = rpcController.getRandomSpawnPoint();
    let position = randomSpawnPoint ? {x: randomSpawnPoint.position.x, y: randomSpawnPoint.position.y} : {x:0,y:0};

    let player = rpcController.RpcCreatePlayer(entityCounter++, owner, name, health, position);

    netframe.makeRPC('rpcCreatePlayer', [player]);
}

function generateTiles(level){
    console.log('Generating tiles...');

    for(let y = 0; y < level.length; y++) {
        rpcController.GetTiles().push([]);
        let levelXarr = level[y];
        for(let x = 0; x < levelXarr.length; x++) {
            //console.log("level[" + y + "][" + x + "] = " + levelXarr[x]);
            rpcController.RpcCreateTile(entityCounter++, levelXarr[x], {x: x, y: y});
        }
    }
    console.log('Finished generated tiles: ' + JSON.stringify(tiles));
}

function spawnBox(){
    console.log('SpawnBox() called on server.');
    let emptyTile = getRandomSpawnPoint();
    if(!emptyTile) {
        console.log('No empty tile found.');
        return;
    }
    let position = {x: emptyTile.position.x, y: emptyTile.position.y};
    let entityId = entityCounter++;

    let box = rpcController.RpcCreateBox(entityId, position);

    netframe.makeRPC('rpcCreateBox', [box]);
}

const Icontroller = {
    clientConnected: clientConnected,
    init: init,
    commands: commands
}

export default Icontroller;
