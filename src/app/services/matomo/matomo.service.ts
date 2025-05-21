import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MatomoService {

  constructor(private http: HttpClient) { }

  getVisitsSummaryLast1DayPost(tokenAuth: string = environment.matomo_token_auth, 
    idSite: number = environment.matomo_site_id, prevDate = '2025-05-07'): Observable<any> {
    const params = {
      module: 'API',
      method: 'VisitsSummary.get',
      idSite: idSite.toString(),
      period: 'day',
      date: prevDate,
      format: 'JSON'
    };

    const body = new HttpParams().set('token_auth', tokenAuth);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(environment.matomo_url+'index.php', body.toString(), { headers, params });
}

  getVisitsSummary(tokenAuth: string = environment.matomo_token_auth, 
    idSite: number = environment.matomo_site_id, startDate = '2025-05-07', endDate='2025-05-15'): Observable<any> {
    const params = {
      module: 'API',
      method: 'VisitsSummary.get',
      idSite: idSite.toString(),
      period: 'range',
      date: `${startDate},${endDate}`,
      format: 'JSON'
    };

    const body = new HttpParams().set('token_auth', tokenAuth);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(environment.matomo_url+'index.php', body.toString(), { headers, params });
}

getVisitsSummaryLast12MonthsPost(tokenAuth: string = environment.matomo_token_auth, 
    idSite: number = environment.matomo_site_id): Observable<any> {

    const params = {
      module: 'API',
      method: 'VisitsSummary.get',
      idSite: idSite.toString(),
      period: 'month',
      date: 'last12',
      format: 'XML'
    };

    const body = new HttpParams().set('token_auth', tokenAuth);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(environment.matomo_url+'index.php', body.toString(), { headers, params, responseType: 'text' });
}


 getCityDataPost(tokenAuth: string = environment.matomo_token_auth, 
  idSite: number = environment.matomo_site_id, 
  startDate = '2025-05-07', endDate='2025-05-15'): Observable<any> {
    
    const params = {
      module: 'API',
      method: 'UserCountry.getCity',
      idSite: idSite.toString(),
      period: 'range',
      date: `${startDate},${endDate}`,
      format: 'JSON'
    };

    const body = new HttpParams().set('token_auth', tokenAuth);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(environment.matomo_url+'index.php', body.toString(), { headers, params});
  }
}