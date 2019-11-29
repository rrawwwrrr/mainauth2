
import { merge as observableMerge, fromEvent as observableFromEvent, BehaviorSubject, Observable } from 'rxjs';

import { map, startWith, debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { Component, OnInit, ViewEncapsulation, ElementRef, ViewChild, Inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest, HttpResponse } from '@angular/common/http';
import { DataSource } from '@angular/cdk/collections';
import { MyConfigVal, MyConfig, Isppodr, Bid } from './class/bid';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatPaginator, MatSort } from '@angular/material';
import { SocketService } from './service/socket.service';
import {
  FormControl, FormBuilder, FormGroup, Validators, ValidatorFn, ValidationErrors,
} from '@angular/forms';
import { environment } from 'src/environments/environment';
import * as moment from 'moment';
declare var ymaps: any;
declare var jQuery: any;

interface YandexMap extends MVCObject {
  // tslint:disable-next-line:no-misused-new
  constructor(el: HTMLElement, opts?: any): void;
  // tslint:disable-next-line:member-ordering
  geoObjects: any;
}

interface MVCObject { addListener(eventName: string, handler: Function): MapsEventListener; }
interface MapsEventListener { remove(): void; }
@Component({
  selector: 'app-dispatcher-component',
  styleUrls: ['dispatcher-component.css'],
  templateUrl: 'dispatcher-component.html',
  providers: [SocketService]
})

export class DispatcherComponent implements OnInit {
  //  typesControl = new FormControl(0);
  localtypesControl = new FormControl(0);
  dateForm: FormGroup;
  localdateForm: FormGroup;
  displayedColumnsDogs = ['checkbox', 'id', 'datebid', 'finishbid', 'status', 'contact', 'address', 'problem', 'creator', 'info'];
  colors = [{ id: 1, value: '#69F0AE' }, { id: 2, value: '#388E3C' }, { id: 3, value: '#FFD740' }, { id: 4, value: '#EF6C00' }];
  dataSource: ExampleDataSource | null;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;
  localStatusControl = new FormControl(0);
  statusData = [
    { value: 0, viewValue: 'все' },
    { value: 1, viewValue: 'только обработаные' },
    { value: 2, viewValue: 'только не обработаные' },
  ];
  limits = [100, 200, 300, 500, 600, 900];
  limitSelected = 600;
  statusSelected = 0;
  typeSelected = 0;
  inputSearchAdress: string;
  constructor(public socket: SocketService, public dialog: MatDialog, private fb: FormBuilder) {
    this.createForm();
  }

  socketFilter(val: boolean) {
    if (val) {
      this.typeSelected = 0;
      this.inputSearchAdress = null;
      this.statusSelected = 0;
      this.limitSelected = 600;
      this.dateForm.value.datePickerInput = '';
    }
    const value: any = {
      type: this.typeSelected || null,
      adress: this.inputSearchAdress || null,
      status: this.statusSelected || null,
      limit: this.limitSelected,
      date: this.dateForm.controls.datePickerInput.value
    };
    this.socket.getData(value);
  }
  ngOnInit() {
    observableFromEvent(this.filter.nativeElement, 'keyup').pipe(
      debounceTime(150),
      distinctUntilChanged())
      .subscribe(() => {
        if (!this.dataSource) { return; }
        this.dataSource.filter = this.filter.nativeElement.value;
      });
    this.dataSource = new ExampleDataSource(this.socket, this.paginator, this.sort);

    this.localtypesControl.valueChanges.subscribe(() => {
      if (!this.dataSource) { return; }
      this.dataSource.typeFilter = this.localtypesControl.value.value;
    });
    this.localStatusControl.valueChanges.subscribe(() => {
      if (!this.dataSource) { return; }
      this.dataSource.statusFilter = this.localStatusControl.value.value;
    });
    this.localdateForm.valueChanges.subscribe(() => {
      if (!this.dataSource) { return; }
      this.dataSource.dateFilter = this.localdateForm.value.localdatePickerInput;
    });
    // this.openDialogAdd();
  }
  createForm() {
    this.dateForm = this.fb.group({
      datePickerInput: [, Validators.compose([
        Validators.required,
      ])]
    });
    this.localdateForm = this.fb.group({
      localdatePickerInput: [, Validators.compose([
        Validators.required,
      ])]
    });
  }
  _keyPress(event: any) {
    const pattern = /^[0-9]*$/;
    const inputChar = String.fromCharCode(event.charCode);

    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }
  openDialogAdd(): void {
    const dialogRef = this.dialog.open(DispatcherDialogAddComponent, {
      width: '1050px', disableClose: true,
      data: { types: this.socket.Types, isppodr: this.socket.isppodr, traf: this.socket.traf, config: this.socket.myConfig }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.socket.sender('append', result);
      }
    });
  }
  openDialogEditContact(row_id: number, contact: any): void {
    console.log(row_id);
  }
  openDialogAddContact(row: any): void {
    const dialogRef = this.dialog.open(DispatcherDialogAddContactComponent, {
      width: '750px', disableClose: true,
      data: { id: row }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.socket.sender('appendcontact', result);
      }
    });
  }
}

