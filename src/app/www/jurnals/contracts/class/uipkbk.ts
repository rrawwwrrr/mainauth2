import { Kbk } from './kbk';
export class UipKbk {
    constructor(
        public guid: string,
        public kbk: string,
        public lbo: Kbk[],
        public name: string,
        public used: string,
        public year: string,
    ) {
    }
}