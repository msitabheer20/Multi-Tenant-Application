import React from 'react';
import { SlackLunchReport } from '@/lib/types/slack';

interface LunchStatusTableProps {
  data: SlackLunchReport;
}

export const LunchStatusTable: React.FC<LunchStatusTableProps> = ({ data }) => {
  if (!data || !data.users) return null;

  return (
    <div className="w-full md:w-2/3 lg:w-4/5 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="bg-zinc-50 dark:bg-zinc-800/90 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <i className="fas fa-utensils text-indigo-500"></i>
          Lunch Status for #{data.channel} ({data.timeframe})
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300">
            Total users: {data.users.filter((user) => user.name !== "checkbot").length}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${data.total > 0
            ? 'bg-red-200 dark:bg-red-800 dark:text-zinc-300 text-red-700 dark:text-red-400'
            : 'bg-emerald-100 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400'
            }`}>
            Missing tags: {data.users.filter((user) => user.name !== "checkbot" && user.status !== "complete").length}
          </span>
        </div>
      </div>

      {/* Table data */}
      <div className="overflow-x-auto dark:bg-zinc-800/90">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
          <thead className="bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">User</th>
              <th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Lunch Start</th>
              <th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Lunch End</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Duration</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-900/50 divide-y divide-gray-200 dark:divide-zinc-800">
            {data.users
              .filter((user) => user.name !== "checkbot")
              .sort((a, b) => {
                if (a.status !== "complete" && b.status === "complete") return -1;
                if (a.status === "complete" && b.status !== "complete") return 1;
                return a.name.localeCompare(b.name);
              })
              .map((user, index) => {
                // Calculate time gap if both timestamps exist
                let timeGap = null;
                let isLongBreak = false;

                if (user.lunchStartTime && user.lunchEndTime) {
                  const startTime = new Date(user.lunchStartTime).getTime();
                  const endTime = new Date(user.lunchEndTime).getTime();
                  const diffInMinutes = Math.round((endTime - startTime) / (1000 * 60));
                  timeGap = diffInMinutes;
                  isLongBreak = diffInMinutes > 30;
                }

                // Set status style based on status - use zinc colors for dark mode
                let statusBgClass = '';
                let statusTextClass = '';

                if (user.status === "complete") {
                  statusBgClass = 'bg-emerald-100 dark:bg-zinc-700/90';
                  statusTextClass = 'text-emerald-700 dark:text-emerald-400';
                } else if (user.status === "missing both tags") {
                  statusBgClass = 'bg-red-100 dark:bg-zinc-700/90';
                  statusTextClass = 'text-red-700 dark:text-red-400';
                } else if (user.status === "missing #lunchstart") {
                  statusBgClass = 'bg-amber-100 dark:bg-zinc-700/90';
                  statusTextClass = 'text-amber-700 dark:text-amber-400';
                } else {
                  statusBgClass = 'bg-orange-100 dark:bg-zinc-700/90';
                  statusTextClass = 'text-orange-700 dark:text-orange-400';
                }

                const displayStatus = user.status === "missing #lunchend"
                  ? "missing #lunchend/lunchover"
                  : user.status;

                // Format timestamps
                const startTime = user.lunchStartTime
                  ? new Date(user.lunchStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '-';

                const endTime = user.lunchEndTime
                  ? new Date(user.lunchEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '-';

                // Row background color for alternating rows
                const rowBgClass = index % 2 === 0 ? 'bg-zinc-50 dark:bg-zinc-800/70' : 'bg-white dark:bg-zinc-900/50';

                return (
                  <tr key={user.id} className={rowBgClass}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-200">
                      {user.name}
                      {/* Show times on mobile */}
                      {(user.lunchStartTime || user.lunchEndTime) && (
                        <div className="sm:hidden mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {user.lunchStartTime && <div>Start: {startTime}</div>}
                          {user.lunchEndTime && <div>End: {endTime}</div>}
                        </div>
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400 font-mono text-xs">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBgClass} ${statusTextClass}`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {startTime}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {endTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {timeGap !== null ? (
                        <span className={isLongBreak
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-emerald-600 dark:text-emerald-400'
                        }>
                          {timeGap} min {isLongBreak ? '⚠️' : '✅'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 