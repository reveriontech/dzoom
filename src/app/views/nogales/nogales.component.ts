import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { BaseMsComponent, HttpService } from 'ejflab-front-lib';
import { EchoLogProcessor } from 'ejflab-front-lib';
import { ReceiveLiveChangesProcessor } from 'ejflab-front-lib';
import { SetModelProcessor } from 'ejflab-front-lib';
import { CallService } from 'ejflab-front-lib';
import { FlowchartService } from 'ejflab-front-lib';
import { MicrosoftAuthService, UserMicrosoft } from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';
import { MyCookies } from '@ejfdelgado/ejflab-common/src/MyCookies';
import { ClinicianData } from './components/home/home.component';
import { IndicatorService } from 'ejflab-front-lib';
import {
  WaitingroomComponent,
} from './components/waitingroom/waitingroom.component';
import { BrowserType, OSType } from './nogalesutiles';
import { StartVideoCallData } from './components/waitingroom/ChatManager.component';

export enum DeviceType {
  desktop = "desktop",
  mobile = "mobile",
}

export interface MyLocalUserData {
  name: string;
  type: string;
  roomName: string;
  socket?: string;
  since?: number;
  configured: boolean;
  inCall?: boolean;
  inCallRoomName?: string;
}

export interface MyDetailedUserData extends MyLocalUserData {
  cameraGranted: boolean;
  micGranted: boolean;
  country: string;
  city: string;
  deviceType: DeviceType | null;
  osType: OSType | null;
  osName: string | null;
  browserType: BrowserType | null;
  browserName: string | null;
}

