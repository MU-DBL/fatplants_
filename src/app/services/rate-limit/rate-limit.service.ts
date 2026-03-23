import { Injectable } from '@angular/core';

const STORAGE_KEY = 'lipidbot_usage';
const DAILY_LIMIT = 100;

interface UsageRecord {
  date: string;   // YYYY-MM-DD
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class RateLimitService {

  private todayKey(): string {
    return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  }

  private getRecord(): UsageRecord {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const record: UsageRecord = JSON.parse(raw);
        if (record.date === this.todayKey()) return record;
      }
    } catch { /* ignore parse errors */ }
    return { date: this.todayKey(), count: 0 };
  }

  private saveRecord(record: UsageRecord): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  }

  /** Returns true if the daily limit has been reached (does NOT increment). */
  isLimited(): boolean {
    return this.getRecord().count >= DAILY_LIMIT;
  }

  /** Increments the counter after a successful response. */
  consume(): void {
    const record = this.getRecord();
    record.count += 1;
    this.saveRecord(record);
  }

  remaining(): number {
    return Math.max(0, DAILY_LIMIT - this.getRecord().count);
  }
}
