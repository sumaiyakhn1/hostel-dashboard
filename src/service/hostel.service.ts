import axios from "axios";


const ENV = "qa"; // Or "production"

const BASE_URL = ENV === "qa"
  ? "https://staging.odpay.in"
  : "https://api.odpay.in";

const api = axios.create({
  baseURL: BASE_URL,
});

// Local Backend API
const localApi = axios.create({
  baseURL: "http://localhost:5000",
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

export const hostelService = {
  login: async (mobile: string, password: string) => {
    const response = await api.post("/login", { mobile, password });
    return response.data;
  },

  getHostelMaster: async (entityId: string) => {
    const response = await api.get(`/api/view/hostelMaster`, {
      params: { entity: entityId }
    });
    return response.data;
  },

  getHostelRooms: async (params: {
    entity: string;
    session: string;
    hostel: string;
    roomType: string;
  }) => {
    const response = await api.get(`/api/list/hostelRoom`, { params });
    return response.data;
  },

  getStudentDetails: async (params: {
    id: string;
    entity: string;
    session: string;
    regNo: string;
  }) => {
    const response = await api.get(`/api/view/student`, { params });
    return response.data;
  },

  assignHostelRoom: async (payload: any) => {
    const response = await api.post(`/api/assignToStudent/hostelRoom`, payload);
    return response.data;
  },

  // Save student data to local MongoDB
  saveStudentToDB: async (regNumber: string, data: {
    session: string;
    wing: string;
    roomNo: string;
    bedNo: string;
    roomType: string;
    paymentFreq: string;
    startDate: string;
    endDate: string;
  }) => {
    const response = await localApi.post(`/api/students/${regNumber}`, data);
    return response.data;
  }
};
