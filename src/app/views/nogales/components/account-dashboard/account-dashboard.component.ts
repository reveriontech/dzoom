import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EmailShareComponent } from '../email-share/email-share.component';
import { MatDialog } from '@angular/material/dialog';
import { UserMicrosoft } from 'ejflab-front-lib';

export interface Room {
  value: string;
  viewValue: string;
}

export interface RoomGroup {
  disabled?: boolean;
  shared: boolean;
  name: string;
  rooms: Room[];
}

@Component({
  selector: 'app-account-dashboard',
  templateUrl: './account-dashboard.component.html',
  styleUrls: ['../../nogales.css', './account-dashboard.component.css'],
})
export class AccountDashboardComponent implements OnInit {
  @Input() roomGroups: RoomGroup[];
  @Input() selectedPath: string;
  @Input() myOwnPath: string;
  @Input() currentUser: UserMicrosoft | null = null;
  @Output() selectedPathChange: EventEmitter<string> = new EventEmitter();

  constructor(
    private dialog: MatDialog,
    public cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void { }

  roomChange(room: string) {
    this.selectedPath = room;
    this.selectedPathChange.emit(room);
    this.cdr.detectChanges();
  }

  async openSendEmailPopUp() {
    const dialogRef = this.dialog.open(EmailShareComponent, {
      data: {
        selectedPath: this.selectedPath,
        roomGroups: this.roomGroups,
        myOwnPath: this.myOwnPath,
        provider: this.currentUser
      },
      //disableClose: true,
      panelClass: ['popup_1', 'nogalespopup'],
    });
    const response = await new Promise<any>((resolve) => {
      if (dialogRef) {
        dialogRef.afterClosed().subscribe((result) => {
          resolve(result);
        });
      }
    });
  }
}
