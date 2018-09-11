import model from '../model/model'
import {sharedInterface as netframe} from '../../lib/netframe'

//===============================================================
// Variables
//===============================================================

let tiles = [];
let spawnPoints = [];
let networkIdentityColors = ['red', 'yellow', 'white'];

//===============================================================
// Methods
//===============================================================

function RpcMoveEntity(entity, direction){
    netframe.log('RpcMove() called with id: ' + JSON.stringify(entity) + ' and direction ' + JSON.stringify(direction));
    entity.move(direction);
}

function RpcCreatePlayer(entityId, owner, name, health, position){
    netframe.log('RpcCreatePlayer called with owner: ' + owner + ', name: ' + name + ', health: ' + health + ', position: ' + position);

    let player = new model.Player(entityId, owner, name, health, position);
    netframe.log('Created player: ' + JSON.stringify(player) + ' with ID: ' + player.id);

    // Add entity to map
    netframe.setEntity(player);

    //Change tile status(objectOnTileId)
    tiles[position.y][position.x].objectOnTileId = player.id;

    return player;
}

function RpcCreateBox(entityId, position){
    netframe.log('RpcCreateBox called with entityId: ' + entityId + ', position: ' + position);
    let box = new model.Box(entityId, position);
    netframe.setEntity(box);
    tiles[position.y][position.x].objectOnTileId = box.id;

    return box;
}

function RpcCreateTile(entityId, type, position){
    netframe.log('creating tile: ' + entityId + ', type: ' + type + ', position: ' + JSON.stringify(position));
    //Create tile
    let tile = new model.Tile(entityId, type, position);

    if(tile.type === 'p'){
        spawnPoints.push(tile);
    }

    //Add to entities
    netframe.setEntity(tile);

    // Add to map
    tiles[position.y][position.x] = tile;
}

function GetTiles(){
    return tiles;
}

function GetSpawnPoints(){
    return spawnPoints;
}

function getNetworkIdentityColors(){
    return networkIdentityColors;
}

function GetRandomEmptyTile(){
    let emptyTiles = GetEmptyTiles();
    let randomIndex = Math.floor(Math.random() * emptyTiles.length);
    return emptyTiles[randomIndex];
}

function GetEmptyTiles(){
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
    netframe.log('Getting random free spawn point. Number of total spawnpoints: ' + GetSpawnPoints());
    //find empty spawn points
    let emptySpawnPoints = GetSpawnPoints().filter(function(point){
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

//===============================================================
// Interface
//===============================================================

const Icontroller = {
    RpcMoveEntity: RpcMoveEntity,
    RpcCreatePlayer: RpcCreatePlayer,
    GetTiles: GetTiles,
    GetSpawnPoints: GetSpawnPoints,
    RpcCreateTile: RpcCreateTile,
    getNetworkIdentityColors: getNetworkIdentityColors,
    RpcCreateBox: RpcCreateBox,
    GetRandomEmptyTile: GetRandomEmptyTile,
    getRandomSpawnPoint: getRandomSpawnPoint
};

export default Icontroller;