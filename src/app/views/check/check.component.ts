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

@Component({
  selector: 'app-check',
  templateUrl: './check.component.html',
  styleUrl: './check.component.css'
})
export class CheckComponent extends BaseComponent implements OnInit {
  override usePage(): boolean {
    return false;
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
  }

}
