import rpcController from '../shared/controller/controller'
import {sharedInterface as netframe} from '../lib/netframe'
let client;

function init(c){
    client = c;

    entityViewMap = new Map();
}

const tileSize = 30;

let entityViewMap = new Map();

function createTileView(tile){

    let tileView = new fabric.Rect({
        width: tileSize, height: tileSize,
        left: tile.position.x * tileSize, top: tile.position.y *tileSize,
        fill: 'black',
        selectable: false,
        hoverCursor: 'cursor'
    });

    client.getCanvas().add(tileView);
    entityViewMap.set(tile.id, tileView);
    netframe.log('Finished generated view tiles...');
}

function createPlayerView(player){
    let color = netframe.getNetworkIdentityFromClientId(player.owner).color;

    let playerView = new fabric.Rect({
        width: tileSize, height: tileSize,
        left: player.position.x * tileSize, top: player.position.y * tileSize,
        fill: color,
        selectable: false,
        hoverCursor: 'cursor'
    });
    netframe.log('Created PlayerView: ' + JSON.stringify(playerView));
    client.getCanvas().add(playerView);

    entityViewMap.set(player.id, playerView);

    return playerView;
}

function moveEntity(entity){
    netframe.log('moveEntity() called on clientView with entity: ' + JSON.stringify(entity));
    let entityView = entityViewMap.get(entity.id);
    entityView.set({left: entity.position.x * tileSize, top: entity.position.y * tileSize});
    client.getCanvas().renderAll();
}

function updateEntity(entity){
    let entityView = entityViewMap.get(entity.id);
    entityView.set({left: entity.position.x * tileSize, top: entity.position.y * tileSize});
}

function render(){
    client.getCanvas().renderAll();
}

function createBoxView(box){
    let color = 'grey';

    let boxView = new fabric.Rect({
        width: tileSize, height: tileSize,
        left: box.position.x * tileSize, top: box.position.y * tileSize,
        fill: color,
        selectable: false,
        hoverCursor: 'cursor'
    });
    netframe.log('Created boxView: ' + JSON.stringify(boxView));
    client.getCanvas().add(boxView);

    entityViewMap.set(box.id, boxView);

    return boxView;
}

function reset() {
    entityViewMap = new Map();
}

const Iview = {
    init: init,
    createPlayerView: createPlayerView,
    createTileView: createTileView,
    moveEntity: moveEntity,
    createBoxView: createBoxView,
    updateEntity: updateEntity,
    render: render,
    reset: reset
}

export default Iview;