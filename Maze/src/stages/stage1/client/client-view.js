import modelController from '../shared/controller/controller'
import {clientSharedInterface as netframe} from '../lib/netframe'
import model from "../shared/model/model";

let canvas;
const tileSize = 30;
let entityViewMap = new Map();
let playersTxt;

function init(){
    entityViewMap = new Map();

    model.setCallbackMap(Iview);

    canvas = netframe.getClient().getCanvas();
}


function createTileView(tile){
    if(tile.type !== 'w'){
        return
    }
    createView('Rect', tile, 1, 'black');
    netframe.log('Finished creating tile view object...');
}

function createPlayerView(player){
    let color = 'purple';
    if(player.owner){
        color = netframe.getNetworkIdentityFromClientId(player.owner).color;
    }
    let playerView = createView('Rect', player, 0.5, color);

    //playersTxt.set({text: "Number of players: " + rpcController.getGameManager().getPlayerEntities().length});

    return playerView;
}

function createBoxView(box){
    let boxView = createView('Rect', box, 1, 'grey');
    return boxView;
}

function createGameManagerView(gameManager){
    let content = "Number of players: " + gameManager.players.length;
    let position = {x: 10, y: 10};
    let color = 'red';
    playersTxt = new createText(content, position, color);
    addToCanvas(playersTxt);
}

function updateGameManagerView(){
    netframe.log('updateGameManagerView() called with: ' + JSON.stringify(modelController.getGameManager()));
    playersTxt.set({text: "Number of players: " + modelController.getGameManager().players.length});
}

function createText(content, position, color){
    playersTxt = new fabric.Text(content, {
        fontFamily: 'Comic Sans',
        left: position.x, top: position.y,
        fill: color,
        selectable: false,
        hoverCursor: 'cursor'
    });

    return playersTxt;
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
    addToCanvas(view);
    entityViewMap.set(entity.id, view);
    return view;
}

function addToCanvas(view){
    canvas.add(view);
    if(view.get('type') !== "text"){
        netframe.log('Bringing entity to back...');
        canvas.sendToBack(view);
    }else{
        netframe.log('Bringing text to front...');
        canvas.bringToFront(view);
    }
    canvas.renderAll();
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

function removeEntityView(entity){
    let entityView = entityViewMap.get(entity.id);
    netframe.getClient().getCanvas().remove(entityView);
    entityViewMap.delete(entity.id);

    //update gameManagerView if needed
    if(entity instanceof model.Player){
        updateGameManagerView();
    }
}

const Iview = {
    init: init,
    createPlayerView: createPlayerView,
    createTileView: createTileView,
    moveEntity: moveEntity,
    createBoxView: createBoxView,
    render: render,
    reset: reset,
    removeEntityView: removeEntityView,
    createGameManagerView: createGameManagerView,
    updateGameManagerView: updateGameManagerView
};

export default Iview;