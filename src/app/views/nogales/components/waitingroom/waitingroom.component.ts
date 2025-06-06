import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { CallService, HttpService } from 'ejflab-front-lib';
import { IndicatorService } from 'ejflab-front-lib';
import { MicrosoftAuthService, UserMicrosoft } from 'ejflab-front-lib';
import { PopupwaitingroomComponent } from '../popupwaitingroom/popupwaitingroom.component';
import { MyCookies } from '@ejfdelgado/ejflab-common/src/MyCookies';
import { DeviceType, MyDetailedUserData, MyLocalUserData } from '../../nogales.component';
import { FlowchartService } from 'ejflab-front-lib';
import { EchoLogProcessor } from 'ejflab-front-lib';
import { ReceiveLiveChangesProcessor } from 'ejflab-front-lib';
import { SetModelProcessor } from 'ejflab-front-lib';
import { DomSanitizer } from '@angular/platform-browser';
import { FileService } from 'ejflab-front-lib';
import {
  Room,
  RoomGroup,
} from '../account-dashboard/account-dashboard.component';
import { NogalesUtiles } from '../../nogalesutiles';
import { ModalService } from 'ejflab-front-lib';
import {
  DevicesData,
  VideoWebStream,//edgar
} from 'ejflab-front-lib';
import { RTCCom } from 'ejflab-front-lib';//edgar
import { PopupconfigdevicesComponent } from '../popupconfigdevices/popupconfigdevices.component';
import { StartCallData } from '../patient-queue-list/patient-queue-list.component';
import { VideoCallComponent } from '../video-call/video-call.component';
import { MyThrottle } from '@ejfdelgado/ejflab-common/src/MyThrottle';
import * as countries from "i18n-iso-countries";
import {
  ConnectToRoomOptions,
  InMemoryState,
  SharedState,
  StartVideoCallData
} from './ChatManager.component';
import { IntroManagerComponent } from './IntroManager.component';
//import { VideoWebStream } from "../../../../temporal/VideoWebStream";//edgar
//import { RTCCom } from "../../../../temporal/RTCCom";//edgar

