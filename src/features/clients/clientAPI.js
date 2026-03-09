import axiosInstance from '../../services/axios';
export const getClientsAPI = () => axiosInstance.get('/clients');
