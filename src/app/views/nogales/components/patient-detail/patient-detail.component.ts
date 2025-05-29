import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { MyDetailedUserData } from '../../nogales.component';


@Component({
  selector: 'app-patient-detail',
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.css', '../../nogales.css'],
  standalone: false,
})
export class PatientDetailComponent {
  @Input() patient: MyDetailedUserData;
  @Input() uuid: string;
  @Input() counter: number;
  @Output() connectToRoomEvent: EventEmitter<string> = new EventEmitter();
  @Output() videoCallEvent: EventEmitter<{ key: string, value: MyDetailedUserData }> = new EventEmitter();
  getRoot() {
    return MyConstants.SRV_ROOT;
  }

  getImageUrl() {
    return this.getRoot() + 'srv/nogales/get_photo/' + this.patient.socket;
  }

  connectToRoom() {
    this.connectToRoomEvent.emit(this.uuid);
  }

  videoCall() {
    this.videoCallEvent.emit({
      key: this.uuid,
      value: this.patient
    });
  }
}
