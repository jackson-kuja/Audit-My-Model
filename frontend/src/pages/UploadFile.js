import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Alert, 
  CircularProgress,
  LinearProgress,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api'; // Import the API utilities

const UploadFile = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const [auditInfo, setAuditInfo] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB max size
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        setError('');
      }
    },
    onDropRejected: fileRejections => {
      const rejection = fileRejections[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError('File is too large. Maximum size is 50MB.');
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        setError('Invalid file type. Please upload an Excel file (.xlsx, .xlsm, .xls).');
      } else {
        setError('File upload failed. Please try again.');
      }
    }
  });
  
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setError('');
    
    try {
      console.log("Uploading file to:", `${axios.defaults.baseURL}/api/excel/upload`);
      
      // Use our Excel API endpoint
      const response = await api.excel.upload(
        file, 
        'o3-mini',  // Use o3-mini model
        true,       // Use tools
        (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        }
      );
      
      console.log("Upload response:", response);
      
      // Check response
      if (response.data.success) {
        setUploadSuccess(true);
        
        // Store the file path for analysis
        const filePath = response.data.file_path;
        
        // Use the audit information returned from the backend
        setAuditInfo({
          ...response.data.audit,
          original_filename: file.name
        });
        
        // If we don't have analysis results yet and we have a file path, trigger the analysis
        if (!response.data.llm_analysis && filePath) {
          try {
            console.log("Requesting Excel file analysis...");
            // Update the UI to show that analysis is in progress
            setAuditInfo(prev => ({
              ...prev,
              status: 'analyzing'
            }));
            
            // Request analysis from the backend
            const analysisResponse = await api.excel.analyze(filePath, 'o3-mini', true);
            
            if (analysisResponse.data.success) {
              console.log("Analysis response:", analysisResponse.data);
              setAnalysisResult(analysisResponse.data.llm_analysis);
              
              // Update the audit info with the completed status
              setAuditInfo(prev => ({
                ...prev,
                status: 'completed'
              }));
            }
          } catch (analysisError) {
            console.error("Analysis error:", analysisError);
            // Show a more specific error message based on the error
            const errorDetails = analysisError.response?.data?.message || analysisError.message || 'Unknown error';
            const errorStatus = analysisError.response?.status;
            
            let errorMessage = '';
            
            if (errorStatus === 401) {
              // Authentication error but don't redirect to login
              errorMessage = 'Authentication error during analysis. Proceeding with upload only.';
            } else if (errorStatus === 400) {
              errorMessage = `Analysis error: ${errorDetails}`;
            } else {
              errorMessage = `Analysis could not be completed: ${errorDetails}`;
            }
            
            // Update the audit status but don't fail the whole upload
            setAuditInfo(prev => ({
              ...prev,
              status: 'uploaded'
            }));
            
            // Set a user-friendly error
            setError(errorMessage);
          }
        } else {
          // If analysis results are included in the upload response, use them
          setAnalysisResult(response.data.llm_analysis || null);
        }
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('File upload failed: ' + (err.message || 'Please try again.'));
    } finally {
      setUploading(false);
    }
  };
  
  const handleNavigateToDashboard = () => {
    navigate('/dashboard');
  };
  
  const handleReset = () => {
    setFile(null);
    setUploadSuccess(false);
    setAuditInfo(null);
    setAnalysisResult(null);
    setUploadProgress(0);
    setError('');
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Upload Model for Audit</Typography>
      
      {!user.is_paid && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are using a free account. Your model will be processed within 24 hours. 
          <Button color="inherit" size="small" onClick={() => navigate('/subscription')}>
            Upgrade to Premium
          </Button> for immediate processing.
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {uploadSuccess ? (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', mb: 3 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            Your model has been successfully uploaded and an audit has been created!
          </Alert>
          
          <Typography variant="h6" gutterBottom>Processing Information</Typography>
          <Typography variant="body1" gutterBottom>
            File: <strong>{auditInfo?.original_filename}</strong>
          </Typography>
          <Typography variant="body1" gutterBottom>
            Status: <strong>{auditInfo?.status.toUpperCase()}</strong>
          </Typography>
          
          {analysisResult && (
            <Box sx={{ mt: 4, mb: 4, textAlign: 'left' }}>
              <Typography variant="h6" gutterBottom>Analysis Results</Typography>
              
              {analysisResult.findings || analysisResult.summary ? (
                <Box>
                  {analysisResult.score && (
                    <Typography variant="subtitle1">Model Score: {analysisResult.score}</Typography>
                  )}
                  {analysisResult.summary && (
                    <>
                      <Typography variant="subtitle1">Summary:</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>{analysisResult.summary}</Typography>
                    </>
                  )}
                  
                  {analysisResult.findings && (
                    <>
                      <Typography variant="subtitle1">Key Issues:</Typography>
                      <ul>
                        {analysisResult.findings.slice(0, 3).map((issue, index) => (
                          <li key={index}>
                            <Typography variant="body2">
                              <strong>{issue.type}</strong> ({issue.severity}): {issue.description}
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </Box>
              ) : (
                <Typography variant="body2">
                  {typeof analysisResult === 'object' 
                    ? JSON.stringify(analysisResult).substring(0, 300) + '...'
                    : String(analysisResult).substring(0, 300) + '...'}
                </Typography>
              )}
            </Box>
          )}
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button variant="contained" onClick={handleNavigateToDashboard}>
              Go to Dashboard
            </Button>
            <Button variant="outlined" onClick={handleReset}>
              Upload Another File
            </Button>
          </Box>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Upload Instructions</Typography>
              <Typography variant="body1" paragraph>
                Upload your model file to create a new audit. Our AI will analyze your model for:
              </Typography>
              <ul>
                <li><Typography variant="body1">Formula errors or inconsistencies</Typography></li>
                <li><Typography variant="body1">Structural issues in the model</Typography></li>
                <li><Typography variant="body1">Logic mistakes or circular references</Typography></li>
                <li><Typography variant="body1">Best practice violations</Typography></li>
                <li><Typography variant="body1">Suggestions for improvement</Typography></li>
              </ul>
              <Typography variant="body2" color="text.secondary">
                Maximum file size: 50MB. Supported formats: .xlsx, .xlsm, .xls
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Box
                  {...getRootProps()}
                  sx={{
                    border: '2px dashed',
                    borderColor: isDragReject ? 'error.main' : isDragActive ? 'primary.main' : 'grey.400',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: isDragActive ? 'rgba(0, 0, 0, 0.04)' : 'background.paper',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <Typography>Drop the Excel file here...</Typography>
                  ) : (
                    <Typography>Drag & drop an Excel file here, or click to select a file</Typography>
                  )}
                </Box>
              </Box>
              
              {file && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1">
                    Selected file: <strong>{file.name}</strong> ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </Typography>
                </Box>
              )}
              
              {uploading && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>Uploading: {uploadProgress}%</Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              )}
              
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleUpload}
                disabled={!file || uploading}
                startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {uploading ? 'Uploading...' : 'Upload and Process'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default UploadFile;