@Component({
  selector: 'app-nogales',
  templateUrl: './nogales.component.html',
  styleUrls: ['./nogales.component.css', './nogales.css'],
})
export class NogalesComponent
  extends BaseMsComponent
  implements OnInit, OnDestroy {
  currentView: string = 'welcome';
  myProvider: ClinicianData | null = null;
  actualSubscription: Subscription | null = null;
  myLocalUserData: MyLocalUserData = {
    name: 'Person',
    type: 'patient',
    roomName: 'public',
    configured: false,
    inCall: false,
  };
  @ViewChild(WaitingroomComponent) waitingRoom: WaitingroomComponent;
  constructor(
    public override flowchartSrv: FlowchartService,
    public override callService: CallService,
    public override authSrv: MicrosoftAuthService,
    public route: ActivatedRoute,
    public override modalService: ModalService,
    public override cdr: ChangeDetectorRef,
    private httpSrv: HttpService,
    private indicatorSrv: IndicatorService
  ) {
    super(flowchartSrv, callService, authSrv, modalService, cdr);
  }

  async waitForWaitingRoom() {
    do {
      await this.sleep(250);
    } while (!this.waitingRoom);
    return this.waitingRoom;
  }

  override async ngOnInit(): Promise<void> {
    super.ngOnInit();
    await this.authSrv.refreshActiveAccount();

    this.authSrv.pathChangedEvent.subscribe(async (hash: string) => {
      await this.waitForWaitingRoom();
      this.waitingRoom.loadState(hash);
    });

    this.actualSubscription = this.authSrv.onAuthStateChanged(
      async (user: UserMicrosoft | null) => {
        await this.getCurrentUserUID();
        const path = this.route.snapshot.paramMap.get('path');
        const detail = this.route.snapshot.paramMap.get('detail');
        if (path) {
          this.currentView = path;
        }
        const COOKIE_NAME_KEY = 'NOG_USER_NAME';
        let oldUserName = MyCookies.getCookie(COOKIE_NAME_KEY);
        //console.log(`user? ${!!user} path? ${!!path}`);
        if (!!user) {
          // Signed user
          if (!path) {
            //console.log(`main room provider`);
            const name = user.name;
            if (name) {
              this.myLocalUserData.name = name;
            }
            this.myLocalUserData.type = 'provider';
            const roomName = this.authSrv.getRoomNameFromUser(user);
            if (roomName) {
              this.myLocalUserData.roomName = roomName;
            }
            this.currentView = 'room';
          }
        }

        if (!user && !!path && !!detail) {
          this.myLocalUserData.roomName = detail;
          if (oldUserName) {
            this.myLocalUserData.name = oldUserName;
          }
        }

        this.currentUser = user;
        if (!!user || !!path) {
          console.log('Ask connect to public!');
          await this.connectToRoomName('public');
        }
      }
    );
  }

  override async ngOnDestroy() {
    await super.ngOnDestroy();
    if (this.actualSubscription) {
      this.actualSubscription.unsubscribe();
    }
  }

  setView(viewName: string) {
    this.currentView = viewName;
  }

  async waitForWaitingRoomComponent() {
    while (!this.waitingRoom) {
      await this.sleep(300);
    }
  }

  bindEvents() {
    const instance = this.getCallServiceInstance();
    instance.registerProcessor('echoLog', (message: any) => {
      new EchoLogProcessor(this).execute(message);
    });
    instance.registerProcessor('clientChange', (message: any) => {
      new ReceiveLiveChangesProcessor(this).execute(message);
    });
    instance.registerProcessor('setModel', (message: any) => {
      new SetModelProcessor(this).execute(message);
    });
    instance.registerProcessor('connect', (message: any) => {
      console.log(`main: connect`);
      this.updateMyInformation();
    });
    instance.registerProcessor('openChat', async (message: any) => {
      //console.log(`openChat ${JSON.stringify(message)}`);
      if (message.room) {
        await this.waitForWaitingRoomComponent();
        await this.waitingRoom.connectToRoomName(message.room, false);
        this.waitingRoom.openChat();
      }
    });
    instance.registerProcessor('openVideoChat', async (message: any) => {
      await this.waitForWaitingRoomComponent();
      this.waitingRoom.openVideoCallDisplay(message);
    });
    instance.registerProcessor('closeVideoChat', async (message: any) => {
      await this.waitForWaitingRoomComponent();
      this.waitingRoom.videoCallComponent?.stopCall();
    });
  }

  updateMyInformation(current?: MyLocalUserData) {
    if (current) {
      this.myLocalUserData = current;
    }
    console.log(`updateMyInformation ${this.currentUserUID}`);
    this.getCallServiceInstance().emitEvent('updateMyInformation', {
      userUID: this.currentUserUID,
      data: this.myLocalUserData,
    });
  }

  showActivityIndicator(millis=1500) {
    const promise = this.indicatorSrv.start();
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, millis);
    }).then(() => {
      promise.done();
    });
  }

  openVideoChat(detail: StartVideoCallData) {
    this.showActivityIndicator();
    const callRoomName = detail.roomName;
    const emitRequest = {
      uuid: detail.peerUUID,
      room: callRoomName,
    };
    //console.log(JSON.stringify(emitRequest));
    this.getCallServiceInstance().emitEvent('openVideoChat', emitRequest);
  }

  closeVideoChat(detail: StartVideoCallData) {
    this.showActivityIndicator();
    const callRoomName = detail.roomName;
    const emitRequest = {
      uuid: detail.peerUUID,
      room: callRoomName,
    };
    //console.log(JSON.stringify(emitRequest));
    this.getCallServiceInstance().emitEvent('closeVideoChat', emitRequest);
  }

  blobToBase64(blob: Blob) {
    return new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  }

  base64ToFile(base64String: string) {
    const [prefix, base64Data] = base64String.split(',');
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: "image/jpeg" });
  }

  async updateMyPhoto(bytes: ArrayBuffer) {
    const blob = new Blob([bytes], { type: 'image/jpeg' });
    const base64 = await this.blobToBase64(blob);
    if (!base64) {
      return;
    }
    const response = await this.httpSrv.post<any>('/srv/nogales/update_photo',
      {
        socketId: this.socketId,
        base64
      },
      {
        showIndicator: true,
      });

  }
}
