import { Nullable } from '../app.global-state'; // for Nullable type
export class BiographyDocument {
    public biographyID: number = -1; // -1, same as NOTHING_CHOSEN value seen elsewhere in code
    public accession: string = ""; // "", same as NO_ACCESSION_CHOSEN seen elsewhere in code
    public preferredName: string = "";
    public birthDate: Nullable<string> = null;
}
