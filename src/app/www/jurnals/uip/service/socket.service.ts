import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import * as io from 'socket.io-client';
import * as moment from 'moment';

export interface Kbk {
    name: string;
    kosgu: string;
    sum: number;
    guid: string;
}
export interface Dog {
    id: number;
    isppodr: number;
    isppodrshow: string;
    dogname: string;
    dogdate: string;
    sumdog: number;
    comment: string;
    year: string;
    color: string;
    creator: string;
    guid: string;
}

@Injectable()
export class SocketService {
    dataChangeDogs: BehaviorSubject<Dog[]> = new BehaviorSubject<Dog[]>([]);
    dataChangeKbk: BehaviorSubject<Kbk[]> = new BehaviorSubject<Kbk[]>([]);
    get dataDogs(): Dog[] { return this.dataChangeDogs.value; }
    get dataKbk(): Kbk[] { return this.dataChangeKbk.value; }
    public otdels: any;
    public people: any;
    private host: string = environment.socketUrl + '/uip';
    private socket: any;
    constructor() {
        moment.locale('ru');
        this.socket = io(this.host);
        this.socket.on('connect', () => this.connected());
        this.socket.on('disconnect', () => this.disconnected());
        this.socket.on('error', (error: string) => {
            console.log(`ERROR: '${error}' (${this.host})`);
        });


        this.socket.on('condata', (data) => {
            this.dataChangeKbk.next(data.kbk.map(kbk => {
                return {
                    name: kbk.name,
                    kosgu: kbk.kosgu,
                    sum: kbk.sum,
                    guid: kbk.guid,
                    kvr: kbk.kvr
                };
            }));
            const datauip = [];
            console.table(data.uip);
            data.uip.map(dog => {
                dog.sum_agg.map(agg =>
                    datauip.push({
                        id: dog.id,
                        isppodr: dog.isppodr || 'не указан',
                        isppodrshow: 'хз',
                        dogname: dog.dogname || 'бн',
                        dogdate: dog.dogdate || '01.01.2001',
                        sumdog: agg.summ || 0,
                        guid: agg.kbk || 0,
                        comment: dog.comment || '',
                        year: dog.year || '0001',
                        color: dog.color || 'green',
                        creator: dog.creator || 'я'
                    }));
            });
            this.dataChangeDogs.next(datauip);
        });

        /* this.dataChangeDogs.next(data.uip.map(dog => {
            return this.createNewDog(dog);
        })); */
        /*  }); */
    }
    /* addDog(dog: Dog) {
        const copiedData = this.dataDogs.slice();
        copiedData.push(dog);
        this.dataChangeDogs.next(copiedData);
    } */
    private createNewDog(data) {
        return {
            id: data.id,
            isppodr: data.isppodr || 'не указан',
            isppodrshow: 'хз',
            dogname: data.dogname || 'бн',
            dogdate: data.dogdate || '01.01.2001',
            sumdog: data.sumdog || 0,
            comment: data.comment || '',
            year: data.year || '0001',
            color: data.color || 'green',
            creator: data.creator || 'я'
        };
    }

    connect() {
        this.socket.connect();
    }
    disconnect() {
        this.socket.disconnect();
    }
    newDog(dog: any) {
        this.socket.emit('newdog', dog);
    }
    editDog(dog: any) {
        this.socket.emit('editdog', dog);
    }
    updateDog(newDog: Dog) {
        const copiedData = this.dataDogs.slice();
        this.dataDogs.slice().forEach((dog, index) => {
            if (dog.id === newDog.id) {
                copiedData[index] = newDog;
                this.dataChangeDogs.next(copiedData);
                return;
            }
        });
    }
    emit(chanel, message) {
        return new Observable<any>(observer => {
            console.log(`emit to ${chanel}:`, message);
            this.socket.emit(chanel, message, function (data) {
                if (data.success) {
                    observer.next(data.msg);
                } else {
                    observer.error(data.msg);
                }
                observer.complete();
            });
        });
    }
    on(event_name) {
        console.log(`listen to ${event_name}:`);
        return new Observable<any>(observer => {
            this.socket.off(event_name);
            this.socket.on(event_name, (data) => {
                observer.next(data);
            });
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
        console.log('Disconnected');
    }
}
