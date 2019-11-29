export class Bid {
    constructor(
        public id: number,
        public datebid: string,
        public finishbid: string,
        public contact: string,
        public contactagg: [any],
        public address: string,
        public problem: string,
        public creator: string,
        public status: string,
        public coloricon: string,
        public info: string,
        public type: number,
        public icon: string,
    ) {
    }
}
export class Isppodr {
    constructor(
        public id: number,
        public name: string,
        public isppodr: number,
        public email: string,
        public phone: string,
        public disp: [number],
    ) {
    }
}
export class Types {
    constructor(
        public value: number,
        public viewValue: string,
        public icon: string,
    ) {
    }
}

export class MyConfig {
    constructor(
        public type: number,
        public value: MyConfigVal,
    ) {
    }
}
export class MyConfigVal {
    constructor(
        public id: number,
        public name: string,
        public phone: string,
        public email: string
    ) {
    }
}
