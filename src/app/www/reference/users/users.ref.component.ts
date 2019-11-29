
import { debounceTime, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Component, OnInit } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, merge as observableMerge } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FormControl } from '@angular/forms';





@Component({
    selector: 'app-users.ref.component',
    styleUrls: ['users.ref.component.css'],
    templateUrl: 'users.ref.component.html',
})
export class UsersRefComponent implements OnInit {
    displayedColumns = ['otdel', 'fio', 'dolj', 'email', 'ncbn', 'nphn2', 'newphone'];
    displayedColumns2 = ['otdel-search', 'fio-search', 'dolj-search', 'email-search', 'ncbn-search', 'nphn2-search', 'newphone-search'];
    Database: Database | null;
    dataSource: ExampleDataSource | null;
    otdel_form = new FormControl('');
    fio_form = new FormControl('');
    dolj_form = new FormControl('');
    email_form = new FormControl('');
    ncbn_form = new FormControl('');
    nphn2_form = new FormControl('');
    newphone_form = new FormControl('');
    constructor(private http: HttpClient) { }
    apiUrl = environment.apiUrl;
    ngOnInit() {
        this.Database = new Database(this.http);
        this.dataSource = new ExampleDataSource(this.Database);
        const filterChanges = [
            this.otdel_form.valueChanges,
            this.fio_form.valueChanges,
            this.dolj_form.valueChanges,
            this.email_form.valueChanges,
            this.ncbn_form.valueChanges,
            this.nphn2_form.valueChanges,
            this.newphone_form.valueChanges
        ];
        observableMerge(...filterChanges).pipe(debounceTime(250)).subscribe(() => {
            const filters = {
                otdel: this.otdel_form.value,
                fio: this.fio_form.value,
                dolj: this.dolj_form.value,
                ncbn: this.ncbn_form.value,
                email: this.email_form.value,
                nphn2: this.nphn2_form.value,
                newphone: this.newphone_form.value
            };
            if (!this.dataSource) { return; }
            this.dataSource.filter2 = filters;
        }
        );
    }
}

export interface UserData {
    otdel: string;
    fio: string;
    dolj: string;
    email: string;
    ncbn: string;
    nphn2: string;
    newphone: string;
}

export class Database {
    requestUrl = environment.apiUrl + '/users/list';
    dataChange: BehaviorSubject<UserData[]> = new BehaviorSubject<UserData[]>([]);
    get data(): UserData[] { return this.dataChange.value; }
    addUser(json: any) {
        const copiedData = this.data.slice();
        json.forEach(element => copiedData.push(this.createUser(element)));
        this.dataChange.next(copiedData);
    }
    createUser(data) {
        return {
            otdel: data.otdel || '',
            fio: data.fio || '',
            dolj: data.dolj || '',
            ncbn: data.ncbn || '',
            email: data.email || '',
            nphn2: data.nphn2 || '',
            newphone: data.newphone || ''
        };
    }

    constructor(private http: HttpClient) {
        this.http.get(this.requestUrl).pipe(map(
            res => this.addUser(res)
        )).subscribe();
    }
}

export class ExampleDataSource extends DataSource<any> {
    _filter2Change = new BehaviorSubject({
        otdel: '',
        fio: '',
        dolj: '',
        ncbn: '',
        email: '',
        nphn2: '',
        newphone: ''
    });

    get filter2(): any { return this._filter2Change.value; }
    set filter2(filter2: any) { this._filter2Change.next(filter2); }


    constructor(private _database: Database) {
        super();
    }
    connect(): Observable<UserData[]> {
        const displayDataChanges = [
            this._database.dataChange,
            this._filter2Change
        ];

        // return Observable.merge(...displayDataChanges).map(() => {
        return observableMerge(...displayDataChanges).pipe(map(() => {
            return this._database.data.slice().filter((item: UserData) => {
                const otdel = (this.filter2.otdel === '') ? true : item.otdel.toLowerCase()
                    .indexOf(this.filter2.otdel.toLowerCase()) !== -1;
                const fio = (this.filter2.fio === '') ? true : item.fio.toLowerCase()
                    .indexOf(this.filter2.fio.toLowerCase()) !== -1;
                const dolj = (this.filter2.dolj === '') ? true : item.dolj.toLowerCase()
                    .indexOf(this.filter2.dolj.toLowerCase()) !== -1;
                const ncbn = (this.filter2.ncbn === '') ? true : item.ncbn.toLowerCase()
                    .indexOf(this.filter2.ncbn.toLowerCase()) !== -1;
                const email = (this.filter2.email === '') ? true : item.email.toLowerCase()
                    .indexOf(this.filter2.email.toLowerCase()) !== -1;
                const nphn2 = (this.filter2.nphn2 === '') ? true : item.nphn2.toLowerCase()
                    .indexOf(this.filter2.nphn2.toLowerCase()) !== -1;
                const newphone = (this.filter2.newphone === '') ? true : item.newphone.toLowerCase()
                    .indexOf(this.filter2.newphone.toLowerCase()) !== -1;
                return otdel && fio && dolj && ncbn && email && nphn2 && newphone;
            });
        }));
    }

    disconnect() { }
}
