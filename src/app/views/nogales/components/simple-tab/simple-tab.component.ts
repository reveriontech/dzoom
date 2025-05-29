import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface TabData {
  id: string;
  name?: string;
  lang?: string;
};

@Component({
  selector: 'app-simple-tab',
  templateUrl: './simple-tab.component.html',
  styleUrl: './simple-tab.component.css'
})
export class SimpleTabComponent {
  @Input() states: TabData[];
  @Input() stateId: string | null;
  @Output() stateIdChange: EventEmitter<string> = new EventEmitter();

  selectTab(selected: TabData) {
    this.stateId = selected.id;
    this.stateIdChange.emit(this.stateId);
  }
}