@Component({
  selector: 'app-waitingroom',
  templateUrl: './waitingroom.component.html',
  styleUrls: ['./waitingroom.component.css', '../../nogales.css'],
})
export class WaitingroomComponent
  extends IntroManagerComponent
  implements OnInit, OnDestroy {

  @Input() socketIdPublic?: string | null;
  @Input() connectionStatePublic: string;
  @Input() avatarImage: any;
  @Input() currentUser: UserMicrosoft | null = null;

  @Output() updateMyInformationEvent: EventEmitter<MyLocalUserData> =
    new EventEmitter();
  @Output() updateMyPhotoEvent: EventEmitter<{ bytes: Uint8ClampedArray }> =
    new EventEmitter();
  @Output() openVideoChat: EventEmitter<StartVideoCallData> =
    new EventEmitter();
  @Output() closeVideoChat: EventEmitter<StartVideoCallData> =
    new EventEmitter();

  isShowingVideoCall: boolean = false;
  myLocalUserData: MyLocalUserData = {
    name: 'Person',
    type: 'patient',
    roomName: 'public',
    configured: false,
  };
  getMissedMessagesCountThis: Function;
  chatSetSawProcessorThis: Function;
  actualSubscription: Subscription | null;
  dialogRef: MatDialogRef<PopupwaitingroomComponent, any> | null = null;
  providerId: string | null = null;
  myOwnUrlRoom: string = '';
  myOwnPath: string = '';
  sharedState: SharedState = {
    micState: false,
    videoState: true,
    voice: false,
    provider: {
      id: '',
      txt: '',
      title: 'Dr.',
      lastname: 'Lastname',
      name: 'Name',
    },
    providerState: 'on',
    // The patient information is used also for provider status...
    patient: {
      name: '',
      type: 'patient',
      roomName: 'public',
      configured: false,
      cameraGranted: false,
      micGranted: false,
      country: '',
      city: '',
      deviceType: null,
      osType: null,
      osName: null,
      browserType: null,
      browserName: '',
      inCall: false,
    },
  };
  @ViewChild('local_video') localVideoRef: ElementRef;
  @ViewChild(VideoCallComponent) videoCallComponent: VideoCallComponent;
  autoOpen: boolean;
  roomGroups: RoomGroup[] = [];
  //
  videoManager: VideoWebStream = new VideoWebStream();
  videoManagerSubscription: Subscription;
  inMemoryState: InMemoryState = {
    stream: null,
    currentDevices: {
      audio: null,
      speaker: null,
      video: null,
    },
    devices: {
      audios: [],
      speaker: [],
      videos: [],
    },
  };
  stateToggleLeftMenu: boolean = true;
  callMadeConfiguredSubscription: Subscription | null = null;
  fallbackError: string | null = null;
  fallbackErrorDetail: string | null = null;
  throttle = new MyThrottle(1000, false);

  constructor(
    public override route: ActivatedRoute,
    public override dialog: MatDialog,
    public override indicatorSrv: IndicatorService,
    public override authSrv: MicrosoftAuthService,
    public override callSrv: CallService,
    public override flowchartSrv: FlowchartService,
    public override sanitizer: DomSanitizer,
    public override fileService: FileService,
    public override modalService: ModalService,
    public override cdr: ChangeDetectorRef,
    public override httpSrv: HttpService,
  ) {
    super(
      route,
      dialog,
      indicatorSrv,
      authSrv,
      callSrv,
      flowchartSrv,
      sanitizer,
      fileService,
      modalService,
      cdr,
      httpSrv
    );
    this.builderConfig = {
      roomName: 'none',
      MAX_SEND_SIZE: 1000,
      LOW_PRESSURE_MS: 100,
      BACK_OFF_MULTIPLIER: 100,
    };
    this.getMissedMessagesCountThis = this.getMissedMessagesCount.bind(this);
    this.chatSetSawProcessorThis = this.chatSetSawProcessor.bind(this);
    const urlParams = new URLSearchParams(window.location.search);
    const autoopen = this.readQueryParam(urlParams, 'autoopen', 'text', null);
    this.autoOpen = autoopen === '1';
    this.inMemoryState.devices = this.videoManager.devices;
    this.inMemoryState.currentDevices = this.videoManager.currentDevices;
    this.videoManagerSubscription = this.videoManager.emitterStreams.subscribe(
      (streams) => {
        this.inMemoryState.stream = streams;
        RTCCom.setMediaStream(streams);
        this.configureVideoStream();
      }
    );
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
      //
    });
  }

  /**
   * The path of availables URL's must have the login provider.
   * It allows to be dynamic.
   * @returns
   */
  includeMeInRooms() {
    if (!this.myOwnPath) {
      return;
    }
    if (this.roomGroups.length == 0) {
      return;
    }
    const nuevo = {
      value: this.myOwnPath,
      viewValue: NogalesUtiles.getRoomUrlFromPath(this.myOwnPath),
    };
    for (let i = 0; i < this.roomGroups.length; i++) {
      const group = this.roomGroups[i];
      if (!group.shared) {
        const rooms = group.rooms;
        const exists =
          rooms.filter((room) => {
            return room.value == nuevo.value;
          }).length > 0;
        if (!exists) {
          rooms.unshift(nuevo);
        }
        break;
      }
    }
  }

  isUserInAllGroup(groups: string[]) {
    return this.authSrv.isUserInGroupInternal(this.currentUser, groups, true);
  }

  isUserInSomeGroup(groups: string[]) {
    return this.authSrv.isUserInGroupInternal(this.currentUser, groups, false);
  }

  async configureWaitingRoom(user: UserMicrosoft | null) {
    // Se pide el nombre del paciente
    if (!user) {
      // Se pide el nombre del paciente
      this.loadRoomsInfo();
      this.openPatientIdPopUp();
    } else {
      // Provider does not need configuration
      this.sharedState.patient.type = "provider";
      if (user.name) {
        this.sharedState.patient.name = user.name;
      }
      // Provider
      if (this.currentUserUID) {
        const partes = /^[^_]+_(.*)$/.exec(this.currentUserUID);
        if (partes) {
          this.myOwnPath = partes[1];
          this.myOwnUrlRoom = NogalesUtiles.getRoomUrlFromPath(this.myOwnPath);
          await this.loadRoomsInfo();
        }
      }
      if (this.dialogRef) {
        this.dialogRef.close();
      }

      if (!this.isUserInAllGroup(['apps_videocall_provider'])) {
        // abort initialization
        return;
      }
      // The provider connects the VideoCall to the space reserver only for it
      const roomName = this.authSrv.getRoomNameFromUser(user);
      if (roomName) {
        await this.waitForVideoCallComponent();
        await this.videoCallComponent.videoCallConnect(roomName);
      }
    }
  }

  async waitForVideoCallComponent() {
    while (!this.videoCallComponent) {
      await this.sleep(300);
    }
  }

  getCountryName(isoCountry: string | null): string | null {
    if (!isoCountry) {
      return '-';
    } else {
      let name = countries.getName(isoCountry, "en", { select: "official" });
      if (!name) {
        return null;
      }
      return name;
    }
  }

  async resolveGeolocation() {
    const response = await this.httpSrv.post<any>('/srv/nogales/geolocate', {});
    if (response.detail) {
      const name = this.getCountryName(response.detail.country);
      if (name) {
        this.sharedState.patient.country = name;
      }
      this.sharedState.patient.city = response.detail.city;
      this.updateMyInformationEventLowPressure();
    }
  }

  readComputerDetail() {
    // Desktop or Mobile
    const isMobile = NogalesUtiles.isMobile();
    if (isMobile) {
      this.sharedState.patient.deviceType = DeviceType.mobile;
    } else {
      this.sharedState.patient.deviceType = DeviceType.desktop;
    }
    // OS name
    const osDetail = NogalesUtiles.getOSDetail();
    if (osDetail) {
      this.sharedState.patient.osType = osDetail.type;
      this.sharedState.patient.osName = osDetail.name;
    }
    this.updateMyInformationEventLowPressure();
    // Browser and version
    const browserDetail = NogalesUtiles.getBrowserInfo();
    if (browserDetail) {
      this.sharedState.patient.browserType = browserDetail.type;
      this.sharedState.patient.browserName = browserDetail.name;
    }
  }

  override async ngOnInit(): Promise<void> {
    super.ngOnInit();
    countries.registerLocale(require("i18n-iso-countries/langs/en.json"));
    window.addEventListener("beforeunload", (event) => {
      //event.preventDefault();
      //event.returnValue = "";
    });
    this.checkDevicePermission("camera" as PermissionName);
    this.checkDevicePermission("microphone" as PermissionName);
    this.makeResize();
    this.reloadDevices();
    this.actualSubscription = this.authSrv.onAuthStateChanged(
      async (user: UserMicrosoft | null) => {
        await this.configureWaitingRoom(user);
      }
    );
    this.readComputerDetail();
    this.resolveGeolocation();
  }

  reloadDevices() {
    this.videoManager.autoReloadDevices().then(async (devices: DevicesData) => {
      //console.log("autoReloadDevices().then");
      this.inMemoryState.devices = devices;
      this.cdr.detectChanges();
      try {
        const stream = await this.videoManager.getUserMedia();
        RTCCom.setMediaStream(stream);
        this.fallbackError = null;
        this.fallbackErrorDetail = null;
        // Set both camera an microphone ok
        this.sharedState.patient.cameraGranted = true;
        this.sharedState.patient.micGranted = true;
        this.updateMyInformationEventLowPressure();
      } catch (err: any) {
        this.fallbackErrorDetail = err.message;
        switch (err.name) {
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            this.fallbackError = 'NO_DEVICE';
            break;
          case 'PermissionDeniedError':
          case 'SecurityError':
          case 'NotAllowedError':
            this.fallbackError = 'PERMISSION';
            break;
          default:
            this.fallbackError = 'UNKNOWN';
            return;
        }
      }
    });
  }

  override async ngOnDestroy() {
    await super.ngOnDestroy();
    if (this.actualSubscription) {
      this.actualSubscription.unsubscribe();
    }
    if (this.videoManagerSubscription) {
      this.videoManagerSubscription.unsubscribe();
    }
  }

  async configureVideoStream() {
    this.localVideoRef.nativeElement.muted = true;
    if (this.inMemoryState.stream) {
      if (this.sharedState.micState !== true) {
        this.inMemoryState.stream.audio.getAudioTracks()[0].enabled = false;
      } else {
        this.inMemoryState.stream.audio.getAudioTracks()[0].enabled = true;
      }
    }
    this.localVideoRef.nativeElement.srcObject = this.inMemoryState.stream?.big;
  }

  async openDeviceConfigPopUp() {
    this.dialog.open(PopupconfigdevicesComponent, {
      data: {
        sharedState: this.sharedState,
        inMemoryState: this.inMemoryState,
        videoManager: this.videoManager,
      },
      disableClose: false,
      panelClass: ['popup_1', 'nogalespopup'],
    });
  }

  async openPatientIdPopUp() {
    this.updateRoomNameFromPath();
    // Then, it can update the room Intro
    const room = this.sharedState.patient.roomName;
    this.loadIntros(room);
    await this.loadProviderDetail();
    const COOKIE_NAME_KEY = 'NOG_USER_NAME';
    // Leo si existe un nombre
    let oldUserName = MyCookies.getCookie(COOKIE_NAME_KEY);
    let response = null;
    this.dialogRef = this.dialog.open(PopupwaitingroomComponent, {
      data: {
        oldUserName: oldUserName,
        sharedState: this.sharedState,
        inMemoryState: this.inMemoryState,
        videoManager: this.videoManager,
      },
      disableClose: true,
      panelClass: ['popup_1', 'nogalespopup'],
    });
    response = await new Promise<any>((resolve) => {
      if (this.dialogRef) {
        this.dialogRef.afterClosed().subscribe((result) => {
          resolve(result);
        });
      }
    });

    if (response) {
      if (response.imageBytes) {
        //const uuid = this.getSessionStorageValue('ANONYMOUS_USER');
        // const socketId = this.socketIdPublic;
        // Load into server
        // console.log(`${socketId} put ${response.imageBytes}`);
        this.updateMyPhotoEvent.emit({ bytes: response.imageBytes });

      }
      MyCookies.setCookie(COOKIE_NAME_KEY, this.sharedState.patient.name);
      this.sharedState.patient.configured = true;
      this.updateMyInformationEventLowPressure();
    }

    this.setScrollTop();
    await this.popupIntro(room);
  }

  updateRoomNameFromPath() {
    const parts = /\/room\/(.+)$/.exec(location.pathname);
    if (parts) {
      this.sharedState.patient.roomName = parts[1];
    }
  }

  async loadProviderDetail() {
    // Lee el provider
    const espera = this.indicatorSrv.start();
    this.providerId = this.route.snapshot.paramMap.get('detail');
    if (this.providerId) {
      this.sharedState.provider = {
        id: this.providerId,
        txt: this.providerId,
        title: 'Dr.',
        name: this.providerId,
        lastname: 'Lastname',
      };
    }
    espera.done();
    return this.sharedState.provider;
  }

  getClinicicianName() {
    const provider = this.sharedState.provider;
    if (provider) {
      return `${provider.title} ${provider.name} ${provider.lastname}`;
    }
    return '';
  }

  async logout() {
    await this.authSrv.logout();
    window.location.assign('/');
  }

  sendMessage(event: any) {
    this.getCallServiceInstance().emitEvent('sendChat', {
      text: event,
      author: this.currentUserUID,
      open: this.isProvider(),
    });
  }

  isOwnProviderConnected() {
    const people = this.livemodelPublic.data?.people;
    if (!people) {
      return false;
    }
    let otherId = `sig_${this.providerId}`;
    if (!people[otherId]?.socket) {
      return false;
    }
    return true;
  }

  async connectWithOwnProvider() {
    //console.log("connectWithOwnProvider");
    const people = this.livemodelPublic.data?.people;
    if (!people) {
      return;
    }
    let otherId = `sig_${this.providerId}`;
    if (!people[otherId]?.socket) {
      return;
    }
    const roomName = `${otherId}_${this.currentUserUID}`;
    await this.connectToRoomName(roomName, false);
    // Open the chat!
    this.isChatOpen = true;
  }

  async connectToRoomNamedAs(options: ConnectToRoomOptions) {
    const { roleType, otherId } = options;
    //console.log(`connectToRoomNamedAs ${roleType}`);
    // Compute roomId as provider_patient
    let roomName = '';
    if (roleType == 'provider') {
      // other is provider
      roomName = `${otherId}_${this.currentUserUID}`;
    } else if (roleType == 'patient') {
      // other is patient
      roomName = `${this.currentUserUID}_${otherId}`;
    }
    await this.connectToRoomName(roomName, false);
    // Open the chat!
    this.isChatOpen = true;
  }

  closeRoom() {
    this.closeChat();
    this.socketIoDisconnect();
  }

  async loadRoomsInfo() {
    console.log(`El login del usuario logeado: ${this.currentUser?.username}`);
    const response = await this.httpSrv.get<any>(`/srv/nogales/room/user-permissions?user_id=${this.currentUser?.username}`);
    console.log (response)
    const textRooms = response.map ((registro:any)=>{
      return {
        "path": registro["room_id"],
        "title": registro ["room_name"],
        "shared": registro ["is_public"] == 1 
      }
    })
    console.log (textRooms)
    this.roomGroups = [];
    const sharedGroup: RoomGroup = {
      name: 'SHARED ROOM(S)',
      shared: true,
      rooms: [],
    };
    const personalGroup: RoomGroup = {
      name: 'PERSONAL ROOM(S)',
      shared: false,
      rooms: [],
    };
    this.roomGroups.push(personalGroup);
    this.roomGroups.push(sharedGroup);
    const parsed = (textRooms);
    for (let i = 0; i < parsed.length; i++) {
      const part = parsed[i];
      const { path, title, shared } = part;
      const room: Room = {
        value: path,
        viewValue: NogalesUtiles.getRoomUrlFromPath(path),
      };
      if (shared) {
        sharedGroup.rooms.push(room);
      } else {
        personalGroup.rooms.push(room);
      }
    }
    this.includeMeInRooms();
  }

  isProvider() {
    return this.currentUser != null;
  }

  async endCallWith(detail: StartCallData) {
    // Tell the other peer to connect
    const response = await this.getVideoCallSpace(detail);
    if (response) {
      this.closeVideoChat.emit(response);
    }
  }

  /**
   * Trigered by the provider when wants to start a call
   * @param detail 
   */
  async startCall(detail: StartCallData) {
    const promesa = this.indicatorSrv.start();
    try {
      await this.waitForVideoCallComponent();
      const isFirstCall = !this.isShowingVideoCall;
      if (!this.isShowingVideoCall) {
        this.sharedState.patient.inCall = true;
        this.updateMyInformationEventLowPressure();
        await this.videoCallComponent.openVideoCallDisplay(isFirstCall);
        this.isShowingVideoCall = true;
      }
      // Wait until this peer is ready
      await this.videoCallComponent.waitUntilReady();

      // Tell the other peer to connect
      const response = await this.getVideoCallSpace(detail);
      if (response) {
        this.openVideoChat.emit(response);
      }
    } catch (err: any) {
      this.modalService.error(err);
      this.stopCall();
    }
    promesa.done();
  }

  async stopCall() {
    this.isShowingVideoCall = false;
    this.stateToggleLeftMenu = true;
    this.sharedState.patient.inCall = false;
    this.updateMyInformationEventLowPressure();
  }

  getUUIDFromPublicSocketId(socketId: string): string | null {
    const people = this.livemodelPublic.data?.people;
    const keys = Object.keys(people);
    for (let i = 0; i < keys.length; i++) {
      const uuid = keys[i];
      if (people[uuid].socket == socketId) {
        return uuid;
      }
    }
    return null;
  }

  async getVideoCallSpace(
    detail: StartCallData
  ): Promise<StartVideoCallData | null> {
    if (!detail.person?.socket || !this.builderConfig.roomName) {
      return null;
    }
    await this.waitForVideoCallComponent();
    const peerUUID = this.getUUIDFromPublicSocketId(detail.person?.socket);
    const roomName = this.videoCallComponent.builderConfig.roomName;
    return {
      roomName,
      peerUUID,
    };
  }

  /**
   * Trigered when the patient receives a call request
   * @param message 
   */
  async openVideoCallDisplay(message: any) {
    await this.waitForVideoCallComponent();
    const room = message.room;
    //console.log(`..... Connect to ${room}`);
    await this.videoCallComponent.connectToRoomName(room, false);
    this.videoCallComponent.openVideoCallDisplay();
    this.cdr.detectChanges();
    this.sharedState.patient.inCall = true;
    this.sharedState.patient.inCallRoomName = message.room;
    this.updateMyInformationEventLowPressure();
  }

  async toggleLeftMenu(state?: boolean) {
    if (typeof state == 'boolean') {
      this.stateToggleLeftMenu = state;
    } else {
      this.stateToggleLeftMenu = !this.stateToggleLeftMenu;
    }
  }

  isInCall(state: boolean) {
    this.isShowingVideoCall = state;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.makeResize();
  }

  makeResize() {
    if (window.innerWidth < 862) {
      this.stateToggleLeftMenu = false;
    } else {
      this.stateToggleLeftMenu = true;
    }
  }

  async checkDevicePermission(permissionName: string) {
    try {
      const permissionStatus = await navigator.permissions.query({ name: permissionName as PermissionName });
      const commonFunction = () => {
        //console.log(`${permissionName} permissionStatus.state=${permissionStatus.state}`);
        if (permissionName == "camera") {
          this.sharedState.patient.cameraGranted = permissionStatus.state == 'granted';
        } else if (permissionName == "microphone") {
          this.sharedState.patient.micGranted = permissionStatus.state == 'granted';
        }
        this.updateMyInformationEventLowPressure();
      };
      permissionStatus.onchange = commonFunction;
      commonFunction();
    } catch (error) {
      console.error("Permission API is not supported or failed:", error);
    }
  }

  updateMyInformationEventLowPressure() {
    this.throttle.throttle(this.updateMyInformationEventLowInternal.bind(this));

  }

  async updateMyInformationEventLowInternal() {
    this.updateMyInformationEvent.emit(this.sharedState.patient);
  }

  filterPatients(inCall: boolean): { [key: string]: MyDetailedUserData } {
    const response: { [key: string]: MyDetailedUserData } = {};
    if (!this.currentUser || !this.livemodelPublic.data) {
      return response;
    }
    const people = this.livemodelPublic.data.people;
    const roomName = this.authSrv.getRoomNameFromUser(this.currentUser);
    const userKeys = Object.keys(people);
    for (let i = 0; i < userKeys.length; i++) {
      const key = userKeys[i];
      const person = people[key];
      if (person.type == "patient") {
        //
        const isInThisCall = (person.inCallRoomName == roomName && !!person.inCall);
        if (inCall) {
          if (isInThisCall) {
            response[key] = person;
          }
        } else {
          if (!isInThisCall) {
            response[key] = person;
          }
        }
      }
    }
    return response;
  }

  checkChanges() {
    this.cdr.detectChanges();
  }
}
