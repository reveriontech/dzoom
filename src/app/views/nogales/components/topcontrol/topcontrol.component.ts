import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import {
  DeviceOption,
  //VideoWebStream,//edgar
} from 'ejflab-front-lib';
import { IndicatorService } from 'ejflab-front-lib';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { PopupconfigdevicesComponent } from '../popupconfigdevices/popupconfigdevices.component';
import {
  InMemoryState,
  SharedState,
} from '../waitingroom/ChatManager.component';
import { VideoWebStream } from "../../../../temporal/VideoWebStream";//edgar

@Component({
  selector: 'app-topcontrol',
  templateUrl: './topcontrol.component.html',
  styleUrls: ['./topcontrol.component.css'],
})
export class TopcontrolComponent implements OnInit, OnDestroy {
  @Input() videoManager: VideoWebStream;
  @Input() sharedState: SharedState;
  @Input() inMemoryState: InMemoryState;
  @Input() showMenuThreeDots: boolean;
  @Output() stateChanged: EventEmitter<string> = new EventEmitter();
  @Output() sourceChanged: EventEmitter<string> = new EventEmitter();
  deviceChoices: Array<DeviceOption> = [];
  state: 'none' | 'audio' | 'video' = 'none';
  micIconPath: string = `${MyConstants.SRV_ROOT}assets/img/mic/mic_0.svg`;
  volumeSubscription: Subscription | null = null;
  constructor(
    private indicatorSrv: IndicatorService,
    private dialog: MatDialog
  ) {}

  ngOnDestroy(): void {
    if (this.volumeSubscription) {
      this.volumeSubscription.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.volumeSubscription = this.videoManager.volumeEmitter.subscribe(
      (volume: number) => {
        this.micIconPath = `${MyConstants.SRV_ROOT}assets/img/mic/mic_${volume}.svg`;
      }
    );
  }

  toggleMicState() {
    this.sharedState.micState = !this.sharedState.micState;
    this.stateChanged.emit('mic');
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
    this.stateChanged.emit('video');
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

  letSelectCamera() {
    this.state = 'video';
    this.deviceChoices = this.inMemoryState.devices.videos;
  }

  letSelectMicrophone() {
    this.state = 'audio';
    this.deviceChoices = this.inMemoryState.devices.audios;
  }

  hasMultipleMicrophones() {
    return this.inMemoryState.devices.audios.length > 1;
  }

  hasMultipleCameras() {
    return this.inMemoryState.devices.videos.length > 1;
  }

  async selectDevice(choice: DeviceOption) {
    const promesa = this.indicatorSrv.start();
    if (this.state == 'audio') {
      if (this.inMemoryState.currentDevices.audio == choice.id) {
        this.state = 'none';
        promesa.done();
        return;
      }
      this.inMemoryState.currentDevices.audio = choice.id;
    } else if (this.state == 'video') {
      if (this.inMemoryState.currentDevices.video == choice.id) {
        this.state = 'none';
        promesa.done();
        return;
      }
      this.inMemoryState.currentDevices.video = choice.id;
    }
    try {
      await this.videoManager.getUserMedia();
      this.applyMicState();
      this.applyVideoState();
    } catch (err) {
      console.log(err);
    }
    promesa.done();
    this.state = 'none';
    this.deviceChoices = [];
    this.sourceChanged.emit();
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

  getRoot() {
    return MyConstants.SRV_ROOT;
  }
}
