import controller from './server-controller'

const events = {
    'ClientConnected': function (server, client, data) {

        server.log(data, {'client_id': client});
        console.log('Received clientConnected event from client with ID' + client);

        //server.send('SetClientId', {id: client}).toClient(client);
        controller.clientConnected(client);

    },
}

export default events;