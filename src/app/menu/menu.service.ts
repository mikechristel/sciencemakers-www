import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';

@Injectable()
export class MenuService {
  public menuOpen: boolean = false;
  public mobileSearchOpen: boolean = false;
  public searchOption: Subject<string> = new Subject<string>();
  public performSearch: Subject<any> = new Subject<any>();
  public bioID: Subject<number> = new Subject<number>();
  public searchOption$ = this.searchOption.asObservable();
  public performSearch$ = this.performSearch.asObservable();
  public bioID$ = this.bioID.asObservable();

  constructor() { }

    setSearchOption(option: string) {
        this.searchOption.next(option);
    }

    setBiographyID(id: number) {
        this.bioID.next(id);
    }

    doSearch(txtQuery: string) {
        this.performSearch.next(txtQuery);
    }

}
