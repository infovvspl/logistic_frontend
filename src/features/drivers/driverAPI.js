import axiosInstance from '../../services/axios';

export const getDriversAPI = () => axiosInstance.get('/drivers');
export const createDriverAPI = (data) => axiosInstance.post('/drivers', data);
