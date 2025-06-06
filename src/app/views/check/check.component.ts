import { v4 as uuidv4 } from 'uuid';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
} from '@angular/core';
import {
  BaseComponent,
  EchoLogProcessor,
  UpdateUserListProcessor,
  RemoveUserProcessor
} from 'ejflab-front-lib';
import { ManageResponseProcessor } from "./processors/ManageResponseProcessor";

@Component({
  selector: 'app-check',
  templateUrl: './check.component.html',
  styleUrl: './check.component.css'
})
export class CheckComponent extends BaseComponent implements OnInit {
  orchestratorData: any = null;
  currentUserUID: string = "";
  focusRoom: string = "ejdelgado";

  override usePage(): boolean {
    return false;
  }

  override async ngOnInit(): Promise<void> {
    super.ngOnInit();
    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get("room");
    if (room) {
      this.focusRoom = room;
    }
    await this.getCurrentUserUID();
    await this.connectToRoomName(this.builderConfig.roomName);
  }

  async getCurrentUserUID() {
    const cookieKey = 'ANONYMOUS_USER';
    // Ask the cookie
    let oldValue = this.getSessionStorageValue(cookieKey);
    if (!oldValue) {
      const randomId = uuidv4().replace(/-/g, '_');
      oldValue = `pat_${this.builderConfig.roomName}_${randomId}`;
      this.setSessionStorageValue(cookieKey, oldValue);
    }
    // Return cookie value
    this.currentUserUID = oldValue;
    return oldValue;
  }

  async allRooms() {
    const instance = this.getCallServiceInstance();
    instance.emitEvent('manage', {
      "action": "getUUIDMap",
    });
  }

  async roomDetail() {
    const instance = this.getCallServiceInstance();
    instance.emitEvent('manage', {
      "action": "getRoomModel",
      "roomId": this.focusRoom,
    });
  }

  bindEvents() {
    console.log('bindEvents');
    const instance = this.getCallServiceInstance();
    instance.registerProcessor('connect', async (message: any) => {
      console.log("Connect");
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
    instance.registerProcessor('manageResponse', (message: any) => {
      new ManageResponseProcessor(this).execute(message);
    });
  }
}
