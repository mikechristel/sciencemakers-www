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
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  /**
   * Intercepts all HTTPRequests and appends an Authorization header to the
   * request object.  Checks for authorization errors on the corresponding
   * response object and if found, redirects to the configured
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (environment.requireAuthentication) {
      var token = localStorage.getItem('token');

      if (token) {
        console.log('Authorization: Bearer ' + token);
        request = request.clone({
          setHeaders: { Authorization: `Bearer ${localStorage.getItem('token')}`}
        });
      }
    }

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
            if (err.status === 401) {
              // Redirect to the Login page
              var url = err.headers.get("DA-Auth-Redirect");
              url += "?return=" + window.location;
              console.log(url);
              window.location.assign(url);
            }
            if (err.status === 403) {
              // Redirect to the Access Denied page
              var url = err.headers.get("DA-Auth-Redirect");
              console.log(url);
              window.location.assign(url);
            }
          }
        }
      );
  }
}
