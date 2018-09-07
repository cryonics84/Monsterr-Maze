import rpcController from '../controller/controller'

let client;

function init(c){
    client = c;
}

const tileSize = 30;

let entityViewMap = new Map();

function createTilesView(tiles){

    console.log('Generating view tiles...');

    for(let y = 0; y < tiles.length; y++) {

        for(let x = 0; x < tiles[y].length; x++) {

            //check if its a wall
            if(tiles[y][x].type === 'w'){
                let wall = createWall(x,y, tileSize);
                tiles[y][x].gameObject = wall;
                client.getCanvas().add(wall);
            }
        }
    }
    console.log('Finished generated view tiles...');
}

function createWall(x,y,size){
    let wall = new fabric.Rect({
        width: size, height: size,
        left: x*size, top: y*size,
        fill: 'black',
        selectable: false,
        hoverCursor: 'cursor'
    });
    return wall;
}

function createPlayerView(player){
    let color = rpcController.GetNetworkIdentityFromClientId(player.owner).color;

    let playerView = new fabric.Rect({
        width: tileSize, height: tileSize,
        left: player.position.x * tileSize, top: player.position.y * tileSize,
        fill: color,
        selectable: false,
        hoverCursor: 'cursor'
    });
    console.log('Created PlayerView: ' + JSON.stringify(playerView));
    client.getCanvas().add(playerView);

    entityViewMap.set(player.id, playerView);

    return playerView;
}

function moveEntity(entity){
    console.log('moveEntity() called on clientView with entity: ' + JSON.stringify(entity));
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
    console.log('Created boxView: ' + JSON.stringify(boxView));
    client.getCanvas().add(boxView);

    entityViewMap.set(box.id, boxView);

    return boxView;
}

const Iview = {
    init: init,
    createTilesView: createTilesView,
    createPlayerView: createPlayerView,
    createWall: createWall,
    moveEntity: moveEntity,
    createBoxView: createBoxView,
    updateEntity: updateEntity,
    render: render
}

export default Iview;