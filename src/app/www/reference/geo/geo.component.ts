import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material';
import { environment } from 'src/environments/environment';
declare var ymaps: any;
declare var jQuery: any;

interface YandexMap extends MVCObject {
    // tslint:disable-next-line:no-misused-new
    constructor(el: HTMLElement, opts?: any): void;
    // tslint:disable-next-line:member-ordering
    geoObjects: any;
}

interface MVCObject { addListener(eventName: string, handler: Function): MapsEventListener; }
interface MapsEventListener { remove(): void; }

@Component({
    selector: 'app-maps-all',
    templateUrl: 'geo-component.html',
    styleUrls: ['geo-component.css'],
})
export class GeoRefComponent implements OnInit {
    districtControl = new FormControl();


    districts: any = [];
    map: any;
    myMap: Promise<YandexMap> = new Promise<YandexMap>((resolve: () => void) => { this._mapResolver = resolve; });
    private _mapResolver: (value?: YandexMap) => void;

    @ViewChild('yamaps') el: ElementRef;
    constructor(private http: HttpClient, public snackBar: MatSnackBar) {
        this.http.get(environment.apiUrl + '/roads/getdata/').subscribe(data => { this.districts = data; console.table(data); });
    }
    ngOnInit(): void {
        ymaps.ready().done(() => {
            this.map = new ymaps.Map(this.el.nativeElement, this.options);
            this._mapResolver(<YandexMap>this.map);
            this.map.events.add('click', this.clickMaps, this);
        });
        this.districtControl.valueChanges.subscribe((data) => {
            this.map.geoObjects.removeAll();
            data.map(obj => obj.geos ? obj.geos.map(coords => this.newPolyline(coords, obj.color)) : console.table(obj));
        });

    }
    clickMaps(e: any) {
        if (this.districtControl.value && this.districtControl.value.length === 1) {
            const coords = e.get('coords');
            this.newPolyline([coords], this.districtControl.value[0].color);
        }
    }
    newPolyline(coords: any, color: string) {
        console.table(coords);
        const myPolyline = new ymaps.Polyline(coords, {}, {
            strokeColor: color, // '#FF008888',
            strokeWidth: 3

        });
        myPolyline.editor.options.set({
            vertexLayout: 'default#image',
            vertexIconImageHref: 'assets/img/button3.png',
            vertexIconImageSize: [16, 16],
            vertexIconImageOffset: [-8, -8],
            vertexLayoutHover: 'default#image',
            vertexIconImageSizeHover: [28, 28],
            vertexIconImageOffsetHover: [-14, -14],
            vertexLayoutActive: 'default#image',
            vertexIconImageHrefActive: 'assets/img/button4.png',
            vertexIconImageSizeActive: [16, 16],
            vertexIconImageOffsetActive: [-8, -8],
            vertexLayoutDrag: 'default#image',
            vertexIconImageHrefDrag: 'assets/img/button4.png',
            vertexIconImageSizeDrag: [16, 16],
            vertexIconImageOffsetDrag: [-8, -8],
            edgeLayout: 'default#image',
            edgeIconImageHref: 'assets/img/button1.png',
            edgeIconImageSize: [16, 16],
            edgeIconImageOffset: [-8, -8],
            edgeLayoutHover: 'default#image',
            edgeIconImageSizeHover: [28, 28],
            edgeIconImageOffsetHover: [-14, -14],
            edgeLayoutDrag: 'default#image',
            edgeIconImageHrefDrag: 'assets/img/button2.png',
            edgeIconImageSizeDrag: [16, 16],
            edgeIconImageOffsetDrag: [-8, -8]
        });
        this.map.geoObjects.add(myPolyline);
        myPolyline.editor.startEditing();
    }
    // tslint:disable-next-line:member-ordering
    options: any = {
        center: [56.85227198748677, 53.20774694062715],
        zoom: 16,
        controls: ['zoomControl', 'searchControl', 'typeSelector', 'fullscreenControl']
    };
    save() {
        const tmpArr: any = new Array();
        this.map.geoObjects.each(function (geoObject) {
            if (geoObject.geometry.getCoordinates().length > 0) {
                tmpArr.push(geoObject.geometry.getCoordinates());
            }
        });
        console.log();
        if (this.districtControl.value && this.districtControl.value.length === 1) {
            console.log(tmpArr);
            if (tmpArr) {
                this.http.post<any>(environment.apiUrl + '/roads/save/' + this.districtControl.value[0].id, tmpArr).subscribe();
            }
        }


    }
}
