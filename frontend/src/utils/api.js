import axios from 'axios';

// Set default base URL with correct port
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
axios.defaults.baseURL = API_URL;
console.log("Using API URL:", API_URL);

// Enable sending cookies for cross-origin requests
axios.defaults.withCredentials = true;

// Set default headers
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Check for token on app load
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Setup interceptor to handle response errors
axios.interceptors.response.use(
  response => response,
  error => {
    // Don't redirect to login if the error is from the analyze endpoint
    const isAnalyzingEndpoint = error.config && 
      (error.config.url.includes('/api/excel/analyze') || 
       error.config.url.includes('/api/excel/upload'));
    
    if (error.response && error.response.status === 401 && !isAnalyzingEndpoint) {
      // Clear token and redirect to login on auth errors (but not for analysis)
      console.log('Authentication error. Redirecting to login...');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const api = {
  // Auth endpoints
  auth: {
    login: (email, password) => axios.post('/api/auth/login', { email, password }),
    register: (userData) => axios.post('/api/auth/register', userData),
    getCurrentUser: () => axios.get('/api/auth/me'),
    updateProfile: (userData) => axios.put('/api/auth/update-profile', userData)
  },
  
  // Audit endpoints
  audits: {
    getAll: (page = 1, perPage = 10) => axios.get(`/api/audits?page=${page}&per_page=${perPage}`),
    getById: (id, includeResult = false) => axios.get(`/api/audits/${id}?include_result=${includeResult}`),
    uploadFile: (formData, onProgress) => axios.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
    })
  },
  
  // Excel analysis endpoints 
  excel: {
    upload: (file, model = 'o3-mini', useTools = true, onProgress) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', model);
      formData.append('use_tools', String(useTools));
      
      // Add proper logging and error handling
      console.log(`Uploading Excel file: ${file.name} (${file.size} bytes) with model: ${model}, use_tools: ${useTools}`);
      
      return axios.post('/api/excel/upload', formData, {
        headers: { 
          // Remove Content-Type to let the browser set it with the boundary
          ...axios.defaults.headers.common,
          'Content-Type': undefined
        },
        withCredentials: true,
        onUploadProgress: onProgress
      });
    },
    
    analyze: (filePath, model = 'o3-mini', useTools = true) => {
      console.log(`Requesting analysis for file: ${filePath} with model: ${model}, use_tools: ${useTools}`);
      
      return axios.post('/api/excel/analyze', {
        file_path: filePath,
        model: model,
        use_tools: useTools
      });
    }
  },
  
  // Subscription endpoints
  subscription: {
    getPlans: () => axios.get('/api/subscription/plans'),
    getCurrent: () => axios.get('/api/subscription/current'),
    createCheckout: (planId) => axios.post('/api/subscription/create-checkout-session', { plan_id: planId }),
    simulateUpgrade: () => axios.post('/api/subscription/simulate-upgrade')
  }
};

export default api;
