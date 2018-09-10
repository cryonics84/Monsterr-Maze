import model from '../model/model'
import * as netframe from '../lib/netframe'
const publicVars = {
    // We put it in the controller so that the model can access it
// TODO: Model should not be dependent on the controller ! I don't know how to solve this atm.

    stateChanges: [],
    stateHistory: [],
    fullStateHistory: [],
    timestamp: 0
}

const Icontroller = {
    RpcMoveEntity: RpcMoveEntity,
    RpcCreatePlayer: RpcCreatePlayer,
    GetTiles: GetTiles,
    GetSpawnPoints: GetSpawnPoints,
    RpcCreateTile: RpcCreateTile,
    getNetworkIdentityColors: getNetworkIdentityColors,
    RpcCreateBox: RpcCreateBox,
    GetRandomEmptyTile: GetRandomEmptyTile,
    publicVars: publicVars,
    applyStateChanges: applyStateChanges,
    getRandomSpawnPoint: getRandomSpawnPoint
};

// List of network entities - <ID, entity>
//let entities = new Map();

// List of players
//let networkIdentities = [];

// 2D array of tiles
let tiles = [];

// List of spawn points
let spawnPoints = [];

//Only used on client-side
let clientView;

let networkIdentityColors = ['red', 'yellow', 'white'];

function applyStateChanges(stateChanges){
    console.log('Called applyStateChanges on client'); //with stateChanges: ' + JSON.stringify(stateChanges));

    let changedEntities = []

    for(let i in stateChanges){
        console.log('processing: ' + JSON.stringify(stateChanges[i]));

        //Override existing entity with new value
        let existingEntity = netframe.getEntities().get(stateChanges[i].id);
        console.log('Updating existing entity: ' + JSON.stringify(existingEntity));
        existingEntity = Object.assign(existingEntity, stateChanges[i]);
        netframe.setEntity(stateChanges[i].id, existingEntity);

        changedEntities.push(existingEntity);
    }

    return changedEntities;
}

function RpcMoveEntity(entity, direction){
    console.log('RpcMove() called with id: ' + JSON.stringify(entity) + ' and direction ' + JSON.stringify(direction));
    entity.move(direction);
}
/*
function RpcCreateNetworkIdentity(identityId, clientId, name, color){
    console.log('RpcCreateNetworkIdentity called with identityId: ' + identityId + ', clientId: ' + clientId + 'name: ' + name + ', color: ' + color + ' Current network identities: ' + JSON.stringify(networkIdentities));
    let networkIdentity = new model.NetworkIdentity(identityId, clientId, name, color);
    networkIdentities.push(networkIdentity);
    console.log('New set of network identities: ' + JSON.stringify(networkIdentities));
    return networkIdentity;
}
*/
function RpcCreatePlayer(entityId, owner, name, health, position){
    console.log('RpcCreatePlayer called with owner: ' + owner + ', name: ' + name + ', health: ' + health + ', position: ' + position);

    let player = new model.Player(entityId, owner, name, health, position);
    console.log('Created player: ' + JSON.stringify(player) + ' with ID: ' + player.id);

    // Add entity to map
    netframe.setEntity(player);

    //Change tile status(objectOnTileId)
    tiles[position.y][position.x].objectOnTileId = player.id;

    return player;
}

function RpcCreateBox(entityId, position){
    console.log('RpcCreateBox called with entityId: ' + entityId + ', position: ' + position);
    let box = new model.Box(entityId, position);
    netframe.setEntity(box);
    tiles[position.y][position.x].objectOnTileId = box.id;

    return box;
}
/*
function setEntity(entity){
    entities.set(entity.id, entity);
    let keys =[ ...entities.keys() ];
    console.log('New set of entities: ' + keys);
}
*/
function RpcCreateTile(entityId, type, position){
    console.log('creating tile: ' + entityId + ', type: ' + type + ', position: ' + JSON.stringify(position));
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

function GetEntities(){
    return entities;
}

function GetNetworkIdentities(){
    return networkIdentities;
}

function GetTiles(){
    return tiles;
}

function GetSpawnPoints(){
    return spawnPoints;
}

/*
function GetEntity(id){
    console.log('Searching for entity: ' + id);
    let entity = entities.get(id);
    if(entity == null) console.log('Failed to find entity!');
    return entity;
}

function GetNetworkIdentityFromClientId(clientId){
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
*/
/*
function getEntitiesKeys(){
    return Array.from( entities.keys() );
}
*/

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
    console.log('Getting random free spawn point. Number of total spawnpoints: ' + GetSpawnPoints());
    //find empty spawn points
    let emptySpawnPoints = GetSpawnPoints().filter(function(point){
        return !point.objectOnTileId;
    })
    //pick a random spawn point
    if(emptySpawnPoints.length > 0){
        let spawnPoint = emptySpawnPoints[Math.floor(Math.random() * emptySpawnPoints.length)];
        return spawnPoint;
    }else{
        console.log('No empty spawn points!');
        return;
    }
}

export default Icontroller;