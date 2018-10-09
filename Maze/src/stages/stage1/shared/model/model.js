//Class composition
//https://alligator.io/js/class-composition/

//private methods/variables - stackoveflow post by Son JoungHo
//https://stackoverflow.com/questions/27849064/how-to-implement-private-method-in-es6-class-with-traceur

//Mixins
//http://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/

import compose from "lodash/fp/compose"
//import mix, {Entity} from './classMixer';

import modelController from '../controller/controller';
import {Entity} from "../../lib/entity";
import {Mixin, mix} from "../../lib/mixwith";
import  {sharedInterface as netframe} from '../../lib/netframe'

let callbacks;

function setCallbackMap(callbackMap){
    callbacks = callbackMap;
}

let MoveMixin = Mixin((superclass) => class extends superclass{
    canMoveToPosition(destinationTile, velocity){
        netframe.log('canMoveToPosition() called on object: ' + JSON.stringify(this));

        // Make sure that destination is valid tile
        if(!destinationTile){
            netframe.log('Cannot move - destination tile invalid!');
            return false;
        }

        //Check that there is no wall
        if(destinationTile.type === 'w'){
            netframe.log('Cannot move - reason: Wall on path.');
            return false;
        }

        //Check that there are no obstacles
        let tileObject;
        if(destinationTile.objectOnTileId) {
            netframe.log('Getting entity on destination tile...');
            tileObject = netframe.getEntity(destinationTile.objectOnTileId);
        }

        if(tileObject){
            netframe.log('Found an entity with id: ' + tileObject.id);
            //If there is - check if it's a player - we don't allow player collision
            if(tileObject instanceof Player){
                netframe.log('Cannot move - reason: Player object on destination tile.');
                return false;

            }
            //Check if we move onto a box
            else if(tileObject instanceof Box) {
                netframe.log('We moved into a box - destinationTile.objectOnTileId: ' + destinationTile.objectOnTileId + ', this.id: ' + this.id);

                // Check if box can be moved
                if(!tileObject.move(velocity)){
                    netframe.log('Cant move - something is blocking box...');
                    return false;
                }
            }
        }

        return true;
    }
    // Returns true if move was successful - false if not
    move( direction){
        netframe.log('move() called on: ' + this.id);

        let endPos = {x: this.position.x + direction.x, y: this.position.y + direction.y};

        let tiles = modelController.getTiles();
        netframe.log('Getting origin tile...');
        let originTile = modelController.getTile(this.position.x, this.position.y);

        let destinationTile;
        if(tiles[endPos.y] != null){
            netframe.log('Getting destination tile...');
            destinationTile = modelController.getTile(endPos.x, endPos.y);
        }

        netframe.log('Checking if it can move...');
        if(!this.canMoveToPosition(destinationTile, direction)){
            netframe.log('Cannot move: ' + JSON.stringify(this));
            return false;
        }else{
            netframe.log('Can move: ' + JSON.stringify(this));
        }

       //this.moveFromToTile(originTile, destinationTile);

        this.position = {x: endPos.x, y: endPos.y};

        //Update objectOnTileId
        originTile.objectOnTileId = null;
        destinationTile.objectOnTileId = this.id;

        netframe.log('Updated origin tile: ' + JSON.stringify(originTile));
        netframe.log('Comparing to entity db: ' + JSON.stringify(netframe.getEntity(originTile.id)));

        netframe.log('Updated destination tile: ' + JSON.stringify(destinationTile));
        netframe.log('Comparing to entity db: ' + JSON.stringify(netframe.getEntity(destinationTile.id)));

        netframe.log('Move successful - ' + JSON.stringify(this));

        return true;
    }
/*
    moveFromToTile(originTile, destinationTile){
        this.position.x = destinationTile.position.x;
        this.position.y = destinationTile.position.y;

        //Update objectOnTileId
        originTile.objectOnTileId = null;
        destinationTile.objectOnTileId = this;

        netframe.log('New position of ' + this.name + ' is: ' + JSON.stringify(this.position));
    }*/
});

const ResetPositionMixin = Mixin((superclass) => class extends superclass{
    resetPosition(){
        this.setProp(this.position, {x: 0, y: 0});
    }
});

/*
let MovableObject =(function(){

    class MovableObject extends mix(Entity).with(MoveMixin){
        constructor(entityId, owner, position){
            super(entityId, owner);
            this.position = position; //public
        }
    }
    return MovableObject;
})();*/

class MovableObject extends mix(Entity).with(MoveMixin){
    constructor(entityId, owner, position){
        super(entityId, owner);
        this._position = position;
    }

    get position(){
        return this._position;
    }

    set position(value){
        this._position = value;
        if(callbacks) callbacks.moveEntity(this);
    }

}

class Player extends MovableObject{

    constructor(entityId, owner, name, health, position) {
        super(entityId, owner, position);
        this.name = name; //public
        this.health = health; //public
    }

    spawnView(){
        netframe.log('spawnView called on Player');
        if(callbacks) callbacks.createPlayerView(this);
    }

    removeView(){
        netframe.log('removeView called on Player');
        if(callbacks) {
            callbacks.removeEntityView(this);
        }
    }
}

class Box extends MovableObject{
    constructor(entityId, position){
        super(entityId, null, position);

    }

    spawnView(){
        if(callbacks) callbacks.createBoxView(this);
    }

    removeView(){
        if(callbacks) {
            callbacks.removeEntityView(this);
        }
    }
}

class Bullet extends MovableObject{
    constructor(entityId, position) {
        super(entityId, null, position);

    }
}

class Tile extends Entity{

    constructor(entityId, type, position){
        super(entityId, null);
        this.type = type;
        this.position = position;
        this.objectOnTileId = null;

    }

    spawnView(){
        if(callbacks) {
            callbacks.createTileView(this);
        }
    }

    removeView(){
        if(callbacks) {
            callbacks.removeEntityView(this);
        }
    }
}

const GameState = { WAITING: 0, PLAYING: 1, GAME_OVER: 2};

class GameManager extends Entity{
    constructor(entityId){
        super(entityId, null);
        this.gameState = GameState.WAITING;
        this.players = [];
        this.tiles = [];
    }

    removePlayer(id){
        this.players.splice( this.players.indexOf(id), 1 );
    }
}


const IModel = {
    Player: Player,
    Box: Box,
    Tile: Tile,
    MoveMixin: MoveMixin,
    MovableObject: MovableObject,
    GameManager: GameManager,
    GameState: GameState,
    setCallbackMap: setCallbackMap
};

export default IModel;