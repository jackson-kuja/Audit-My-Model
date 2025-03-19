import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import auditService from '../services/auditService';
import { supabase } from '../utils/supabase';
import { CreateAuditData } from '../services/auditService';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import api from '../utils/api';
import axios from 'axios';

// Shadcn UI components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';

// Icons
import { 
  Upload as UploadIcon, 
  AlertCircle, 
  CheckCircle, 
  FileSpreadsheet, 
  FileText,
  Presentation,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Shield,
  ExternalLink,
  Clock,
  Zap
} from 'lucide-react';

interface FileUploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
}

// Analysis preset options
const analysisPresets = [
  { id: 'formulas', label: 'Formula Complexity & Risks' },
  { id: 'data-validation', label: 'Data Validation & Integrity' },
  { id: 'circular-refs', label: 'Circular References' },
  { id: 'hidden-data', label: 'Hidden Data & Sheets' },
  { id: 'naming', label: 'Naming Conventions' },
  { id: 'macros', label: 'Macro Security' },
  { id: 'links', label: 'External Links & Dependencies' },
  { id: 'performance', label: 'Performance Bottlenecks' },
];

// PowerPoint specific options
const pptPresets = [
  { id: 'accessibility', label: 'Accessibility Issues' },
  { id: 'design-consistency', label: 'Design Consistency' },
  { id: 'font-usage', label: 'Font Usage' },
  { id: 'image-quality', label: 'Image Quality & Size' },
  { id: 'animations', label: 'Animations & Transitions' },
  { id: 'slide-density', label: 'Information Density' },
  { id: 'master-slides', label: 'Master Slide Usage' },
  { id: 'narration', label: 'Notes & Narration' },
];

// Word-specific options
const wordPresets = [
  { id: 'document-structure', label: 'Document Structure' },
  { id: 'formatting-consistency', label: 'Formatting Consistency' },
  { id: 'readability', label: 'Readability & Clarity' },
  { id: 'grammar-spelling', label: 'Grammar & Spelling' },
  { id: 'accessibility', label: 'Accessibility Issues' },
  { id: 'references', label: 'Citations & References' },
  { id: 'tables-figures', label: 'Tables & Figures' },
  { id: 'content-organization', label: 'Content Organization' },
];

// Define the step types more precisely
type StepType = 
  | 'type' 
  | 'animation-1' 
  | 'obfuscate' 
  | 'animation-2' 
  | 'upload' 
  | 'animation-3' 
  | 'analyze' 
  | 'animation-4' 
  | 'confirmation';

const isAnimationStep = (step: StepType): boolean => {
  return step.startsWith('animation-');
};

// Helper function to check if current step is after a specific step
const isStepAfter = (currentStep: StepType, targetStep: StepType): boolean => {
  const stepOrder: StepType[] = [
    'type', 
    'animation-1', 
    'obfuscate', 
    'animation-2', 
    'upload', 
    'animation-3', 
    'analyze', 
    'animation-4', 
    'confirmation'
  ];
  
  const currentIndex = stepOrder.indexOf(currentStep);
  const targetIndex = stepOrder.indexOf(targetStep);
  
  return currentIndex > targetIndex;
};

