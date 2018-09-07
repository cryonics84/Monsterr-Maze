//Class composition
//https://alligator.io/js/class-composition/

//private methods/variables - stackoveflow post by Son JoungHo
//https://stackoverflow.com/questions/27849064/how-to-implement-private-method-in-es6-class-with-traceur

//Mixins
//http://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/

import compose from "lodash/fp/compose"
//import mix, {Entity} from './classMixer';

import rpcController from '../controller/controller';
import Entity from "../lib/entity";
import {Mixin, mix} from "../lib/mixwith";

let MoveMixin = Mixin((superclass) => class extends superclass{
    canMoveToPosition(destinationTile, velocity){
        console.log('canMoveToPosition() called on object: ' + JSON.stringify(this));

        // Make sure that destination is valid tile
        if(!destinationTile){
            console.log('Cannot move - destination tile invalid!');
            return false;
        }

        //Check that there is no wall
        if(destinationTile.type === 'w'){
            console.log('Cannot move - reason: Wall on path.');
            return false;
        }

        //Check that there are no obstacles
        let tileObject;
        if(destinationTile.objectOnTileId) {
            tileObject = rpcController.GetEntity(destinationTile.objectOnTileId);
        }

        if(tileObject){
            //If there is - check if it's a player - we don't allow player collision
            if(tileObject instanceof Player){
                console.log('Cannot move - reason: object on path.');
                return false;

            }
            //Check if we move onto a box
            else if(tileObject instanceof Box) {
                console.log('We moved into a box - destinationTile.objectOnTileId: ' + destinationTile.objectOnTileId + ', this.id: ' + this.id);

                // Check if box can be moved
                if(!tileObject.move(velocity)){
                    console.log('Cant move - something is blocking box...');
                    return false;
                }
            }
        }

        return true;
    }
    // Returns true if move was successful - false if not
    move( direction){
        console.log('move() called on: ' + this);

        let endPos = {x: this.position.x + direction.x, y: this.position.y + direction.y};

        let tiles = rpcController.GetTiles();
        let originTile = tiles[this.position.y][this.position.x];

        let destinationTile;
        if(tiles[endPos.y] != null){
            destinationTile = tiles[endPos.y][endPos.x];
        }

        if(!this.canMoveToPosition(destinationTile, direction)){
            console.log('Cannot move: ' + JSON.stringify(this));
            return false;
        }else{
            console.log('Can move: ' + JSON.stringify(this));
        }

       //this.moveFromToTile(originTile, destinationTile);

        this.position = {x: endPos.x, y: endPos.y};

        //Update objectOnTileId
        originTile.objectOnTileId = null;
        destinationTile.objectOnTileId = this.id;

        console.log('Move successful - ' + JSON.stringify(this));

        return true;
    }
/*
    moveFromToTile(originTile, destinationTile){
        this.position.x = destinationTile.position.x;
        this.position.y = destinationTile.position.y;

        //Update objectOnTileId
        originTile.objectOnTileId = null;
        destinationTile.objectOnTileId = this;

        console.log('New position of ' + this.name + ' is: ' + JSON.stringify(this.position));
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
        this.position = position; //public

    }
}


let Player = (function(){
    class Player extends MovableObject{

        constructor(entityId, owner, name, health, position) {
            super(entityId, owner, position);
            this.name = name; //public
            this.health = health; //public

            //withGetterSetter(this);
        }

    }
    return Player;
})();

let Box = (function(){
    class Box extends MovableObject{
        constructor(entityId, position){
            super(entityId, null, position);

        }
    }
    return Box;
})();

let Tile = (function(){
    class Tile extends Entity{

        constructor(entityId, type, position){
            super(entityId, null);
            this.type = type;
            this.position = position;
            this.objectOnTileId = null;

        }
    }
    return Tile;
})();

let NetworkIdentity = (function(){
    class NetworkIdentity {

        constructor(identityId, clientId, name, color){
            this.identityId = identityId;
            this.clientId = clientId;
            this.name = name;
            this.color = color;
        }
    }
    return NetworkIdentity;
})();


const IModel = {
    Player: Player,
    Box: Box,
    Tile: Tile,
    MoveMixin: MoveMixin,
    MovableObject: MovableObject,
    NetworkIdentity: NetworkIdentity
}

export default IModel;