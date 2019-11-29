import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as io from 'socket.io-client';
import * as moment from 'moment';
import { environment } from 'src/environments/environments.test';

export class Files {
    constructor(
        public id: number,
        public filename: string,
        public user_id: number,
        public hashkey: string,
        public dir: string,
        public tmpdir: string,
        public publ: string,
        public created: number
    ) {
    }
}
export class File {
    constructor(
        public id: number,
        public filename: string,
        public percent: number,
        public upload: string,
        public tmp: string,
        public src: string
    ) {
    }
}


@Injectable()
export class SocketService {
    dataChange: BehaviorSubject<Files[]> = new BehaviorSubject<Files[]>([]);
    get data(): Files[] { return this.dataChange.value; }
    public isppodrs: any;
    public otdels: any;
    public args: any;
    public people: any;
    private host = environment.socketUrl + '/help/myfiles';
    private socket: any;
    constructor() {
        moment.locale('ru');
        this.socket = io(this.host);
        this.socket.on('connect', () => this.connected());
        this.socket.on('disconnect', () => this.disconnected());
        this.socket.on('error', (error: string) => {
            console.log(`ERROR: "${error}" (${this.host})`);
        });
        this.socket.on('hello', () => {
            this.socket.emit('getdata', 'hello');
        });
        this.socket.on('update', (value: any) => {
            this.editFile(value[0]);
        });
        this.socket.on('append', (value: any) => {
            /* console.table(value); */
            this.addFiles(value, true);
        });
        this.socket.on('primarydata', (data) => {
            this.dataChange.next([]);
            this.addFiles(data);
        });
    }
    send(event: string, value: any) {
        if (value) {
            this.socket.emit(event, value);
        }
    }
    addFile(con: Files) {
        const copiedData = this.data.slice();
        copiedData.push(con);
        this.dataChange.next(copiedData);
    }
    addFiles(Filess, revers = false) {
        const copiedData = this.data.slice();
        Filess.map(con => {
            if (!revers) {
                copiedData.push(this.createNew(con));
            } else {
                copiedData.unshift(this.createNew(con));
            }

        });
        this.dataChange.next(copiedData);
    }
    editFile(value: any) {
        const copiedData = this.data.slice();
        copiedData.forEach((con, index) => {
            /* if (con.idshow === value.idshow) {
                copiedData[index] = this.createNew(value);
                return;
            } */
        });
        this.dataChange.next(copiedData);
    }
    private createNew(data) {
        return {
            id: data.id,
            filename: data.filename,
            user_id: data.user_id,
            hashkey: data.hashkey,
            dir: data.dir,
            tmpdir: data.tmpdir,
            publ: data.publ,
            created: data.created
        };
    }

    connect() {
        this.socket.connect();
    }
    disconnect() {
        this.socket.disconnect();
    }
    private connected() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.socket.emit('authenticate',
            { token: currentUser.token })
            .on('authenticated', function () {
                // do other things
            })
            .on('unauthorized', function (msg) {
                console.log('unauthorized: ' + JSON.stringify(msg.data));
                throw new Error(msg.data.type);
            });
        console.log('Connected');
    }
    private disconnected() {
        console.log('Disconnected');
    }
}
