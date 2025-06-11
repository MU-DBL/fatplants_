import { Component, OnInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { MatomoService } from '../../services/matomo/matomo.service';

interface CityVisit {
  label: string;
  sum_daily_nb_uniq_visitors: number;
  lat: number;
  long: number;
  city_name: string;
  region_name: string;
  country_name: string;
}

interface ChartPoint {
  name: string;
  value: number;
}

@Component({
  selector: 'app-visit-dashboard',
  templateUrl: './visit-dashboard.component.html',
  styleUrls: ['./visit-dashboard.component.scss']
})

export class VisitDashboardComponent implements OnInit, OnDestroy {
  map: L.Map | null = null;
  options: L.MapOptions | undefined;
  layers: L.Layer[] = [];
  live_visits = 0;
  visits = 0;
  series: ChartPoint[] = [];
  cityVisits: CityVisit[] = [];

  visitsData: any;
  colorScheme = 'forest';

  chartWidth = 1000;

  constructor(private matomoService: MatomoService) {}

  updateChartWidth = () => {
    this.chartWidth = window.innerWidth - window.innerWidth * 0.1;
  };

  ngOnInit() {
    const prevDate = this.getPreviousDay();

    this.getVisitsSummaryLast1Day(prevDate);
    this.getVisitsSummaryLast12Months();
    this.getCityData(prevDate);
    this.getVisitsSummary(prevDate);

    this.updateChartWidth();
    window.addEventListener('resize', this.updateChartWidth);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.updateChartWidth);
    if (this.map) {
      this.map.remove();
    }
  }

  initMap() {
    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('map', {
      center: [0, 0],
      zoom: 2
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.cityVisits.forEach(city => {
      if(this.map){
      const circleMarker = L.circleMarker([city.lat, city.long], {
        color: 'green',
        radius: 3,
      }).addTo(this.map);

      circleMarker.on('mouseover', () => {
        circleMarker.bindPopup(`
          <strong>${city.label}</strong><br>
          Sum Daily Unique Visitors: ${city.sum_daily_nb_uniq_visitors}<br>
        `).openPopup();
      });

      circleMarker.on('mouseout', () => {
        circleMarker.closePopup();
      });
      }

    });
  }

  getVisitsSummaryLast1Day(prevDate: string) {
    this.matomoService.getVisitsSummaryLast1DayPost(undefined, undefined, prevDate).subscribe({
      next: (data: any) => {
        this.live_visits = data["nb_visits"];
      },
      error: (err: any) => {
        console.error('Error get visits of last day', err);
      }
    });
  }

  getVisitsSummary(prevDate: string) {
    this.matomoService.getVisitsSummary(undefined, undefined, undefined, prevDate).subscribe({
      next: (data: any) => {
        this.visits = data["nb_visits"];
      },
      error: (err: any) => {
        console.error('Error get visits of last day', err);
      }
    });
  }

  getVisitsSummaryLast12Months() {
    this.matomoService.getVisitsSummaryLast12MonthsPost(undefined, undefined).subscribe({
      next: (xmlString: string) => {
        this.series = this.parseLast12MonthXml(xmlString);
        this.visitsData = [
          {
            name: "Visits",
            series: this.series
          }
        ];
      },
      error: (err: any) => {
        console.error('Error get visits of Last 12 Month', err);
      }
    });
  }

  getCityData(prevDate: string) {
    this.matomoService.getCityDataPost(undefined, undefined, undefined, prevDate).subscribe({
      next: (data: any[]) => {
        this.cityVisits = data.map(item => ({
          label: item.label || '',
          sum_daily_nb_uniq_visitors: item.sum_daily_nb_uniq_visitors || 0,
          lat: item.lat || 0,
          long: item.long || 0,
          city_name: item.city_name || '',
          region_name: item.region_name || '',
          country_name: item.country_name || ''
        }));
        this.initMap();
      },
      error: (err: any) => {
        console.error('Error get city data', err);
      }
    });
  }

  parseLast12MonthXml(xmlString: string): ChartPoint[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const results = Array.from(xmlDoc.getElementsByTagName('result'));

    return results.map(result => {
      const date = result.getAttribute('date') ?? '';
      const nbVisitsElem = result.getElementsByTagName('nb_visits')[0];
      const nb_visits = nbVisitsElem ? parseInt(nbVisitsElem.textContent ?? '0', 10) : 0;
      return {
        name: date,
        value: nb_visits
      };
    });
  }

  getPreviousDay(): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = ('0' + (yesterday.getMonth() + 1)).slice(-2);
    const day = ('0' + yesterday.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }
}
