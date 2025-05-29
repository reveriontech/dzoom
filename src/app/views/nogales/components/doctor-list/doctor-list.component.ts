import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TrackByFunction,
  ViewEncapsulation,
} from '@angular/core';
import { MyConstants } from '@ejfdelgado/ejflab-common/src/MyConstants';
import { MyDetailedUserData, MyLocalUserData } from '../../nogales.component';
import { ConnectToRoomOptions } from '../waitingroom/ChatManager.component';

@Component({
  selector: 'app-doctor-list',
  templateUrl: './doctor-list.component.html',
  styleUrls: ['./doctor-list.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class DoctorListComponent implements OnInit {
  @Input() people?: { [key: string]: MyDetailedUserData };
  @Input() getMissedMessagesCount: Function;
  @Output() connectToRoomNamedAs: EventEmitter<ConnectToRoomOptions> =
    new EventEmitter();

  constructor() { }

  ngOnInit(): void { }

  connectToRoom(keyValue: any) {
    this.connectToRoomNamedAs.emit({
      otherId: keyValue.key,
      roleType: 'provider',
    });
  }

  getRoot() {
    return MyConstants.SRV_ROOT;
  }

  trackById: TrackByFunction<{ key: string, value: MyDetailedUserData }> = (index, person) => person.key;
}
