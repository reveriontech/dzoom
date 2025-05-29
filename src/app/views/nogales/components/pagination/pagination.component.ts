import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';

export interface PaginationData {
  limit: number; // same as pageSize
  offset: number;
  direction: "DESC" | "ASC";
  orderColumn: string;
  page: number;
  q?: string;
};

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent {
  @Input() lang: string;
  @Input() list: any[];
  @Input() page: number;
  @Output() pageChange: EventEmitter<number> = new EventEmitter();
  @Input() pageSize: number;
  @Output() pageSizeChange: EventEmitter<number> = new EventEmitter();
  @Output() next: EventEmitter<void> = new EventEmitter();
  @Output() previous: EventEmitter<void> = new EventEmitter();

  pagingOptions: Array<{ id: number, txt: string }> = [
    { id: 1, txt: "1" },
    { id: 2, txt: "2" },
    { id: 10, txt: "10" },
    { id: 20, txt: "20" },
    { id: 50, txt: "50" },
    { id: 100, txt: "100" },
  ];

  constructor(
    private cdr: ChangeDetectorRef
  ) {

  }

  tryToIncrease: boolean = false;
  currentList: number[] = [];

  getPages(): number[] {
    return this.currentList;
  }

  update() {
    console.log("update!");
    // compute how many pages has
    const pages = Math.ceil(this.list.length / this.pageSize);
    this.currentList = [];
    for (let i = 0; i < pages; i++) {
      this.currentList.push(i);
    }
    // Fix page if needed
    if (this.tryToIncrease) {
      this.page++;
      this.tryToIncrease = false;
    }
    if (this.page > pages - 1) {
      this.page = pages - 1;
    }
    this.notifyPageChange();
  }

  nextAction() {
    this.tryToIncrease = true;
    this.notifyPageChange();
    this.next.emit();
  }

  previousAction() {
    this.tryToIncrease = false;
    if (this.page == 0) {
      return;
    }
    this.page -= 1;
    this.notifyPageChange();
    this.previous.emit();
  }

  goToPage(pageId: number) {
    this.tryToIncrease = false;
    this.page = pageId;
    this.notifyPageChange();
  }

  notifyPageChange() {
    this.pageChange.emit(this.page);
  }

  updatePageSize() {
    // Ask to reload from scratch
    this.page = 0;
    this.notifyPageChange();
    this.pageSizeChange.emit(this.pageSize);
  }

  static filterList(pagination: PaginationData, list: Array<any>) {
    const startIndex = pagination.page * pagination.limit;
    const endIndex = (pagination.page + 1) * pagination.limit;
    return list.filter((elem, index) => {
      const evaluation = (startIndex <= index && index < endIndex);
      return evaluation;
    });
  }
}
