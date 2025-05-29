import { ChangeDetectionStrategy, signal, Component, EventEmitter, Input, Output } from '@angular/core';
import { StateData } from '../waitingroom/IntroManager.component';
import { TabData } from '../simple-tab/simple-tab.component';

@Component({
  selector: 'app-room-settings',
  templateUrl: './room-settings.component.html',
  styleUrl: './room-settings.component.css',
})
export class RoomSettingsComponent {
  @Input() tabState: string | null;
  @Output() stateChange: EventEmitter<StateData> = new EventEmitter();
  tabOptions: TabData[] = [
    {
      id: "settings-profile",
      lang: "room.base.settings.tabs.profile.title",
    },
    {
      id: "settings-clinic",
      lang: "room.base.settings.tabs.clinic.title",
    },
  ];

  contructor() {

  }

  goBack() {
    this.stateChange.emit({ name: null });
  }

  changeTab(tabId: string) {
    this.stateChange.emit({ name: tabId });
  }
}
