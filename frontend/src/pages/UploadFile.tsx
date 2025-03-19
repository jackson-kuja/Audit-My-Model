import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Container,
  Typography,
  Box,
  CircularProgress,
  TextField,
  Paper,
  Grid,
  LinearProgress,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { AxiosProgressEvent } from 'axios';

interface FileUploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
}

const UploadFile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState('');
  const [modelType, setModelType] = useState('');
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress>({
    progress: 0,
    status: 'idle',
  });
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setError(null);
      // Reset upload progress
      setUploadProgress({
        progress: 0,
        status: 'idle',
      });
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!modelName.trim()) {
      setError('Please enter a name for the model');
      return;
    }

    if (!modelType) {
      setError('Please select a model type');
      return;
    }

    console.log('🚀 UploadFile - Starting upload process');
    console.log('🚀 UploadFile - File:', file.name, file.type, file.size);
    console.log('🚀 UploadFile - Model name:', modelName);
    console.log('🚀 UploadFile - Model type:', modelType);
    console.log('🚀 UploadFile - User:', user?.id, user?.email);

    try {
      setUploadProgress({
        progress: 0,
        status: 'uploading',
        message: 'Uploading file...',
      });

      console.log('🚀 UploadFile - Upload progress state updated to 0%');
      console.log('🚀 UploadFile - Starting file upload process...');

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('modelName', modelName);
      formData.append('modelType', modelType);

      console.log('🚀 UploadFile - FormData created with file and model info');

      // Test connection to backend
      try {
        console.log('🚀 UploadFile - Testing connection to backend API...');
        const testResponse = await fetch('http://localhost:5001/api/audits', {
          method: 'OPTIONS'
        });
        console.log('🚀 UploadFile - Test response status:', testResponse.status);
        const headersObj = {};
        testResponse.headers.forEach((value, key) => {
          headersObj[key] = value;
        });
        console.log('🚀 UploadFile - Test response headers:', JSON.stringify(headersObj, null, 2));
      } catch (testError) {
        console.error('❌ UploadFile - Error testing connection to backend:', testError);
      }

      // Upload file and create audit
      console.log('🚀 UploadFile - Calling uploadFile API...');
      const response = await api.audits.uploadFile(formData, (progressEvent: AxiosProgressEvent) => {
        const total = progressEvent.total || 0;
        const progress = total ? Math.round((progressEvent.loaded * 100) / total) : 0;
        console.log(`🚀 UploadFile - Upload progress callback: ${progress}% (${progressEvent.loaded}/${total} bytes)`);
        setUploadProgress({
          progress,
          status: 'uploading',
          message: `Uploading: ${progress}%`,
        });
      });

      console.log('✅ UploadFile - Upload response received:', response.status);
      console.log('✅ UploadFile - Upload response data:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.audit) {
        console.log('✅ UploadFile - Audit created successfully:', response.data.audit.id);
        setUploadProgress({
          progress: 100,
          status: 'success',
          message: 'Audit created successfully!',
        });

        // Navigate to the audit details page
        setTimeout(() => {
          console.log('🚀 UploadFile - Navigating to audit page');
          navigate(`/audit/${response.data.audit.id}`);
        }, 1000);
      } else {
        console.error('❌ UploadFile - Response does not contain audit data');
        throw new Error('File upload failed');
      }
    } catch (error) {
      console.error('❌ UploadFile - Upload error:', error);
      
      let errorMessage = 'An error occurred during upload.';
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('❌ UploadFile - Error details:', error.stack);
      }
      
      if (error.response) {
        console.error('❌ UploadFile - API error response:', error.response.data);
        console.error('❌ UploadFile - API error status:', error.response.status);
        console.error('❌ UploadFile - API error headers:', JSON.stringify(error.response.headers, null, 2));
        errorMessage = `API error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`;
      } else if (error.request) {
        console.error('❌ UploadFile - No response received:', error.request);
        errorMessage = 'The server did not respond to the upload request.';
      }
      
      setUploadProgress({
        progress: 0,
        status: 'error',
        message: errorMessage,
      });
    }
  };

  const getProgressColor = () => {
    switch (uploadProgress.status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'primary';
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 5, mb: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Upload Your Model for Auditing
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
          Upload your model to get insights into potential biases,
          vulnerabilities, and performance issues.
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Model Name"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              fullWidth
              required
              helperText="Give your model a descriptive name"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel id="model-type-label">Model Type</InputLabel>
              <Select
                labelId="model-type-label"
                value={modelType}
                label="Model Type"
                onChange={(e) => setModelType(e.target.value)}
              >
                <MenuItem value="classification">Classification</MenuItem>
                <MenuItem value="regression">Regression</MenuItem>
                <MenuItem value="nlp">Natural Language Processing</MenuItem>
                <MenuItem value="computer_vision">Computer Vision</MenuItem>
                <MenuItem value="reinforcement_learning">Reinforcement Learning</MenuItem>
                <MenuItem value="clustering">Clustering</MenuItem>
                <MenuItem value="time_series">Time Series</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                backgroundColor: '#fafafa',
                cursor: 'pointer',
              }}
              onClick={handleClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".pkl, .h5, .pt, .onnx, .pb, .tflite, .zip, .joblib, .hdf5"
              />
              
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                {file ? file.name : 'Drag & drop your model file or click to browse'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Supported formats: .pkl, .h5, .pt, .onnx, .pb, .tflite, .zip, .joblib, .hdf5
              </Typography>
              
              {file && (
                <Typography variant="body2">
                  Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                </Typography>
              )}
            </Box>
          </Grid>

          {(uploadProgress.status !== 'idle' || error) && (
            <Grid item xs={12}>
              {uploadProgress.status !== 'idle' && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress.progress} 
                    color={getProgressColor() as "primary" | "secondary" | "error" | "info" | "success" | "warning" | undefined}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    align="center"
                    sx={{ mt: 1 }}
                  >
                    {uploadProgress.message}
                  </Typography>
                </Box>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Grid>
          )}

          <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleUpload}
              disabled={!file || uploadProgress.status === 'uploading'}
              startIcon={uploadProgress.status === 'uploading' ? <CircularProgress size={24} color="inherit" /> : undefined}
              sx={{ px: 4, py: 1.5 }}
            >
              {uploadProgress.status === 'uploading' ? 'Uploading...' : 'Upload and Analyze'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default UploadFile;
