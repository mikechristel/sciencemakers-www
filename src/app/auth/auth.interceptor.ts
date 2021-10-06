/**
 * HTTP Authentication Interceptor
 */
import { APP_BASE_HREF, Location } from '@angular/common';
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { AuthManagerService } from './auth-manager.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authManagerService: AuthManagerService) {

  }

  /**
    * Handle all 403 (and 401) errors returned by reverse-proxy authentication server
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    return next
      .handle(request)
      .do(
        (event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) {
            // Do stuff with response here if necessary
          }
        },
        (err: any) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status === 401 || err.status === 403) {
              // Reload page to force reauthentication
              // NO!!! infinite looping!!! Instead of... window.location.reload();
              // ...do a modal dialogue:
              this.authManagerService.triggerConfirmReloadForm();
            }
          }
        }
      );
  }
}
