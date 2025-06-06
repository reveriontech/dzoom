import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ModalService } from 'ejflab-front-lib';
import { PatientService, UserData } from 'src/app/services/user.service';
import { MyThrottle } from '@ejfdelgado/ejflab-common/src/MyThrottle';
import { PaginationComponent, PaginationData } from '../../pagination/pagination.component';

@Component({
  selector: 'app-popup-sharedroom-users',
  templateUrl: './popup-sharedroom-users.component.html',
  styleUrls: ['../../../nogales.css', '../../../nogales-table.css', '../../../nogales-popup.css', './popup-sharedroom-users.component.css'],
})
export class PopupSharedroomUsersComponent implements OnInit {
  form: FormGroup;
  users: UserData[] = [];
  roomId: string;
  throttle = new MyThrottle(100, false);
  resetPaging: boolean = true;
  pagination: PaginationData = {
    limit: 10,
    offset: 0,
    direction: 'DESC',
    orderColumn: 'name',
    page: 0,
  };
  @ViewChild('shared_user_pagination') sharedUserPaginationComponent: PaginationComponent;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PopupSharedroomUsersComponent>,
    private modalSrv: ModalService,
    public patientSrv: PatientService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data) {
      this.roomId = data.roomId;
    }
  }
  ngOnInit(): void {
    this.form = this.fb.group({
      search: ['', []],
    });
    this.resetPaging = true;
    this.loadPrivateUsersInternal();
  }

  async cancel() {
    this.dialogRef.close();
  }

  async accept() {
    this.dialogRef.close();
  }

  async paginate(forward: boolean) {
    //
  }

  loadPrivateUsers(reset: boolean = false) {
    this.resetPaging = reset;
    this.throttle.throttle(this.loadPrivateUsersInternal.bind(this));
  }

  async loadPrivateUsersInternal() {
    if (this.resetPaging) {
      this.users = [];
    }
    let q: any = this.form.get("search")?.getRawValue();
    if (typeof q == "string") {
      q = q.trim();
    }
    this.pagination.q = q;
    this.pagination.offset = this.users.length;
    const tempList = await this.patientSrv.paginateRoomPermission(this.roomId, this.pagination);
    this.users.push(...tempList);
    if (this.sharedUserPaginationComponent) {
      this.sharedUserPaginationComponent.update();
    }
  }

  async updatePrivatePermission(user: UserData) {
    setTimeout(async () => {
      const user_id = user.user_id;
      const grant = user.permission_granted;
      await this.patientSrv.updateRoomPermission(this.roomId, user_id, grant);
    });
  }

  getUsers(): UserData[] {
    return PaginationComponent.filterList(this.pagination, this.users);
  }
}
