import model from '../model/model'
import {sharedInterface as netframe} from '../../lib/netframe'
import view from "../../client/client-view";

//---------------------------------------------------------------
// Variables
//---------------------------------------------------------------

let gameManager;
let spawnPoints = [];
let networkIdentityColors = ['red', 'yellow', 'white', 'pink', 'cyan', 'orange'];

//---------------------------------------------------------------
// create entity functions
//---------------------------------------------------------------

function createPlayer(entityId, owner, name, health, position){
    netframe.log('RpcCreatePlayer called with owner: ' + owner + ', name: ' + name + ', health: ' + health + ', position: ' + position);

    // Create the player entity
    let player = new model.Player(entityId, owner, name, health, position);
    netframe.log('Created player: ' + JSON.stringify(player) + ' with ID: ' + player.id);

    // Add entity to map
    netframe.updateEntity(player.id, player);

    //Change tile status(objectOnTileId)
    setObjectOnTile(position.x, position.y, player);

    // Add player to GameManager
    gameManager.players.push(player.id);

    return player;
}

function setObjectOnTile(x, y, entity){
    netframe.log('setOnObjectOnTile called()');
    let tileId = gameManager.tiles[y][x];
    let tile = netframe.getEntity(tileId);
    tile.objectOnTileId = entity.id;
    netframe.log('Updated tile: ' + JSON.stringify(netframe.getEntity(tileId)));
}

function createBox(entityId, position){
    netframe.log('RpcCreateBox called with entityId: ' + entityId + ', position: ' + position);
    let box = new model.Box(entityId, position);
    netframe.updateEntity(box.id, box);
    setObjectOnTile(position.x, position.y, box);

    return box;
}

function createTile(entityId, type, position){
    netframe.log('creating tile: ' + entityId + ', type: ' + type + ', position: ' + JSON.stringify(position));
    //Create tile
    let tile = new model.Tile(entityId, type, position);

    if(tile.type === 'p'){
        spawnPoints.push(tile);
    }

    //Add to entities
    netframe.updateEntity(tile.id, tile);

    // Add to map
    gameManager.tiles[position.y][position.x] = tile.id;

    tile.spawnView();
}

function createTiles(level){
    netframe.log('createTiles() called');
    for(let y = 0; y < level.length; y++) {
        gameManager.tiles.push([]);
        for(let x = 0; x < level[y].length; x++) {
            createTile(netframe.createNewEntityId(), level[y][x], {x: x, y: y});
        }
    }
}

function moveEntity(entityId, direction){
    netframe.log('moveEntity called() on model Controller');
    let entity = netframe.getEntity(entityId);
    entity.move(direction);
}

function createGameManager(entityId){
    netframe.log('creating game manager: ' + entityId);
    gameManager = new model.GameManager(entityId);
    netframe.log('created : ' + JSON.stringify(gameManager));
    netframe.updateEntity(gameManager.id, gameManager);
}


//---------------------------------------------------------------
// getters and util functions
//---------------------------------------------------------------

function getTiles(){
    return gameManager.tiles;
}

function getTile(x,y){
    let tileId = gameManager.tiles[y][x];
    return netframe.getEntity(tileId);
}

function getSpawnPoints(){
    return spawnPoints;
}

function getNetworkIdentityColors(){
    return networkIdentityColors;
}

function getRandomEmptyTile(){
    let emptyTiles = getEmptyTiles();
    let randomIndex = Math.floor(Math.random() * emptyTiles.length);
    return emptyTiles[randomIndex];
}

function getEmptyTiles(){
    let emptyTiles = [];

    for(let y = 0; y < tiles.length; y++) {
        for (let x = 0; x < tiles[y].length; x++) {

            let tile = tiles[y][x];
            if(tile.type!=='w' && tile.objectOnTileId == null){
                emptyTiles.push(tile);
            }
        }
    }
    return emptyTiles;
}

function getRandomSpawnPoint(){
    netframe.log('Getting random free spawn point. Number of total spawnpoints: ' + getSpawnPoints());
    //find empty spawn points
    let emptySpawnPoints = getSpawnPoints().filter(function(point){
        return !point.objectOnTileId;
    })
    //pick a random spawn point
    if(emptySpawnPoints.length > 0){
        let spawnPoint = emptySpawnPoints[Math.floor(Math.random() * emptySpawnPoints.length)];
        return spawnPoint;
    }else{
        netframe.log('No empty spawn points!');
        return;
    }
}

function getGameManager(){
    return gameManager;
}

function setGameManager(instance){
    gameManager = instance;
}

//---------------------------------------------------------------
// core callback
//---------------------------------------------------------------

function init(){
    netframe.addRemoveEntityCallback(removeEntityCallback);
    netframe.addEndStageCallback(endStageCallback);

    gameManager = new model.GameManager();
    spawnPoints = [];
}

function removeEntityCallback(entity){
    netframe.log('removeEntityCallback() called on modelController with entity id: ' + entity.id);
    if(entity instanceof model.Player){
        gameManager.removePlayer(entity.id);
    }
}

function endStageCallback(){
    netframe.removeRemoveEntityCallback(removeEntityCallback);
}

//---------------------------------------------------------------
// Interface
//---------------------------------------------------------------

export default {
    init: init,
    createPlayer: createPlayer,
    moveEntity: moveEntity,
    getTile: getTile,
    getTiles: getTiles,
    getSpawnPoints: getSpawnPoints,
    createTile: createTile,
    getNetworkIdentityColors: getNetworkIdentityColors,
    createBox: createBox,
    getRandomEmptyTile: getRandomEmptyTile,
    getRandomSpawnPoint: getRandomSpawnPoint,
    createGameManager: createGameManager,
    getGameManager: getGameManager,
    setGameManager: setGameManager,
    createTiles: createTiles
};
