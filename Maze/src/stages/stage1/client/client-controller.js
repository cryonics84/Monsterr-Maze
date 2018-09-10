import rpcController from '../shared/controller/controller'
import model from "../shared/model/model";
import view from './client-view'
import {hasMixin} from "../lib/mixwith";
import {clientSharedInterface as netframe} from '../lib/netframe'

let client;
let myPlayerID = 20;
const Input = {LEFT: false, RIGHT: false, UP: false, DOWN: false};
const Direction = { LEFT: 0, UP: 1, RIGHT: 2, DOWN: 3};

// List of network entities - <ID, entity>
let entities = new Map();

// List of players
let networkIdentities = new Map();

// 2D array of tiles
let tiles = [];

// List of spawn points
let spawnPoints = [];


const rpcs = {
    rpcCreatePlayer: rpcCreatePlayer,
    rpcSetControlledEntity: rpcSetControlledEntity,
    rpcCreateBox: rpcCreateBox,
    rpcCreateTiles: rpcCreateTiles,
}

function init(c){
    netframe.shouldLog(false);

    client = c;
    netframe.log('Setting client ' + client + ' to ' + c);

    view.init(c);
    setupInputListener();

    ClientConnected();

}


function setupInputListener(){
    //Add input listener
    fabric.util.addListener(document.body, 'keydown', function (options) {
        if (options.repeat) {
            return;
        }
        let key = options.which || options.key; // key detection
        if (key === 37) { // handle Left key
            keyHandle(Direction.LEFT);
            Input.LEFT = true;
        } else if (key === 38) { // handle Up key
            keyHandle(Direction.UP);
            Input.UP = true;
        } else if (key === 39) { // handle Right key
            keyHandle(Direction.RIGHT);
            Input.RIGHT = true;
        } else if (key === 40) { // handle Down key
            keyHandle(Direction.DOWN);
            Input.DOWN = true;
        }
    });
/*
    fabric.util.addListener(document.body, 'keyup', function (options) {
        if (options.repeat) {
            return;
        }
        let key = options.which || options.key; // key detection
        if (key === 37) { // handle Left key
            keyHandle(Direction.LEFT);
            Input.LEFT = false;
        } else if (key === 38) { // handle Up key
            keyHandle(Direction.UP);
            Input.UP = false;
        } else if (key === 39) { // handle Right key
            keyHandle(Direction.RIGHT);
            Input.RIGHT = false;
        } else if (key === 40) { // handle Down key
            keyHandle(Direction.DOWN);
            Input.DOWN = false;
        }

    });*/
}

function keyHandle(directionIndex){
    //let keyNames = Object.keys(Direction);
    //netframe.log("Moving: " + keyNames[directionIndex] + " - value of: " + directionIndex);

    let moveDirection = {};

    if(directionIndex === Direction.LEFT){
        moveDirection.x = -1;
    }else if(directionIndex === Direction.RIGHT){
        moveDirection.x = 1;
    }else {
        moveDirection.x = 0;
    }

    if(directionIndex === Direction.UP){
        moveDirection.y = -1;
    }else if(directionIndex === Direction.DOWN){
        moveDirection.y = 1;
    }else {
        moveDirection.y = 0;
    }

    CmdMove(moveDirection);
}

function ClientConnected(){
    netframe.log('client connected...');
    client.send('ClientConnected');
}

function applyStates(states){
    let changedEntities = rpcController.applyStateChanges(states);

    for(let i in changedEntities){
        if(hasMixin(changedEntities[i], model.MoveMixin)){
            view.updateEntity(changedEntities[i]);
        }
    }

    view.render();

}

function CmdMove(direction){
    netframe.log('sending cmdMove to server.');
    let data = {command: 'cmdMovePlayer', entityId: myPlayerID, params: [direction]};
    client.send('executeCmd', data);
}

function rpcSetControlledEntity(entityId){
    myPlayerID = entityId;
    netframe.log('Setting myPlayerID: ' + myPlayerID);
}


function rpcCreatePlayer(entity){
    netframe.log('addPlayer called with ' + JSON.stringify(entity) + ' with ID: ' + entity.id);
    let player = rpcController.RpcCreatePlayer(entity.id, entity.owner, entity.name, entity.health, entity.position);

    // Set controlled unit
    if(player.owner === netframe.getClientId()) myPlayerID = player.id;

    view.createPlayerView(player);
}

function rpcCreateTiles(entityArr){
    netframe.log('addTile called with tile array: ' + JSON.stringify(entityArr));

    for(let y = 0; y < entityArr.length; y++) {
        rpcController.GetTiles().push([]);

        for (let x = 0; x < entityArr[y].length; x++) {
            rpcController.RpcCreateTile(entityArr[y][x].id, entityArr[y][x].type, entityArr[y][x].position);
        }
    }
    netframe.log('Current entities: ' + netframe.getEntitiesKeys());

    // Make tile view
    view.createTilesView(rpcController.GetTiles());
}

function rpcCreateBox(box){
    rpcController.RpcCreateBox(box.id, box.position);
    view.createBoxView(box);
}


const IclientController = {
    init: init,
    applyStates: applyStates,
    rpcs: rpcs
}


export default IclientController;