export class ExampleDataSource extends DataSource<any> {
  _filterChange = new BehaviorSubject('');
  _typeChange = new BehaviorSubject(0);
  _statusChange = new BehaviorSubject(0);
  _dateChange = new BehaviorSubject('');
  get filter(): string { return this._filterChange.value; }
  set filter(filtert: string) { this._filterChange.next(filtert); }
  get typeFilter() { return this._typeChange.value; }
  set typeFilter(type: number) { this._typeChange.next(type); }
  get statusFilter() { return this._statusChange.value; }
  set statusFilter(type: number) { this._statusChange.next(type); }
  get dateFilter() { return this._dateChange.value; }
  set dateFilter(date: string) { this._dateChange.next(date); }
  filteredData: Bid[] = [];
  renderedData: Bid[] = [];
  constructor(public _socketService: SocketService, private _paginator: MatPaginator, private _sort: MatSort) {
    super();
    this._filterChange.subscribe(() => this._paginator.pageIndex = 0);
  }


  connect(): Observable<Bid[]> {
    const displayDataChanges = [
      this._socketService.dataChangeBid,
      this._filterChange,
      this._typeChange,
      this._statusChange,
      this._dateChange,
      this._paginator.page,
      this._sort.sortChange,
    ];
    return observableMerge(...displayDataChanges).pipe(map(() => {
      this.filteredData = this._socketService.dataDogs.slice().filter((item: Bid) => {
        const searchStr = item.problem.toLowerCase() + item.problem.toLowerCase();
        const iftype = this.typeFilter === 0 ? true : this.typeFilter === item.type;
        const ifdate = (this.dateFilter !== '') ?
          moment(this.dateFilter).isBetween(item.datebid, (item.finishbid || moment.now()), 'day', '[]') : true;
        const ifstatus = this.statusFilter === 0 ? true : (this.statusFilter === 1 ? item.finishbid !== null : item.finishbid === null);
        return searchStr.indexOf(this.filter.toLowerCase()) !== -1 && iftype && ifstatus && ifdate;
      });
      const sortedData = this.sortData(this.filteredData.slice());
      const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
      this.renderedData = sortedData.splice(startIndex, this._paginator.pageSize);
      return this.renderedData;
    }));

  }

