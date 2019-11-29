export class Contact {
    constructor(
        public id: number,
        public name: string,
        public isppodr: number,
        public isppodrName: string,
        public dolj: string,
        public email: string,
        public phone: string,
        public types: number[]
    ) {
    }
}
