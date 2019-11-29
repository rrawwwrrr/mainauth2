import { Injectable } from '@angular/core';
import { Bid } from '../class/bid';
import { BehaviorSubject } from 'rxjs';
import * as io from 'socket.io-client';
import * as moment from 'moment';

import { environment } from 'src/environments/environment';

@Injectable()
export class SocketService {
    dataChangeBid: BehaviorSubject<Bid[]> = new BehaviorSubject<Bid[]>([]);
    get dataDogs(): Bid[] { return this.dataChangeBid.value; }
    public otdels: any;
    public people: any;
    private host = `${environment.socketUrl}/disp`;
    public socket: any;
    public isppodr: any;
    public traf: any;
    public isLoadingResults = true;
    public Types: any;
    public myConfig: any;
    constructor() {
        moment.locale('ru');
        this.socket = io(this.host, { transports: ['websocket'] });
        this.socket.on('connect', () => this.connected());
        this.socket.on('disconnect', () => this.disconnected());
        this.socket.on('error', (error: string) => {
            console.log(`ERROR: '${error}' (${this.host})`);
        });
        this.socket.on('hello', () => {
            this.socket.emit('getdata', { limit: 600 });
        });
        this.socket.on('append', (data) => {
            this.addBid(data, true);
            console.log('append', data);
        });
        this.socket.on('console', (data) => {
            console.log(data);
        });
        this.socket.on('primarydata', (data) => {
            this.myConfig = data.config; // JSON.parse();
            this.Types = data.args;
            this.addTraf(data.traf);
            this.addIsp(data.isp);
            this.addBid(data.data);
            /* console.table(this.isppodr); */
        });
        this.socket.on('myid', (data) => {
            '';
        });
    }
    addBid(data: any, resolv = false) {
        this.isLoadingResults = false;
        if (!resolv) { this.dataChangeBid.next(new Array); }
        const copiedData = this.dataDogs.slice();
        data.map(data2 => {
            if (!resolv) {
                copiedData.push(this.createNew(data2));
            } else {
                copiedData.unshift(this.createNew(data2));
            }
        });
        /* console.log(copiedData); */
        this.dataChangeBid.next(copiedData);
    }
    addIsp(data: any) {
        const arr: Array<string> = new Array();
        data.map(element => {
            arr[element.id] = element;
        });
        this.isppodr = arr;
    }
    addTraf(data: any) {
        const arr: Array<string> = new Array();
        data.map(element => {
            arr[element.id] = element;
        });
        this.traf = arr;
        /*         console.table(this.traf); */
    }
    public sender(event: string, message: string) {
        this.socket.emit(event, message);
    }

    private createNew(data) {
        console.log(data.contact);
        return {
            id: data.id || 'id',
            datebid: data.datebid,
            finishbid: data.finishbid || null,
            contact: (typeof data.contact === 'object' && data.contact) ?
                    data.contact.map(t => t.name).reduce((acc, value) => acc + ', ' + value) : 'тютю',
            contactagg: data.contact || null,
            address: data.type === 1 ? this.traf.filter(x => x.id === parseInt(data.address, 10)).map(x => x.street) : data.address,
            problem: data.problem || 'id',
            creator: data.creator || 'не указана',
            status: data.finishbid ? 'done_all' : 'build',
            info: data.info || '',
            coloricon: data.finishbid ? 'green' : 'red',
            color: data.color || '',
            type: data.type || '',
            icon: this.Types.filter(x => x.value === data.type).map(x => x.icon)
        };
    }
    connect() {
        this.socket.connect();
    }
    disconnect() {
        this.socket.disconnect();
    }

    getData(value) {
        this.isLoadingResults = true;
        this.socket.emit('getdata', value);
    }
    updateDog(newDog: Bid) {
        const copiedData = this.dataDogs.slice();
        this.dataDogs.slice().forEach((dog, index) => {
            if (dog.id === newDog.id) {
                copiedData[index] = newDog;
                this.dataChangeBid.next(copiedData);
                return;
            }
        });
    }
    private connected() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.socket.emit('authenticate',
            { token: currentUser.token })
            .on('authenticated', function () {
                // do other things
            })
            .on('unauthorized', function (msg) {
                // console.log('unauthorized: ' + JSON.stringify(msg.data));
                throw new Error(msg.data.type);
            });
        // console.log('Connected');
    }
    private disconnected() {
        // console.log('Disconnected');
    }
    /* public Types = [
        { value: 0, viewValue: 'Все', },
        { value: 1, viewValue: 'Светофоры', icon: 'traffic' },
        { value: 2, viewValue: 'Дорожные знаки', icon: 'directions' },
        { value: 3, viewValue: 'Ливневая канализация', icon: 'gps_not_fixed' },
        { value: 4, viewValue: 'Пешеходные мостики', icon: 'directions' }
    ];    public icon(type) {
        switch (type) {
            case 1:
                return 'traffic';
            case 2:
                return 'directions';
            case 3:
                return 'gps_not_fixed';
            case 4:
                return 'gps_not_fixed';
            default:
                break;
        }
    } */
}
