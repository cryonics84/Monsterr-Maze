import model from '../shared/model/model'
import rpcController from '../shared/controller/controller'
import {hasMixin} from "../lib/mixwith";
import {serverSharedInterface as netframe} from '../lib/netframe';

//===============================================================
// Variables
//===============================================================

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

//===============================================================
// Commands
//===============================================================

// Command from client
function cmdMovePlayer(entity, direction){
    netframe.log('called movePlayer() on server');

    // Check that entity is capable of moving
    if(!(hasMixin(entity, model.MoveMixin))){
        netframe.log('Entity is not able to move...');
        return;
    }

    rpcController.RpcMoveEntity(entity, direction);
}

const commands = {
    'cmdMovePlayer': cmdMovePlayer,
};

//===============================================================
// Core functions
//===============================================================

function init(serverInstance){

    // Setup and initiate NetFrame
    netframe.shouldLog(true); // stop logging
    netframe.addUpdateCallback(update); // add update callback
    netframe.addClientConnectedCallback(clientConnected); // add client connected callback
    netframe.addEntitiesRemovedCallback(entityRemoved);
    netframe.init(serverInstance); // set server reference
    netframe.startLoop(10); // start server update with X ms interval - stop again with stopLoop()

    //server generates level on startup
    generateTiles(level);
    netframe.clearStateChanges();
}

// Gets called from netframe after each update
function update(){}

// Gets called from netframe when a client has joined a stage
function clientConnected(client, networkIdentity){
    netframe.log('clientConnected() called on server-controller...');

    // Tell clients to make tiles
    netframe.makeRPC('rpcCreateTiles', [rpcController.GetTiles()]);

    // Create player
    createPlayer(client, networkIdentity.name, 90, {x:1,y:2});

    // Spawn a box when at least 2 players have joined TODO
    if(netframe.getNetworkIdentities().length >= 2){
        spawnBox();
    }

}

function entityRemoved(entity){
    console.log('entityRemoved() called with: ' + JSON.stringify(entity));

    //Check if moveable object - then we need to remove from tile.objectOnTile

}

//===============================================================
// Controller functions
//===============================================================

// Interval server function to create a player and tell clients to do the same
function createPlayer(owner, name, health){
    netframe.log('createPlayer() called on server.');
    let randomSpawnPoint = rpcController.getRandomSpawnPoint();
    let position = randomSpawnPoint ? {x: randomSpawnPoint.position.x, y: randomSpawnPoint.position.y} : {x:0,y:0};
    let entityId = netframe.createNewEntityId();

    let player = rpcController.RpcCreatePlayer(entityId, owner, name, health, position);

    netframe.makeRPC('rpcCreatePlayer', [player]);
}

function generateTiles(level){
    netframe.log('Generating tiles...');

    for(let y = 0; y < level.length; y++) {
        rpcController.GetTiles().push([]);
        let levelXarr = level[y];
        for(let x = 0; x < levelXarr.length; x++) {
            //netframe.log("level[" + y + "][" + x + "] = " + levelXarr[x]);
            rpcController.RpcCreateTile(netframe.createNewEntityId(), levelXarr[x], {x: x, y: y});
        }
    }
}

// Interval server function to create a box and tell clients to do the same
function spawnBox(){
    netframe.log('SpawnBox() called on server.');
    let emptyTile = rpcController.getRandomSpawnPoint();
    if(!emptyTile) {
        netframe.log('No empty tile found.');
        return;
    }
    let position = {x: emptyTile.position.x, y: emptyTile.position.y};
    let entityId = netframe.createNewEntityId();

    let box = rpcController.RpcCreateBox(entityId, position);

    netframe.makeRPC('rpcCreateBox', [box]);
}

//===============================================================

// Server-controller interface - should in most cases contain init(), clientConnected() and Commands{}.
const api = {
    clientConnected: clientConnected,
    init: init,
    commands: commands
};

export default api;
