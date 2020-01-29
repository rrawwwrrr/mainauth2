
import { merge as observableMerge, fromEvent as observableFromEvent, BehaviorSubject, Observable } from 'rxjs';

import { map, debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import {
  Component,
  OnInit,
  ViewEncapsulation,
  ElementRef,
  ViewChild,
  Inject
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  HttpRequest,
  HttpEventType,
  HttpResponse
} from '@angular/common/http';
import { DataSource } from '@angular/cdk/collections';
import { Contracts } from './class/contract';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatPaginator,
  MatSort
} from '@angular/material';
import { SocketService } from './service/socket.service';
import {
  FormControl,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import * as moment from 'moment';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-ozi-contracts-component',
  styleUrls: ['ozi-contracts-component.css'],
  templateUrl: 'ozi-contracts-component.html',
  providers: [SocketService]
})

export class OziContractsComponent implements OnInit {
  displayedColumnsDogs = ['id', 'menu', 'numdog', 'datedog', 'isppodr', 'sign', 'sumdog', 'creator', 'comment'];
  colors = [{ id: 1, value: '#69F0AE' }, { id: 2, value: '#388E3C' }, { id: 3, value: '#FFD740' }, { id: 4, value: '#EF6C00' }];
  dataSource: ExampleDataSource | null;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild('filter', {static: true}) filter: ElementRef;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  myKbkControl: FormControl = new FormControl('', [Validators.required]);
  constructor(private socket: SocketService, public dialog: MatDialog) { }
  openDialogAdd(): void {
    const dialogRefAdd = this.dialog.open(OziContractsDialogAddComponent, {
      width: '850px', disableClose: true, data: { otdelGroups: this.socket.otdels, people: this.socket.people }
    });

    dialogRefAdd.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.socket.newDog(result);
      }
    });
  }
  openDialogEdit(data2): void {
    const dialogRefEdit = this.dialog.open(OziContractsDialogEditComponent, {
      width: '850px', disableClose: true, data: { otdelGroups: this.socket.otdels, people: this.socket.people, data: data2 }
    });

    dialogRefEdit.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.socket.editDog(result);
      }
    });
  }
  openDialogShowSigning(data2): void {
    const dialogRefShowSigning = this.dialog.open(OziContractsDialogShowSigningComponent, {
      width: '850px', disableClose: true, data: { data: data2 }
    });

    dialogRefShowSigning.afterClosed().subscribe(result => {
      if (result !== undefined) {
        console.log(result);

      }
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
  set filter(str: string) { this._filterChange.next(str); }
  filteredData: Contracts[] = [];
  renderedData: Contracts[] = [];
  constructor(private _socketService: SocketService, private _paginator: MatPaginator, private _sort: MatSort) {
    super();
    this._filterChange.subscribe(() => this._paginator.pageIndex = 0);
  }


  connect(): Observable<Contracts[]> {
    const displayDataChanges = [
      this._socketService.dataChangeDogs,
      this._filterChange,
      this._paginator.page,
      this._sort.sortChange,
    ];
    return observableMerge(...displayDataChanges).pipe(map(() => {
      this.filteredData = this._socketService.dataDogs.slice().filter((item: Contracts) => {
        const searchStr = item.isppodr.toLowerCase();
        return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
      });
      const sortedData = this.sortData(this.filteredData.slice());

      const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
      this.renderedData = sortedData.splice(startIndex, this._paginator.pageSize);
      return this.renderedData;
    }));

  }

  disconnect() { }
  sortData(data: Contracts[]): Contracts[] {
    if (!this._sort.active || this._sort.direction === '') { return data; }

    return data.sort((a, b) => {
      let propertyA: number | string = '';
      let propertyB: number | string = '';

      switch (this._sort.active) {
        case 'id': [propertyA, propertyB] = [a.id, b.id]; break;
        case 'isppodr': [propertyA, propertyB] = [a.isppodr, b.isppodr]; break;
        case 'numdog': [propertyA, propertyB] = [a.numdog, b.numdog]; break;
        case 'datedog': [propertyA, propertyB] = [a.datedog, b.datedog]; break;
        case 'sumdog': [propertyA, propertyB] = [a.sumdog, b.sumdog]; break;
        case 'comment': [propertyA, propertyB] = [a.comment, b.comment]; break;
      }

      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }
}
export class Files {
  constructor(
    public id: number,
    public filename: string,
    public percent: number,
    public upload: string,
    public tmp: string,
  ) {
  }

}
@Component({
  selector: 'app-ozi-contracts-dialog-add',
  templateUrl: './view/dialog-add.html',
  styleUrls: ['./view/dialog-add.css'],
  encapsulation: ViewEncapsulation.None,
})
export class OziContractsDialogAddComponent implements OnInit {
  dateForm: FormGroup;
  color = 'primary';
  mode = 'determinate';
  value = 50;
  bufferValue = 75;
  namedog: string;
  datadog: string;
  summdog: string;
  commentdog: string;
  targetdog: string;
  isppodrControl: FormControl = new FormControl();
  filteredOptions: Observable<any[]>;
  dataChangeFiles: BehaviorSubject<Files[]> = new BehaviorSubject<Files[]>([]);
  get dataFiles(): Files[] { return this.dataChangeFiles.value; }
  signControl = new FormControl([1, 50, 49, 8, 5, 26, 9, 39, 58, 21]);
  constructor(
    public dialogRef: MatDialogRef<OziContractsDialogAddComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private el: ElementRef, private http: HttpClient, private fb: FormBuilder) {
    this.createForm();
  }

  ngOnInit() {
    this.filteredOptions = this.isppodrControl.valueChanges.pipe(
      debounceTime(150), filter(num => num.length > 2),
      switchMap((searchPhrase: string) => {
        return this.http.get<any>(`${environment.apiUrl}/autocomplete/isppodr/${searchPhrase}`);
      }));
  }


  createForm() {
    this.dateForm = this.fb.group({
      datePickerInput: [moment(), Validators.compose([
        Validators.required,
      ])]
    });
  }

  filesDeleteDownloadable(name) {
    const copiedData = this.dataFiles.slice();
    copiedData.forEach((file, index) => {
      if (file.filename === name) {
        copiedData.splice(index, 1);
        this.dataChangeFiles.next(copiedData);
        return;
      }
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  confirmSelection() {
    const dateValue = this.dateForm.controls.datePickerInput.value;
    const result: any = {
      numdog: this.namedog, datedog: dateValue, isppodr: this.isppodrControl.value, sumdog: this.summdog, comment: this.commentdog,
      target: this.targetdog, sign: this.signControl.value, files: this.dataFiles
    };
    this.dialogRef.close(result);
  }

  upload() {
    const inputEl: HTMLInputElement = this.el.nativeElement.querySelector('#photo');
    const fileCount: number = inputEl.files.length;
    if (fileCount > 0) {
      for (let i = 0; i < fileCount; i++) {
        const formData = new FormData();
        formData.append('photo', inputEl.files.item(i));
        const req = new HttpRequest('POST', environment.apiUrl + '/files/file/ozi', formData, {
          reportProgress: true
        });
        const copiedData = this.dataFiles.slice();
        copiedData.push({ id: i, filename: inputEl.files.item(i).name, percent: 0, upload: null, tmp: null });
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
  _keyPress(event: any) {
    const pattern = /^[0-9]*$/;
    const inputChar = String.fromCharCode(event.charCode);

    if (!pattern.test(inputChar)) {
      // invalid character, prevent input
      event.preventDefault();
    }
  }
}



@Component({
  selector: 'app-ozi-contracts-dialog-edit',
  templateUrl: './view/dialog-edit.html',
  styleUrls: ['./view/dialog-edit.css'],
  encapsulation: ViewEncapsulation.None,
})
export class OziContractsDialogEditComponent implements OnInit {
  color = 'primary';
  mode = 'determinate';
  value = 50;
  bufferValue = 75;
  namedog: string;
  datadog: string;
  summdog: string;
  commentdog: string;
  targetdog: string;
  dateForm: FormGroup;
  signArr: any = new Array();
  dataChangeFiles: BehaviorSubject<Files[]> = new BehaviorSubject<Files[]>([]);
  get dataFiles(): Files[] { return this.dataChangeFiles.value; }
  isppodrControl: FormControl;
  filteredOptions: Observable<any[]>;
  signControl = new FormControl(this.signArr);
  constructor(
    public dialogRef: MatDialogRef<OziContractsDialogEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private el: ElementRef, private http: HttpClient, private fb: FormBuilder) {
    this.createForm();
    this.namedog = data.data.numdog;
    // this.isppodr = data.data.isppodr;
    this.summdog = data.data.sumdog;
    this.commentdog = data.data.comment;
    this.targetdog = data.data.target;
    this.isppodrControl = new FormControl(data.data.isppodr);
    if (data.data.signs.length > 0) {
      data.data.signs.forEach(element => {
        this.signArr.push(element.user_id);
      });
    }
  }

  ngOnInit() {
    this.filteredOptions = this.isppodrControl.valueChanges.pipe(
      debounceTime(150), filter(num => num.length > 2),
      switchMap((searchPhrase: string) => {
        return this.http.get<any>(`${environment.apiUrl}/autocomplete/isppodr/${searchPhrase}`);
      }));
  }

  createForm() {
    this.dateForm = this.fb.group({
      datePickerInput: [this.data.data.datedog, Validators.compose([
        Validators.required,
      ])]
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  confirmSelection() {
    const dateValue = this.dateForm.controls.datePickerInput.value;
    const result: any = {
      contract_id: this.data.data.id,
      numdog: this.namedog,
      datedog: dateValue,
      isppodr: this.isppodrControl.value,
      sumdog: this.summdog,
      comment: this.commentdog,
      filedownloaded: this.data.data.files,
      target: this.targetdog,
      sign: this.signControl.value,
      files: this.dataFiles
    };
    this.dialogRef.close(result);
  }

  filesDeleteDownloaded(name) {
    this.data.data.files.forEach((file, index) => {
      if (file.file === name) {
        this.data.data.files.splice(index, 1);
        return;
      }
    });
  }

  filesDeleteDownloadable(name) {
    const copiedData = this.dataFiles.slice();
    copiedData.forEach((file, index) => {
      if (file.filename === name) {
        copiedData.splice(index, 1);
        this.dataChangeFiles.next(copiedData);
        return;
      }
    });
  }

  upload() {
    const inputEl: HTMLInputElement = this.el.nativeElement.querySelector('#photo');
    const fileCount: number = inputEl.files.length;

    if (fileCount > 0) {
      for (let i = 0; i < fileCount; i++) {
        const formData = new FormData();
        formData.append('photo', inputEl.files.item(i));
        const req = new HttpRequest('POST', environment.apiUrl + '/users/file', formData, {
          reportProgress: true
        });
        const copiedData = this.dataFiles.slice();
        copiedData.push({ id: i, filename: inputEl.files.item(i).name, percent: 0, upload: null, tmp: null });
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
                copiedData2.forEach((file, index) => {
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

  _keyPress(event: any) {
    const pattern = /^[0-9]*$/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }
}





@Component({
  selector: 'app-ozi-contracts-dialog-show-signing',
  templateUrl: './view/dialog-show-signing.html',
  styleUrls: ['./view/dialog-show-signing.css'],
  encapsulation: ViewEncapsulation.None,
})
export class OziContractsDialogShowSigningComponent {
  constructor(
    public dialogRef: MatDialogRef<OziContractsDialogEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private el: ElementRef, private http: HttpClient, private fb: FormBuilder) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
