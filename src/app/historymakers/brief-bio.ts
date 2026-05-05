import { BiographyDocument } from './biography-document';

export class BriefBio {
    constructor(
        public score: number,
        public highlights: string,
        public document: BiographyDocument
    ) { }
}