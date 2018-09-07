const proxy = function(object) {
    const handler = {
        get(target, property, receiver) {
            try {
                return new Proxy(target[property], handler);
            } catch (err) {
                return Reflect.get(target, property, receiver);
            }
        },
        set(obj, prop, value) {
            //console.log('Object: ' + JSON.stringify(object) + ",\ntarget/obj: " + JSON.stringify(obj) + ',\nproperty: ' + prop + '\n,value: ' + JSON.stringify(value));
            object.stateChanged();
            return Reflect.set(...arguments);
        }
        /*,
        defineProperty(target, property, descriptor) {
            onChange();
            object.stateChanged();
            return Reflect.defineProperty(target, property, descriptor);
        },
        deleteProperty(target, property) {
            onChange();
            return Reflect.deleteProperty(target, property);
        }*/
    };

    return new Proxy(object, handler);

};

export default proxy;