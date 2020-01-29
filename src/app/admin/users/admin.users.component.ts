
import {merge as observableMerge,  BehaviorSubject ,  Observable, fromEvent } from 'rxjs';

import {map, distinctUntilChanged,  debounceTime } from 'rxjs/operators';
import { Component, ElementRef, OnInit, ViewChild, Inject } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
import { FormControl, Validators } from '@angular/forms';
import { User, SocketService } from './socket.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
@Component({
    selector: 'app-admin-users.component',
    styleUrls: ['admin.users.component.css'],
    templateUrl: 'admin.users.component.html',
    providers: [SocketService]
})
export class AdminUsersComponent implements OnInit {
    displayedColumns = ['otdel', 'fio', 'dolj', 'email', 'ncbn', 'nphn2', 'newphone'];
    dataSource: ExampleDataSource | null;
    @ViewChild('filter', {static: true}) filter: ElementRef;

    constructor(public dialog: MatDialog, private _socket: SocketService) { }

    ngOnInit() {
        this.dataSource = new ExampleDataSource(this._socket);
        fromEvent(this.filter.nativeElement, 'keyup').pipe(
            debounceTime(150),
            distinctUntilChanged())
            .subscribe(() => {
                if (!this.dataSource) { return; }
                this.dataSource.filter = this.filter.nativeElement.value;
            });
    }
    openDialog(row): void {
        const dialogRef = this.dialog.open(AdminUsersAddComponent, {
            width: '1024px',
            data: { row }
        });
        dialogRef.afterClosed().subscribe(result => {
        });
    }
    public loadAriData(): void {
        this._socket.socket.emit('loadAriData',
            {}, x => { console.log(x); }
        ).on(data => console.log(data));
    }
}

export class ExampleDataSource extends DataSource<any> {
    _filterChange = new BehaviorSubject('');
    get filter(): string { return this._filterChange.value; }
    set filter(filter: string) { this._filterChange.next(filter); }

    constructor(private _socket: SocketService) {
        super();
    }
    connect(): Observable<User[]> {
        const displayDataChanges = [
            this._socket.Users,
            this._filterChange,
        ];

        return observableMerge(...displayDataChanges).pipe(map(() => {
            return this._socket.Users.value.slice().filter((item: User) => {
                const searchStr = (item.otdel + item.fio + item.email + item.nphn2 + item.newphone).toLowerCase();
                return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
            });
        }));
    }

    disconnect() { }
}
@Component({
    selector: 'app-admin-users-add.component',
    styleUrls: ['./view/admin.users.add.component.css'],
    templateUrl: './view/admin.users.add.component.html',
})
export class AdminUsersAddComponent {
    public ddata;
    otdelControl = new FormControl('', [Validators.required]);

    otdels = [
        { name: 'Dog', sound: 'Woof!' },
        { name: 'Cat', sound: 'Meow!' },
        { name: 'Cow', sound: 'Moo!' },
        { name: 'Fox', sound: 'Wa-pa-pa-pa-pa-pa-pow!' },
    ];
    constructor(
        public dialogRef: MatDialogRef<AdminUsersAddComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        this.ddata = data.row;
        console.log(this.data);
    }
    onNoClick(): void {
        this.dialogRef.close();
    }
}
