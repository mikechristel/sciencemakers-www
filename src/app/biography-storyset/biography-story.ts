export class BiographyStory {
    public storyID: number = -1; // // ID of the story, starts as -1 == this.globalState.NOTHING_CHOSEN
    public storyOrder: number = 0;
    public duration: number = 0;
    public title: string = "";
    public entityStates: string[] = []; // array of two-letter states, like "HI" for Hawaii, that this story mentions as detected by automated processing
}
