import React from 'react';
import { motion } from 'framer-motion';

const Table = ({ columns, data, loading, onRowClick, className = "" }) => {
    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            <p className="text-sm text-slate-400 font-medium">Fetching data...</p>
        </div>
    );

    if (!data || data.length === 0) return (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 mx-6 my-6">
            <p className="text-sm text-slate-500 font-medium">No records found matched your criteria.</p>
        </div>
    );

    return (
        <div className={`rounded-2xl bg-white ${className}`}>
            <div className="overflow-x-visible">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest"
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                        {data.map((row, rowIdx) => (
                            <motion.tr
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: rowIdx * 0.03 }}
                                key={rowIdx}
                                onClick={() => onRowClick?.(row)}
                                className={`${onRowClick ? 'cursor-pointer hover:bg-slate-50/80 transition-colors' : ''}`}
                            >
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                                        {col.render ? col.render(row) : (row[col.accessor] || '-')}
                                    </td>
                                ))}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Table;
