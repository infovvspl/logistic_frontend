import axiosInstance from '../../services/axios';

/**
 * Fetches the daily report summary from the backend.
 * @param {string} date - Date in YYYY-MM-DD format.
 */
export const getDailyReportsAPI = (date) => axiosInstance.get(`/api/reports/daily?date=${date}`);

/**
 * Fetches the daily report as a PDF blob.
 * @param {string} date - Date in YYYY-MM-DD format.
 */
export const getDailyReportPDFAPI = (date) => axiosInstance.get(`/api/reports/daily?date=${date}&format=pdf`, {
    responseType: 'blob'
});

/**
 * Sends the daily report PDF via WhatsApp using server-side integration.
 * @param {string} date - Date in YYYY-MM-DD format.
 * @param {string} to - Destination WhatsApp ID (e.g., 'whatsapp:+91...').
 */
export const sendReportWhatsAppAPI = (date, to) => axiosInstance.post(`/api/reports/send-whatsapp?date=${date}&to=${encodeURIComponent(to)}`);

/**
 * Schedules a recurring daily report PDF via WhatsApp.
 * @param {Object} params - Scheduling parameters.
 * @param {string} params.scheduleType - Type of schedule ('daily', '7days', '30days', 'custom').
 * @param {string} params.time - Time in HH:mm format.
 * @param {string} params.to - Destination WhatsApp ID.
 * @param {number} [params.customDays] - Number of days for custom schedule.
 */
export const scheduleReportWhatsAppAPI = (params) => {
    const { scheduleType, time, to, customDays } = params;
    let url = `/api/reports/send-whatsapp/schedule-recurring?scheduleType=${scheduleType}&time=${time}&to=${encodeURIComponent(to)}`;
    if (scheduleType === 'custom' && customDays) {
        url += `&customDays=${customDays}`;
    }
    return axiosInstance.post(url);
};

/**
 * Fallback for testing UI if API is not yet ready:
 * Can be used by the component if needed.
 */
export const getMockDailyReportData = () => {
    return {
        data: {
            date: new Date().toISOString().split('T')[0],
            summary: {
                totalAssignments: 12,
                completedAssignments: 8,
                inTransit: 3,
                pending: 1,
                activeVehicles: 10,
                totalRevenue: 45000,
            },
            assignments: [
                { id: 'ASGN-001', client: 'Alpha Logistics', route: 'BBSR to CTC', status: 'completed', vehicle: 'OR01-AX-1234' },
                { id: 'ASGN-002', client: 'Beta Corp', route: 'Puri to BBSR', status: 'in transit', vehicle: 'OR02-BY-5678' },
                { id: 'ASGN-003', client: 'Gamma Industries', route: 'CTC to Jajpur', status: 'completed', vehicle: 'OR03-CZ-9012' },
            ]
        }
    };
};
