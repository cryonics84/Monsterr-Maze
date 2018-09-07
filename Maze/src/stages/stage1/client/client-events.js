import rpcController from '../controller/controller'
import clientController from './client-controller'
import client from "./client";
import {executeRpc} from '../lib/netframe';

const events = {
    '_PrintEntities': function (client, data) {

        console.log('Received _PrintEntities event from server');
        let clientEntities = rpcController.GetNetworkIdentities().join(', ');
        let serverEntities = data.serverEntities.join(', ');
        client.getChat().append('server entities:' + serverEntities + '\nclient entities: ' + clientEntities);

    },
    'NewStateUpdate': function (client, data) {
        console.log('Received NewStateUpdate event from server with data: ' + JSON.stringify(data));
        clientController.applyStates(data.stateChanges);

    },

}

export default events;