import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs';

@Injectable()
export class AuthManagerService {
  public presentConfirmReloadForm: Subject<boolean> = new Subject<boolean>();
  public presentConfirmReloadForm$ = this.presentConfirmReloadForm.asObservable();

  triggerConfirmReloadForm() {
      // NOTE: Relying on a listener to changes in presentConfirmReloadForm to actually do the (modal) confirm-clear form display.
      // Here we just signal it.
      this.presentConfirmReloadForm.next(true);
  }

}
