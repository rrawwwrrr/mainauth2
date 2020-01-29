
import { merge as observableMerge, BehaviorSubject, Observable, fromEvent as observableFromEvent } from 'rxjs';

import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
import { FormControl, Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Trunk, SocketService } from './socket.service';
import * as moment from 'moment';

@Component({
    selector: 'app-statistics-voip.component',
    styleUrls: ['statistics.voip.component.css'],
    templateUrl: 'statistics.voip.component.html',
    providers: [SocketService]
})
export class StatisticsVoipComponent implements OnInit {
    displayedColumns = ['phone', 'fio', 'help', 'local', 'admlocal', 'city', 'free', 'mobile', 'alls'];
    dataSource: ExampleDataSource | null;
    selectparam: FormGroup;
    @ViewChild('filter', {static: true}) filter: ElementRef;

    constructor(private _socket: SocketService, private fb: FormBuilder) {
        this.selectparam = fb.group({
            select: ['local', [Validators.required]],
            startdate: [moment().subtract(1, 'month').format()],
            stopdate: [new Date()]
        });
    }
    send() {
        console.log(this.selectparam.value);
        this._socket.socket.emit('loadData', this.selectparam.value);
    }
    ngOnInit() {
        this.dataSource = new ExampleDataSource(this._socket);
        observableFromEvent(this.filter.nativeElement, 'keyup').pipe(
            debounceTime(150),
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

    constructor(private _socket: SocketService) {
        super();
    }
    connect(): Observable<Trunk[]> {
        const displayDataChanges = [
            this._socket.Trunks,
            this._filterChange,
        ];

        return observableMerge(...displayDataChanges).pipe(map(() => {
            return this._socket.Trunks.value.slice().filter((item: Trunk) => {
                const searchStr = (item.phone).toLowerCase();
                return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
            });
        }));
    }

    disconnect() { }
}

