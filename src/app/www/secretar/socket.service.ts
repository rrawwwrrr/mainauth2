import { Injectable } from '@angular/core';
import { Contact } from './secretar.class';
import { BehaviorSubject } from 'rxjs';
import * as io from 'socket.io-client';
import * as moment from 'moment';
import { environment } from 'src/environments/environment';




@Injectable()
export class SocketService {
    dataChange: BehaviorSubject<Contact[]> = new BehaviorSubject<Contact[]>([]);
    get data(): Contact[] { return this.dataChange.value; }
    public isppodrs: any;
    public otdels: any;
    public args: any;
    public people: any;
    private host = environment.socketUrl + '/secretar';
    private socket: any;
    constructor() {
        moment.locale('ru');
        this.socket = io(this.host, { transports: ['websocket'] });
        this.socket.on('connect', () => this.connected());
        this.socket.on('disconnect', () => this.disconnected());
        this.socket.on('error', (error: string) => {
            console.log(`ERROR: "${error}" (${this.host})`);
        });
        this.socket.on('hello', () => {
            this.socket.emit('getdata', 'hello');
        });
        this.socket.on('update', (value: any) => {
            this.editContact(value[0]);
        });
        this.socket.on('append', (value: any) => {
            /* console.table(value); */
            this.addContacts(value, true);
        });
        this.socket.on('primarydata', (data) => {
            this.isppodrs = data.isp;
            this.dataChange.next([]);
            this.args = data.args[0].args;
            this.addContacts(data.data);
        });
    }
    send(event: string, value: any) {
        if (value) {
            this.socket.emit(event, value);
        }
    }
    addContact(con: Contact) {
        const copiedData = this.data.slice();
        copiedData.push(con);
        this.dataChange.next(copiedData);
    }
    addContacts(Contacts, revers = false) {
        const copiedData = this.data.slice();
        Contacts.map(con => {
            if (!revers) {
                copiedData.push(this.createNew(con));
            } else {
                copiedData.unshift(this.createNew(con));
            }

        });
        this.dataChange.next(copiedData);
    }
    editContact(value: any) {
        const copiedData = this.data.slice();
        copiedData.forEach((con, index) => {
            if (con.idshow === value.idshow) {
                copiedData[index] = this.createNew(value);
                return;
            }
        });
        this.dataChange.next(copiedData);
    }
    private createNew(data) {
        return {
            idshow: data.idshow,
            sum: data.sum,
            isppodrName: this.isppodrs.filter(function (number) {
                return number.id === data.isppodr; // parseInt(data.isppodr, 10);
            })[0].name,
            isppodr: data.isppodr,
            numdoc: data.numdoc || '',
            datedoc: data.datedoc || '',
            datenow: data.datenow || '',
            typedocshow: this.args.type[data.typedoc],
            typedoc: data.typedoc,
            targetshow: this.args.target[data.target],
            target: data.target,
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