  disconnect() { }
  sortData(data: Bid[]): Bid[] {
    if (!this._sort.active || this._sort.direction === '') { return data; }

    return data.sort((a, b) => {
      let propertyA: number | string = '';
      let propertyB: number | string = '';

      switch (this._sort.active) {
        case 'id': [propertyA, propertyB] = [a.id, b.id]; break;
        case 'datebid': [propertyA, propertyB] = [a.datebid, b.datebid]; break;
        case 'finishbid': [propertyA, propertyB] = [a.finishbid, b.finishbid]; break;
        case 'contact': [propertyA, propertyB] = [a.contact, b.contact]; break;
        case 'address': [propertyA, propertyB] = [a.address, b.address]; break;
        case 'creator': [propertyA, propertyB] = [a.creator, b.creator]; break;
        case 'status': [propertyA, propertyB] = [a.status, b.status]; break;
      }

      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }

}

@Component({
  selector: 'app-dispatcher-dialog-add',
  templateUrl: 'view/dialog-add.html',
  styleUrls: ['view/dialog-add.css'],
  encapsulation: ViewEncapsulation.None
})

export class DispatcherDialogAddComponent implements OnInit {
  time = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  options: any = {
    center: [56.85227198748677, 53.20774694062715],
    zoom: 16,
    controls: ['zoomControl', 'searchControl', 'typeSelector', 'fullscreenControl'],
    encapsulation: ViewEncapsulation.None,
  };
  isppodrs: any;
  myconfig: any;
  traf: any;
  addFormGroup: FormGroup;
  isppodrControl = new FormControl();
  filteredTraf: Observable<string[]>;
  map: any;
  save = false;
  myMap: Promise<YandexMap> = new Promise<YandexMap>((resolve: () => void) => { this._mapResolver = resolve; });
  private _mapResolver: (value?: YandexMap) => void;
  @ViewChild('yamaps') el: ElementRef;
  constructor(
    public dialogRef: MatDialogRef<DispatcherDialogAddComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private http: HttpClient, private fb: FormBuilder) {
    this.traf = data.traf;
    this.myconfig = data.config;
    this.addFormGroup = fb.group({
      'type': [0, [Validators.required, Validators.min(1)]],
      'datebid': [new Date(), [Validators.required]],
      'time': [moment().format('LT'), [
        Validators.required,
        Validators.pattern(this.time)]],
      'address': ['фыв', Validators.required],
      'problem': ['1', Validators.required],
      'phone': ['1', Validators.required],
      'contact': ['1', Validators.required],
      'comment': [''],
    }, { validator: this.checkAddress() });
  }
  ngOnInit(): void {
    console.log(this.myconfig);
    ymaps.ready().done(() => {
      this.filteredTraf = this.addFormGroup.get('address').valueChanges
        .pipe(
          startWith<string | any>(''),
          map(val => (typeof val === 'string' ? val : val.street)),
          map(val => this._filter(val))
        );
      this.map = new ymaps.Map(this.el.nativeElement, this.options);
      this._mapResolver(<YandexMap>this.map);
      this.map.events.add('click', this.clickMaps, this);
    });
    this.addFormGroup.controls['type'].valueChanges.subscribe((val) => {
      const typeconf = this.myconfig.filter(x => x.type === val).map((x: MyConfig) => x.value)[0];
      this.isppodrs = this.data.isppodr.slice().filter((item: any) => {
        return item.disp.includes(val);
      }).map(x => {
        if (typeconf) {
          const fl = typeconf.filter(xx => xx.id === x.id);
          if (fl.length > 0) { x.email = fl[0].email; x.phone = fl[0].phone; console.log(fl); }
        }
        return x;
      });
      if (typeconf) {
        this.isppodrControl.setValue(typeconf.map(xx => xx.id));
      } else {
        this.isppodrControl.setValue([]);
      }
    });
  }
  private checkAddress(): ValidatorFn {
    return (group: FormGroup): { [key: string]: any } => {
      const type = group.get('type').value;
      const address = group.get('address').value;
      return type === 1 && typeof address === 'string' ? { 'identityRevealed': true } : null;
    };
  }
  displayView(object?: any): string | undefined {
    return object ? object.street : undefined;
  }
  _filter(value: string): string[] {
    return this.traf.filter(item => item.street.toLowerCase().includes(value.toLowerCase()));
  }
  clickMaps(e: any) {
    const coords = e.get('coords');
    this.addPoint(coords);
  }
  addPoint(coords) {
    const placemark = new ymaps.Placemark(coords, {}, {
      draggable: true
    });
    placemark.events.add('dblclick', function (e) {
      this.map.geoObjects.remove(e.get('target'));
    });
    this.map.geoObjects.add(placemark);
    /* myPolyline.editor.startEditing(); */
  }
  _keyPress(event: any) {
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
    if (this.addFormGroup.valid) {
      const form = this.addFormGroup.value;
      form.send = this.isppodrs.slice().filter((item: any) => {
        return this.isppodrControl.value ? this.isppodrControl.value.includes(item.id) : [{}];
      }).map((item: any) => {
        return {
          id: item.id || '',
          name: item.name || '',
          phone: item.phone || '',
          email: item.email || ''
        };
      });
      form.save = this.save;
      /* this.map.geoObjects.each(function (geoObject) {
        if (geoObject.geometry.getCoordinates().length > 0) {
          tmpArr.push(geoObject.geometry.getCoordinates());
        }
      }); */

      this.dialogRef.close(form);
    } else {
      console.log(this.addFormGroup.errors);
    }
  }
}

@Component({
  selector: 'app-dialog-add-contact',
  templateUrl: './view/dialog-add-contact.html',
})
export class DispatcherDialogAddContactComponent implements OnInit {
  private addFormGroup: FormGroup;
  constructor(
    public dialogRef: MatDialogRef<DispatcherDialogAddContactComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private fb: FormBuilder) {
    this.addFormGroup = fb.group({
      'phone': ['', Validators.required],
      'contact': ['', Validators.required],
    });
  }

  ngOnInit() {

  }
  confirmSelection(): void {
    if (this.addFormGroup.valid) {
      const form = this.addFormGroup.value;
      form.id = this.data.id;
      this.dialogRef.close(form);
    } else {
      console.log(this.addFormGroup.errors);
    }
  }
  onNoClick(): void {
    this.dialogRef.close();
  }

}
