import { StatsSummary } from "./types.js";
declare function ReportStats(): StatsSummary;
export declare function RecordStats(): typeof ReportStats;
export declare const recordStats: typeof RecordStats;
export {};
