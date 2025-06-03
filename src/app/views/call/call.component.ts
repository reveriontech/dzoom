import { Buffer } from 'buffer';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
} from '@angular/core';

import { Auth } from '@angular/fire/auth';
import { ActivatedRoute } from '@angular/router';
import { BackendPageService } from 'ejflab-front-lib';
import { AuthService } from 'ejflab-front-lib';
import { MatDialog } from '@angular/material/dialog';
import { TupleService } from 'ejflab-front-lib';
import { ModalService } from 'ejflab-front-lib';
import { WebcamService } from 'ejflab-front-lib';
import { FileService } from 'ejflab-front-lib';
import { FlowchartService } from 'ejflab-front-lib';
import { CallService } from 'ejflab-front-lib';
import { EchoLogProcessor } from 'ejflab-front-lib';
import { BaseComponent } from 'ejflab-front-lib';
import {
  DevicesData,
  MultiScaleMediaStream,
  SelectedDeviceData,
  VideoWebStream,//edgar
} from 'ejflab-front-lib';
import { RTCCom } from 'ejflab-front-lib';//edgar
import { Subscription } from 'rxjs';
import { UpdateUserListProcessor } from 'ejflab-front-lib';
import { RemoveUserProcessor } from 'ejflab-front-lib';
//import { VideoWebStream } from "../../temporal/VideoWebStream";//edgar
//import { RTCCom } from "../../temporal/RTCCom";//edgar

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.css'],
})
export class CallComponent extends BaseComponent implements OnInit {
  @ViewChild('local_video') localVideoRef: ElementRef;
  mesageOverChannel: string = '';
  devices: DevicesData;
  currentDevices: SelectedDeviceData;
  videoManager: VideoWebStream = new VideoWebStream();
  streams: MultiScaleMediaStream | null = null;
  selectedVideoStream: string = 'big';
  inCall: boolean = false;
  onDataChanelSubscription: Subscription | null = null;
  onStatusChangeSubscription: Subscription | null = null;
  updateSpeakerThis: Function;

  constructor(
    public override flowchartSrv: FlowchartService,
    public override callService: CallService,
    public override route: ActivatedRoute,
    public override pageService: BackendPageService,
    public override cdr: ChangeDetectorRef,
    public override authService: AuthService,
    public override dialog: MatDialog,
    public override tupleService: TupleService,
    public override fileService: FileService,
    public override modalService: ModalService,
    public override webcamService: WebcamService,
    public override auth: Auth
  ) {
    super(
      flowchartSrv,
      callService,
      route,
      pageService,
      cdr,
      authService,
      dialog,
      tupleService,
      fileService,
      modalService,
      webcamService,
      auth
    );
    this.builderConfig.roomName = 'videocall';
    this.updateSpeakerThis = this.updateSpeaker.bind(this);
    this.devices = this.videoManager.devices;
    this.currentDevices = this.videoManager.currentDevices;
    if (this.onStatusChangeSubscription) {
      this.onStatusChangeSubscription.unsubscribe();
    }
    this.onStatusChangeSubscription = RTCCom.onStatusChange(() => {
      this.cdr.detectChanges();
    });
    this.videoManager.emitterStreams.subscribe((streams) => {
      this.streams = streams;
      RTCCom.setMediaStream(streams);
      this.showVideoStream(this.selectedVideoStream);
    });
    this.socketIoConnect();
  }
  override usePage(): boolean {
    return false;
  }
  override async ngOnInit() {
    await super.ngOnInit();
    this.reloadDevices();
  }

  reloadDevices() {
    this.videoManager.autoReloadDevices().then(async (devices: DevicesData) => {
      this.devices = devices;
      this.cdr.detectChanges();
      try {
        await this.videoManager.getUserMedia();
      } catch (err) {
        console.log(err);
      }
    });
  }

  async updateAudio() {
    try {
      const stream = await this.videoManager.getUserMedia();
      RTCCom.setMediaStream(stream);
      if (this.inCall) {
        await this.startCall();
      }
    } catch (err) {
      RTCCom.setMediaStream(null);
    }
  }

  async updateVideo() {
    try {
      const stream = await this.videoManager.getUserMedia();
      RTCCom.setMediaStream(stream);
      if (this.inCall) {
        await this.startCall();
      }
    } catch (err) {
      RTCCom.setMediaStream(null);
    }
  }

  stopStream() {
    this.videoManager.stopStream();
  }

  showVideoStream(name: string) {
    this.selectedVideoStream = name;
    const videoElement = this.localVideoRef.nativeElement;
    if (videoElement && this.streams) {
      const streams: any = this.streams;
      videoElement.srcObject = streams[name];
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

  async hangUser(socketId: string) {
    await RTCCom.closeChannelWith(socketId);
  }

  async callUser(socketId: string) {
    await RTCCom.closeChannelWith(socketId);
    await RTCCom.openChannelWith(socketId, ['text']);
  }

  async reloadConnection(socketId: string) {
    await RTCCom.closeChannelWith(socketId);
    setTimeout(async () => {
      await RTCCom.openChannelWith(socketId, ['text']);
    }, 0);
  }

  async stopCall() {
    this.inCall = false;
    for (let i = 0; i < this.userList.length; i++) {
      const socketIdL = this.userList[i];
      RTCCom.closeChannelWith(socketIdL);
    }
  }

  async startCall() {
    this.inCall = false;
    const promesas = [];
    const socketId = this.getCallServiceInstance().getSocketId();
    for (let i = 0; i < this.userList.length; i++) {
      const socketIdL = this.userList[i];
      if (socketId !== socketIdL) {
        promesas.push(this.reloadConnection(socketIdL));
      }
    }
    await Promise.all(promesas);
    this.inCall = true;
  }

  bindEvents() {
    console.log('bindEvents');
    const instance = this.getCallServiceInstance();
    instance.registerProcessor('connect', async (message: any) => {
      await RTCCom.init(instance);
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
      if (this.inCall) {
        this.startCall();
      }
    });
    instance.registerProcessor('echoLog', (message: any) => {
      new EchoLogProcessor(this).execute(message);
    });
    instance.registerProcessor('updateUserList', (message: any) => {
      new UpdateUserListProcessor(this).execute(message);
    });
    instance.registerProcessor('removeUser', (message: any) => {
      new RemoveUserProcessor(this).execute(message);
    });
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
}
