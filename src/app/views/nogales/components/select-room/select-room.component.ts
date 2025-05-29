import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { NogalesUtiles } from '../../nogalesutiles';
import { RoomGroup } from '../account-dashboard/account-dashboard.component';

@Component({
  selector: 'app-select-room',
  templateUrl: './select-room.component.html',
  styleUrls: ['../../nogales.css', './select-room.component.css'],
})
export class SelectRoomComponent implements OnInit, OnChanges {
  roomSelectControl = new FormControl('');
  @Input() roomGroups: RoomGroup[];
  @Input() myOwnPath: string;
  @Input() selectedPath: string;
  @Output() roomChange: EventEmitter<string> = new EventEmitter();
  copiedState: string = 'not_copied';
  constructor(private clipboard: Clipboard) { }

  ngOnChanges(changes: SimpleChanges): void {
    if ('roomGroups' in changes || 'myOwnPath' in changes) {
      this.roomSelectControl.setValue(this.myOwnPath);
    }
  }

  ngOnInit(): void {
    this.roomSelectControl.valueChanges.subscribe((value: any) => {
      this.roomChange.emit(value);
    });
    this.roomSelectControl.setValue(this.selectedPath);
  }

  copyCurrentUrlToClipboard() {
    // Get current url
    const val = this.roomSelectControl.getRawValue();
    if (val) {
      const url = NogalesUtiles.getRoomUrlFromPath(val);
      this.clipboard.copy(url);
      this.copiedState = 'copied';
      setTimeout(() => {
        this.copiedState = 'not_copied';
      }, 2000);
    }
  }
}
