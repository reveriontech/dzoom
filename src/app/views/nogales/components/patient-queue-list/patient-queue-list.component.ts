import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TrackByFunction,
  ViewEncapsulation,
} from '@angular/core';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { MyDetailedUserData, MyLocalUserData } from '../../nogales.component';
import { ConnectToRoomOptions } from '../waitingroom/ChatManager.component';

export interface StartCallData {
  personKey: string;
  person: MyLocalUserData;
}

@Component({
  selector: 'app-patient-queue-list',
  templateUrl: './patient-queue-list.component.html',
  styleUrls: ['./patient-queue-list.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class PatientQueueListComponent implements OnInit, OnDestroy {
  @Input() people?: { [key: string]: MyDetailedUserData };
  @Input() inCallView: boolean;
  @Input() getMissedMessagesCount: Function;
  @Output() connectToRoomNamedAs: EventEmitter<ConnectToRoomOptions> =
    new EventEmitter();
  @Output() startCallAction: EventEmitter<StartCallData> = new EventEmitter();
  @Output() endCallAction: EventEmitter<StartCallData> = new EventEmitter();

  refreshInterval: NodeJS.Timeout | null = null;
  counter: number = 0;

  constructor(public cdr: ChangeDetectorRef) { }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  ngOnInit(): void {
    this.refreshInterval = setInterval(() => {
      this.counter += 1;
      this.cdr.detectChanges();
    }, 60000);
  }

  connectToRoom(keyValue: string) {
    this.connectToRoomNamedAs.emit({
      otherId: keyValue,
      roleType: 'patient',
    });
  }

  startCallWith(personKey: string, person: MyLocalUserData) {
    this.startCallAction.emit({ personKey, person });
  }

  endCallWith(personKey: string, person: MyLocalUserData) {
    this.endCallAction.emit({ personKey, person });
  }

  getRoot() {
    return MyConstants.SRV_ROOT;
  }

  trackById: TrackByFunction<{ key: string, value: MyDetailedUserData }> = (index, person) => person.key;
}
