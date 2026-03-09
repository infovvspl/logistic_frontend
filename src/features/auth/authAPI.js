import axiosInstance from '../../services/axios';

export const loginAPI = (data) => axiosInstance.post('/auth/login', data);
export const signupAPI = (data) => axiosInstance.post('/auth/signup', data);
