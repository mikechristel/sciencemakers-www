export class StoryPlayLogInfo {
    constructor(
      public storyID: string,
      public accession: string,
      public sessionOrder: number,
      public tapeOrder: number,
      public storyOrder: number,
      public title: string
    ) {}
}
