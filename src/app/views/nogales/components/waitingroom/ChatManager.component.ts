import {
    ChangeDetectorRef,
    Component,
    Input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { CallService, HttpService } from 'ejflab-front-lib';
import { IndicatorService } from 'ejflab-front-lib';
import { MicrosoftAuthService } from 'ejflab-front-lib';
import { ClinicianData } from '../home/home.component';
import { MyDetailedUserData, MyLocalUserData } from '../../nogales.component';
import { ContextComponent } from 'ejflab-front-lib';
import { FlowchartService } from 'ejflab-front-lib';
import { SimpleObj } from '@ejfdelgado/ejflab-common/src/SimpleObj';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FileService } from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';
import {
    DevicesData,
    MultiScaleMediaStream,
    SelectedDeviceData,
} from 'ejflab-front-lib';

export interface SharedState {
    micState: boolean;
    videoState: boolean;
    voice: boolean;
    provider: ClinicianData | null;
    providerState: string;
    patient: MyDetailedUserData;
}

export interface InMemoryState {
    stream: MultiScaleMediaStream | null;
    devices: DevicesData;
    currentDevices: SelectedDeviceData;
}

export interface ConnectToRoomOptions {
    otherId: string;
    roleType: string;
}

export interface StartVideoCallData {
    roomName: string;
    peerUUID: string | null;
}

@Component({
    selector: 'app-chat-manager',
    template: ` <div></div> `,
    styles: [],
})
export abstract class ChatManagerComponent
    extends ContextComponent {

    static MAX_COUNT_MESSAGES = 5;

    @Input() livemodelPublic: any;
    @Input() currentUserUID?: string | null;
    @Input() myLocalUserDataPublic: MyLocalUserData;

    isChatOpen: boolean = false;
    simpleGT: SafeHtml;
    emptyHTML: SafeHtml;
    changeMessagesCount: {
        [key: string]: {
            count: number,
            html?: SafeHtml
        }
    } = {};
    memoryCacheMapNumbers: { [key: number]: SafeHtml } = {};

    constructor(
        public route: ActivatedRoute,
        public dialog: MatDialog,
        public indicatorSrv: IndicatorService,
        public authSrv: MicrosoftAuthService,
        public callSrv: CallService,
        public override flowchartSrv: FlowchartService,
        public sanitizer: DomSanitizer,
        public fileService: FileService,
        public override modalService: ModalService,
        public override cdr: ChangeDetectorRef,
        public httpSrv: HttpService
    ) {
        super(flowchartSrv, callSrv, modalService, cdr);
        this.changeMessagesCount = {};
        this.emptyHTML = this.sanitizer.bypassSecurityTrustHtml('');
        this.simpleGT = this.sanitizer.bypassSecurityTrustHtml(
            `<span class="unread_messages">&gt;${ChatManagerComponent.MAX_COUNT_MESSAGES}</span>`);
    }

    checkMessagesCount(room: string, currentCount: number) {
        //console.log("checkMessagesCount");
        let hasChange = false;
        if (!(room in this.changeMessagesCount)) {
            hasChange = true;
            //console.log(`1 room ${room} message ${currentCount}`);
            this.changeMessagesCount[room] = {
                count: currentCount,
            };
        } else {
            const previousNumber = this.changeMessagesCount[room];
            if (currentCount != previousNumber.count) {
                hasChange = true;
                //console.log(`2 room ${room} message ${currentCount}`);
                this.changeMessagesCount[room].count = currentCount;
            }
        }
        if (hasChange) {
            if (currentCount in this.memoryCacheMapNumbers) {
                //console.log("checkMessagesCount using old");
                this.changeMessagesCount[room].html = this.memoryCacheMapNumbers[currentCount];
            } else {
                //console.log("checkMessagesCount using new");
                this.changeMessagesCount[room].html = this.sanitizer.bypassSecurityTrustHtml(
                    `<span class="unread_messages">${currentCount}</span>`
                );
                this.memoryCacheMapNumbers[currentCount] = this.changeMessagesCount[room].html;
            }
        }
        if (hasChange) {
            if (document.hidden) {
                this.playSound('message2.mp3', false, 0.3);
            } else {
                if (!this.isChatOpen) {
                    this.playSound('message2.mp3', false, 0.3);
                }
            }

        }
        return this.changeMessagesCount[room].html;
    }

    getMissedMessagesCount(otherId: string) {
        const me = this.currentUserUID;

        let roomName;
        if (this.myLocalUserDataPublic.type == 'provider') {
            roomName = `${me}_${otherId}`;
        } else {
            roomName = `${otherId}_${me}`;
        }
        if (!roomName) {
            return this.emptyHTML;
        }
        const lastmsg = this.livemodelPublic.data?.lastmsg;
        if (!lastmsg) {
            return this.emptyHTML;
        }

        const defaultRefArray: any = [];
        const refArray = SimpleObj.getValue(
            lastmsg,
            `${roomName}.${otherId}.arr`,
            defaultRefArray
        );
        const defaultLastMe: any = 0;
        const lastMe = SimpleObj.getValue(
            lastmsg,
            `${roomName}.${me}.last`,
            defaultLastMe
        );
        const filtered = refArray.filter((elem: number) => {
            return elem > lastMe;
        });
        if (filtered.length > ChatManagerComponent.MAX_COUNT_MESSAGES) {
            return this.simpleGT;
        } else if (filtered.length == 0) {
            return this.emptyHTML;
        } else {
            return this.checkMessagesCount(roomName, filtered.length);
        }
    }

    closeChat() {
        const room = this.builderConfig.roomName;
        if (room in this.changeMessagesCount) {
            this.changeMessagesCount[room].count = 0;
        } else {
            console.log(JSON.stringify(this.changeMessagesCount));
        }
        this.isChatOpen = false;
    }

    openChat() {
        this.isChatOpen = true;
    }

    toggleOpenCloseChat() {
        if (this.isChatOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    chatSetSawProcessor() {
        if (!this.isChatOpen || document.hidden) {
            // chat is closed
            return;
        }
        // chat is opened
        // Verify
        const lastmsg = this.livemodelPublic.data?.lastmsg;
        const me = this.currentUserUID;
        if (!me) {
            return;
        }
        // Leer del otro, el maximo tiempo
        const roomName = this.builderConfig.roomName;
        let otherId;
        if (this.myLocalUserDataPublic.type == 'provider') {
            otherId = roomName.substring(me.length + 1);
        } else {
            otherId = roomName.substring(0, roomName.length - (me.length + 1));
        }
        // Get my last saw
        const defaultLastSaw: any = 0;
        const myLastSaw = SimpleObj.getValue(
            lastmsg,
            `${roomName}.${me}.last`,
            defaultLastSaw
        );
        const defaultArray: any = [];
        const myLastArray = SimpleObj.getValue(
            lastmsg,
            `${roomName}.${otherId}.arr`,
            defaultArray
        );
        if (myLastArray.length > 0) {
            const lastTime = myLastArray[myLastArray.length - 1];
            if (myLastSaw < lastTime) {
                this.getCallServiceInstance().emitEvent('chatSetSawProcessor', {
                    lastTime,
                    author: this.currentUserUID,
                });
            }
        }
    }
}
