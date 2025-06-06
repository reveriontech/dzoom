import { GenericProcessor } from "@ejfdelgado/ejflab-back/srv/callprocessors/GenericProcessor.mjs";
import { PeerOrchestrator } from '../../../srcJs/PeerOrchestrator.js';

export class PeersManagerProcessor extends GenericProcessor {
    orchestrator = null;
    constructor(context, io, socket) {
        super(context, io, socket);
        this.orchestrator = new PeerOrchestrator(context);
    }

    getUUIDMap() {
        return this.context.socketRoomUUIDMap;
    }

    getRoomModel(roomId) {
        return this.context.roomLiveTupleModel[roomId];
    }

    execute(args) {
        //console.log(JSON.stringify(args, null, 4));
        if (args.action == "getUUIDMap") {
            args.response = this.getUUIDMap();
        } else if (args.action == "getRoomModel") {
            args.response = this.getRoomModel(args.roomId);
        }
        // Sends
        this.io.to(this.socket.id).emit("manageResponse", args);
        this.orchestrator.execute(args, true);
    }
}