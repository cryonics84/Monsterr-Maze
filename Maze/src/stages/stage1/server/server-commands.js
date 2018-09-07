import rpcController from '../controller/controller'


const commands = {
    'PrintEntities': function (server, _, ...args) {
        console.log('Received PrintEntities command from client');
        let data = {
            serverEntities: rpcController.GetEntities().join(', '),
        }
        server.send('_PrintEntities', 'serverEntities: ' + data).toAll()
    }
}

export default commands;

