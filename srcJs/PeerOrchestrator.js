const { SimpleObj } = require("@ejfdelgado/ejflab-common/src/SimpleObj");

class PeerOrchestrator {
    constructor(context) {
        this.context = context;
    }
    async execute(args, isServer) {
        //this.context.userList = args.socketIds;
        //console.log(JSON.stringify(args, null, 4));
        const context = this.context;
        if (args.action == "getUUIDMap") {
            const response = JSON.parse(JSON.stringify(args.response));
            // but transform
            const roomIds = Object.keys(response);
            roomIds.forEach((roomId) => {
                const room = response[roomId]
                const peerUUIDs = Object.keys(room);
                peerUUIDs.forEach((peerUUID) => {
                    room[peerUUID] = {
                        socket: room[peerUUID],
                    };
                });
            });

            // TODO Merge
            context.orchestratorData = response
        } else if (args.action == "getRoomModel") {
            const generalModel = context.orchestratorData;
            const roomData = generalModel[args.roomId];
            // Build map from socket to uuid
            const uuidMap = {};
            const uuidKeys = Object.keys(roomData);
            uuidKeys.forEach((uuidKey) => {
                const socketId = roomData[uuidKey].socket;
                uuidMap[socketId] = uuidKey;
            });
            console.log(JSON.stringify(uuidMap, null, 4));
            const response = args.response;
            const people = response.model.data.people;
            const socketIds = Object.keys(people);
            const actualUUIDS = [];
            socketIds.forEach((socketId) => {
                const element = people[socketId];
                const sharedState = element.sharedState;
                // Transform peers
                
                const oldPeers = sharedState.peers;
                const peers = {};
                const oldPeersKeys = Object.keys(oldPeers);
                oldPeersKeys.forEach((socketId2) => {
                    const uuid2 = uuidMap[socketId2];
                    if (uuid2 !== undefined) {
                        peers[uuid2] = oldPeers[socketId2];
                    }
                });
                sharedState.peers_uuid = peers;
                
                actualUUIDS.push(sharedState.uuid);
                SimpleObj.recreate(generalModel, `${args.roomId}.${sharedState.uuid}`, sharedState);
            });
            // Erase removed uuids
            const actualKeys = Object.keys(generalModel[args.roomId]);
            const filtered = actualKeys.filter((peerUUID) => actualUUIDS.indexOf(peerUUID) < 0);
            filtered.forEach((notExists) => {
                delete generalModel[args.roomId][notExists];
            });
        }
        if (isServer == true) {
            // There is no way to display state
            //console.log(JSON.stringify(context.orchestratorData, null, 4));
        }
    }
}

module.exports = {
    PeerOrchestrator
};