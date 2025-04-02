import React from 'react';
import { SlackReportStatusReport } from '@/lib/types/slack';

interface ReportStatusTableProps {
  data: SlackReportStatusReport;
  onSelectContent: (name: string, content: string) => void;
}

export const ReportStatusTable: React.FC<ReportStatusTableProps> = ({ data, onSelectContent }) => {
  if (!data || !data.users) return null;

  return (
    <div className="w-full md:w-2/3 lg:w-4/5 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="bg-zinc-50 dark:bg-zinc-800/90 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <i className="fas fa-file-alt text-indigo-500"></i>
          Report Status for #{data.channel} ({data.timeframe})
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300">
            Users with reports: {data.users.filter(user => user.name !== "checkbot" && user.hasPosted).length}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-400">
            Total reports: {data.users.reduce((count, user) =>
              user.name !== "checkbot" && user.allReports ? count + user.allReports.length : count, 0)}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto dark:bg-zinc-800/90">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
          <thead className="bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">User</th>
              <th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-900/50 divide-y divide-gray-200 dark:divide-zinc-800">
            {/* Get all reports from all users */}
            {data.users
              // Filter out users with name "checkbot" and only show users with reports
              .filter(user => user.name !== "checkbot" && user.hasPosted && user.allReports)
              // Sort users by name
              .sort((a, b) => a.name.localeCompare(b.name))
              .flatMap((user) => {
                // For each user, create a row for each report
                return user.allReports!.map((report, reportIndex) => {
                  // Format timestamp
                  const postedTime = report.timestamp
                    ? new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '-';

                  const postedDate = report.date || '-';

                  // Row background for alternating users
                  const baseRowBgClass = reportIndex % 2 === 0
                    ? 'bg-zinc-50 dark:bg-zinc-800/70'
                    : 'bg-white dark:bg-zinc-900/50';

                  // Different shade for first row of each user to help visually group reports
                  const rowBgClass = reportIndex === 0
                    ? `${baseRowBgClass} border-t-2 border-zinc-300 dark:border-zinc-700`
                    : baseRowBgClass;

                  return (
                    <tr
                      key={`${user.id}-${reportIndex}`}
                      className={`${rowBgClass} cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700`}
                      onClick={() => {
                        if (report.content) {
                          onSelectContent(`${user.name} (Report ${reportIndex + 1})`, report.content);
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-200">
                        {user.name}
                        {reportIndex > 0 ? (
                          <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">
                            (Report {reportIndex + 1})
                          </span>
                        ) : null}
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400 font-mono text-xs">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-zinc-700/90 text-emerald-700 dark:text-emerald-400">
                          Posted Report
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                        {postedDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                        {postedTime}
                      </td>
                    </tr>
                  );
                });
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 