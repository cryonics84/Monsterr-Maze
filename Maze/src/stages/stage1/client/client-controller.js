import model from "../shared/model/model";
import view from './client-view'
import {clientSharedInterface as netframe} from '../lib/netframe'
import modelController from '../shared/controller/controller'

//---------------------------------------------------------------
// Variables
//---------------------------------------------------------------

let controlledEntity = -1;
const Input = {LEFT: false, RIGHT: false, UP: false, DOWN: false};
const Direction = { LEFT: 0, UP: 1, RIGHT: 2, DOWN: 3};

const rpcs = {

}

//---------------------------------------------------------------
// Core functions
//---------------------------------------------------------------
function init(client){
    netframe.shouldLog(true);
    netframe.addCreateEntityCallback(createEntity);
    netframe.addUpdateEntityCallback(updateEntity);
    netframe.addEndStageCallback(endStage);
    netframe.addEntitiesRemovedCallback(removeEntity);
    view.init();
    setupInputListener();

    netframe.init(client);

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

function createEntity(entity){
    netframe.log('createEntity was called on client-controller with entity: ' + JSON.stringify(entity));

    switch (netframe.getClassNameOfEntity(entity)) {

        case 'Player':
            netframe.log('Entity is PLAYER');

            if(entity.owner === netframe.getClientId()) {
                netframe.log('Setting rpcSetControlledEntity...');
                setControlledEntity(entity.id);
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
        case 'GameManager':
            netframe.log('Entity is GameManager');
            modelController.setGameManager(entity);
            view.createGameManagerView(entity);
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
    else if(entity instanceof model.GameManager){
        view.updateGameManagerView(entity);
    }
}

function removeEntity(entity){
    view.removeEntityView(entity);

    netframe.log('Removed entity with class type: ' + netframe.getClassNameOfEntity(entity));
    if(entity instanceof model.Player){
        view.updateGameManagerView(modelController.getGameManager());
    }
}

//---------------------------------------------------------------
// Input
//---------------------------------------------------------------
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

//---------------------------------------------------------------
// client functions
//---------------------------------------------------------------
function setControlledEntity(entityId){
    controlledEntity = entityId;
    netframe.log('Setting myPlayerID: ' + controlledEntity);
}

//---------------------------------------------------------------
// Commands
//---------------------------------------------------------------
function CmdMove(direction){
    netframe.log('sending cmdMove to server.');
    netframe.makeCmd('cmdMovePlayer', [direction], controlledEntity);
}

//---------------------------------------------------------------
// Interface
//---------------------------------------------------------------
export default {
    init: init,
    rpcs: rpcs
}