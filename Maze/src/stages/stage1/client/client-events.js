import clientController from './client-controller'
import {sharedInterface as netframe} from "../lib/netframe";

const events = {
    'NewStateUpdate': function (client, data) {
        netframe.log('Received NewStateUpdate event from server with data: ' + JSON.stringify(data));
        clientController.applyStates(data.stateChanges);

    },

}

export default events;