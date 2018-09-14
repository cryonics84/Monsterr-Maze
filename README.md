# Monsterr-Maze

server methods:
netframe.makeRPC('rpcHelloWorld', {someData: myData};

CLIENT SIDE
-----------------------------------------------------------
function init:
- setup with callbacks (createEntity, updateEntity, endStage).
- init netframe

function endStage:
- remove callbacks
- clear view

function createEntity(entity):
- Callback for when an entity is created in the model. Used to update View with new object.
- Do switch (netframe.getClassNameOfEntity(entity)) to check what kind of Class entity belongs to.
Ex:
switch (netframe.getClassNameOfEntity(entity)) {

        case 'Player':
            netframe.log('Entity is PLAYER');
            view.createPlayerView(entity);
            
function updateEntity(entity){
- callback for when an entity is updated in the model. Used to update existing object in view.
Ex:
if(entity instanceof model.MovableObject){
        view.moveEntity(entity);
    }

client can send 'commands' to the server, that then executes it.
Ex:
netframe.makeCmd(command, params, entityId);
- command: the function invoked on server. Ex: 'cmdMovePlayer'
- params: array of parameters to pass to the function. Ex: [direction]
- entityId: entity to perform command on. client has to own it. Ex: controlledEntity

RPC
- Server can execute methods on the client with Remote Procedure Calls (RPC).
- Make object called 'rpcs' on client-controller, and add it to the interface. 
- Include any methods you want the server to be able to call.
Ex:
server.makeRPC(rpc, params, (OPTIONAL) clientId)
- rpc: the function invoked on server: Ex: 'rpcFireCannon
- params: array of parameters to pass to the function.
- clientId: OPTIONAL paramater - send to specific client. If left out, it will send to ALL clients.

