import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataService } from './app.service';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {

    constructor(private _http: HttpClient, private _dataService: DataService) { }
    login(username: string, password: string) {
        return this._http.post<any>(`${environment.apiUrl}/auth/authenticate`, { username, password })
            .pipe(map(user => {
                if (user && user.token) {
                    this._dataService.addData(user);
                    localStorage.setItem('currentUser', JSON.stringify(user));
                }
                return user;
            }));
    }

    logout() {
        this._dataService.addData({});
        localStorage.removeItem('currentUser');
    }
}
