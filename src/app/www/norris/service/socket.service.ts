import { Injectable } from '@angular/core';
import { Dogs } from '../class/dogs';
import { BehaviorSubject, Observable } from 'rxjs';
import * as io from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable()
export class SocketService {

    dataChange: BehaviorSubject<Dogs[]> = new BehaviorSubject<Dogs[]>([]);
    get data(): Dogs[] { return this.dataChange.value; }
    private host = environment.socketUrl + '/norris';
    public socket: any;

    public Types = [
        { value: 0, viewValue: 'Все' },
        { value: 1, viewValue: 'удс' },
        { value: 2, viewValue: 'дворы' },
        { value: 3, viewValue: 'Деп.наказы' }
    ];
    constructor() {
        this.socket = io(this.host);
        this.socket.on('connect', () => this.connected());
        this.socket.on('disconnect', () => this.disconnected());
        this.socket.on('error', (error: string) => {
            console.log(`ERROR: '${error}' (${this.host})`);
        });
        this.socket.on('loadUpl', (data) => {
            return data.map(dog => {
                this.addDog(this.createNewDog(dog));
            });
        });
    }

    private createNewDog(data) {
        return {
            id: data.id,
            used: data.used,
            isppodr: data.isppodr,
            contractFull: data.contractfull,
            objectFull: data.objectfull,
            type: data.type,
            files: data.files,
            comment: data.comment,
            created_at: data.created_at,
            color: data.used ? '' : 'red'
        };
    }

    connect() {
        this.socket.connect();
    }
    disconnect() {
        this.socket.disconnect();
    }
    addDog(dog: Dogs) {
        const copiedData = this.data.slice();
        copiedData.push(dog);
        this.dataChange.next(copiedData);
    }
    updateDog(newDog: Dogs) {
        const copiedData = this.data.slice();
        this.data.slice().forEach((dog, index) => {
            if (dog.id === newDog.id) {
                copiedData[index] = newDog;
                this.dataChange.next(copiedData);
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
