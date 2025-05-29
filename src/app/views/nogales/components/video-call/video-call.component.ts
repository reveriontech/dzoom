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
  QueryList,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import {
  DevicesData,
  MultiScaleMediaStream,
  SelectedDeviceData,
  //VideoWebStream,
  Wait,
} from 'ejflab-front-lib';
import { AuthService } from 'ejflab-front-lib';
import { BackendPageService } from 'ejflab-front-lib';
import { CallService } from 'ejflab-front-lib';
import { FileService } from 'ejflab-front-lib';
import { FlowchartService } from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';
import { TupleService } from 'ejflab-front-lib';
import { WebcamService } from 'ejflab-front-lib';
//import { RTCCom } from 'ejflab-front-lib';//edgar
import { EchoLogProcessor } from 'ejflab-front-lib';
import { UpdateUserListProcessor } from 'ejflab-front-lib';
import { RemoveUserProcessor } from 'ejflab-front-lib';
import { UserMicrosoft } from 'ejflab-front-lib';
import { IndicatorService } from 'ejflab-front-lib';
import sortify from '@ejfdelgado/ejflab-common/src/sortify';
import { MyThrottle } from '@ejfdelgado/ejflab-common/src/MyThrottle';
import {
  InMemoryState,
  SharedState,
} from '../waitingroom/ChatManager.component';
import { SimpleObj } from '@ejfdelgado/ejflab-common/src/SimpleObj';
import { ReceiveLiveChangesProcessor } from 'ejflab-front-lib';
import { SetModelProcessor } from 'ejflab-front-lib';
import { ModuloSonido } from '@ejfdelgado/ejflab-common/src/ModuloSonido';
import { PeerOnFrontContext } from './PeerOnFrontContext';
import { VideoWebStream } from "../../../../temporal/VideoWebStream";//edgar
import { RTCCom } from "../../../../temporal/RTCCom";//edgar


