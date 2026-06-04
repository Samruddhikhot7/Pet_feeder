import React from 'react';
import { format } from 'date-fns';
import { Box, Play } from 'lucide-react';

const Table = ({ data, emptyMessage = "No records found." }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Box className="w-12 h-12 mb-3 opacity-20" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="pb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider pl-2">Event Type</th>
            <th className="pb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">Duration / Qty</th>
            <th className="pb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider text-right pr-2">Date & Time</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="py-4 pl-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${row.type === 'Manual' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                    <Play className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-slate-700">{row.type} Feed</span>
                </div>
              </td>
              <td className="py-4">
                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-md ${
                  row.quantity === 'high' ? 'bg-orange-100 text-orange-700' :
                  row.quantity === 'medium' ? 'bg-blue-100 text-blue-700' :
                  'bg-teal-100 text-teal-700'
                }`}>
                  {row.quantity.charAt(0).toUpperCase() + row.quantity.slice(1)} (
                    {row.quantity === 'high' ? '60s' : row.quantity === 'medium' ? '40s' : '20s'}
                  )
                </span>
              </td>
              <td className="py-4 text-right pr-2">
                <span className="text-sm text-slate-500">
                  {format(new Date(row.time), 'MMM d, yyyy h:mm a')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
