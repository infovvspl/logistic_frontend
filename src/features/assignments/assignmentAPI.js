import axiosInstance from '../../services/axios';

// Admin: Get all assignments by request
export const getAssignmentsByRequestAPI = () => axiosInstance.get('/api/requests');

// Admin: Bulk assign drivers and helpers to vehicle requests
export const bulkAssignAPI = (data) => axiosInstance.post('/api/assignments/bulk', data);

// Admin: Get available drivers
export const getAvailableDriversAPI = () => axiosInstance.get('/api/drivers');

// Drivers/Helpers: Get personal assignments
export const getMyAssignmentsAPI = () => axiosInstance.get('/api/assignments/my');

// Drivers/Helpers: Respond to assignment
export const respondAssignmentAPI = (id, status, rejectionReason = '') => {
    const payload = { status };
    if (status === 'rejected' && rejectionReason) {
        payload.rejectionReason = rejectionReason;
    }
    return axiosInstance.patch(`/api/assignments/respond/${id}`, payload);
};

export const getAssignmentsAPI = () => axiosInstance.get('/api/assignments');
