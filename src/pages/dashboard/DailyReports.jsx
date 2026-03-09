import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
    MdDescription, MdDownload, MdRefresh,
    MdSchedule, MdShare, MdFullscreen, MdPictureAsPdf, MdPeople
} from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import Button from '../../components/ui/Button';
import { setDailyReport, setLoading, setError } from '../../features/reports/reportsSlice';
import { getDailyReportsAPI, getDailyReportPDFAPI, sendReportWhatsAppAPI, scheduleReportWhatsAppAPI } from '../../features/reports/reportsAPI';

const DailyReports = () => {
    const dispatch = useDispatch();
    const { dailyReport, loading, error } = useSelector(state => state.reports);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [shareStatus, setShareStatus] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [recipientNumber, setRecipientNumber] = useState('whatsapp:+918327700451');
    const [shareView, setShareView] = useState('initial'); // 'initial', 'options'
    const [showScheduleDropdown, setShowScheduleDropdown] = useState(false);
    const [scheduling, setScheduling] = useState(false);
    const [customTime, setCustomTime] = useState('17:00');

    const RECIPIENTS = [
        { label: '8327700451', value: 'whatsapp:+918327700451' },
        { label: '7735416582', value: 'whatsapp:+917735416582' }, // Placeholder/Example
    ];

    useEffect(() => {
        fetchData(selectedDate);
        return () => {
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [selectedDate]);

    const fetchData = async (date) => {
        dispatch(setLoading(true));
        setPdfLoading(true);
        try {
            // 1. Fetch JSON data for sharing/summary
            const jsonRes = await getDailyReportsAPI(date);
            const reportData = jsonRes.data?.data || jsonRes.data;
            dispatch(setDailyReport(reportData));

            // 2. Fetch PDF blob for display
            const pdfRes = await getDailyReportPDFAPI(date);
            const blob = new Blob([pdfRes.data], { type: 'application/pdf' });

            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
        } catch (err) {
            console.error('[DailyReport] Data Fetch Error:', err);
            dispatch(setError(err.message || 'Failed to sync with report server.'));
        } finally {
            dispatch(setLoading(false));
            setPdfLoading(false);
        }
    };

    const getCleanNumber = (num) => {
        return num.replace('whatsapp:', '');
    };

    const handleWhatsAppShare = async () => {
        setSharing(true);
        setShareStatus(null);
        try {
            console.log(`[DailyReport] Initiating server-side WhatsApp share for: ${selectedDate} to ${recipientNumber}`);
            await sendReportWhatsAppAPI(selectedDate, recipientNumber);
            setShareStatus('success');
            setShareView('initial');
            setTimeout(() => setShareStatus(null), 3000);
        } catch (err) {
            console.error('[DailyReport] WhatsApp Share Error:', err);
            setShareStatus('error');
            setTimeout(() => setShareStatus(null), 5000);
        } finally {
            setSharing(false);
        }
    };

    const handleScheduleSend = async (type) => {
        setScheduling(true);
        setShareStatus(null);

        let params = {
            scheduleType: type,
            time: customTime,
            to: getCleanNumber(recipientNumber)
        };

        if (type === '30days') params.time = '09:30';
        if (type === 'custom') {
            params.customDays = 10;
            params.time = '18:15';
        }

        try {
            console.log(`[DailyReport] Scheduling ${type} report to ${params.to} at ${params.time}`);
            await scheduleReportWhatsAppAPI(params);
            setShareStatus('success');
            setShareView('initial');
            setShowScheduleDropdown(false);
            setTimeout(() => setShareStatus(null), 3000);
        } catch (err) {
            console.error('[DailyReport] Scheduling Error:', err);
            setShareStatus('error');
            setTimeout(() => setShareStatus(null), 5000);
        } finally {
            setScheduling(false);
        }
    };

    const handleDownload = () => {
        if (!pdfUrl) return;
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `Daily_Report_${selectedDate}.pdf`;
        link.click();
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <div className="flex items-center space-x-2 text-primary-600 font-bold text-xs uppercase tracking-[2px] mb-1">
                        <MdPictureAsPdf size={16} />
                        <span>Official Export</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Generated Report</h2>
                </div>

                <div className="flex items-center flex-wrap gap-3">
                    <div className="relative">
                        <MdSchedule className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="date"
                            className="bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/10 transition-all cursor-pointer"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <MdPeople className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        <select
                            className="bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-10 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/10 transition-all appearance-none cursor-pointer min-w-[200px]"
                            value={recipientNumber}
                            onChange={(e) => setRecipientNumber(e.target.value)}
                        >
                            {RECIPIENTS.map((r, i) => (
                                <option key={i} value={r.value}>{r.label}</option>
                            ))}
                            {/* <option value="">Custom Number...</option> */}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>

                    {/* Show manual input if custom is selected or if user wants flexibility */}
                    {!RECIPIENTS.find(r => r.value === recipientNumber) && recipientNumber !== "" && (
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="whatsapp:+91..."
                                className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/10 transition-all w-48"
                                value={recipientNumber}
                                onChange={(e) => setRecipientNumber(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="h-8 w-[1px] bg-slate-100 mx-1 hidden md:block"></div>

                    <Button variant="secondary" icon={MdRefresh} onClick={() => fetchData(selectedDate)} size="sm">Reload</Button>

                    <div className="flex items-center gap-2 relative">
                        {shareView === 'initial' ? (
                            <Button
                                variant="secondary"
                                icon={FaWhatsapp}
                                onClick={() => setShareView('options')}
                                className={`!text-[#25D366] hover:bg-emerald-50 transition-all ${shareStatus === 'success' ? 'bg-emerald-50 border-emerald-200' : ''}`}
                                size="sm"
                                loading={sharing || scheduling}
                            >
                                {shareStatus === 'success' ? 'Sent!' : shareStatus === 'error' ? 'Failed' : 'Share PDF'}
                            </Button>
                        ) : (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                                <Button
                                    variant="secondary"
                                    onClick={() => { handleWhatsAppShare(); }}
                                    className="!text-[#25D366] !bg-white !px-4 !rounded-xl active:scale-95 transition-all"
                                    size="sm"
                                >
                                    Send Now
                                </Button>

                                <div className="relative">
                                    <Button
                                        variant="primary"
                                        onClick={() => setShowScheduleDropdown(!showScheduleDropdown)}
                                        size="sm"
                                        className="!px-4 !rounded-xl active:scale-95 transition-all"
                                        icon={MdSchedule}
                                    >
                                        Schedule Send
                                    </Button>

                                    {showScheduleDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 12, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className="absolute right-0 mt-3 w-96 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 py-6 z-[100] overflow-hidden"
                                        >
                                            <div className="px-6 pb-4 border-b border-slate-50 mb-4">
                                                <h4 className="text-sm font-black text-slate-800 tracking-tight">Report Automation</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Select recurring delivery plan</p>
                                            </div>

                                            <div className="px-6 space-y-5">
                                                {/* Option 1: Custom Today */}
                                                <div className="group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-slate-700">1. Send Today</span>
                                                            <span className="text-[10px] text-slate-400 font-bold">Custom selected time</span>
                                                        </div>
                                                        <input
                                                            type="time"
                                                            className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-primary-500/10 transition-all w-28"
                                                            value={customTime}
                                                            onChange={(e) => setCustomTime(e.target.value)}
                                                        />
                                                    </div>
                                                    <Button size="sm" className="w-full !rounded-xl !py-2 bg-slate-900 hover:bg-black text-white" onClick={() => handleScheduleSend('daily')}>Set Schedule Now</Button>
                                                </div>

                                                <div className="h-[1px] bg-slate-50"></div>

                                                {/* Option 2: 7 Days */}
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-700">2. Send for 7 Days</span>
                                                        <span className="text-[10px] text-slate-400 font-bold">At {customTime} daily</span>
                                                    </div>
                                                    <Button size="sm" variant="secondary" className="!rounded-xl !px-6 hover:bg-slate-900 hover:text-white transition-all" onClick={() => handleScheduleSend('7days')}>Send</Button>
                                                </div>

                                                <div className="h-[1px] bg-slate-50"></div>

                                                {/* Option 3: 30 Days */}
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-700">3. Send for 30 Days</span>
                                                        <span className="text-[10px] text-slate-400 font-bold">Fixed @ 9:30 PM (21:30)</span>
                                                    </div>
                                                    <Button size="sm" variant="secondary" className="!rounded-xl !px-6 hover:bg-slate-900 hover:text-white transition-all" onClick={() => handleScheduleSend('30days')}>Send</Button>
                                                </div>

                                                <div className="h-[1px] bg-slate-50"></div>

                                                {/* Option 4: 10 Days */}
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-700">4. Send every 10 Days</span>
                                                        <span className="text-[10px] text-slate-400 font-bold">Fixed @ 6:15 PM (18:15)</span>
                                                    </div>
                                                    <Button size="sm" variant="secondary" className="!rounded-xl !px-6 hover:bg-slate-900 hover:text-white transition-all" onClick={() => handleScheduleSend('custom')}>Send</Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <button onClick={() => { setShareView('initial'); setShowScheduleDropdown(false); }} className="px-3 text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest transition-colors active:scale-90">Close</button>
                            </motion.div>
                        )}
                    </div>
                    <Button icon={MdDownload} onClick={handleDownload} size="sm">Download PDF</Button>
                </div>
            </div>

            {/* PDF Viewer Container */}
            <div className="flex-1 bg-slate-800 rounded-2xl overflow-hidden shadow-2xl relative border-4 border-slate-900">
                {pdfLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
                        <p className="text-white font-black text-[10px] uppercase tracking-widest animate-pulse">Rendering Document Engine...</p>
                    </div>
                ) : error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-slate-900">
                        <MdDescription size={64} className="text-slate-700 mb-6" />
                        <h3 className="text-white font-black text-xl mb-2">Protocol Link Failure</h3>
                        <p className="text-slate-400 max-w-md mb-8">{error}</p>
                        <Button onClick={() => fetchData(selectedDate)}>Retry Handshake</Button>
                    </div>
                ) : pdfUrl ? (
                    <iframe
                        src={`${pdfUrl}#toolbar=0&navpanes=0`}
                        className="w-full h-full border-none"
                        title="Daily Report PDF"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                        <MdPictureAsPdf size={48} className="mb-4 opacity-20" />
                        <p className="font-bold uppercase tracking-widest text-xs">No document stream detected.</p>
                    </div>
                )}

                {/* Floating Fullscreen Action */}
                {pdfUrl && !pdfLoading && (
                    <button
                        onClick={() => window.open(pdfUrl, '_blank')}
                        className="absolute bottom-6 right-6 bg-primary-600 text-white p-3 rounded-xl shadow-xl hover:bg-primary-500 transition-all hover:scale-110 group active:scale-95"
                        title="Open in New Tab"
                    >
                        <MdFullscreen size={24} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default DailyReports;
