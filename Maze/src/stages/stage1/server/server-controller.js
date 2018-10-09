import model from '../shared/model/model'
import modelController from '../shared/controller/controller'
import {hasMixin} from "../lib/mixwith";
import {serverSharedInterface as netframe} from '../lib/netframe';

//---------------------------------------------------------------
// Variables
//---------------------------------------------------------------

// W = wall, E = empty, P = player spawn points
let level = [
    ['w', 'w', 'w', 'e', 'e', 'e', 'e', 'e', 'w'],
    ['w', 'e', 'p', 'e', 'p', 'e', 'e', 'e', 'w'],
    ['w', 'e', 'w', 'p', 'e', 'e', 'e', 'e', 'w'],
    ['w', 'e', 'e', 'e', 'w', 'e', 'e', 'e', 'w'],
    ['w', 'e', 'w', 'w', 'e', 'e', 'e', 'e', 'w'],
    ['w', 'e', 'e', 'e', 'e', 'p', 'e', 'e', 'w'],
    ['w', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'w'],
    ['w', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'w'],
    ['w', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'w'],
    ['w', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'w'],
    ['w', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'w'],
    ['w', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'w'],
    ['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w'],
];

//---------------------------------------------------------------
// Commands
//---------------------------------------------------------------

// Command from client
function cmdMovePlayer(entity, direction){
    netframe.log('called movePlayer() on server');

    netframe.log('GameState: ' + modelController.getGameManager().gameState );

    if(modelController.getGameManager().gameState === model.GameState.WAITING){
        netframe.log('Ignoring command. Still in waiting state....');
        return;
    }

    // Check that entity is capable of moving
    if(!(hasMixin(entity, model.MoveMixin))){
        netframe.log('Entity is not able to move...');
        return;
    }

    //modelController.moveEntity(entity, direction);
    netframe.makeRPC('moveEntity', [entity.id, direction]);

}

const commands = {
    'cmdMovePlayer': cmdMovePlayer,
};

//---------------------------------------------------------------
// Core functions
//---------------------------------------------------------------

function init(serverInstance){

    //initiate NetFrame (always do first)
    netframe.init(serverInstance); // initialize NetFrame and set server reference

    //initiate modelController
    modelController.init();

    // Setup
    netframe.shouldLog(true); // stop logging
    netframe.addUpdateCallback(update); // add update callback
    netframe.addClientConnectedCallback(clientConnected); // add client connected callback
    netframe.startLoop(10); // start server update with X ms interval - stop again with stopLoop()

    //make gamemanager
    createGameManager();

    //server generates level on startup
    generateTiles(level);
}

// Gets called from netframe after each update
function update(){}

// Gets called from netframe when a client has joined a stage
function clientConnected(client, networkIdentity){
    netframe.log('clientConnected() callback called on server-controller...');

    // Create player
    createPlayer(client, networkIdentity.name, 90, {x:1,y:2});

    // Spawn a box when at least 2 players have joined and start the game
    if(netframe.getNetworkIdentities().length >= 1 && modelController.getGameManager().gameState === model.GameState.WAITING){
        modelController.getGameManager().gameState = model.GameState.PLAYING;
        spawnBox();
    }

}


//---------------------------------------------------------------
// Controller functions
//---------------------------------------------------------------

function createPlayer(owner, name, health){
    netframe.log('createPlayer() called on server.');
    let randomSpawnPoint = modelController.getRandomSpawnPoint();
    let position = randomSpawnPoint ? {x: randomSpawnPoint.position.x, y: randomSpawnPoint.position.y} : {x:0,y:0};
    let entityId = netframe.createNewEntityId();

    //modelController.createPlayer(entityId, owner, name, health, position);

    netframe.makeRPC('createPlayer', [entityId, owner,name, health, position]);
}

function createGameManager(){
    modelController.createGameManager(netframe.createNewEntityId());
}

function generateTiles(level){
    netframe.log('Generating tiles...');
    netframe.makeRPC('createTiles', [level]);
    /*
    for(let y = 0; y < level.length; y++) {
        modelController.getTiles().push([]);
        for(let x = 0; x < level[y].length; x++) {
            modelController.createTile(netframe.createNewEntityId(), level[y][x], {x: x, y: y});
        }
    }*/
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

    //modelController.createBox(entityId, position);

    netframe.makeRPC('createBox', [entityId, position]);
}


//---------------------------------------------------------------

// Server-controller interface - should in most cases contain init(), clientConnected() and Commands{}.
const api = {
    init: init,
    commands: commands
};

export default api;
