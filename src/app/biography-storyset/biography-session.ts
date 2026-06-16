import { BiographyTape } from './biography-tape';

export class BiographySession {
    public sessionOrder: number = 1;
    public interviewer: string = "";
    public interviewDate: string = "";
    public videographer: string = "";
    public location: string = "";
    public tapes: BiographyTape[] = [];
}
