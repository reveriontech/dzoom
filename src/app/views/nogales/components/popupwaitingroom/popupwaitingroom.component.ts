import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
//import { VideoWebStream } from 'ejflab-front-lib';//edgar
import {
  InMemoryState,
  SharedState,
} from '../waitingroom/ChatManager.component';
import { NogalesUtiles } from '../../nogalesutiles';
import { VideoWebStream } from "../../../../temporal/VideoWebStream";//edgar

@Component({
  selector: 'app-popupwaitingroom',
  templateUrl: './popupwaitingroom.component.html',
  styleUrls: ['../../nogales.css', './popupwaitingroom.component.css'],
})
export class PopupwaitingroomComponent implements OnInit, OnDestroy {
  myControl: FormControl<string | null>;
  sharedState: SharedState;
  inMemoryState: InMemoryState;
  videoManager: VideoWebStream;
  videoManagerSubscription: Subscription;
  self: any;
  MAX_USERNAME_LENGTH = 60;
  @ViewChild('local_video') localVideoRef: ElementRef;
  showMenuThreeDots: boolean = false;
  constructor(
    private dialogRef: MatDialogRef<PopupwaitingroomComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.sharedState = data.sharedState;
    this.inMemoryState = data.inMemoryState;
    this.videoManager = data.videoManager;
    let oldUserName: string = data.oldUserName;
    if (!oldUserName) {
      oldUserName = '';
    }
    this.sharedState.patient.name = oldUserName;
    this.myControl = new FormControl<string | null>(oldUserName, [
      Validators.required,
      Validators.maxLength(this.MAX_USERNAME_LENGTH),
    ]);
    this.self = this;
    this.videoManagerSubscription = this.videoManager.emitterStreams.subscribe(
      (streams: any) => {
        this.inMemoryState.stream = streams;
        this.configureVideoStream();
      }
    );
  }

  async ngOnInit(): Promise<void> {
    this.configureVideoStream();
    this.myControl.valueChanges.subscribe((name) => {
      if (name) {
        this.sharedState.patient.name = name;
      }
    });
  }

  async configureVideoStream() {
    if (!this.localVideoRef) {
      return;
    }
    this.localVideoRef.nativeElement.muted = true;
    this.localVideoRef.nativeElement.srcObject = this.inMemoryState.stream?.big;
  }

  patientHasName() {
    if (!this.myControl.valid) {
      return false;
    }
    let current: any = this.myControl.value;
    if (typeof current == 'string') {
      current = current.trim();
    }
    return ['', null, undefined].indexOf(current) < 0;
  }

  async continue() {
    // grab photo thumbnail
    const imageBytes = await NogalesUtiles.grabVideoThumbnail(this.localVideoRef.nativeElement);
    this.dialogRef.close({
      sharedState: this.sharedState,
      imageBytes
    });
  }

  async ngOnDestroy(): Promise<void> {
    if (this.videoManagerSubscription) {
      this.videoManagerSubscription.unsubscribe();
    }
  }
}
