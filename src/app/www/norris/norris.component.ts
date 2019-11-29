
import {merge as observableMerge, fromEvent as observableFromEvent,  BehaviorSubject ,  Observable } from 'rxjs';

import {map, debounceTime, distinctUntilChanged} from 'rxjs/operators';
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
import { Dogs } from './class/dogs';
import { MatPaginator, MatSort } from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';
import { SocketService } from './service/socket.service';
import { FormControl } from '@angular/forms';






import { LOCATION_INITIALIZED } from '@angular/common';
@Component({
  selector: 'app-norris-component',
  styleUrls: ['norris.component.css'],
  templateUrl: 'norris.component.html',
  providers: [SocketService]
})

export class NorrisComponent implements OnInit {
  displayedColumns = ['id', 'isppodr', 'contractFull', 'objectFull', 'files', 'comment'];
  selection = new SelectionModel<string>(true, []);
  dataSource: ExampleDataSource | null;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('filter') filter: ElementRef;
  typesControl = new FormControl();
  constructor(public socket: SocketService) { }
  ngOnInit() {
    this.dataSource = new ExampleDataSource(this.socket, this.paginator, this.sort);
    observableFromEvent(this.filter.nativeElement, 'keyup').pipe(
      debounceTime(150),
      distinctUntilChanged())
      .subscribe(() => {
        if (!this.dataSource) { return; }
        this.dataSource.filter = this.filter.nativeElement.value;
      });
    this.typesControl.valueChanges.subscribe(() => {
      console.log(this.typesControl.value);
      if (!this.dataSource) { return; }
      this.dataSource.type = this.typesControl.value;
    });
  }

  isAllSelected(): boolean {
    if (!this.dataSource) { return false; }
    if (this.selection.isEmpty()) { return false; }

    if (this.filter.nativeElement.value) {
      return this.selection.selected.length === this.dataSource.renderedData.length;
    } else {
      return this.selection.selected.length === this.socket.data.length;
    }
  }

  masterToggle() {
    if (!this.dataSource) { return; }

    if (this.isAllSelected()) {
      this.selection.clear();
    } else if (this.filter.nativeElement.value) {
      this.dataSource.renderedData.forEach(data => this.selection.select(data.isppodr));
    } else {
      this.socket.data.forEach(data => this.selection.select(data.isppodr));
    }
  }
}


export class ExampleDataSource extends DataSource<any> {
  _filterChange = new BehaviorSubject('');
  get filter(): string { return this._filterChange.value; }
  set filter(filter: string) { this._filterChange.next(filter); }
  _typeChange = new BehaviorSubject({ value: 1, viewValue: 'удс' });
  get type(): any { return this._typeChange.value; }
  set type(typeV: any) { this._typeChange.next(typeV); }
  filteredData: Dogs[] = [];
  renderedData: Dogs[] = [];

  constructor(private _socketService: SocketService,
    private _paginator: MatPaginator,
    private _sort: MatSort) {
    super();
    this._filterChange.subscribe(() => this._paginator.pageIndex = 0);
  }

  connect(): Observable<Dogs[]> {
    const displayDataChanges = [
      this._socketService.dataChange,
      this._sort.sortChange,
      this._filterChange,
      this._paginator.page,
      this._typeChange
    ];

    return observableMerge(...displayDataChanges).pipe(map(() => {
      this.filteredData = this._socketService.data.slice().filter((item: Dogs) => {
        const searchStr = (item.contractFull + item.objectFull).toLowerCase();
        return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
      })
        .filter((item: Dogs) => {
          if (parseInt(this.type.value, 10) === 0) {
            return true;
          } else {
            return item.type === parseInt(this.type.value, 10);
           }

        });

      const sortedData = this.sortData(this.filteredData.slice());


      const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
      this.renderedData = sortedData.splice(startIndex, this._paginator.pageSize);
      return this.renderedData;
    }));
  }

  disconnect() { }

  /** Returns a sorted copy of the database data. */
  sortData(data: Dogs[]): Dogs[] {
    if (!this._sort.active || this._sort.direction === '') { return data; }

    return data.sort((a, b) => {
      let propertyA: number | string = '';
      let propertyB: number | string = '';

      switch (this._sort.active) {
        case 'id': [propertyA, propertyB] = [a.id, b.id]; break;
        case 'used': [propertyA, propertyB] = [a.used, b.used]; break;
        case 'isppodr': [propertyA, propertyB] = [a.isppodr, b.isppodr]; break;
        case 'contractFull': [propertyA, propertyB] = [a.contractFull, b.contractFull]; break;
        case 'objectFull': [propertyA, propertyB] = [a.objectFull, b.objectFull]; break;

        case 'comment': [propertyA, propertyB] = [a.comment, b.comment]; break;
        case 'created_at': [propertyA, propertyB] = [a.created_at, b.created_at]; break;
      }

      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (valueA < valueB ? -1 : 1) * (this._sort.direction === 'asc' ? 1 : -1);
    });
  }
}
