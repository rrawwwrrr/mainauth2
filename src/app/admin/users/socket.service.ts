import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as io from 'socket.io-client';
import { environment } from 'src/environments/environment';



export interface User {
    otdel: string;
    fio: string;
    dolj: string;
    email: string;
    ncbn: string;
    nphn2: string;
    newphone: string;
}

@Injectable()
export class SocketService {

    private host = environment.socketUrl + '/admin/users';
    public socket: any;
    public Users: BehaviorSubject<User[]> = new BehaviorSubject<User[]>([]);
    get data(): User[] { return this.Users.value; }
    constructor() {
        this.socket = io(this.host);
        this.socket.on('connect', () => this.connected());
        this.socket.on('disconnect', () => this.disconnected());
        this.socket.on('error', (error: string) => {
            console.log(`ERROR: '${error}' (${this.host})`);
        });
        this.socket.on('loaderr', err => console.log(err));
        this.socket.on('loadUpl', (data) => {
            this.addUser(data);
        });
    }
    addUser(json: any) {
        const copiedData = this.data.slice();
        json.forEach(element => copiedData.push(this.createUser(element)));
        this.Users.next(copiedData);
    }
    createUser(data) {
        return {
            otdel: data.otdel,
            fio: data.fio,
            dolj: data.dolj,
            ncbn: data.ncbn,
            email: data.email,
            nphn2: data.nphn2,
            newphone: data.newphone
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
