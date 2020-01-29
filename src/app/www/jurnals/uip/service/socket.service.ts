import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

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
    constructor(private http: HttpClient) {
        this.http.get('http://localhost:8090/kbk/getKbkByYear?year=2020').subscribe((data: any[]) => {
            console.table(data);
            this.dataChangeKbk.next(data.map(kbk => {
                return {
                    name: kbk.name,
                    kosgu: kbk.kosgu,
                    sum: kbk.sum,
                    guid: kbk.guid,
                    value: kbk.value
                };
            }));

        });
        this.http.get('http://localhost:8090/contract/getContractsByYear?year=2020').subscribe((data: any[]) => {

            const datauip: any[] = data.map(dog => {
                return this.createNewDog(dog)
            }
            );
            this.dataChangeDogs.next(datauip);

        });

    }


    private createNewDog(data: any) {
        console.table(data);
        return {
            id: data.id,
            isppodr: data.isppodr || 1,
            isppodrshow: 'хз',
            dogname: data.dogname || 'бн',
            dogdate: data.dogdate || '01.01.2001',
            sumdog: data.sumdog ? Number.parseInt(data.sumdog) : 0,
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
