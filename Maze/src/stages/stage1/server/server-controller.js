import model from '../shared/model/model'
import modelController from '../shared/controller/controller'
import {hasMixin} from "../lib/mixwith";
import {serverSharedInterface as netframe} from '../lib/netframe';

//---------------------------------------------------------------
// Variables
//---------------------------------------------------------------

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

//---------------------------------------------------------------
// Commands
//---------------------------------------------------------------

// Command from client
function cmdMovePlayer(entity, direction){
    netframe.log('called movePlayer() on server');

    // Check that entity is capable of moving
    if(!(hasMixin(entity, model.MoveMixin))){
        netframe.log('Entity is not able to move...');
        return;
    }

    entity.move(direction);
}

const commands = {
    'cmdMovePlayer': cmdMovePlayer,
};

//---------------------------------------------------------------
// Core functions
//---------------------------------------------------------------

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
}

// Gets called from netframe after each update
function update(){}

// Gets called from netframe when a client has joined a stage
function clientConnected(client, networkIdentity){
    netframe.log('clientConnected() called on server-controller...');

    // Create player
    createPlayer(client, networkIdentity.name, 90, {x:1,y:2});

    // Spawn a box when at least 2 players have joined TODO
    if(netframe.getNetworkIdentities().length >= 2){
        spawnBox();
    }

}

function entityRemoved(entity){
    netframe.log('entityRemoved() called with: ' + JSON.stringify(entity));

    //Check if moveable object - then we need to remove from tile.objectOnTile

}

//---------------------------------------------------------------
// Controller functions
//---------------------------------------------------------------

function createPlayer(owner, name, health){
    netframe.log('createPlayer() called on server.');
    let randomSpawnPoint = modelController.getRandomSpawnPoint();
    let position = randomSpawnPoint ? {x: randomSpawnPoint.position.x, y: randomSpawnPoint.position.y} : {x:0,y:0};
    let entityId = netframe.createNewEntityId();

    modelController.createPlayer(entityId, owner, name, health, position);
}

function generateTiles(level){
    netframe.log('Generating tiles...');

    for(let y = 0; y < level.length; y++) {
        modelController.getTiles().push([]);
        for(let x = 0; x < level[y].length; x++) {
            modelController.createTile(netframe.createNewEntityId(), level[y][x], {x: x, y: y});
        }
    }
}

function spawnBox(){
    netframe.log('SpawnBox() called on server.');
    let emptyTile = modelController.getRandomSpawnPoint();
    if(!emptyTile) {
        netframe.log('No empty tile found.');
        return;
    }
    let position = {x: emptyTile.position.x, y: emptyTile.position.y};
    let entityId = netframe.createNewEntityId();

    modelController.createBox(entityId, position);
}


//---------------------------------------------------------------

// Server-controller interface - should in most cases contain init(), clientConnected() and Commands{}.
const api = {
    init: init,
    commands: commands
};

export default api;
