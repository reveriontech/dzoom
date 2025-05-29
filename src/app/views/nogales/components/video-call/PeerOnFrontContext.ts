import { VoiceDetectionContext } from "./VoiceDetection";
import { SimpleObj } from '@ejfdelgado/ejflab-common/src/SimpleObj';
import { MyThrottle } from '@ejfdelgado/ejflab-common/src/MyThrottle';
import { 
    MultiScaleMediaStream, 
    //RTCCom //edgar
} from "ejflab-front-lib";
import { ElementRef } from "@angular/core";
import { RTCCom } from "../../../../temporal/RTCCom";//edgar

export abstract class PeerOnFrontContext
    extends VoiceDetectionContext {

    throttleCenterVideo = new MyThrottle(500, false);
    throttlePlaceCenterVideo = new MyThrottle(500, false);
    currentSelectedUUID: string | null = "";
    mainCenterVideoSocketId: string | null = null;
    numPeople: number = 0;

    abstract isProvider(): boolean;
    abstract getStreams(): MultiScaleMediaStream | null;
    abstract adjustView(): Promise<any>;
    abstract getCenterVideoRef(): ElementRef<any>;
    abstract getSocketIdByUUID(uuid: string): string | null;

    // Called from front end check box
    placePeerOnFront(uuid: string | null) {
        if (this.isProvider()) {
            SimpleObj.recreate(this.livemodel, `data.selectedPeer`, uuid);
            this.trackChanges(['data', 'data.selectedPeer']);
            this.updatePeerOnFront();
        }
    }

    updateMainCenterVideo() {
        this.throttlePlaceCenterVideo.throttle(this.updateMainCenterVideoLocal.bind(this));
    }

    async updateMainCenterVideoLocal() {
        console.log(`Update Main center Video ${this.mainCenterVideoSocketId}`);
        const socketId = this.getCallServiceInstance().getSocketId();
        if (!socketId) {
            console.log(`ERROR: local ${socketId} is needed`);
            return;
        }
        if (!this.mainCenterVideoSocketId) {
            //this.mainCenterVideoSocketId = socketId;
            this.showCenterVideo();
            return;
        }
        if (this.mainCenterVideoSocketId == socketId) {
            const streams = this.getStreams();
            if (!streams) {
                console.log(`ERROR: No streams for my own ${socketId}`);
                return;
            }
            console.log(`Setting ${this.mainCenterVideoSocketId} local big`);
            this.showCenterVideo(streams.big);
        } else {
            const peerData = RTCCom.getPeerStream(this.mainCenterVideoSocketId);
            if (!peerData || !peerData.streams) {
                console.log(`ERROR: No streams for socket id ${this.mainCenterVideoSocketId}`);
                return;
            }
            const streams = peerData.streams;
            const trackIndex = 1; //1 = big, 0 = small
            const stream = streams.video[trackIndex].stream;
            if (!stream) {
                console.log(`ERROR: No stream for ${this.mainCenterVideoSocketId}`);
                return;
            }
            console.log(
                `Setting ${this.mainCenterVideoSocketId} with track ${trackIndex} of ${streams.video.length}`
            );
            this.showCenterVideo(stream);
        }
    }

    existsShowCenterVideo() {
        if (!this.getCenterVideoRef()) {
            console.log('No centerVideoRef');
            return false;
        }
        const videoElement: HTMLVideoElement = this.getCenterVideoRef().nativeElement;
        if (!videoElement) {
            console.log(`ERROR: No videoElement`);
            return false;
        }
        if (videoElement.srcObject instanceof MediaStream) {
            const mediaStream: MediaStream = videoElement.srcObject;
            return mediaStream.active;
        }
        return false;
    }

    showCenterVideo(stream?: MediaStream) {
        if (!this.getCenterVideoRef()) {
            console.log('No centerVideoRef');
            return;
        }
        const videoElement = this.getCenterVideoRef().nativeElement;
        if (!videoElement) {
            console.log(`ERROR: No videoElement`);
            return;
        }
        videoElement.srcObject = stream;

        const currentListener = () => {
            this.adjustView();
            videoElement.removeEventListener('playing', currentListener);
        }
        videoElement.addEventListener('playing', currentListener);
    }

    updatePeerOnFront() {
        this.throttleCenterVideo.throttle(this.updatePeerOnFrontLocal.bind(this));
    }

    async updatePeerOnFrontLocal() {
        console.log("updatePeerOnFront...");
        try {
            // Compute how many peers exists on the call
            const people: any = SimpleObj.getValue(this.livemodel, `data.people`);
            const peopleKeys = Object.keys(people);
            this.numPeople = peopleKeys.length;

            const selectedPeer: string | null = SimpleObj.getValue(this.livemodel, `data.selectedPeer`, null);
            this.currentSelectedUUID = null;
            if (this.numPeople == 1) {
                // Overwrite choice
                if (this.socketId) {
                    //console.log(JSON.stringify(people));
                    // If it is only me, place the current user
                    this.currentSelectedUUID = people[this.socketId].sharedState.uuid;
                }
            } else if (this.numPeople == 2) {
                // Overwrite choice
                const otherPeer = peopleKeys.filter((key) => {
                    return key != this.socketId;
                });
                if (otherPeer.length > 0) {
                    this.currentSelectedUUID = people[otherPeer[0]].sharedState.uuid;
                }
            } else {
                // Read the live model selection
                this.currentSelectedUUID = selectedPeer;
            }

            let currentSocketId = null;
            if (this.currentSelectedUUID) {
                currentSocketId = this.getSocketIdByUUID(this.currentSelectedUUID);
            } else {
                // Use voice selection
                currentSocketId = this.lastSocketIdVoiceOn;
            }
            //console.log(`updatePeerOnFront this.numPeople=${this.numPeople} currentSelectedUUID=${this.currentSelectedUUID}`);
            //console.log(`updatePeerOnFront currentSocketId=${currentSocketId} this.mainCenterVideoSocketId=${this.mainCenterVideoSocketId}`);
            if (!this.existsShowCenterVideo() || currentSocketId != this.mainCenterVideoSocketId) {
                this.mainCenterVideoSocketId = currentSocketId;
                this.updateMainCenterVideo();
            }
        } catch (err) {
            console.log(err);
        }
    }
}