import { User } from '../_models';
import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable()
export class DataService {

    UserData: BehaviorSubject<User>;
    getData(): User { return this.UserData.value; }
    addData(data: any) {
        this.UserData.next(this.SetData(data));
    }

    constructor() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const data = currentUser ? currentUser : {};
        this.UserData = new BehaviorSubject<User>(this.SetData(data));
        this.UserData.subscribe((x) => console.log(x));
    }
    private SetData(data) {
        return {
            full_name: data.full_name || null,
            token: data.token || null
        };
    }
}
