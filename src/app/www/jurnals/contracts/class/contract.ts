import { Sign } from './sign';
export class Contracts {
    constructor(
        public id: number,
        public contract_id: number,
        public isppodr: string,
        public numdog: string,
        public datedog: string,
        public datedogshow: string,
        public sumdog: number,
        public comment: string,
        public sign: Sign[],
        public signshow: string,
        public year: string,
        public color: string,
        public creator: number
    ) {
    }
}
