import { merge as observableMerge, fromEvent as observableFromEvent, BehaviorSubject, Observable } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import {
  Component, OnInit, ViewEncapsulation, ElementRef, ViewChild, Inject
} from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { HttpRequest, HttpEventType, HttpResponse } from '@angular/common/http';
import { DataSource } from '@angular/cdk/collections';
import {
  MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatPaginator, MatSort
} from '@angular/material';
import { SocketService, Kbk, Dog } from './service/socket.service';
import { FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';



@Component({
  selector: 'app-uip-component',
  styleUrls: ['uip-component.css'],
  templateUrl: 'uip-component.html',
  providers: [SocketService]
})

export class UipComponent implements OnInit {
  displayedColumns: string[];
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  uipDisplayedColumns = ['num', 'dogname', 'dogdate', 'isppodr', 'nmc', 'sumdog', 'paypp', 'comment'];
  columnss = [];
  kbkdataSource: KbkDataSource | null;
  uipdataSource: UipDataSource | null;
  sum: number;
  firstColumn = ['Наименование', 'Лимит', 'Израсходовано', 'Осталось', 'КБК'];
  constructor(private socket: SocketService, public dialog: MatDialog) {
    this.socket.dataChangeKbk.subscribe(x => {
      this.columnss = [];
      x.map(xx => this.columnss.push(xx.guid));
      this.displayedColumns = ['first'].concat(this.columnss.slice(), ['last']);
    });
  }
  ngOnInit() {
    this.kbkdataSource = new KbkDataSource(this.socket);
    this.uipdataSource = new UipDataSource(this.socket, this.paginator, this.sort);
    this.uipdataSource._sumUip.subscribe((x) => { this.sum = x; });
  }
}

export class KbkDataSource extends DataSource<any> {
  constructor(private _socketService: SocketService) {
    super();
  }

  connect(): Observable<any[]> {
    const displayDataChanges = [
      this._socketService.dataChangeKbk,
      this._socketService.dataChangeDogs
    ];
    return observableMerge(...displayDataChanges).pipe(map(() => {
      const temp = this._socketService.dataKbk.slice();
      const tmp = this._socketService.dataDogs.slice();
      const reverse = [{ last: 'Итого' }, { last: 0 }, { last: 0 }, { last: 0 }, { last: 'Итого' }];
      reverse[0]['color'] = '#42C0C9';
      reverse[1]['color'] = '#3366CC';
      reverse[2]['color'] = '#008000';
      reverse[3]['color'] = '#A14E96';
      reverse[4]['color'] = '';

      reverse[1]['last'] = (temp.map(t => t.sum).reduce((acc, value) => acc + (value * 100), 0)) / 100;
      reverse[2]['last'] = tmp.map(t => t.sumdog).reduce((acc, value) => acc + (value * 100), 0) / 100;
      reverse[3]['last'] = (reverse[1]['last'] * 100 - reverse[2]['last'] * 100) / 100;
      temp.map((x, i) => {
        // reverse[0][x['guid']] = x['value'];
        reverse[0][x['guid']] = x['name'];
        reverse[1][x['guid']] = x.sum;
        reverse[2][x['guid']] = tmp.filter(obj => obj.guid === x['guid']).map(t => t.sumdog).reduce((acc, value) => acc + value, 0);
        reverse[3][x['guid']] = (x['sum'] - reverse[2][x['guid']]);
        reverse[4][x['guid']] = x['value'];

      });
      return reverse;
    }));

  }

  disconnect() { }
}



export class UipDataSource extends DataSource<any> {
  _filterChange = new BehaviorSubject('');
  _sumUip = new BehaviorSubject(0);
  get filter(): string { return this._filterChange.value; }
  get sum(): number { return this._sumUip.value; }
  set filter(str: string) { this._filterChange.next(str); }
  set sum(num: number) { this._sumUip.next(num); }
  filteredData: Dog[] = [];
  renderedData: Dog[] = [];
  constructor(private _socketService: SocketService, private _paginator: MatPaginator, private _sort: MatSort) {
    super();
    this._filterChange.subscribe(() => this._paginator.pageIndex = 0);
  }


  connect(): Observable<Dog[]> {
    const displayDataChanges = [
      this._socketService.dataChangeDogs,
      this._filterChange,
      this._paginator.page,
      this._sort.sortChange,
    ];
    this._socketService.dataChangeDogs.subscribe(x => {
      this.sum = x.map(t => t.sumdog).reduce((acc, value) => acc + value, 0);
      x.forEach(element => {
        console.log(element);
      });
      
    });
    return observableMerge(...displayDataChanges).pipe(map(() => {
      this.filteredData = this._socketService.dataDogs.slice().filter((item: Dog) => {
        const searchStr = item.isppodrshow.toLowerCase();

        return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
      });
      const sortedData = this.sortData(this.filteredData.slice());

      const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
      this.renderedData = sortedData.splice(startIndex, this._paginator.pageSize);
      return this.renderedData;
    }));

  }

  disconnect() { }
  sortData(data: Dog[]): Dog[] {
    if (!this._sort.active || this._sort.direction === '') { return data; }

    return data.sort((a, b) => {
      let propertyA: number | string = '';
      let propertyB: number | string = '';

      switch (this._sort.active) {
        case 'id': [propertyA, propertyB] = [a.id, b.id]; break;
        case 'isppodr': [propertyA, propertyB] = [a.isppodr, b.isppodr]; break;
        case 'dogname': [propertyA, propertyB] = [a.dogname, b.dogname]; break;
        case 'dogdate': [propertyA, propertyB] = [a.dogdate, b.dogdate]; break;
        case 'sumdog': [propertyA, propertyB] = [a.sumdog, b.sumdog]; break;
        case 'comment': [propertyA, propertyB] = [a.comment, b.comment]; break;
      }

      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }
}

@Component({
  selector: 'app-uip-dialog-add',
  templateUrl: './view/dialog-add.html',
  styleUrls: ['./view/dialog-add.css'],
  encapsulation: ViewEncapsulation.None,
})
export class UipDialogAddComponent implements OnInit {
  ngOnInit() {
  }


}



@Component({
  selector: 'app-uip-dialog-edit',
  templateUrl: './view/dialog-edit.html',
  styleUrls: ['./view/dialog-edit.css'],
  encapsulation: ViewEncapsulation.None,
})
export class UipDialogEditComponent implements OnInit {
  ngOnInit() {
  }

}

