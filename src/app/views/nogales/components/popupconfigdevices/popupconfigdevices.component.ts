import {
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { 
  DevicesData, 
  VideoWebStream //edgar
} from 'ejflab-front-lib';
import { IndicatorService } from 'ejflab-front-lib';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { ModuloSonido } from '@ejfdelgado/ejflab-common/src/ModuloSonido';
import {
  InMemoryState,
  SharedState,
} from '../waitingroom/ChatManager.component';
//import { VideoWebStream } from "../../../../temporal/VideoWebStream";//edgar

@Component({
  selector: 'app-popupconfigdevices',
  templateUrl: './popupconfigdevices.component.html',
  styleUrls: ['./popupconfigdevices.component.css'],
})
export class PopupconfigdevicesComponent implements OnInit, OnDestroy {
  @ViewChild('local_video') localVideoRef: ElementRef;
  @ViewChild('sample_audio') sampleAudioRef: ElementRef;
  sharedState: SharedState;
  inMemoryState: InMemoryState;
  videoManager: VideoWebStream;
  videoManagerSubscription: Subscription | null;
  sampleIsPlaying: boolean = false;
  micIconPath: string = `${MyConstants.SRV_ROOT}assets/img/mic/nmic_0.svg`;
  volumeSubscription: Subscription | null = null;
  constructor(
    private indicatorSrv: IndicatorService,
    private dialogRef: MatDialogRef<PopupconfigdevicesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.sharedState = data.sharedState;
    this.inMemoryState = data.inMemoryState;
    this.videoManager = data.videoManager;
    this.videoManagerSubscription = this.videoManager.emitterStreams.subscribe(
      (streams: any) => {
        this.inMemoryState.stream = streams;
        this.configureVideoStream();
      }
    );
  }
  ngOnDestroy(): void {
    if (this.volumeSubscription) {
      this.volumeSubscription.unsubscribe();
    }
    if (this.videoManagerSubscription) {
      this.videoManagerSubscription.unsubscribe();
    }
    this.stopSampleSound();
  }

  ngOnInit(): void {
    this.videoManager.autoReloadDevices().then(async (devices: DevicesData) => {
      this.updateSelectedSpeaker();
    });
    requestAnimationFrame(() => {
      this.configureVideoStream();
    });
    this.volumeSubscription = this.videoManager.volumeEmitter.subscribe(
      (volume: number) => {
        this.micIconPath = `${MyConstants.SRV_ROOT}assets/img/mic/nmic_${volume}.svg`;
      }
    );
  }

  async configureVideoStream() {
    this.updateSelectedSpeaker();
    if (!this.localVideoRef) {
      return;
    }
    this.localVideoRef.nativeElement.muted = true;
    this.localVideoRef.nativeElement.srcObject = this.inMemoryState.stream?.big;
  }

  toggleMicState() {
    this.sharedState.micState = !this.sharedState.micState;
    this.applyMicState();
  }

  applyMicState() {
    if (this.inMemoryState.currentDevices.audio) {
      this.videoManager.useAudioDevice(this.inMemoryState.currentDevices.audio);
    }
    if (this.inMemoryState.stream) {
      this.inMemoryState.stream.audio.getAudioTracks()[0].enabled =
        this.sharedState.micState;
    }
  }

  toggleVideoState() {
    this.sharedState.videoState = !this.sharedState.videoState;
    this.applyVideoState();
  }

  applyVideoState() {
    if (this.inMemoryState.currentDevices.video) {
      this.videoManager.useVideoDevice(this.inMemoryState.currentDevices.video);
    }
    if (this.inMemoryState.stream) {
      this.inMemoryState.stream.big.getVideoTracks()[0].enabled =
        this.sharedState.videoState;
      this.inMemoryState.stream.small.getVideoTracks()[0].enabled =
        this.sharedState.videoState;
    }
  }

  async updateSelectedDevice() {
    const promesa = this.indicatorSrv.start();
    try {
      await this.videoManager.getUserMedia();
      this.applyMicState();
      this.applyVideoState();
    } catch (err) {
      console.log(err);
    }
    promesa.done();
  }

  async updateSelectedSpeaker() {
    requestAnimationFrame(() => {
      const selected = this.inMemoryState.currentDevices.speaker;
      if (selected) {
        console.log(`Set Sink Id with ${selected}`);
        this.videoManager.useSpeakerDevice(selected);
        this.sampleAudioRef.nativeElement.setSinkId?.(selected);
        ModuloSonido.setSincId(selected);
      }
    });
  }

  async startSampleSound() {
    if (!this.sampleAudioRef) {
      return;
    }
    this.sampleAudioRef.nativeElement.play();
    this.sampleIsPlaying = true;
  }

  async stopSampleSound() {
    if (!this.sampleAudioRef) {
      return;
    }
    this.sampleAudioRef.nativeElement.pause();
    this.sampleIsPlaying = false;
  }

  cancel() {
    this.dialogRef.close();
  }

  getRoot() {
    return MyConstants.SRV_ROOT;
  }
}
