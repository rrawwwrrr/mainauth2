import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as io from 'socket.io-client';
import { environment } from 'src/environments/environment';



export interface Trunk {
    phone: string;
    fio: string;
    help: string;
    local: string;
    admlocal: string;
    city: string;
    free: string;
    mobile: string;
    alls: string;
}

@Injectable()
export class SocketService {

    private host = environment.socketUrl + '/statistic/voip';
    public socket: any;
    public Trunks: BehaviorSubject<Trunk[]> = new BehaviorSubject<Trunk[]>([]);
    get data(): Trunk[] { return this.Trunks.value; }
    constructor() {
        this.socket = io(this.host);
        this.socket.on('connect', () => this.connected());
        this.socket.on('disconnect', () => this.disconnected());
        this.socket.on('error', (error: string) => {
            console.log(`ERROR: '${error}' (${this.host})`);
        });
        this.socket.on('loaderr', err => console.log(err));
        this.socket.on('loadUpl', (data) => {
            this.Trunks.next([]);
            this.addUser(data);
        });
    }
    addUser(json: any) {
        const copiedData = this.data.slice();
        json.forEach(element => copiedData.push(this.createTrunk(element)));
        this.Trunks.next(copiedData);
    }
    createTrunk(data) {
        return {
            phone: data.phone,
            fio: data.fio,
            help: data.help,
            local: data.local,
            admlocal: data.admlocal,
            city: data.city,
            free: data.help,
            mobile: data.mobile,
            alls: data.alls
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
            /* .on('authenticated', function () {
                ;
            }) */
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
