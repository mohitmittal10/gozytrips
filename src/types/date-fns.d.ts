declare module 'date-fns' {
  export type Locale = any;

  export interface FormatOptions {
    locale?: Locale;
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    firstWeekContainsDate?: number;
    useAdditionalWeekYearTokens?: boolean;
    useAdditionalDayOfYearTokens?: boolean;
  }

  export interface FormatDistanceOptions extends FormatOptions {
    addSuffix?: boolean;
    comparison?: 'earlier' | 'later';
  }

  export interface ParseOptions {
    locale?: Locale;
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    firstWeekContainsDate?: number;
    useAdditionalWeekYearTokens?: boolean;
    useAdditionalDayOfYearTokens?: boolean;
  }

  export interface IsMatchOptions extends ParseOptions, FormatOptions {}

  export function format(
    date: Date | number,
    format: string,
    options?: FormatOptions
  ): string;

  export function formatDistance(
    dateA: Date | number,
    dateB: Date | number,
    options?: FormatDistanceOptions
  ): string;

  export function formatDistanceStrict(
    dateA: Date | number,
    dateB: Date | number,
    options?: FormatDistanceOptions
  ): string;

  export function formatDistanceToNow(
    date: Date | number,
    options?: FormatDistanceOptions
  ): string;

  export function formatISO(
    date: Date | number,
    options?: { format?: 'extended' | 'basic' }
  ): string;

  export function formatISO9075(
    date: Date | number,
    options?: { format?: 'extended' | 'basic' }
  ): string;

  export function formatRFC7231(date: Date | number): string;

  export function parse(
    dateString: string,
    format: string,
    baseDate: Date | number,
    options?: ParseOptions
  ): Date;

  export function isMatch(
    dateString: string,
    format: string,
    options?: IsMatchOptions
  ): boolean;

  export function differenceInDays(dateA: Date | number, dateB: Date | number): number;
  export function differenceInHours(dateA: Date | number, dateB: Date | number): number;
  export function differenceInMinutes(dateA: Date | number, dateB: Date | number): number;
  export function differenceInSeconds(dateA: Date | number, dateB: Date | number): number;

  export function addDays(date: Date | number, amount: number): Date;
  export function addHours(date: Date | number, amount: number): Date;
  export function addMinutes(date: Date | number, amount: number): Date;
  export function addSeconds(date: Date | number, amount: number): Date;

  export function startOfDay(date: Date | number): Date;
  export function endOfDay(date: Date | number): Date;
  export function startOfWeek(date: Date | number, options?: { weekStartsOn?: number }): Date;
  export function endOfWeek(date: Date | number, options?: { weekStartsOn?: number }): Date;
  export function startOfMonth(date: Date | number): Date;
  export function endOfMonth(date: Date | number): Date;
  export function startOfYear(date: Date | number): Date;
  export function endOfYear(date: Date | number): Date;

  export function isAfter(dateA: Date | number, dateB: Date | number): boolean;
  export function isBefore(dateA: Date | number, dateB: Date | number): boolean;
  export function isEqual(dateA: Date | number, dateB: Date | number): boolean;
  export function isSameDay(dateA: Date | number, dateB: Date | number): boolean;
  export function isSameMonth(dateA: Date | number, dateB: Date | number): boolean;
  export function isSameYear(dateA: Date | number, dateB: Date | number): boolean;

  export function isValid(date: any): boolean;

  export function isPast(date: Date | number): boolean;
  export function isFuture(date: Date | number): boolean;

  export function getDay(date: Date | number): number;
  export function getDate(date: Date | number): number;
  export function getDayOfYear(date: Date | number): number;
  export function getMonth(date: Date | number): number;
  export function getYear(date: Date | number): number;

  export function setDay(date: Date | number, dayOfWeek: number, options?: { weekStartsOn?: number }): Date;
  export function setDate(date: Date | number, dayOfMonth: number): Date;
  export function setMonth(date: Date | number, month: number): Date;
  export function setYear(date: Date | number, year: number): Date;
}
