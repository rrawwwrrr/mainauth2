
import { merge as observableMerge, fromEvent as observableFromEvent, BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, debounceTime, catchError, map, tap, startWith } from 'rxjs/operators';
import { Component, OnInit, ViewEncapsulation, ElementRef, ViewChild, Inject } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
/* import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core'; */
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatPaginator, MatSort } from '@angular/material';
import { SocketService, Files, File } from './socket.service';
import { HttpRequest, HttpResponse, HttpEventType, HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-my-files',
  styleUrls: ['myfiles.component.css'],
  templateUrl: 'myfiles.component.html',
  providers: [SocketService]
})
export class MyFilesComponent implements OnInit {
  displayedColumns = ['filename', 'publ', 'created'];
  dataSource: ExampleDataSource | null;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild('filter', {static: true}) filter: ElementRef;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(public socket: SocketService, public dialog: MatDialog) { }

  openDialogAdd(): void {
    const dialogRef = this.dialog.open(MyFilesAddComponent, {
      width: '1024px',
      data: { isp: this.socket.isppodrs, args: this.socket.args }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.socket.send('append', result);
    });
  }
  openDialogEdit(row: Files): void {
    const dialogRef = this.dialog.open(MyFilesEditComponent, {
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
  filteredData: Files[] = [];
  renderedData: Files[] = [];
  constructor(private _socketService: SocketService, private _paginator: MatPaginator, private _sort: MatSort) {
    super();
    this._filterChange.subscribe(() => this._paginator.pageIndex = 0);
  }
  connect(): Observable<Files[]> {
    const displayDataChanges = [
      this._socketService.dataChange,
      this._filterChange,
      this._paginator.page,
      this._sort.sortChange,
    ];
    return observableMerge(...displayDataChanges).pipe(map(() => {
      this.filteredData = this._socketService.data.slice().filter((item: Files) => {
        const searchStr = item.filename.toLowerCase();
        return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
      });
      const sortedData = this.sortData(this.filteredData.slice());
      const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
      this.renderedData = sortedData.splice(startIndex, this._paginator.pageSize);
      return this.renderedData;
    }));
  }
  disconnect() { }
  sortData(data: Files[]): Files[] {
    if (!this._sort.active || this._sort.direction === '') { return data; }
    return data.sort((a, b) => {
      let propertyA: number | string = '';
      let propertyB: number | string = '';
      switch (this._sort.active) {
        case 'filename': [propertyA, propertyB] = [a.filename, b.filename]; break;
        case 'publ': [propertyA, propertyB] = [a.publ, b.publ]; break;
        case 'created': [propertyA, propertyB] = [a.created, b.created]; break;
      }
      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;
      return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }
}

@Component({
  selector: 'app-myfiles-dialog-add',
  styleUrls: ['./view/AddDialog.css'],
  templateUrl: './view/AddDialog.html',
  encapsulation: ViewEncapsulation.None,
})
export class MyFilesAddComponent {
  dataChangeFiles: BehaviorSubject<File[]> = new BehaviorSubject<File[]>([]);
  formNewFiles: FormGroup;
  get dataFiles(): File[] { return this.dataChangeFiles.value; }
  filteredIsp: Observable<any[]>;
  constructor(
    public dialogRef: MatDialogRef<MyFilesAddComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private el: ElementRef, private http: HttpClient, private fb: FormBuilder) {
    this.formNewFiles = fb.group({
      checkRar: [false],
      checkRarPwd: [false],
      nameRar: [''],
      pwdRar: [''],
      startdate: [moment().add(1, 'month').format()],
      stopdate: [new Date()]
    });
  }

  _keyPressDate(event: any) {
    const pattern = /^[0-9]*$/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  upload() {
    const inputEl: HTMLInputElement = this.el.nativeElement.querySelector('#photo');
    const fileCount: number = inputEl.files.length;
    if (fileCount > 0) {
      for (let i = 0; i < fileCount; i++) {
        const formData = new FormData();
        formData.append('photo', inputEl.files.item(i));
        const req = new HttpRequest('POST', environment.apiUrl + '/files/help/myfile', formData, {
          reportProgress: true
        });
        const copiedData = this.dataFiles.slice();
        copiedData.push({ id: i, filename: inputEl.files.item(i).name, percent: 0, upload: null, tmp: null, src: '' });
        this.dataChangeFiles.next(copiedData);
        this.http.request(req)
          .subscribe(event => {
            if (event.type === HttpEventType.UploadProgress) {
              const percentDone = Math.round(100 * event.loaded / event.total);
              const copiedData2 = this.dataFiles.slice();
              copiedData2.forEach((file, index) => {
                if (file.filename === inputEl.files.item(i).name) {
                  copiedData2[index].percent = percentDone;
                  this.dataChangeFiles.next(copiedData2);
                  return;
                }
              });
            } else if (event instanceof HttpResponse) {
              if (event.body['status'] === 'ok') {
                const copiedData2 = this.dataFiles.slice();
                copiedData.forEach((file, index) => {
                  if (file.filename === inputEl.files.item(i).name) {
                    copiedData2[index].upload = event.body['path'] + '' + file.filename;
                    copiedData2[index].tmp = event.body['tmp'];
                    this.dataChangeFiles.next(copiedData2);
                    return;
                  }
                });
              }
            }
          });
      }
    }
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
  confirmSelection(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-myfiles-dialog-edit',
  styleUrls: ['./view/editDialog.css'],
  templateUrl: './view/editDialog.html',
  encapsulation: ViewEncapsulation.None,
})
export class MyFilesEditComponent implements OnInit {
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
    public dialogRef: MatDialogRef<MyFilesEditComponent>,
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
