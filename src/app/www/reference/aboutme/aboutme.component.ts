import { Component } from '@angular/core';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { SocketService } from './socket.service';

@Component({
    selector: 'app-aboutme',
    templateUrl: 'aboutme.component.html',
    styleUrls: ['aboutme.component.css'],
    providers: [SocketService]
})

export class AboutMeComponent {
    meForm: FormGroup;
    editPwd = true;
    constructor(public socket: SocketService, fb: FormBuilder) {
        this.meForm = fb.group({
            'fio': new FormControl(),
            'otdel': new FormControl(),
            'dolj': new FormControl(),
            'phone': new FormControl(),
            'email': new FormControl(),
            'femail': new FormControl(),
            'login': new FormControl(),
            'editpwd': new FormControl(),
            'password': new FormControl(),
            'newpassword': new FormControl(),
            'dblpassword': new FormControl(),
        });
        this.socket.meData.subscribe({
            // next: (v) => console.table(v)
            next: (v) => this.meForm.setValue(v)
        });
    }
    editMe() {
        this.socket.socket.emit('edit', this.meForm.value);
    }
}
