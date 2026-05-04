import { StoryHighlight } from './story-highlight';
import { StoryDocument } from './story-document';

export class Story {
    constructor(
        public score: number,
        public highlights: StoryHighlight,
        public document: StoryDocument
    ) {}
}