const Upload: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'excel' | 'powerpoint' | 'word' | ''>('');
  const [currentStep, setCurrentStep] = useState<StepType>('type');
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [customRequirements, setCustomRequirements] = useState('');
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(false);
  const [animationProgress, setAnimationProgress] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress>({
    progress: 0,
    status: 'idle',
  });
  const [error, setError] = useState<string | null>(null);

  // Rive animation for step 1 to step 2
  const { RiveComponent: Step1Animation, rive: rive1 } = useRive({
    src: '/images/upload_file_xls.riv',
    autoplay: true,
    layout: new Layout({
      fit: Fit.FitHeight,
      alignment: Alignment.Center
    }),
  });

  // Rive animation for step 2 to step 3
  const { RiveComponent: Step2Animation, rive: rive2 } = useRive({
    src: '/images/ai__document__style.riv',
    autoplay: true,
    layout: new Layout({
      fit: Fit.FitHeight,
      alignment: Alignment.Center
    }),
  });

  // Rive animation for step 3 to step 4
  const { RiveComponent: Step3Animation, rive: rive3 } = useRive({
    src: '/images/animation_seats_check.riv',
    autoplay: true,
    layout: new Layout({
      fit: Fit.FitHeight,
      alignment: Alignment.Center
    }),
  });

  // Rive animation for step 4 to confirmation
  const { RiveComponent: Step4Animation, rive: rive4 } = useRive({
    src: '/images/processing_animation.riv',
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center
    }),
  });

  // Get the appropriate file extensions based on file type
  const getAcceptedFileTypes = () => {
    if (fileType === 'excel') {
      return '.xlsx, .xls, .xlsm, .csv';
    } else if (fileType === 'powerpoint') {
      return '.ppt, .pptx, .pptm';
    } else if (fileType === 'word') {
      return '.doc, .docx, .docm';
    }
    return '';
  };
  
  // Get the appropriate presets based on file type
  const getPresets = () => {
    if (fileType === 'excel') {
      return analysisPresets;
    } else if (fileType === 'powerpoint') {
      return pptPresets;
    } else if (fileType === 'word') {
      return wordPresets;
    }
    return [];
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setFileName(files[0].name.split('.')[0]);
      setError(null);
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

  const handlePresetToggle = (presetId: string) => {
    setSelectedPresets(prev => 
      prev.includes(presetId)
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId]
    );
  };

  const handleSelectAll = () => {
    const allPresetIds = getPresets().map(preset => preset.id);
    if (selectedPresets.length === allPresetIds.length) {
      // If all are selected, deselect all
      setSelectedPresets([]);
    } else {
      // Otherwise, select all
      setSelectedPresets(allPresetIds);
    }
  };

  // Handle animation progress and auto advance to next step
  useEffect(() => {
    let animationTimer: NodeJS.Timeout;
    let pauseTimer: NodeJS.Timeout;
    let completeTimer: NodeJS.Timeout;

    if (currentStep === 'animation-1') {
      // First animation - 2.35 seconds total (cut by 0.1s)
      setAnimationProgress(0);
      
      // Progress to 50% in 0.925 seconds
      animationTimer = setTimeout(() => {
        setAnimationProgress(50);
        
        // Pause at 50% for 0.5 second
        pauseTimer = setTimeout(() => {
          // Continue to 100% in 0.925 seconds
          completeTimer = setTimeout(() => {
            setAnimationProgress(100);
            setCurrentStep('obfuscate');
          }, 925);
        }, 500);
      }, 925);
    } else if (currentStep === 'animation-2') {
      // Second animation - 3.35 seconds total (cut by 0.1s)
      setAnimationProgress(0);
      
      // Progress to 50% in 0.925 seconds
      animationTimer = setTimeout(() => {
        setAnimationProgress(50);
        
        // Pause at 50% for 1.5 seconds
        pauseTimer = setTimeout(() => {
          // Continue to 100% in 0.925 seconds
          completeTimer = setTimeout(() => {
            setAnimationProgress(100);
            setCurrentStep('upload');
          }, 925);
        }, 1500);
      }, 925);
    } else if (currentStep === 'animation-3') {
      // Third animation - 4.95 seconds total (cut by 0.1s)
      setAnimationProgress(0);
      
      // Progress to 50% in 1.475 seconds
      animationTimer = setTimeout(() => {
        setAnimationProgress(50);
        
        // Pause at 50% for 2 seconds
        pauseTimer = setTimeout(() => {
          // Continue to 100% in 1.475 seconds
          completeTimer = setTimeout(() => {
            setAnimationProgress(100);
            setCurrentStep('analyze');
          }, 1475);
        }, 2000);
      }, 1475);
    } else if (currentStep === 'animation-4') {
      // Fourth animation - keep it running until analysis is complete
      setAnimationProgress(0);
      
      // Progress to 50% in 1.45 seconds
      animationTimer = setTimeout(() => {
        setAnimationProgress(50);
        
        // Only auto-progress if not waiting for actual analysis
        if (uploadProgress.status === 'success') {
          // Continue to 100% in 1.45 seconds
          completeTimer = setTimeout(() => {
            setAnimationProgress(100);
            setCurrentStep('confirmation');
          }, 1450);
        }
        // If still processing, the polling will update the state when complete
      }, 1450);
    }

    return () => {
      clearTimeout(animationTimer);
      clearTimeout(pauseTimer);
      clearTimeout(completeTimer);
    };
  }, [currentStep, uploadProgress.status]);

  const handleNextStep = () => {
    if (currentStep === 'type') {
      if (!fileType) {
        setError('Please select a file type');
        return;
      }
      setCurrentStep('animation-1');
      setError(null);
    } else if (currentStep === 'obfuscate') {
      setCurrentStep('animation-2');
      setError(null);
    } else if (currentStep === 'upload') {
      if (!file) {
        setError('Please upload a file');
        return;
      }
      setCurrentStep('animation-3');
      setError(null);
    } else if (currentStep === 'analyze') {
      if (selectedPresets.length === 0 && !customRequirements.trim()) {
        setError('Please select at least one analysis option or provide custom requirements');
        return;
      }
      setCurrentStep('animation-4');
      handleUpload();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'obfuscate') {
      setCurrentStep('type');
    } else if (currentStep === 'upload') {
      setCurrentStep('obfuscate');
    } else if (currentStep === 'analyze') {
      setCurrentStep('upload');
    }
    setError(null);
  };

  const handleFileTypeSelect = (type: 'excel' | 'powerpoint' | 'word') => {
    setFileType(type);
    setCurrentStep('animation-1');
    setError(null);
  };

  useEffect(() => {
    // Check if the user has a premium account
    // This is a placeholder - replace with actual subscription check
    if (user) {
      // Using type assertion to access custom properties
      const userMetadata = user.user_metadata as Record<string, any> || {};
      setIsPremiumUser(Boolean(userMetadata.is_premium));
    }
  }, [user]);

  // Clean up any polling intervals when component unmounts
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        console.log('[Frontend] Cleaning up polling interval on unmount');
      }
    };
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setError('Please upload a file');
      return;
    }

    if (!fileType) {
      setError('Please select a file type');
      return;
    }

    if (selectedPresets.length === 0 && !customRequirements.trim()) {
      setError('Please select at least one analysis option or provide custom requirements');
      return;
    }

    if (!user) {
      setError('You must be logged in to upload a file');
      return;
    }

    // Log with timestamp for better tracking in console
    const logWithTimestamp = (message: string) => {
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
      console.log(`[${timestamp}] 🚀 FRONTEND - ${message}`);
    };

    logWithTimestamp(`Starting upload for ${file.name}`);
    logWithTimestamp(`File details: ${file.type}, ${file.size} bytes`);
    logWithTimestamp(`File type: ${fileType}`);
    logWithTimestamp(`Selected presets: ${selectedPresets.join(', ')}`);
    logWithTimestamp(`Custom requirements: ${customRequirements ? 'Yes' : 'No'}`);
    logWithTimestamp(`User: ${user.id}`);

    try {
      // Get auth token from Supabase and set it to localStorage
      logWithTimestamp('Getting Supabase session');
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        console.error('❌ FRONTEND - No auth token found in session');
        throw new Error('You must be logged in to upload a file. Please refresh the page and try again.');
      }
      
      logWithTimestamp(`Auth token obtained (${token.length} chars)`);
      localStorage.setItem('auth_token', token);

      setUploadProgress({
        progress: 0,
        status: 'uploading',
        message: 'Uploading file...',
      });

      logWithTimestamp('Upload progress state updated to 0%');

      // Prepare analysis details
      const analysisDetails = {
        presets: selectedPresets,
        customRequirements: customRequirements
      };

      // First create an audit entry
      logWithTimestamp('Creating audit record');
      
      const auditData: CreateAuditData = {
        name: fileName || (file ? file.name.split('.')[0] : 'Unnamed'),
        model_type: fileType,
        description: JSON.stringify(analysisDetails)
      };
      
      logWithTimestamp(`Audit data prepared: ${JSON.stringify(auditData)}`);
      const audit = await auditService.createAudit(auditData);
      logWithTimestamp(`Audit created with ID: ${audit.id}`);
      
      setUploadProgress({
        progress: 30,
        status: 'uploading',
        message: 'Audit created. Uploading file...',
      });
      
      // Now upload the file through the backend API, which will trigger analysis
      logWithTimestamp('Preparing to upload file');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('auditId', audit.id);
      
      logWithTimestamp(`FormData created with auditId: ${audit.id}`);
      logWithTimestamp('Starting file upload to backend');
      
      // Use the uploadFile method from the API client
      const uploadResponse = await api.audits.uploadFile(formData, (progressEvent) => {
        const total = progressEvent.total || 0;
        // Scale progress from 30% to 80%
        const scaledProgress = 30 + Math.round((progressEvent.loaded / total) * 50);
        
        logWithTimestamp(`Upload progress: ${Math.round((progressEvent.loaded / total) * 100)}%`);
        
        setUploadProgress({
          progress: scaledProgress,
          status: 'uploading',
          message: `Uploading: ${Math.round((progressEvent.loaded / total) * 100)}%`,
        });
      });
      
      logWithTimestamp(`Upload response received with status: ${uploadResponse.status}`);
      logWithTimestamp(`Upload response data: ${JSON.stringify(uploadResponse.data)}`);
      
      // Check for the analysis status and start polling
      logWithTimestamp('Starting to poll for analysis status');
      
      // Set up polling for status updates
      let pollCount = 0;
      const maxPolls = 60; // Max 5 minutes (5s intervals)
      
      // Clear any existing interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      
      pollIntervalRef.current = setInterval(async () => {
        pollCount++;
        logWithTimestamp(`Polling for analysis status (attempt ${pollCount}/${maxPolls})`);
        
        try {
          const auditResponse = await auditService.getAuditById(audit.id);
          logWithTimestamp(`Poll response: status = ${auditResponse.status}`);
          
          // Update progress based on status
          if (auditResponse.status === 'completed') {
            logWithTimestamp('Analysis completed successfully');
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            
            setUploadProgress({
              progress: 100,
              status: 'success',
              message: 'Analysis completed!',
            });
            
            // Only auto-advance to confirmation if not already there,
            // and make sure animation-4 completes first
            if (currentStep === 'animation-4' || currentStep === 'confirmation') {
              // If already on confirmation, just update the status
              // If on animation-4, transition to confirmation after a brief delay
              if (currentStep === 'animation-4') {
                setTimeout(() => {
                  setCurrentStep('confirmation');
                }, 1000); // Give the animation time to display success
              }
            }
          } else if (auditResponse.status === 'error' || auditResponse.status === 'failed') {
            logWithTimestamp(`Analysis failed: ${auditResponse.error_message || 'Unknown error'}`);
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            
            setUploadProgress({
              progress: 0,
              status: 'error',
              message: auditResponse.error_message || 'Analysis failed',
            });
            
            setError(auditResponse.error_message || 'Analysis failed');
            setCurrentStep('analyze');
          } else {
            // For pending or in_progress statuses
            // Calculate progress between 80% and 95% based on poll count
            const analysisProgress = Math.min(80 + Math.floor(pollCount / 3), 95);
            
            setUploadProgress({
              progress: analysisProgress,
              status: 'uploading',
              message: 'Analyzing file...',
            });
          }
          
          // Stop polling after max attempts
          if (pollCount >= maxPolls) {
            logWithTimestamp('Max polling attempts reached');
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            
            // Show a timeout message but don't consider it an error
            // The analysis might still complete eventually
            setUploadProgress({
              progress: 95,
              status: 'uploading',
              message: 'Analysis taking longer than expected, but still processing...',
            });
          }
        } catch (pollError) {
          logWithTimestamp(`Error polling for status: ${pollError}`);
        }
      }, 5000); // Poll every 5 seconds
      
      // Start with initial progress after upload
      setUploadProgress({
        progress: 80,
        status: 'uploading',
        message: 'Analyzing file...',
      });
      
      // Navigate to the appropriate next step
      if (currentStep === 'analyze') {
        setCurrentStep('animation-4');
      }
      
    } catch (err) {
      console.error('❌ FRONTEND - Upload error:', err);
      
      let errorMessage = 'Upload failed';
      
      // Handle different error types
      if (axios.isAxiosError(err) && err.response) {
        console.error('❌ FRONTEND - API error status:', err.response.status);
        console.error('❌ FRONTEND - API error data:', JSON.stringify(err.response.data));
        
        errorMessage = err.response.data?.message || err.response.data?.error || err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setUploadProgress({
        progress: 0,
        status: 'error',
        message: errorMessage,
      });
      
      setError(errorMessage);
      
      // If upload fails, go back to analyze step
      setCurrentStep('analyze');
    }
  };

  const handleDashboardNavigation = () => {
    // Keep the polling running in the background so analysis can complete
    // even if user navigates away 
    navigate('/dashboard');
  };

  const handleUpgradeAccount = () => {
    // Navigate to subscription page
    navigate('/profile?tab=subscription');
  };

  // Render step indicator
  const renderStepIndicator = () => {
    // Only show real steps in the indicator (not animations)
    const isStep1Active = currentStep === 'type';
    const isStep2Active = currentStep === 'obfuscate';
    const isStep3Active = currentStep === 'upload';
    const isStep4Active = currentStep === 'analyze';
    const isStep5Active = currentStep === 'confirmation';
    
    const isAfterStep1 = isStepAfter(currentStep, 'type');
    const isAfterStep2 = isStepAfter(currentStep, 'obfuscate');
    const isAfterStep3 = isStepAfter(currentStep, 'upload');
    const isAfterStep4 = isStepAfter(currentStep, 'analyze');
    
    return (
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-2">
          <div className={`rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-300 ease-in-out ${isStep1Active ? 'bg-primary text-primary-foreground' : isAfterStep1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            1
          </div>
          <div className="h-1 w-8 bg-muted overflow-hidden">
            <div className={`h-full bg-primary transition-all duration-500 ease-in-out ${isAfterStep1 ? 'w-full' : 'w-0'}`}></div>
          </div>
          <div className={`rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-300 ease-in-out ${isStep2Active ? 'bg-primary text-primary-foreground' : isAfterStep2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            2
          </div>
          <div className="h-1 w-8 bg-muted overflow-hidden">
            <div className={`h-full bg-primary transition-all duration-500 ease-in-out ${isAfterStep2 ? 'w-full' : 'w-0'}`}></div>
          </div>
          <div className={`rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-300 ease-in-out ${isStep3Active ? 'bg-primary text-primary-foreground' : isAfterStep3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            3
          </div>
          <div className="h-1 w-8 bg-muted overflow-hidden">
            <div className={`h-full bg-primary transition-all duration-500 ease-in-out ${isAfterStep3 ? 'w-full' : 'w-0'}`}></div>
          </div>
          <div className={`rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-300 ease-in-out ${isStep4Active ? 'bg-primary text-primary-foreground' : isAfterStep4 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            4
          </div>
          <div className="h-1 w-8 bg-muted overflow-hidden">
            <div className={`h-full bg-primary transition-all duration-500 ease-in-out ${isAfterStep4 ? 'w-full' : 'w-0'}`}></div>
          </div>
          <div className={`rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-300 ease-in-out ${isStep5Active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            5
          </div>
        </div>
      </div>
    );
  };

  // Render animation component based on current step
  const renderAnimationForStep = (step: StepType) => {
    switch (step) {
      case 'animation-1':
        return <Step1Animation />;
      case 'animation-2':
        return <Step2Animation />;
      case 'animation-3':
        return <Step3Animation />;
      case 'animation-4':
      case 'confirmation': // Allow the animation to be shown in confirmation step when still processing
        if (uploadProgress.status !== 'success') {
          return <Step4Animation />;
        }
        return null;
      default:
        return null;
    }
  };

  // Render animation steps
  const renderAnimation = () => {
    return renderAnimationForStep(currentStep);
  };

  // Get card title based on current step
  const getCardTitle = () => {
    if (currentStep === 'type') return "Select File Type";
    if (currentStep === 'obfuscate') {
      return fileType === 'excel' ? "Secure Your Excel Model" : 
             fileType === 'powerpoint' ? "Secure Your PowerPoint Deck" :
             fileType === 'word' ? "Secure Your Word Document" : "";
    }
    if (currentStep === 'upload') {
      return fileType === 'excel' ? "Upload Your Model" : 
             fileType === 'powerpoint' ? "Upload Your Deck" :
             fileType === 'word' ? "Upload Your Document" : "";
    }
    if (currentStep === 'analyze') {
      return fileType === 'excel' ? "Model Analysis Options" : 
             fileType === 'powerpoint' ? "Deck Analysis Options" :
             fileType === 'word' ? "Document Analysis Options" : "";
    }
    if (currentStep === 'confirmation') return "Audit Request Confirmation";
    if (isAnimationStep(currentStep)) return "";
    
    return "Audit My File";
  };

  // Get card description based on current step
  const getCardDescription = () => {
    if (currentStep === 'type') return "Choose the type of file you want to audit";
    if (currentStep === 'obfuscate') {
      return fileType === 'excel' 
        ? "Protect your sensitive data before uploading (optional)"
        : fileType === 'powerpoint'
        ? "Protect your confidential content before uploading (optional)"
        : fileType === 'word'
        ? "Protect your sensitive information before uploading (optional)"
        : "";
    }
    if (currentStep === 'upload') {
      return fileType === 'excel' ? "Upload the Excel model you want to analyze" : 
             fileType === 'powerpoint' ? "Upload the PowerPoint deck you want to analyze" :
             fileType === 'word' ? "Upload the Word document you want to analyze" : "";
    }
    if (currentStep === 'analyze') {
      return fileType === 'excel' ? "Select what aspects you want to analyze in your model" : 
             fileType === 'powerpoint' ? "Select what aspects you want to analyze in your deck" :
             fileType === 'word' ? "Select what aspects you want to analyze in your document" : "";
    }
    if (currentStep === 'confirmation') return "Your audit has been successfully submitted";
    if (isAnimationStep(currentStep)) return "";
    
    return "Auditing in progress...";
  };

  return (
    <>
      {isAnimationStep(currentStep) ? (
        // For animation steps, display header, step indicators, and animation
        <div className="container mx-auto max-w-3xl py-8 px-4">
          {/* Header Section */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {fileType === 'excel' ? 'Audit My Model' : 
              fileType === 'powerpoint' ? 'Audit My Deck' : 
              fileType === 'word' ? 'Audit My Document' :
              'Audit My File'}
            </h1>
            <p className="text-muted-foreground">
              Get insights into potential issues, risks, and improvements for your files.
            </p>
          </div>

          {renderStepIndicator()}

          {/* Animation without card container */}
          <div style={{ width: "100%", height: "450px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {renderAnimation()}
          </div>
        </div>
      ) : (
        <div className="container mx-auto max-w-3xl py-8 px-4">
          {/* Header Section */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {fileType === 'excel' ? 'Audit My Model' : 
              fileType === 'powerpoint' ? 'Audit My Deck' : 
              fileType === 'word' ? 'Audit My Document' :
              'Audit My File'}
            </h1>
            <p className="text-muted-foreground">
              Get insights into potential issues, risks, and improvements for your files.
            </p>
          </div>

          {renderStepIndicator()}

          <Card>
            <CardHeader>
              <CardTitle>{getCardTitle()}</CardTitle>
              <CardDescription>{getCardDescription()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentStep === 'type' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    className={`border rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors ${fileType === 'excel' ? 'border-primary bg-accent/50' : 'border-input'}`}
                    onClick={() => handleFileTypeSelect('excel')}
                  >
                    <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-green-600" />
                    <h3 className="text-lg font-medium">Excel Spreadsheet</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Audit Excel files for formula errors, data issues, and structural problems
                    </p>
                  </div>
                  <div 
                    className={`border rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors ${fileType === 'word' ? 'border-primary bg-accent/50' : 'border-input'}`}
                    onClick={() => handleFileTypeSelect('word')}
                  >
                    <FileText className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                    <h3 className="text-lg font-medium">Word Document</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Review Word documents for structure, clarity, readability, and formatting
                    </p>
                  </div>
                  <div 
                    className={`border rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors ${fileType === 'powerpoint' ? 'border-primary bg-accent/50' : 'border-input'}`}
                    onClick={() => handleFileTypeSelect('powerpoint')}
                  >
                    <Presentation className="h-16 w-16 mx-auto mb-4 text-orange-600" />
                    <h3 className="text-lg font-medium">PowerPoint Presentation</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Review presentations for design consistency, accessibility, and best practices
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 'obfuscate' && fileType === 'excel' && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-accent/30 rounded-lg">
                    <Shield className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-medium mb-2">Protect Your Sensitive Data</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Secure your Excel model before uploading by obfuscating financial data while preserving structure and formulas.
                      </p>
                      
                      <div className="space-y-4 mt-4 p-4 bg-background rounded-lg border">
                        <h4 className="font-medium">How Obfuscation Works:</h4>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                          <li>Replaces sensitive values with random numbers of identical format</li>
                          <li>Preserves all formulas, references, and formatting</li>
                        </ul>
                        
                        <Button variant="secondary" onClick={() => window.open('#', '_blank')} className="mt-4 flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Download Excel Obfuscation Macro
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'obfuscate' && fileType === 'powerpoint' && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-accent/30 rounded-lg">
                    <Shield className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-medium mb-2">Protect Your Confidential Content</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Secure your PowerPoint content by scrambling text and numbers while maintaining your presentation's visual layout.
                      </p>
                      
                      <div className="space-y-4 mt-4 p-4 bg-background rounded-lg border">
                        <h4 className="font-medium">How Obfuscation Works:</h4>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                          <li>Replaces text with random characters that match original length</li>
                          <li>Preserves all visual elements, layout, and formatting</li>
                        </ul>
                        
                        <Button variant="secondary" onClick={() => window.open('#', '_blank')} className="mt-4 flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Download PowerPoint Obfuscation Macro
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'obfuscate' && fileType === 'word' && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-accent/30 rounded-lg">
                    <Shield className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-medium mb-2">Protect Your Sensitive Content</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Secure your Word document by obfuscating confidential information while maintaining document structure.
                      </p>
                      
                      <div className="space-y-4 mt-4 p-4 bg-background rounded-lg border">
                        <h4 className="font-medium">How Obfuscation Works:</h4>
                        <ul className="list-disc pl-5 space-y-2 text-sm">
                          <li>Replaces names, identifiers, and sensitive data with generic placeholders</li>
                          <li>Preserves document structure, formatting, and readability</li>
                        </ul>
                        
                        <Button variant="secondary" onClick={() => window.open('#', '_blank')} className="mt-4 flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Download Word Obfuscation Macro
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'upload' && (
                <div className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-accent/50 transition-colors ${
                      file ? 'border-primary' : 'border-input'
                    }`}
              onClick={handleClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                      className="hidden"
                      accept={getAcceptedFileTypes()}
                    />
                    
                    <div className="flex flex-col items-center gap-2">
                      <UploadIcon className="h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-medium">
                        {file ? file.name : fileType === 'excel' 
                          ? 'Drag & drop your model or click to browse' 
                          : fileType === 'word'
                          ? 'Drag & drop your document or click to browse'
                          : 'Drag & drop your deck or click to browse'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Supported formats: {getAcceptedFileTypes()}
                      </p>
              {file && (
                        <p className="text-sm font-medium">
                  Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'analyze' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-base">What would you like to analyze?</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleSelectAll}
                        className="text-xs h-8"
                      >
                        {selectedPresets.length === getPresets().length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      {getPresets().map((preset) => (
                        <div
                          key={preset.id}
                          className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-accent/50 transition-colors ${
                            selectedPresets.includes(preset.id) ? 'border-primary bg-accent/50' : 'border-input'
                          }`}
                          onClick={() => handlePresetToggle(preset.id)}
                        >
                          <Checkbox 
                            checked={selectedPresets.includes(preset.id)}
                            onCheckedChange={() => handlePresetToggle(preset.id)}
                            id={`preset-${preset.id}`}
                            className="mr-2"
                          />
                          <Label
                            htmlFor={`preset-${preset.id}`}
                            className="text-sm font-medium cursor-pointer flex-1"
                          >
                            {preset.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label htmlFor="customRequirements" className="text-base">
                      Specific requirements or concerns (optional)
                    </Label>
                    <Textarea
                      id="customRequirements"
                      value={customRequirements}
                      onChange={(e) => setCustomRequirements(e.target.value)}
                      placeholder="E.g., Check for inconsistent calculations in column B, validate pivot table data sources, etc."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              )}

              {currentStep === 'confirmation' && (
                <div className="space-y-6 py-6">
                  <div className="flex flex-col items-center text-center">
                    {uploadProgress.status === 'success' ? (
                      <CheckCircle className="h-20 w-20 text-green-500 mb-6" />
                    ) : (
                      <div className="h-32 w-32 mb-6 bg-primary/5 rounded-full p-2 flex items-center justify-center animate-pulse">
                        <Step4Animation />
                      </div>
                    )}
                    <h3 className="text-2xl font-bold mb-2">Audit Request Submitted</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-primary">
                        {uploadProgress.status === 'success' ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Zap className="h-5 w-5 animate-pulse" />
                        )}
                        <p className="font-medium">
                          {uploadProgress.status === 'success' ? 'Model Processing Complete' : 'Processing Your Model'}
                        </p>
                      </div>
                      <p className="text-muted-foreground max-w-md">
                        {uploadProgress.status === 'success' 
                          ? 'Your audit has been completed and results are now available in your dashboard.'
                          : 'Your audit is being processed and results will be available in your dashboard shortly. We will send you a confirmation email when it\'s ready.'}
                      </p>
                      
                      {uploadProgress.status !== 'success' && (
                        <div className="w-full max-w-md mt-4">
                          <div className="flex justify-between mb-1">
                            <p className="text-sm font-medium">{uploadProgress.message || "Processing..."}</p>
                            <p className="text-sm font-medium">{uploadProgress.progress}%</p>
                          </div>
                          <Progress value={uploadProgress.progress} className="w-full h-2" />
                        </div>
                      )}
                      
                      <Button onClick={handleDashboardNavigation} className="mt-8 px-8 py-6 text-base" size="lg">
                        {uploadProgress.status === 'success' ? 'View Results' : 'Go to Dashboard'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {uploadProgress.status === 'uploading' && (
                <div className="space-y-2">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">{uploadProgress.message}</p>
                    <p className="text-sm font-medium">{uploadProgress.progress}%</p>
                  </div>
                  <Progress value={uploadProgress.progress} className="w-full" />
                </div>
              )}

              {uploadProgress.status === 'success' && currentStep !== 'confirmation' && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{uploadProgress.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {currentStep !== 'type' && currentStep !== 'confirmation' ? (
                <Button 
                  variant="outline" 
                  onClick={handlePreviousStep}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : (
                <div></div>
              )}
              
              {currentStep === 'obfuscate' && (
                <div className="flex space-x-2">
            <Button 
                    onClick={handleNextStep}
                    className="flex items-center gap-1"
            >
                    Proceed <ArrowRight className="h-4 w-4" />
            </Button>
                </div>
              )}
            
              {(currentStep === 'upload' || currentStep === 'analyze') && (
            <Button
                  onClick={handleNextStep}
                  disabled={uploadProgress.status === 'uploading' || (currentStep === 'upload' && !file)}
                  className="flex items-center gap-1"
                >
                  {currentStep === 'analyze' ? (
                    uploadProgress.status === 'uploading' ? 'Uploading...' : (
                      <>Start Audit <ArrowRight className="h-4 w-4" /></>
                    )
                  ) : (
                    <>Next <ArrowRight className="h-4 w-4" /></>
                  )}
            </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
};

export default Upload;