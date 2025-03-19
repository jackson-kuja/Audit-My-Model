import axios, { AxiosProgressEvent } from 'axios';
import { User, Audit } from '../types/index';
import { supabase } from './supabase';

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Helper function to get current token from supabase auth
const getAuthToken = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token || localStorage.getItem('auth_token');
    return token;
  } catch (error) {
    console.error('🚀 Error getting auth token:', error);
    return localStorage.getItem('auth_token');
  }
};

// Add auth token to requests if available
axios.interceptors.request.use(async (config) => {
  console.log(`🚀 Sending ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
  console.log('🚀 Request headers:', JSON.stringify(config.headers, null, 2));
  
  // Get token using our helper function
  const token = await getAuthToken();
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🚀 Auth token present in request:', !!token, 'Length:', token.length);
    
    // Also set to localStorage as backup
    localStorage.setItem('auth_token', token);
  } else {
    console.log('🚀 No auth token found in session or localStorage');
  }
  
  // Log request data if it exists and is not FormData (FormData can't be stringified)
  if (config.data && !(config.data instanceof FormData)) {
    console.log('🚀 Request data:', JSON.stringify(config.data, null, 2));
  } else if (config.data instanceof FormData) {
    console.log('🚀 Request contains FormData');
    try {
      // Log FormData keys
      const formDataKeys = Array.from((config.data as FormData).keys());
      console.log('🚀 FormData keys:', formDataKeys);
      
      // Try to log some form values (except file content)
      formDataKeys.forEach(key => {
        const value = (config.data as FormData).get(key);
        if (value instanceof File) {
          console.log(`🚀 FormData[${key}]:`, `File: ${value.name}, type: ${value.type}, size: ${value.size}B`);
        } else if (typeof value !== 'object') {
          console.log(`🚀 FormData[${key}]:`, value);
        }
      });
    } catch (err) {
      console.log('🚀 Could not inspect FormData:', err);
    }
  }
  
  return config;
});

// Add response interceptor for logging
axios.interceptors.response.use(
  response => {
    console.log(`✅ Response from ${response.config.url}: ${response.status}`);
    console.log('✅ Response headers:', JSON.stringify(response.headers, null, 2));
    try {
      console.log('✅ Response data:', JSON.stringify(response.data, null, 2));
    } catch (e) {
      console.log('✅ Response data: [Unable to stringify]', response.data);
    }
    return response;
  },
  error => {
    console.error('❌ API request failed:', error.message);
    if (error.response) {
      console.error(`❌ Status: ${error.response.status}`);
      console.error('❌ Response headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('❌ Response data:', error.response.data);
      console.error('❌ Request URL:', error.config.url);
      console.error('❌ Request method:', error.config.method);
    } else if (error.request) {
      console.error('❌ No response received:', error.request);
      console.error('❌ Request URL:', error.config?.url);
      console.error('❌ Request method:', error.config?.method);
    }
    return Promise.reject(error);
  }
);

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData extends LoginData {
  first_name?: string;
  last_name?: string;
}

interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  preferred_email?: string;
  password?: string;
}

interface UploadFileOptions {
  model?: string;
  useTools?: boolean;
  onProgress?: (event: AxiosProgressEvent) => void;
}

interface AnalyzeOptions {
  model?: string;
  useTools?: boolean;
}

const api = {
  auth: {
    login: (data: LoginData) => 
      axios.post<{ user: User; token: string }>('/api/auth/login', data),
    
    register: (data: RegisterData) => 
      axios.post<{ user: User; token: string }>('/api/auth/register', data),
    
    updateProfile: (data: UpdateProfileData) => 
      axios.put<{ user: User }>('/api/auth/update-profile', data)
  },

  audits: {
    getById: (id: string, includeResult = false) => 
      axios.get<Audit>(`/api/audits/${id}?include_result=${includeResult}`),
    
    uploadFile: (formData: FormData, onProgress?: (event: AxiosProgressEvent) => void) => {
      // Get the audit ID from the form data
      const auditId = formData.get('auditId');
      
      console.log('📤 uploadFile called with auditId:', auditId);
      console.log('📤 Current time:', new Date().toISOString());
      
      // If no audit ID is provided, we need to create one first
      if (!auditId) {
        console.log('📤 No auditId provided, creating a new audit');
        const modelName = formData.get('modelName') || 'o3-mini';
        const modelType = formData.get('modelType') || 'excel';
        
        console.log('📤 Creating audit with:', { modelName, modelType });
        
        // First create an audit entry
        return axios.post<{ id: string }>('/api/audits', {
          model_name: modelName,
          model_type: modelType,
          description: `Analysis with ${modelName}`
        })
        .then(response => {
          const auditId = response.data.id;
          console.log('📤 Audit created successfully with ID:', auditId);
          
          // Add the audit ID to the form data
          formData.append('auditId', auditId);
          console.log('📤 Added auditId to FormData, preparing to upload file');
          
          // Now upload the file
          console.log('📤 Starting file upload to /api/upload');
          return axios.post<{ audit: Audit }>('/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (event) => {
              const total = event.total || 0;
              const progress = total ? Math.round((event.loaded * 100) / total) : 0;
              console.log(`📤 Upload progress: ${progress}% (${event.loaded}/${total} bytes)`);
              if (onProgress) onProgress(event);
            }
          });
        });
      }
      
      // If audit ID is already provided, just upload
      console.log('📤 Using existing auditId:', auditId);
      console.log('📤 Starting file upload to /api/upload');
      
      return axios.post<{ audit: Audit }>('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (event) => {
          const total = event.total || 0;
          const progress = total ? Math.round((event.loaded * 100) / total) : 0;
          console.log(`📤 Upload progress: ${progress}% (${event.loaded}/${total} bytes)`);
          if (onProgress) onProgress(event);
        }
      });
    },

    upload: (
      file: File,
      { model = 'o3-mini', useTools = true, onProgress }: UploadFileOptions = {}
    ) => {
      console.log('📤 upload called with file:', file.name, file.size, file.type);
      console.log('📤 Upload options:', { model, useTools });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', model);
      formData.append('useTools', String(useTools));

      console.log('📤 FormData created, starting upload to /api/audits/upload');
      
      return axios.post<{ audit: Audit }>('/api/audits/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (event) => {
          const total = event.total || 0;
          const progress = total ? Math.round((event.loaded * 100) / total) : 0;
          console.log(`📤 Upload progress: ${progress}% (${event.loaded}/${total} bytes)`);
          if (onProgress) onProgress(event);
        }
      });
    },

    analyze: (filePath: string, { model = 'o3-mini', useTools = true }: AnalyzeOptions = {}) => 
      axios.post<{ audit: Audit }>('/api/audits/analyze', {
        filePath,
        model,
        useTools
      })
  },

  subscription: {
    createCheckout: (planId: string) => 
      axios.post<{ url: string }>('/api/subscription/create-checkout-session', { plan_id: planId })
  }
};

export default api;
