import { Injectable } from '@angular/core';
import { Contracts } from '../class/contract';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import * as io from 'socket.io-client';
import * as moment from 'moment';





@Injectable()
export class SocketService {
    dataChangeDogs: BehaviorSubject<Contracts[]> = new BehaviorSubject<Contracts[]>([]);
    get dataDogs(): Contracts[] { return this.dataChangeDogs.value; }
    public otdels: any;
    public people: any;
    private host: string = environment.apiUrl + 'ozicontracts';
    private socket: any;
    constructor() {
        moment.locale('ru');
        this.socket = io(this.host, { transports: ['websocket'] });
        this.socket.on('connect', () => this.connected());
        this.socket.on('disconnect', () => this.disconnected());
        this.socket.on('error', (error: string) => {
            console.log(`ERROR: '${error}' (${this.host})`);
        });
        this.socket.on('hello', () => {
            this.socket.emit('hello', 'hello');
        });

        this.socket.on('alldata', (data) => {
            console.table(data);
            return data.map(dog => {
                this.addDog(this.createNewDog(dog));
            });
        });
        this.socket.on('myid', (data) => {
            console.log(data);
        });
        this.socket.on('newdog', (data) => {
            console.table(data);
            return data.map(dog => {
                this.addDog(this.createNewDog(dog));
            });
        });
        this.socket.on('allppl', (data) => {
            // console.table(data);
            this.otdels = data;
            const arr: Array<string> = new Array();
            data.map(dog => {
                // dog.users.map(person => { this.people.push({ id: person.fio_id, fio: person.fio }) })
                dog.users.map(person => { arr[person.fio_id] = person.fio });
            });
            this.people = arr;

        });
    }

    private createNewDog(data) {
        let count = 0, countsign = 0;
        if (data.sign !== null && data.sign !== undefined) {
            data.sign.forEach(element => {
                count++;
                if (element.sign) { countsign++; }

            });
        }
        data.signshow = countsign + ' из ' + count;
        return {
            id: data.id || 'id',
            contract_id: data.contract_id || 'id',
            isppodr: data.isppodr || 'не указан',
            numdog: data.numdog || 'бн',
            datedogshow: moment(data.datedog).format('LL'),
            datedog: data.datedog || 'id',
            sumdog: data.sumdog || 'не указана',
            comment: data.comment || '',
            sign: data.sign || {},
            signs: data.signs || {},
            sign_used: data.sign_used,
            target: data.target || 'нет',
            files: data.files,
            signshow: data.signshow || 'нет',
            year: data.year || 'годпехот',
            color: data.color || 'green',
            creator: data.creator || 'z'
        };
    }

    connect() {
        this.socket.connect();
    }
    disconnect() {
        this.socket.disconnect();
    }
    addDog(dog: Contracts) {
        const copiedData = this.dataDogs.slice();
        copiedData.push(dog);
        this.dataChangeDogs.next(copiedData);
    }
    newDog(dog: any) {
        this.socket.emit('newdog', dog);
    }
    editDog(dog: any) {
        this.socket.emit('editdog', dog);
    }
    updateDog(newDog: Contracts) {
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
        console.log('Connected');
    }
    private disconnected() {
        console.log('Disconnected');
    }
}
