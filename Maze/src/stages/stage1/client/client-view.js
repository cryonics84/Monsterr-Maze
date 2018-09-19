import rpcController from '../shared/controller/controller'
import {clientSharedInterface as netframe} from '../lib/netframe'

function init(){
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

    netframe.getClient().getCanvas().add(tileView);
    entityViewMap.set(tile.id, tileView);
    netframe.log('Finished generated view tiles...');
}

function createPlayerView(player){
    let color = 'purple';
    if(player.owner){
        color = netframe.getNetworkIdentityFromClientId(player.owner).color;
    }
    let playerView = createView('Rect', player, 0.5, color);
    return playerView;
}

function createBoxView(box){
    let boxView = createView('Rect', box, 1, 'grey');
    return boxView;
}


function createBulletView(bullet){
    let bulletView = createView('Rect', bullet, 0.5, 'green');
    return bulletView;
}

function createView(shape, entity, sizeScale, color){

    let entityHalfSize = (tileSize*sizeScale/2);
    let offset = tileSize/2 - entityHalfSize;

    let viewObj = {
        sizeScale: sizeScale,
        left: entity.position.x * tileSize + offset, top: entity.position.y * tileSize + offset,
        fill: color,
        selectable: false,
        hoverCursor: 'cursor'
    };

    let view;
    switch (shape) {
        case 'Rect':
            viewObj.width = sizeScale * tileSize;
            viewObj.height = sizeScale * tileSize;
            view = new fabric.Rect(viewObj);
            break;
        case 'Circle':
            viewObj.radius = sizeScale * tileSize;
            view = new fabric.Circle(viewObj);
            break;
        default:
            netframe.log('Did not recognize shape!');
            break;
    }
    netframe.log('Created View: ' + JSON.stringify(view));
    netframe.getClient().getCanvas().add(view);
    entityViewMap.set(entity.id, view);
    return view;
}

function moveEntity(entity){
    netframe.log('moveEntity() called on clientView with entity: ' + JSON.stringify(entity));
    let entityView = entityViewMap.get(entity.id);

    //let offset = ((tileSize / entityView.sizeScale) * ((1 / entityView.sizeScale)));
    let entityHalfSize = (tileSize*entityView.sizeScale/2);
    let offset = tileSize/2 - entityHalfSize;
    let left = entity.position.x * tileSize +offset ;
    let top = entity.position.y * tileSize +offset;
    netframe.log('Setting entity position to: ' + JSON.stringify({x: left, y: top}));
    entityView.set({left: left, top: top});
    netframe.getClient().getCanvas().renderAll();
}
/*
function updateEntity(entity){
    netframe.log('updateEntity() called on clientView with entity: ' + JSON.stringify(entity));
    let entityView = entityViewMap.get(entity.id);
    entityView.set({left: entity.position.x * tileSize + (tileSize * entityView.sizeScale / 2), top: entity.position.y * tileSize + (tileSize * entityView.sizeScale / 2)});
}
*/
function render(){
    netframe.getClient().getCanvas().renderAll();
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
    render: render,
    reset: reset
}

export default Iview;