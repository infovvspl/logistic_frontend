import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const dataPool = {
    daily: [
        { label: 'Mon', value: 1200 },
        { label: 'Tue', value: 1900 },
        { label: 'Wed', value: 1500 },
        { label: 'Thu', value: 2400 },
        { label: 'Fri', value: 2100 },
        { label: 'Sat', value: 2800 },
        { label: 'Sun', value: 2200 },
    ],
    monthly: [
        { label: 'Jan', value: 45000 },
        { label: 'Feb', value: 52000 },
        { label: 'Mar', value: 48000 },
        { label: 'Apr', value: 61000 },
        { label: 'May', value: 55000 },
        { label: 'Jun', value: 67000 },
        { label: 'Jul', value: 82000 },
    ],
    yearly: [
        { label: '2020', value: 420000 },
        { label: '2021', value: 510000 },
        { label: '2022', value: 580000 },
        { label: '2023', value: 720000 },
        { label: '2024', value: 690000 },
        { label: '2025', value: 850000 },
    ]
};

const RevenueChart = ({ period = 'monthly' }) => {
    const data = dataPool[period] || dataPool.monthly;

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                        tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            padding: '12px'
                        }}
                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                        cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        animationBegin={0}
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueChart;
