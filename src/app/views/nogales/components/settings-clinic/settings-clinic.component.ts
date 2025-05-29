import { Component, EventEmitter, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { HttpService, MicrosoftAuthService, ModalService, UserMicrosoft } from 'ejflab-front-lib';
import { PopupSharedroomCreateComponent } from '../settings-popup/popup-sharedroom-create/popup-sharedroom-create.component';
import { PopupSharedroomUsersComponent } from '../settings-popup/popup-sharedroom-users/popup-sharedroom-users.component';
import { Subscription } from 'rxjs';
import { MyThrottle } from '@ejfdelgado/ejflab-common/src/MyThrottle';
import { PatientService, UserData } from 'src/app/services/user.service';
import { PaginationComponent, PaginationData } from '../pagination/pagination.component';

export interface SharedRoomData {
  room_id: string;
  owner: string;
  title: string;
  created?: number,
  updated?: number,
  is_public?: number,
}

@Component({
  selector: 'app-settings-clinic',
  templateUrl: './settings-clinic.component.html',
  styleUrls: ['../../nogales.css', '../../nogales-table.css', './settings-clinic.component.css'],
})
export class SettingsClinicComponent implements OnInit, OnDestroy {
  currentPanelId: string | null = null;
  formSharedRoom: FormGroup;
  formPrivateRoom: FormGroup;
  sharedRooms: SharedRoomData[] = [];
  throttle = new MyThrottle(100, false);
  resetLoadSharedRoom: boolean = false;
  resetLoadPrivateRoom: boolean = true;
  actualSubscription: Subscription | null = null;
  profilePreReadEvents: EventEmitter<any> = new EventEmitter();
  state: any = {
    privateLoaded: false,
    sharedLoaded: false,
  };
  sharedRoomPagination: PaginationData = {
    limit: 1,
    offset: 0,
    direction: 'DESC',
    orderColumn: 'created',
    page: 0,
  };
  privateRoomUserPagination: PaginationData = {
    limit: 1,
    offset: 0,
    direction: 'DESC',
    orderColumn: 'name',
    page: 0,
  };
  principal: UserMicrosoft | null = null;
  privateUsers: UserData[] = [];
  @ViewChild('private_user_pagination') privateRoomUserPaginationComponent: PaginationComponent;
  @ViewChild('shared_room_pagination') sharedRoomPaginationComponent: PaginationComponent;

  constructor(
    private fb: FormBuilder,
    private modalSrv: ModalService,
    private dialog: MatDialog,
    public httpSrv: HttpService,
    public authSrv: MicrosoftAuthService,
    public patientSrv: PatientService,
  ) {
    this.profilePreReadEvents.subscribe((data) => {
      Object.assign(this.state, data);
      if (this.state.authenticated) {
        if (this.state.panelId == "private_room" && !this.state.privateLoaded) {
          this.loadPrivateRoom();
        } else if (this.state.panelId == "shared_room" && !this.state.sharedLoaded) {
          this.loadSharedRoom();
        }
      }
    });
  }

  ngOnInit(): void {
    this.formSharedRoom = this.fb.group({
      search: ['', []],
    });
    this.formPrivateRoom = this.fb.group({
      search: ['', []],
    });
    this.actualSubscription = this.authSrv.onAuthStateChanged(
      async (user: UserMicrosoft | null) => {
        if (user) {
          this.principal = user;
          this.profilePreReadEvents.emit({ authenticated: true });
        } else {
          this.principal = null;
          this.profilePreReadEvents.emit({ authenticated: false });
        }
      });
  }
  ngOnDestroy(): void {
    if (this.actualSubscription) {
      this.actualSubscription.unsubscribe();
    }
  }

  updateState(panelId: string, opened: boolean) {
    if (opened) {
      this.currentPanelId = panelId;
      this.profilePreReadEvents.emit({ panelId });
    } else {
      this.currentPanelId = null;
      this.profilePreReadEvents.emit({ panelId: null });
    }
  }

  async loadPrivateRoom() {
    const response: any = await this.httpSrv.get("srv/nogales/room/assure_my_room");
    this.loadPrivateUsers(true);
  }

  getPrivateRoomId() {
    const userId = this.principal?.username.toLowerCase();
    if (!userId) {
      return null;
    }
    const roomIdParts = /^([^@]+)@/.exec(userId);
    if (!roomIdParts) {
      return null;
    }
    return roomIdParts[1];
  }

  loadPrivateUsers(reset: boolean = false) {
    this.resetLoadPrivateRoom = reset;
    this.throttle.throttle(this.loadPrivateUsersInternal.bind(this));
  }

  async loadPrivateUsersInternal() {

    const roomId = this.getPrivateRoomId();
    if (!roomId) {
      return;
    }
    if (this.resetLoadPrivateRoom) {
      this.privateUsers = [];
    }
    let q: any = this.formPrivateRoom.get("search")?.getRawValue();
    if (typeof q == "string") {
      q = q.trim();
    }
    this.privateRoomUserPagination.q = q;
    this.privateRoomUserPagination.offset = this.privateUsers.length;
    const tempList = await this.patientSrv.paginateRoomPermission(roomId, this.privateRoomUserPagination);
    if (tempList.length > 0) {
      this.privateUsers.push(...tempList);
    }
    // Ask pagination component update
    if (this.privateRoomUserPaginationComponent) {
      this.privateRoomUserPaginationComponent.update();
    }
  }

  getSharedRooms(): SharedRoomData[] {
    return PaginationComponent.filterList(this.sharedRoomPagination, this.sharedRooms);
  }

  getPrivateUsers(): Array<UserData> {
    return PaginationComponent.filterList(this.privateRoomUserPagination, this.privateUsers);
  }

  loadSharedRoom(reset: boolean = false) {
    this.resetLoadSharedRoom = reset;
    this.throttle.throttle(this.loadSharedRoomInternal.bind(this));
  }

  async loadSharedRoomInternal() {
    let q: any = this.formSharedRoom.get("search")?.getRawValue();
    if (typeof q == "string") {
      q = q.trim();
    }
    if (this.resetLoadSharedRoom) {
      this.sharedRooms = [];
    }
    this.sharedRoomPagination.q = q;
    this.sharedRoomPagination.offset = this.sharedRooms.length;
    const searchParams = new URLSearchParams(this.sharedRoomPagination as any);
    const response: any = await this.httpSrv.get("srv/nogales/room/paginate?" + searchParams.toString());
    if (response instanceof Array) {
      this.sharedRooms.push(...response);
    }
    this.state.sharedLoaded = true;
    // Ask pagination component update
    if (this.sharedRoomPaginationComponent) {
      this.sharedRoomPaginationComponent.update();
    }
  }

  async createSharedRoom() {
    // Open popup
    const dialogRef = this.dialog.open(PopupSharedroomCreateComponent, {
      data: {
        create: true,
        room_id: '',
        title: '',
      },
      disableClose: false,
      panelClass: ['popup_1', 'nogalespopup'],
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.created) {
        this.loadSharedRoom(true);
      }
    });
  }

  async manageRoomUsers(room: SharedRoomData) {
    // Open popup
    this.dialog.open(PopupSharedroomUsersComponent, {
      data: {
        roomId: room.room_id
      },
      disableClose: false,
      panelClass: ['popup_1', 'nogalespopup'],
    });
  }

  async redirectEditWaitingRoom() {
    // Open in other tab
  }

  async showMeetingHistory(room: SharedRoomData) {
    // Actually it open another tab
    // But one could see that here.
  }

  async manageRoomSettings(room: SharedRoomData) {
    // Open popup
    const dialogRef = this.dialog.open(PopupSharedroomCreateComponent, {
      data: {
        create: false,
        room_id: room.room_id,
        title: room.title,
      },
      disableClose: false,
      panelClass: ['popup_1', 'nogalespopup'],
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.created) {
        this.loadSharedRoom(true);
      }
    });
  }

  async deleteSharedRoom(room: SharedRoomData) {
    const response = await this.modalSrv.confirm({
      title: "room.base.settings.tabs.clinic.section.popup.delete.title",
      txt: "room.base.settings.tabs.clinic.section.popup.delete.txt",
      translateFolder: "nogales",
      model: {
        room
      }
    });
    if (response) {
      const searchParams = new URLSearchParams({
        room_id: room.room_id,
      });
      try {
        const response: any = await this.httpSrv.delete("srv/nogales/room/delete?" + searchParams.toString());
        this.modalSrv.alert({
          title: "room.base.settings.tabs.clinic.section.popup.delete_ok.title",
          txt: "room.base.settings.tabs.clinic.section.popup.delete_ok.txt",
          translateFolder: "nogales",
          model: {
            room
          }
        });
        this.loadSharedRoom(true);
      } catch (err) {
        //
      }
    }
  }

  async paginateUsers(forward: boolean) {
    //
  }

  async copyRoomUrl() {
    //
  }

  async updatePrivatePermission(user: UserData) {
    const room_id = this.getPrivateRoomId();
    if (!room_id) {
      return;
    }
    setTimeout(async () => {
      const user_id = user.user_id;
      const grant = user.permission_granted;
      await this.patientSrv.updateRoomPermission(room_id, user_id, grant);
    });
  }

  isUserInSomeGroup(groups: string[]) {
    return this.authSrv.isUserInGroupInternal(this.principal, groups, false);
  }
}
