
import {merge as observableMerge, fromEvent as observableFromEvent,  BehaviorSubject ,  Observable } from 'rxjs';
import {distinctUntilChanged, debounceTime,  catchError, map, tap, startWith } from 'rxjs/operators';
import { Component, OnInit, ViewEncapsulation, ElementRef, ViewChild, Inject } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
/* import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core'; */
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Contact } from './secretar.class';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatPaginator, MatSort } from '@angular/material';
import { SocketService } from './socket.service';
/* import * as moment from 'moment'; */

@Component({
  selector: 'app-secretar',
  styleUrls: ['secretar.component.css'],
  templateUrl: 'secretar.component.html',
  providers: [SocketService]
})
export class SecretarComponent implements OnInit {
  displayedColumns = ['idshow', 'isppodrName', 'sum', 'numdoc', 'datedoc', 'datenow', 'typedocshow', 'targetshow'];
  dataSource: ExampleDataSource | null;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;

  constructor(public socket: SocketService, public dialog: MatDialog) { }

  openDialogAdd(): void {
    const dialogRef = this.dialog.open(SecretarAddComponent, {
      width: '1024px',
      data: { isp: this.socket.isppodrs, args: this.socket.args }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.socket.send('append', result);
    });
  }
  openDialogEdit(row: Contact): void {
    const dialogRef = this.dialog.open(SecretarEditComponent, {
      width: '1024px',
      data: { isp: this.socket.isppodrs, args: this.socket.args, row: row }
    });

    dialogRef.afterClosed().subscribe(result => {
      /* this.socket.send('update', result); */
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
        const searchStr = item.numdoc.toLowerCase();
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
        case 'sum': [propertyA, propertyB] = [a.sum, b.sum]; break;
        case 'idshow': [propertyA, propertyB] = [a.idshow, b.idshow]; break;
        case 'isppodrName': [propertyA, propertyB] = [a.isppodrName, b.isppodrName]; break;
        case 'numdoc': [propertyA, propertyB] = [a.numdoc, b.numdoc]; break;
        case 'datedoc': [propertyA, propertyB] = [a.datedoc, b.datedoc]; break;
        case 'datenow': [propertyA, propertyB] = [a.datenow, b.datenow]; break;
        case 'typedocshow': [propertyA, propertyB] = [a.typedocshow, b.typedocshow]; break;
        case 'targetshow': [propertyA, propertyB] = [a.targetshow, b.targetshow]; break;
      }
      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;
      return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }
}

@Component({
  selector: 'app-secretar-dialog-add',
  styleUrls: ['./view/AddDialog.css'],
  templateUrl: './view/AddDialog.html',
  encapsulation: ViewEncapsulation.None,
})
export class SecretarAddComponent implements OnInit {
  sum_regexp = /^\d+([,.]?\d{2})?$/;
  proxyValue: any;
  addForm = new FormGroup({
    'sum': new FormControl('', [Validators.required, Validators.pattern(this.sum_regexp)]),
    'numdoc': new FormControl('', [Validators.required]),
    'type': new FormControl(1),
    'target': new FormControl(2),
    'isppodr': new FormControl('', [Validators.required]),
    'datedoc': new FormControl(new Date(), [Validators.required]),
    'datenow': new FormControl(new Date(), [Validators.required]),
  });
  isppodrs: any;
  types = [];
  targets = [];
  filteredIsp: Observable<any[]>;
  constructor(
    public dialogRef: MatDialogRef<SecretarAddComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private fb: FormBuilder) {
    this.isppodrs = this.data.isp;
    for (const i in this.data.args.type) {
      if (this.data.args.type.hasOwnProperty(i)) {
        this.types.push({ id: parseInt(i, 10), val: this.data.args.type[i] });
      }
    }
    for (const i in this.data.args.target) {
      if (this.data.args.target.hasOwnProperty(i)) {
        this.targets.push({ id: parseInt(i, 10), val: this.data.args.target[i] });
      }
    }
  }
  displayView(object?: any): string | undefined {
    console.log(object);
    return object ? object.name : undefined;
  }
  ngOnInit() {
    this.filteredIsp = this.addForm.controls['isppodr'].valueChanges
      .pipe(
        startWith<string | any>(''),
        map(val => (typeof val === 'string' ? val : val.name)),
        map(val => this.filter(val))
      );
  }

  filter(val: string): string[] {
    console.log(val);
    return this.isppodrs.filter(isp =>
      isp.name.toLowerCase().indexOf(val.toLowerCase()) >= 0);
  }
  _keyPressSum(event: any) {
    const pattern = /^[0-9,.]*$/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }
  _keyPressDate(event: any) {
    console.table(this.addForm.controls['datedoc']);
    const pattern = /^[0-9]*$/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmSelection(): void {
    const form = this.addForm.value;
    this.dialogRef.close(form);
  }
}

@Component({
  selector: 'app-secretar-dialog-edit',
  styleUrls: ['./view/editDialog.css'],
  templateUrl: './view/editDialog.html',
  encapsulation: ViewEncapsulation.None,
})
export class SecretarEditComponent implements OnInit {
  sum_regexp = /^\d+([,.]?\d{2})?$/;
  addForm = new FormGroup({
    'sum': new FormControl(this.data.row.sum, [Validators.required, Validators.pattern(this.sum_regexp)]),
    'numdoc': new FormControl(this.data.row.numdoc, [Validators.required]),
    'type': new FormControl(this.data.row.typedoc),
    'target': new FormControl(this.data.row.target),
    'isppodr': new FormControl(this.data.row.isppodrName, [Validators.required]),
    'datedoc': new FormControl(this.data.row.datedoc, [Validators.required]),
    'datenow': new FormControl(this.data.row.datenow, [Validators.required]),
  });
  isppodrs: any;
  types = [];
  targets = [];
  filteredIsp: Observable<any[]>;
  constructor(
    public dialogRef: MatDialogRef<SecretarEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private fb: FormBuilder) {
    console.table(this.data.row);
    this.isppodrs = this.data.isp;
    for (const i in this.data.args.type) {
      if (this.data.args.type.hasOwnProperty(i)) {
        this.types.push({ id: parseInt(i, 10), val: this.data.args.type[i] });
      }
    }
    for (const i in this.data.args.target) {
      if (this.data.args.target.hasOwnProperty(i)) {
        this.targets.push({ id: parseInt(i, 10), val: this.data.args.target[i] });
      }
    }
  }

  ngOnInit() {
    this.filteredIsp = this.addForm.controls['isppodr'].valueChanges
      .pipe(
        startWith(''),
        map(val => this.filter(val))
      );
  }

  filter(val: string): string[] {
    return this.isppodrs.filter(isp =>
      isp.name.toLowerCase().indexOf(val.toLowerCase()) >= 0);
  }
  _keyPressSum(event: any) {
    const pattern = /^[0-9,.]*$/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }
  _keyPressDate(event: any) {
    console.table(this.addForm.controls['datedoc']);
    const pattern = /^[0-9]*$/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmSelection(): void {
    const form = this.addForm.value;
    this.dialogRef.close(form);
  }
}
