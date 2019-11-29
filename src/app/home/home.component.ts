import { Component, OnInit } from '@angular/core';
import { User } from '../_models';
import { DataService } from '../_services';

@Component({ templateUrl: 'home.component.html', styleUrls: ['./home.component.css'] })
export class HomeComponent implements OnInit {
    users: User[] = [];
    /* myname = JSON.parse(localStorage.getItem('currentUser')); */
    constructor() { }

    ngOnInit() {
    }
}
