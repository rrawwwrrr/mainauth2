import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import * as io from 'socket.io-client';
import { environment } from 'src/environments/environment';

export class AboutMe {
    constructor(
        /* public id: number, */
        public fio: string,
        public otdel: string,
        public dolj: string,
        public phone: string,
        public email: string,
        public femail: string,
        public login: string,
        public password: string
    ) {
    }
}

@Injectable()
export class SocketService {

    private host = environment.socketUrl + '/ref/aboutme';
    public socket: any;
    public meData = new Subject<AboutMe>();
    constructor() {
        this.socket = io(this.host);
        this.socket.on('connect', () => this.connected());
        this.socket.on('disconnect', () => this.disconnected());
        this.socket.on('error', (error: string) => {
            console.log(`ERROR: '${error}' (${this.host})`);
        });
        this.socket.on('loadUpl', (data) => {
            return data.map(dog => {
                this.meData.next(this.addData(dog));
            });
        });
    }
    addData(data) {
        console.table(data);
        return {
            fio: data.fio || '',
            otdel: data.otdel || '',
            dolj: data.dolj || '',
            phone: data.nphn2 || '',
            email: data.email + '@sbdh.ru' || '',
            femail: data.femail || '',
            login: data.email || '',
            editpwd: false,
            password: '',
            newpassword: '',
            dblpassword: ''
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
