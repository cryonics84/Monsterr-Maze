import clientController from './client-controller'

const events = {
    'NewStateUpdate': function (client, data) {
        console.log('Received NewStateUpdate event from server with data: ' + JSON.stringify(data));
        clientController.applyStates(data.stateChanges);

    },

}

export default events;