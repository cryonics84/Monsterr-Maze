import customServerEvents from './server-events'
import {serverEvents  as netframeEvents} from '../lib/netframe'
import commands from './server-commands'

import serverController from './server-controller'

let combinedEvents = Object.assign(customServerEvents, netframeEvents);

// Export stage as the default export
export default {
  // Optionally define commands
  commands: commands,

  // Optionally define events
  events: combinedEvents,

  // Optionally define a setup method that is run before stage begins
  setup: (server) => {
    console.log('PREPARING SERVER FOR STAGE', server.getCurrentStage());

    serverController.init(server);
  },  
  
  // Optionally define a teardown method that is run when stage finishes
  teardown: (server) => {
    console.log('CLEANUP SERVER AFTER STAGE',
      server.getCurrentStage())
  },

  // Configure options
  options: {
    // You can set duration if you want the stage to
    // be timed on the server.
    // duration: 10000
  }
}
