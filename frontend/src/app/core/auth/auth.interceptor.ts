import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();
  const request = withAuth(req, token);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = /\/auth\/(login|register|refresh|logout)$/.test(req.url);
      const alreadyRetried = req.headers.has('x-refresh-attempt');

      if (error.status !== 401 || isAuthEndpoint || alreadyRetried) {
        return throwError(() => error);
      }

      return authService.refreshAccessToken().pipe(
        switchMap((refreshed) => {
          if (!refreshed) {
            return throwError(() => error);
          }

          const retryRequest = withAuth(
            req.clone({ headers: req.headers.set('x-refresh-attempt', '1') }),
            authService.getAccessToken()
          );

          return next(retryRequest);
        }),
        catchError((refreshError: HttpErrorResponse) => throwError(() => refreshError))
      );
    })
  );
};

function withAuth(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  const headers = token ? req.headers.set('Authorization', `Bearer ${token}`) : req.headers;

  return req.clone({
    headers,
    withCredentials: true
  });
}

