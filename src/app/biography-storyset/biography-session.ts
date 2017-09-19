import { BiographyTape } from './biography-tape';

export class BiographySession {
    public sessionOrder: number;
    public interviewer: string;
    public interviewDate: string;
    public videographer: string;
    public location: string;
    public sponsor: string;
    public sponsorURL: string;
    public sponsorImage: string; // NOTE: do not use if empty or if it starts "TODO"
    public tapes: BiographyTape[];
}
