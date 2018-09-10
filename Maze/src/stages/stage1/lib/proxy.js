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
            object.stateChanged();
            return Reflect.set(...arguments);
        }
    };

    return new Proxy(object, handler);

};

export default proxy;