
import {merge as observableMerge, fromEvent as observableFromEvent,  BehaviorSubject ,  Observable } from 'rxjs';

import {distinctUntilChanged, debounceTime,  catchError, map, tap, startWith } from 'rxjs/operators';
import { Component, OnInit, ViewEncapsulation, ElementRef, ViewChild, Inject } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
import { FormControl } from '@angular/forms';
import { Contact } from './isppodr.ref.class';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatPaginator, MatSort } from '@angular/material';
import { SocketService } from './socket.service';






@Component({
  selector: 'app-isppodrs-ref',
  styleUrls: ['isppodr.ref.component.css'],
  templateUrl: 'isppodr.ref.component.html',
  providers: [SocketService]
})
export class IsppodrsRefComponent implements OnInit {
  displayedColumns = ['isppodrName', 'name', 'dolj', 'email', 'phone'];
  dataSource: ExampleDataSource | null;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;

  constructor(public socket: SocketService, public dialog: MatDialog) { }

  openDialogAdd(): void {
    const dialogRef = this.dialog.open(IsppodrsRefAddDigalogComponent, {
      width: '1000px',
      data: { isp: this.socket.isppodrs, types: this.socket.types }
    });

    dialogRef.afterClosed().subscribe(result => {
      /* if (result) { */
      this.socket.send('append', result);
      /* } */
    });
  }
  openDialogEdit(row: Contact): void {
    const dialogRef = this.dialog.open(IsppodrsRefEditDigalogComponent, {
      width: '1000px',
      data: { isp: this.socket.isppodrs, types: this.socket.types, row: row }
    });

    dialogRef.afterClosed().subscribe(result => {
      /*   */
      this.socket.send('update', result);
      /* } */
    });
  }
  ngOnInit() {
    this.dataSource = new ExampleDataSource(this.socket, this.paginator, this.sort);
    observableFromEvent(this.filter.nativeElement, 'keyup').pipe(
      debounceTime(550),
      distinctUntilChanged())
      .subscribe(() => {
        if (!this.dataSource) { return; }
        this.dataSource.filter = this.filter.nativeElement.value;
      });
  }
}

export class ExampleDataSource extends DataSource<any> {
  _filterChange = new BehaviorSubject('');
  get filter(): string { return this._filterChange.value; }
  set filter(filter: string) { this._filterChange.next(filter); }
  filteredData: Contact[] = [];
  renderedData: Contact[] = [];
  constructor(private _socketService: SocketService, private _paginator: MatPaginator, private _sort: MatSort) {
    super();
    this._filterChange.subscribe(() => this._paginator.pageIndex = 0);
  }
  connect(): Observable<Contact[]> {
    const displayDataChanges = [
      this._socketService.dataChange,
      this._filterChange,
      this._paginator.page,
      this._sort.sortChange,
    ];
    return observableMerge(...displayDataChanges).pipe(map(() => {
      this.filteredData = this._socketService.data.slice().filter((item: Contact) => {
        const searchStr = item.name.toLowerCase();
        return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
      });
      const sortedData = this.sortData(this.filteredData.slice());
      const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
      this.renderedData = sortedData.splice(startIndex, this._paginator.pageSize);
      return this.renderedData;
    }));
  }
  disconnect() { }
  sortData(data: Contact[]): Contact[] {
    if (!this._sort.active || this._sort.direction === '') { return data; }
    return data.sort((a, b) => {
      let propertyA: number | string = '';
      let propertyB: number | string = '';
      switch (this._sort.active) {
        case 'id': [propertyA, propertyB] = [a.id, b.id]; break;
        case 'isppodrName': [propertyA, propertyB] = [a.isppodrName, b.isppodrName]; break;
        case 'name': [propertyA, propertyB] = [a.name, b.name]; break;
        case 'dolj': [propertyA, propertyB] = [a.dolj, b.dolj]; break;
        case 'email': [propertyA, propertyB] = [a.email, b.email]; break;
        case 'phone': [propertyA, propertyB] = [a.phone, b.phone]; break;
      }
      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;
      return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }
}

@Component({
  selector: 'app-isppodrs-ref-dialog-add',
  styleUrls: ['./view/AddDialog.css'],
  templateUrl: './view/AddDialog.html',
  encapsulation: ViewEncapsulation.None,
})
export class IsppodrsRefAddDigalogComponent implements OnInit {
  isppodrs: any;
  myControl: FormControl = new FormControl();
  typesControl = new FormControl();
  types: any;
  name: string;
  isppodrName: string;
  dolj: string;
  email: string;
  phone: string;
  filteredIsp: Observable<any[]>;
  constructor(
    public dialogRef: MatDialogRef<IsppodrsRefAddDigalogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.isppodrs = this.data.isp;
    this.types = this.data.types;
  }

  ngOnInit() {
    this.filteredIsp = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(val => this.filter(val))
      );
  }

  filter(val: string): string[] {
    return this.isppodrs.filter(isp =>
      isp.name.toLowerCase().indexOf(val.toLowerCase()) === 0);
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmSelection(): void {
    if (this.myControl.value && this.name && (this.phone || this.email)) {
      const result = {
        types: this.typesControl.value,
        name: this.name,
        isppodr: this.myControl.value,
        dolj: this.dolj,
        email: this.email,
        phone: this.phone
      };
      this.dialogRef.close(result);
    }
  }
}

@Component({
  selector: 'app-isppodrs-ref-dialog-edit',
  styleUrls: ['./view/EditDialog.css'],
  templateUrl: './view/EditDialog.html',
  encapsulation: ViewEncapsulation.None,
})
export class IsppodrsRefEditDigalogComponent implements OnInit {
  isppodrs: any;
  ispControl: FormControl;
  typesControl: FormControl;
  types: any;
  name: string;
  isppodrName: string;
  dolj: string;
  email: string;
  phone: string;
  filteredIsp: Observable<any[]>;
  constructor(
    public dialogRef: MatDialogRef<IsppodrsRefEditDigalogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.ispControl = new FormControl(this.data.row.isppodrName);
    this.typesControl = new FormControl(this.data.row.types);
    this.isppodrs = this.data.isp;
    this.types = this.data.types;
    this.name = this.data.row.name || '';
    this.isppodrName = this.data.row.isppodrName || '';
    this.dolj = this.data.row.dolj || '';
    this.email = this.data.row.email || '';
    this.phone = this.data.row.phone || '';
    console.table(this.data.row);
  }
  confirmSelection(): void {
    if (this.ispControl.value && this.name && (this.phone || this.email)) {
      const result = {
        id: this.data.row.id,
        types: this.typesControl.value,
        name: this.name,
        isppodr: this.ispControl.value,
        dolj: this.dolj,
        email: this.email,
        phone: this.phone
      };
      this.dialogRef.close(result);
    }
  }
  ngOnInit() {
    this.filteredIsp = this.ispControl.valueChanges
      .pipe(
        startWith(''),
        map(val => this.filter(val))
      );
  }

  filter(val: string): string[] {
    return this.isppodrs.filter(isp =>
      /* isp.name.toLowerCase().indexOf(val.toLowerCase()) === 0); */
      isp.name.toLowerCase().includes(val.toLowerCase()));
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
}
