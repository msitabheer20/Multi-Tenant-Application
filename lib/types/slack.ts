export interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  email?: string;
  avatar?: string;
}

export interface LunchStatus {
  name: string;
  id: string;
  status: "missing both tags" | "missing #lunchstart" | "missing #lunchend" | "complete";
  lunchStartTime?: string;
  lunchEndTime?: string;
}

export interface SlackLunchReport {
  channel: string;
  timeframe: "today" | "yesterday" | "this_week";
  users: LunchStatus[];
  total: number;
  timestamp: string;
  error?: string;
}

export interface UpdateStatus {
  id: string;
  name: string;
  hasPosted: boolean;
  timestamp?: string;
  content?: string;
  allUpdates?: Array<{ timestamp: string; content: string, date: string }>;
}

export interface SlackUpdateReport {
  channel: string;
  timeframe: "today" | "yesterday" | "this_week";
  users: UpdateStatus[];
  timestamp: string;
  error?: string;
}

export interface ReportStatus {
  id: string;
  name: string;
  hasPosted: boolean;
  timestamp?: string;
  content?: string;
  allReports?: Array<{ timestamp: string; content: string, date: string }>;
}

export interface SlackReportStatusReport {
  channel: string;
  timeframe: "today" | "yesterday" | "this_week";
  users: ReportStatus[];
  timestamp: string;
  error?: string;
}

export interface SlackApiResponse {
  ok: boolean;
  error?: string;
  [key: string]: any;
} 