import rpcController from '../shared/controller/controller'
import model from "../shared/model/model";
import view from './client-view'
import {hasMixin} from "../lib/mixwith";
import {clientSharedInterface as netframe} from '../lib/netframe'

let client;
let myPlayerID = 20;
const Input = {LEFT: false, RIGHT: false, UP: false, DOWN: false};
const Direction = { LEFT: 0, UP: 1, RIGHT: 2, DOWN: 3};

const rpcs = {
    rpcCreatePlayer: rpcCreatePlayer,
    rpcSetControlledEntity: rpcSetControlledEntity,
    rpcCreateBox: rpcCreateBox,
    rpcCreateTiles: rpcCreateTiles,
}

function init(c){
    netframe.shouldLog(true);
    netframe.addCreateEntityCallback(createEntity);
    netframe.addUpdateEntityCallback(updateEntity);
    netframe.addEndStageCallback(endStage);
    netframe.init();

    client = c;
    netframe.log('Setting client ' + client + ' to ' + c);

    view.init(c);
    setupInputListener();

    ClientConnected();

}

function endStage(){
    netframe.log('endStage() called..');
    removeInputListener();
    view.reset();
    netframe.removeCreateEntityCallback(createEntity);
    netframe.removeUpdateEntityCallback(updateEntity);
    netframe.removeEndStageCallback(endStage);
    netframe.reset();
}

function removeInputListener(){
    fabric.util.removeListener(document.body, 'keydown', keyDown);
}

function setupInputListener(){
    //Remove any existing listener
    removeInputListener();

    //Add input listener
    fabric.util.addListener(document.body, 'keydown', keyDown);

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

function keyDown(options){
    if (options.repeat) {
        //return;
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

function createEntity(entity){
    netframe.log('createEntity was called on client-controller with entity: ' + JSON.stringify(entity));

    switch (getType(entity)) {

        case 'Player':
            netframe.log('Entity is PLAYER');

            if(entity.owner === netframe.getClientId()) {
                netframe.log('Setting rpcSetControlledEntity...');
                rpcSetControlledEntity(entity.id);
            }

            view.createPlayerView(entity);
            break;
        case 'Tile':
            netframe.log('Entity is TILE');
            if(entity.type === 'w') view.createTileView(entity);
            break;
        case 'Box':
            netframe.log('Entity is BOX');
            view.createBoxView(entity);
            break;
        default:
            netframe.log('Entity is UNKNOWN Class');
            break;
    }
}

function updateEntity(entity){
    netframe.log('updateEntity() called on: ' + JSON.stringify(entity));
    if(entity instanceof model.MovableObject){
        view.moveEntity(entity);
    }
}

function getType(entity){
    return netframe.getModelMap().get(entity.constructor);
}

const IclientController = {
    init: init,
    rpcs: rpcs
}


export default IclientController;