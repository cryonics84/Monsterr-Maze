# Monsterr-Maze

SHARED BETWEEN SERVER AND CLIENT
-----------------------------------------------------------
### Entitiy
Parent object that all game objects inherits from.
Simply extend your class from Entity, and NetFrame will offer a set of services such as, an unique identifier, client-ownership and automatic syncing.

```class Tile extends Entity{

    constructor(entityId, type, position){
        super(entityId, null);
    }
}
´´´

#### Entity Methods
- get specific entity with: ```netframe.getEntity(id)```
- get all entities with: ```netframe.getEntities()```
- get entities owned by specific client with: ```getEntitiesOwnedBy(clientId)```
- return class-type name of specific entity with: ```getClassNameOfEntity(entity)```

### Network Identity
- Unique object assigned to each client.
- This can hold game-specific information about the client, such as name, units and connection-status.
- get a client's Network Identity with ```netframe.getNetworkIdentityFromClientId(clientId)```
- get all Network Identities with ```netframe.getNetworkIdentities()```

SERVER SIDE
-----------------------------------------------------------

### RPC
Server can execute methods on the client with Remote Procedure Calls (RPC).
NetFrame syncronizes the gamestate by default, but sometimes you might want to trigger certain events manually.

HOW-TO:
- Make object called 'rpcs' on client-controller, and add it to the interface. 
- Include any methods you want the server to be able to call.
```
server.makeRPC(rpc, params, (OPTIONAL) clientId)
```
- **rpc:** the function name invoked on server: Ex: 'rpcFireCannon
- **params:** array of parameters to pass to the function.
- *OPTIONAL* **clientId:** send to specific client. If left out, it will send to ALL clients.

#### Use case in some card game:
Server does roundStart(). Here it assigns cards to each player and sets GAME_STATE: ROUND 1. 
The client won't know that the round started, only that the Entity containing the game state changed. 
So to notify the client of the event, the server does: ```makeRPC('rpcStartRound');```
The client will then call the method: ```rpcStartRound()``` which could make some animation displaying the cards in the player hand (which was replicated from the server moments ago), as well as displaying the current round number (also replicated from server).


### Server methods

#### function init:
- setup with callbacks (createEntity, updateEntity, endStage).
- init netframe
- start netframe gameloop with ``` netframe.startLoop(ms) ```

#### function update
- Callback that gets called from netframe after each update

#### function clientConnected(client, networkIdentity)
- Callback called when client joined stage.
- Useful for instantiating Entities belonging to a specific player, such as units, cards etc.
- Passes a Network Identity unique for that client. Can be used to store information about that client, such as: Name, connection status, playerNumber.

#### function entityRemoved
- Callback called when entity was removed (ex. after disconnect).

CLIENT SIDE
-----------------------------------------------------------
### COMMANDS
- Client can send 'commands' to the server, that then executes it.
- Make 'commands' object on server, and add to interface.
- Add any methods you want the client to be able to invoke.
```
netframe.makeCmd(command, params, entityId);
```
- **command:** the function invoked on server. Ex: 'cmdMovePlayer'
- **params:** array of parameters to pass to the function. Ex: [direction]
- **entityId:** entity to perform command on. client has to own it. Ex: controlledEntity

### Client methods

#### function init:
- setup with callbacks (createEntity, updateEntity, endStage).
- init netframe

#### function endStage:
- remove callbacks
- clear view

#### function createEntity(entity):
- Callback for when an entity is created in the model. Used to update View with new object.
- Do switch (netframe.getClassNameOfEntity(entity)) to check what kind of Class entity belongs to.

```
switch (netframe.getClassNameOfEntity(entity)) {

        case 'Player':
            netframe.log('Entity is PLAYER');
            view.createPlayerView(entity);
            
```
#### function updateEntity(entity){
- callback for when an entity is updated in the model. Used to update existing object in view.
```
if(entity instanceof model.MovableObject){
        view.moveEntity(entity);
    }
```


