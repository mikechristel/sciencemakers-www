export interface PlaylistInterface {
  storyID: number;
  title: string;
}

export class Playlist implements PlaylistInterface {
  public storyID: number;
  public title: string;

  constructor(storyID: number, title: string) {
    this.storyID = storyID;
    this.title = title;
  }
}
