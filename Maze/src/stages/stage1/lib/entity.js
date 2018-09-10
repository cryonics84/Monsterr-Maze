import rpcController from '../shared/controller/controller';
import prox from "./proxy";

// Base class that all entities inherit from
const Entity = (function() {

    //const _privateHello = function() {} //private function
    const _privateVariables = new WeakMap(); //map of private variables

    class Entity {
        constructor(entityId, owner){
            _privateVariables.set(this, {isDirty: false}); //private
            this.id = entityId;
            this.owner = owner;

            return new prox(this);
        }

        getDirty() {
            return _privateVariables.get(this).isDirty;
        }

        clearDirty(){
            _privateVariables.get(this).isDirty = false;
        }

        stateChanged(){
            if(!_privateVariables.get(this).isDirty){
                _privateVariables.get(this).isDirty = true;
                rpcController.publicVars.stateChanges.push(this);
            }
        }
    }
    return Entity;
})();

export default Entity;