@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.css', '../../nogales.css'],
})
export class VideoCallComponent
  extends PeerOnFrontContext
  implements OnInit, OnDestroy {
  @Output() stopCallAction: EventEmitter<void> = new EventEmitter();
  @Output() toggleLeftMenuEvent: EventEmitter<boolean> = new EventEmitter();
  @Output() isInCall: EventEmitter<boolean> = new EventEmitter();
  @Input() stateToggleLeftMenu: boolean;
  @Input() sharedState: SharedState;
  @Input() inMemoryState: InMemoryState;
  @Input() videoManager: VideoWebStream;
  @Input() currentUser: UserMicrosoft | null = null;
  @Input() isChatOpen: boolean;
  @ViewChild('local_video') localVideoRef: ElementRef;
  @ViewChild('main_container') mainContainerRef: ElementRef;
  @ViewChild('center_video') centerVideoRef: ElementRef;
  mesageOverChannel: string = '';
  devices: DevicesData;
  currentDevices: SelectedDeviceData;
  streams: MultiScaleMediaStream | null = null;
  onDataChanelSubscription: Subscription | null = null;
  onStatusChangeSubscription: Subscription | null = null;
  videoManagerStreamSubscription: Subscription | null = null;
  initPeerHtmlElementsThis: Function;
  adjustViewThis: Function;
  autoConfigureThis: Function;
  centerVideoStyle: { [key: string]: string } = {};
  stateToggleFullScreen: boolean = false;
  stateToggleViewOrientation: boolean = true;
  displayVideoCall: boolean = false;


  streamWatcher: EventEmitter<boolean> = new EventEmitter<boolean>();
  streamWatcherBool: boolean = false;
  streamWatcherSubscription: Subscription | null = null;
  updatePeerOnFrontSubscription: Subscription | null = null;
  conectionWatcher: EventEmitter<boolean> = new EventEmitter<boolean>();
  conectionWatcherBool: boolean = false;
  conectionWatcherSubscription: Subscription | null = null;
  notReadyConnection: Wait | null = null;
  notReadyStream: Wait | null = null;

  throttle = new MyThrottle(1000, false);
  // Take into account last invocation

  forceRefresh: boolean = false;
  forceRefreshAll: boolean = false;
  stopingCall: boolean = false;

  constructor(
    public override flowchartSrv: FlowchartService,
    public override callService: CallService,
    public route: ActivatedRoute,
    public pageService: BackendPageService,
    public override cdr: ChangeDetectorRef,
    public authService: AuthService,
    public dialog: MatDialog,
    public tupleService: TupleService,
    public fileService: FileService,
    public override modalService: ModalService,
    public webcamService: WebcamService,
    public auth: Auth,
    private indicatorSrv: IndicatorService
  ) {
    //VideoWebStream.TUMBNAIL_HEIGHT = 155 / 1.5;
    console.log('VideoCallComponent constructor()');
    super(flowchartSrv, callService, modalService, cdr);
    this.builderConfig.roomName = "none";//To avoid disconnect from public
    this.initPeerHtmlElementsThis = this.initPeerHtmlElements.bind(this);
    this.autoConfigureThis = this.autoConfigure.bind(this);
    this.adjustViewThis = this.adjustView.bind(this);
    // Configure prerequisites
    this.configureMainEvents();
  }

  getStreams(): MultiScaleMediaStream | null {
    return this.streams;
  }

  getCenterVideoRef(): ElementRef<any> {
    return this.centerVideoRef;
  }

  initVariables() {
    this.stopingCall = false;
  }

  destroyMainEvents() {
    if (this.updatePeerOnFrontSubscription) {
      this.updatePeerOnFrontSubscription.unsubscribe();
    }
    if (this.streamWatcherSubscription) {
      this.streamWatcherSubscription.unsubscribe();
    }
    if (this.conectionWatcherSubscription) {
      this.conectionWatcherSubscription.unsubscribe();
    }
  }

  configureMainEvents() {
    this.destroyMainEvents();
    this.updatePeerOnFrontSubscription = RTCCom.streamActive.subscribe((event: any) => {
      console.log("streamActive!");
      if (event.type == 'audio') {
        //
      }
      this.updatePeerOnFront();
    });
    this.streamWatcherSubscription = this.streamWatcher.subscribe(
      (value: boolean) => {
        console.log(`streamWatcher? ${value}`);
        this.streamWatcherBool = value;
        if (!this.streamWatcherBool) {
          if (!this.notReadyStream) {
            this.notReadyStream = this.indicatorSrv.start();
          }
        } else {
          this.notReadyStream?.done();
          this.notReadyStream = null;
        }
        this.checkState();
      }
    );
    this.conectionWatcherSubscription = this.conectionWatcher.subscribe(
      (value: boolean) => {
        console.log(`conectionWatcher? ${value}`);
        this.conectionWatcherBool = value;
        if (!this.conectionWatcherBool) {
          if (!this.notReadyConnection) {
            this.notReadyConnection = this.indicatorSrv.start();
          }
        } else {
          this.notReadyConnection?.done();
          this.notReadyConnection = null;
        }
        this.checkState();
      }
    );
  }

  checkState() {
    this.adjustView();
    if (this.streamWatcherBool && this.conectionWatcherBool) {
      console.log('Fire fixAllConnections');
      this.playSound('success2.mp3', false, 0.2);
      this.isInCall.emit(true);
      this.fixAllConnections();
      // Only do this if screen is small
      //this.closeLeftMenu();
    }
  }

  async waitUntilReady(): Promise<void> {
    const streamPromise = new Promise<void>((resolve) => {
      if (this.streamWatcherBool) {
        resolve();
      } else {
        const subscription = this.streamWatcher.subscribe((value: boolean) => {
          if (value) {
            subscription.unsubscribe();
            resolve();
          }
        });
      }
    });
    const connectionPromise = new Promise<void>((resolve) => {
      if (this.conectionWatcherBool) {
        resolve();
      } else {
        const subscription = this.conectionWatcher.subscribe(
          (value: boolean) => {
            if (value) {
              subscription.unsubscribe();
              resolve();
            }
          }
        );
      }
    });
    await Promise.all([streamPromise, connectionPromise]);
  }

  isProvider(): boolean {
    return this.currentUser != null;
  }

  logCurrentDevices() {
    const audioSource = this.currentDevices.audio;
    const videoSource = this.currentDevices.video;
    console.log(
      `VideoCallComponent.logCurrentDevices... video:${videoSource} audio:${audioSource}`
    );
  }

  async videoCallConnect(roomName: string) {
    console.log(`videoCallConnect(${roomName})`);
    this.builderConfig.roomName = roomName;
    await this.socketIoConnect();
  }

  async openVideoCallDisplay(destroyModel: boolean = false) {
    if (destroyModel) {
      console.log('Destroying old model...');
      this.destroyModelSimple();
    }
    this.initVariables();
    this.configureMainEvents();
    this.devices = this.videoManager.devices;
    this.currentDevices = this.videoManager.currentDevices;
    ModuloSonido.setSincId(this.currentDevices.speaker);
    this.displayVideoCall = true;
  }

  async autoConfigure() {
    console.log(`autoConfigure...`);
    this.streamWatcher.emit(false);
    //this.videoManager.logCurrentDevices();
    const activityIndicator = this.indicatorSrv.start();
    try {
      this.destroyConfiguration();
      // Wait html elements are present...
      await this.waitUntilElementsReady();

      this.onStatusChangeSubscription = RTCCom.onStatusChange(() => {
        this.cdr.detectChanges();
      });

      this.videoManagerStreamSubscription =
        this.videoManager.emitterStreams.subscribe(
          (streams: MultiScaleMediaStream) => {
            this.streams = streams;
            RTCCom.setMediaStream(streams);
            this.showVideoStream();
            this.streamWatcher.emit(true);
            // Configure volume
            this.startVoiceDetection(streams.audio);
          }
        );
      await this.reloadDevices();
    } catch (err) {
      // it is poped up on other places
      console.log(err);
      this.streamWatcher.emit(false);
    }
    activityIndicator.done();
  }

  async waitUntilElementsReady() {
    while (!this.localVideoRef) {
      await this.sleep(500);
    }
  }

  destroyConfiguration() {
    if (this.onStatusChangeSubscription) {
      this.onStatusChangeSubscription.unsubscribe();
    }
    if (this.videoManagerStreamSubscription) {
      this.videoManagerStreamSubscription.unsubscribe();
    }
  }

  async videoCallDisconnect() {
    await this.socketIoDisconnect();
  }

  override async ngOnInit(): Promise<void> {
    super.ngOnInit();
  }

  override async ngOnDestroy() {
    await super.ngOnDestroy();
  }

  async reloadDevices() {
    console.log(`reloadDevices...`);
    this.videoManager.autoReloadDevices().then(async (devices: DevicesData) => {
      this.devices = devices;
      this.cdr.detectChanges();
      try {
        const stream = await this.videoManager.getUserMedia();
        RTCCom.setMediaStream(stream);
      } catch (err) {
        console.log(err);
      }
    });
  }

  async updateAudio() {
    try {
      const stream = await this.videoManager.getUserMedia();
      RTCCom.setMediaStream(stream);
    } catch (err) {
      RTCCom.setMediaStream(null);
    }
  }

  async updateVideo() {
    try {
      const stream = await this.videoManager.getUserMedia();
      RTCCom.setMediaStream(stream);
    } catch (err) {
      RTCCom.setMediaStream(null);
    }
  }

  stopStream() {
    this.videoManager.stopStream();
  }

  /**
   * Shows local video
   * @param name
   * @returns
   */
  showVideoStream() {
    if (!this.localVideoRef) {
      console.log(`ERROR: No this.localVideoRef`);
      return;
    }
    const videoElement = this.localVideoRef.nativeElement;
    if (!videoElement) {
      console.log(`ERROR: No videoElement`);
      return;
    }
    if (!this.streams) {
      console.log(`ERROR: No this.streams`);
      return;
    }
    if (videoElement && this.streams) {
      const streams: MultiScaleMediaStream = this.streams;
      videoElement.srcObject = streams.small;
    }
  }

  useChannel(socketId: string) {
    const ahora = new Date().getTime();
    const message = `Hola cómo estás ${socketId} ${ahora}`;
    RTCCom.send(socketId, 'text', message);
  }

  toggleStream(socketId: string) {
    RTCCom.connectStreamToHtmlElement(socketId);
  }

  getNativeElementFromSocket(
    socketId: string,
    list: QueryList<ElementRef>
  ): HTMLVideoElement | null {
    const filtered = list.toArray().filter((elemRef) => {
      const socketIdRef = elemRef.nativeElement.getAttribute('data-socket-id');
      return socketIdRef == socketId;
    });
    if (filtered.length > 0) {
      return filtered[0].nativeElement;
    } else {
      return null;
    }
  }

  async reloadConnection(socketId: string) {
    await RTCCom.closeChannelWith(socketId);
    setTimeout(async () => {
      await RTCCom.openChannelWith(socketId, ['text']);
    }, 0);
  }

  async stopCall() {
    if (this.stopingCall === true) {
      return;
    }
    this.stopingCall = true;
    try {
      console.log('videoCall.stopCall()');
      this.destroyConfiguration();
      this.destroyMainEvents();
      this.stopVoiceDetection();
      if (this.isProvider()) {
        // Only provider closes completely the call
        this.getCallServiceInstance().emitEvent('closeVideoChat', {
          room: this.builderConfig.roomName,
        });
      } else {
        // Patient just disconnect
        this.videoCallDisconnect();
      }
      for (let i = 0; i < this.userList.length; i++) {
        const socketIdL = this.userList[i];
        RTCCom.closeChannelWith(socketIdL);
      }
      this.isInCall.emit(this.displayVideoCall);
      this.stopCallAction.emit();
      this.playSound('hangdown.mp3', false, 0.1);
      if (this.isProvider()) {
        this.destroyModelSimple();
      }
    } catch (err) {
      location.reload();
    }
    this.displayVideoCall = false;
  }

  destroyModelSimple() {
    const instance = this.getCallServiceInstance();
    instance.emitEvent('destroyModel', {});
  }

  updateMyLiveModel() {
    const instance = this.getCallServiceInstance();
    const socketId = instance.socketId;
    //Read name and uuid
    const uuid = this.getSessionStorageValue('ANONYMOUS_USER');
    let name = this.getCookie('NOG_USER_NAME');
    if (this.isProvider()) {
      name = this.currentUser?.name;
    }
    if (socketId) {
      SimpleObj.recreate(
        this.livemodel,
        `data.people.${socketId}.sharedState.uuid`,
        uuid
      );
      const myData = SimpleObj.getValue(
        this.livemodel,
        `data.people.${socketId}.sharedState`,
        {}
      );
      myData.micState = this.sharedState.micState;
      myData.videoState = this.sharedState.videoState;
      myData.name = name;
      this.trackChanges(['data', 'data.people', `data.people.${socketId}`]);
    }
  }

  readMyLiveModel(type?: string) {
    const instance = this.getCallServiceInstance();
    const socketId = instance.socketId;
    if (socketId) {
      for (let i = 0; i < this.userList.length; i++) {
        const peerSocketId = this.userList[i];
        const micState = SimpleObj.getValue(
          this.livemodel,
          `data.people.${peerSocketId}.sharedState.micState`
        );
        const videoState = SimpleObj.getValue(
          this.livemodel,
          `data.people.${peerSocketId}.sharedState.videoState`
        );
        if (socketId == peerSocketId) {
          // it'is me
          this.sharedState.micState = micState === true;
          this.sharedState.videoState = videoState === true;
          // Lets the stream do the job
          this.applyMicState();
          this.applyVideoState();
        } else {
          // It's other peer
          // Gets the audio element and apply the value
          // The audio is muted directly from the source, there is no need to mute here
          const peer = RTCCom.getPeerHtmlElements(peerSocketId);
          if (peer) {
            const { audio } = peer;
            if (audio) {
              if (audio.paused) {
                audio.play().catch(() => {
                  //ignore
                });
              }
            }
          }
        }
      }
    }
  }

  muteAudioPeer(socketId: string) {
    if (!this.isProvider()) {
      return;
    }
    SimpleObj.recreate(
      this.livemodel,
      `data.people.${socketId}.sharedState.micState`,
      false
    );
    this.trackChanges(['data', 'data.people', `data.people.${socketId}`]);
  }

  muteVideoPeer(socketId: string) {
    if (!this.isProvider()) {
      return;
    }
    SimpleObj.recreate(
      this.livemodel,
      `data.people.${socketId}.sharedState.videoState`,
      false
    );
    this.trackChanges(['data', 'data.people', `data.people.${socketId}`]);
  }

  bindEvents() {
    //this.videoManager.logCurrentDevices();
    console.log('bindEvents...');
    const instance = this.getCallServiceInstance();
    instance.registerProcessor('disconnect', async (message: any) => {
      console.log('Disconnect!');
      this.conectionWatcher.emit(false);
    });
    const connectEvent = async (message: any) => {
      console.log('connectEvent');
      // Fire update model to preserve current state
      this.updateMyLiveModel();
      // Set up the RTC channel
      await RTCCom.init(instance);
      RTCCom.mustUpdate.subscribe(async () => {
        if (this.displayVideoCall && !this.stopingCall) {
          // Try reconection!
          console.log('Try reconnection!');
          await this.sleep(500, 1000);
          this.fixAllConnections();
        }
      });
      if (this.onDataChanelSubscription) {
        this.onDataChanelSubscription.unsubscribe();
      }
      this.onDataChanelSubscription = RTCCom.onDataChannel((message: any) => {
        if (message.label == 'text') {
          const buffer = message.data;
          const texto = Buffer.from(buffer).toString('utf8');
          this.mesageOverChannel = texto;
          this.cdr.detectChanges();
        }
      });
      this.conectionWatcher.emit(true);
    };
    instance.registerProcessor('reconnect', connectEvent);
    instance.registerProcessor('connect', connectEvent);
    instance.registerProcessor('echoLog', (message: any) => {
      new EchoLogProcessor(this).execute(message);
    });
    instance.registerProcessor('updateUserList', (message: any) => {
      new UpdateUserListProcessor(this).execute(message);
      // Fire fix connections
      this.fixAllConnections();
    });
    instance.registerProcessor('removeUser', (message: any) => {
      new RemoveUserProcessor(this).execute(message);
    });
    instance.registerProcessor('closeVideoChat', async (message: any) => {
      //console.log(`closeVideoChat ${JSON.stringify(message)}`);
      if (message.room == this.builderConfig.roomName) {
        this.stopCall();
      }
    });
    instance.registerProcessor('clientChange', async (message: any) => {
      await new ReceiveLiveChangesProcessor(this).execute(message);
      //Update current values from remote
      this.readMyLiveModel();
      this.computeLastChangedVoice();
      this.updatePeerOnFront();
    });
    instance.registerProcessor('setModel', async (message: any) => {
      await new SetModelProcessor(this).execute(message);
      this.updateMyLiveModel();
    });
  }

  getSocketIdByUUID(uuid: string): string | null {
    const people = SimpleObj.getValue(this.livemodel, 'data.people', {});
    const keys = Object.keys(people);
    for (let i = 0; i < keys.length; i++) {
      const socketId = keys[i];
      const peer = people[socketId];
      if (peer?.sharedState?.uuid == uuid) {
        return socketId;
      }
    }
    return null;
  }

  // Move this code to VideoCall!!
  getChangedPath(message: any, path: string): any {
    //console.log(JSON.stringify(message, null, 4));
    const keys = ['*', '-', '+'];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const list = message[key];
      //console.log(list);
      const actual = list.filter((elem: any) => {
        return elem.k == path;
      });
      //console.log(actual);
      if (actual.length > 0) {
        if (key == '-') {
          return {
            val: undefined,
          };
        } else {
          return {
            val: actual[0].v,
          };
        }
      }
    }
  }

  hasConnectionWith(socketId: string): boolean {
    return RTCCom.hasConnectionWith(socketId);
  }

  async refreshDevices() {
    await this.videoManager.askAgainGetDevices();
  }

  async updateSpeaker() {
    requestAnimationFrame(() => {
      this.remoteAudioRefs.toArray().forEach((audioRef) => {
        const nativeAudio = audioRef.nativeElement;
        nativeAudio.setSinkId?.(this.currentDevices.speaker);
      });
    });
  }

  async initPeerHtmlElements() {
    console.log(`initPeerHtmlElements...`);
    this.updateSpeaker();
    requestAnimationFrame(() => {
      this.registerVideoElements();
      this.registerAudioElements();
    });
  }

  async adjustView() {
    requestAnimationFrame(() => {
      this.adjustViewLocal();
    });
  }

  async adjustViewLocal() {
    //console.log('adjustViewLocal');
    if (!this.mainContainerRef) {
      return;
    }
    if (!this.centerVideoRef) {
      return;
    }

    const centerVideoStyle: { [key: string]: string } = {};

    const videoHeight = this.centerVideoRef.nativeElement.videoHeight;
    const videoWidth = this.centerVideoRef.nativeElement.videoWidth;

    const height = this.mainContainerRef.nativeElement.clientHeight;
    const width = this.mainContainerRef.nativeElement.clientWidth;

    let computedHeight = videoHeight;
    let computedWidth = videoWidth;

    computedWidth = videoWidth * (height / videoHeight);
    computedHeight = height;

    if (computedWidth > width) {
      computedHeight = computedHeight * (width / computedWidth);
      computedWidth = width;
    }

    if (computedWidth < width) {
      const half = Math.floor((width - computedWidth) / 2);
      centerVideoStyle['left'] = `${half}px`;
    } else {
      centerVideoStyle['left'] = '0';
    }
    if (computedHeight < height) {
      const half = Math.floor((height - computedHeight) / 2);
      centerVideoStyle['top'] = `${half}px`;
    } else {
      centerVideoStyle['top'] = '0';
    }

    centerVideoStyle['height'] = `${computedHeight}px`;
    centerVideoStyle['width'] = `${computedWidth}px`;
    centerVideoStyle['max-height'] = centerVideoStyle['height'];
    centerVideoStyle['max-width'] = centerVideoStyle['width'];

    // Compute margins
    const oldSortify = sortify(this.centerVideoStyle);
    const currentSortify = sortify(centerVideoStyle);
    if (currentSortify != oldSortify) {
      this.centerVideoStyle = centerVideoStyle;
      this.cdr.detectChanges();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.adjustViewLocal();
  }

  toggleLeftMenu() {
    this.toggleLeftMenuEvent.emit();
    this.adjustView();
  }

  closeLeftMenu() {
    this.toggleLeftMenuEvent.emit(false);
  }

  toggleViewOrientation() {
    this.stateToggleViewOrientation = !this.stateToggleViewOrientation;
    this.adjustView();
  }

  toggleFullScreen() {
    this.stateToggleFullScreen = !this.stateToggleFullScreen;
    if (this.stateToggleFullScreen) {
      try {
        document.documentElement.requestFullscreen();
        this.adjustView();
      } catch (err) {
        this.stateToggleFullScreen = false;
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        this.adjustView();
      }
    }
  }

  toggleMicState() {
    this.sharedState.micState = !this.sharedState.micState;
    if (this.sharedState.micState == false) {
      this.finishVoiceFun(null, false)
    }
    this.updateMyLiveModel();
    this.applyMicState();
  }

  applyMicState() {
    if (this.inMemoryState.stream) {
      this.inMemoryState.stream.audio.getAudioTracks()[0].enabled =
        this.sharedState.micState;
    }
  }

  toggleVideoState() {
    this.sharedState.videoState = !this.sharedState.videoState;
    this.updateMyLiveModel();
    this.applyVideoState();
  }

  applyVideoState() {
    if (this.inMemoryState.stream) {
      this.inMemoryState.stream.big.getVideoTracks()[0].enabled =
        this.sharedState.videoState;
      this.inMemoryState.stream.small.getVideoTracks()[0].enabled =
        this.sharedState.videoState;
    }
  }

  sourceChanged() {
    // Some video or audio source had changed, so force reopen RTCP Connection
    this.fixAllConnections(true, true);
  }

  fixAllConnections(force: boolean = false, forceAll: boolean = false) {
    if (!this.displayVideoCall) {
      return;
    }
    if (force) {
      this.forceRefresh = true;
    }
    if (forceAll) {
      this.forceRefreshAll = true;
    }
    this.throttle.throttle(this.fixAllConnectionsInternal.bind(this));
  }

  async fixAllConnectionsInternal() {
    console.log('fixAllConnections...');
    const activityIndicator = this.indicatorSrv.start();
    const promesas = [];
    const instance = this.getCallServiceInstance();
    const socketId = instance.getSocketId();
    if (!socketId) {
      console.log(`fixAllConnections ERROR: local ${socketId} is needed`);
      activityIndicator.done();
      return;
    }
    for (let i = 0; i < this.userList.length; i++) {
      const peerSocketId = this.userList[i];
      if (socketId !== peerSocketId) {
        // Only if it is different from me with myself
        if (this.forceRefreshAll || this.forceRefresh || !RTCCom.isHealthyConnection(peerSocketId)) {
          if (socketId > peerSocketId || this.forceRefreshAll) {
            promesas.push(this.reloadConnection(peerSocketId));
            console.log(`Conection with ${peerSocketId} reloading!`);
          } else {
            console.log(
              `Conection with ${peerSocketId} ignored to avoid collision...`
            );
          }
        } else {
          console.log(`Conection with ${peerSocketId} is OK`);
        }
      }
    }
    await Promise.all(promesas);
    this.forceRefresh = false;
    this.forceRefreshAll = false;
    activityIndicator.done();
    console.log('fixAllConnections... OK');
  }
}
