import { BiographyStory } from './biography-story';

export class BiographyTape {
    public tapeOrder: number = 1;
    public abstract: string = "";
    public stories: BiographyStory[] = [];
}
