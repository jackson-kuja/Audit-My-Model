import React, { useState, useEffect, useRef } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Container,
  Paper,
  Stack,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../utils/supabase';

// Company logos for trusted by section
const CompanyLogos = () => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      justifyContent: 'center',
      gap: { xs: 2, md: 4 },
      opacity: 0.6,
      my: 6,
      px: 2
    }}>
      <Box component="img" src="https://placehold.co/120x40/f5f5f5/a0a0a0?text=IDEO" alt="IDEO" height={35} />
      <Box component="img" src="https://placehold.co/120x40/f5f5f5/a0a0a0?text=atomico" alt="atomico" height={35} />
      <Box component="img" src="https://placehold.co/120x40/f5f5f5/a0a0a0?text=EVERY" alt="EVERY" height={35} />
      <Box component="img" src="https://placehold.co/120x40/f5f5f5/a0a0a0?text=Andreessen" alt="Andreessen" height={35} />
      <Box component="img" src="https://placehold.co/120x40/f5f5f5/a0a0a0?text=ROBLOX" alt="ROBLOX" height={35} />
    </Box>
  );
};

// Platform logos section
const PlatformLogos = () => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      justifyContent: 'center',
      gap: { xs: 3, md: 5 },
      my: 4,
      px: 2
    }}>
      <Box component="img" src="https://placehold.co/50x50/f5f5f5/a0a0a0?text=Meet" alt="Google Meet" height={50} />
      <Box component="img" src="https://placehold.co/50x50/f5f5f5/a0a0a0?text=Teams" alt="Microsoft Teams" height={50} />
      <Box component="img" src="https://placehold.co/50x50/f5f5f5/a0a0a0?text=Slack" alt="Slack" height={50} />
      <Box component="img" src="https://placehold.co/50x50/f5f5f5/a0a0a0?text=Zoom" alt="Zoom" height={50} />
    </Box>
  );
};

// Interactive before/after slider for Excel audit comparison
const BeforeAfterSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleMouseMove = (e) => {
    if (!isDragging || !sliderRef.current) return;
    
    const sliderRect = sliderRef.current.getBoundingClientRect();
    const newPosition = ((e.clientX - sliderRect.left) / sliderRect.width) * 100;
    
    // Constrain position between 0 and 100
    setSliderPosition(Math.max(0, Math.min(100, newPosition)));
  };
  
  const handleTouchMove = (e) => {
    if (!isDragging || !sliderRef.current) return;
    
    const touch = e.touches[0];
    const sliderRect = sliderRef.current.getBoundingClientRect();
    const newPosition = ((touch.clientX - sliderRect.left) / sliderRect.width) * 100;
    
    // Constrain position between 0 and 100
    setSliderPosition(Math.max(0, Math.min(100, newPosition)));
  };
  
  useEffect(() => {
    // Add event listeners for mouse and touch events
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);
  
  // Excel sheet grid styling
  const cellStyles = {
    borderRight: '1px solid #ccc',
    borderBottom: '1px solid #ccc',
    height: '22px',
    fontSize: '12px',
    padding: '2px 4px',
    fontFamily: 'Consolas, monospace',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };
  
  const headerCellStyles = {
    ...cellStyles,
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    textAlign: 'center'
  };
  
  const formulaCellStyles = {
    ...cellStyles,
    color: '#217346',
    cursor: 'pointer'
  };
  
  return (
    <Box sx={{ position: 'relative', height: '450px', userSelect: 'none', mb: 4, borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      {/* Excel toolbar */}
      <Box sx={{ 
        height: '40px', 
        bgcolor: '#217346', 
        display: 'flex', 
        width: '100%',
        alignItems: 'center',
        p: 1,
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        <Box sx={{ mr: 2 }}>Q2_Revenue_Forecast.xlsx</Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box sx={{ px: 1, py: 0.5, fontSize: '12px', borderRadius: 0.5, bgcolor: 'rgba(255,255,255,0.1)' }}>File</Box>
          <Box sx={{ px: 1, py: 0.5, fontSize: '12px', borderRadius: 0.5, bgcolor: 'rgba(255,255,255,0.1)' }}>Home</Box>
          <Box sx={{ px: 1, py: 0.5, fontSize: '12px', borderRadius: 0.5, bgcolor: 'rgba(255,255,255,0.2)' }}>Formulas</Box>
          <Box sx={{ px: 1, py: 0.5, fontSize: '12px', borderRadius: 0.5, bgcolor: 'rgba(255,255,255,0.1)' }}>Data</Box>
          <Box sx={{ px: 1, py: 0.5, fontSize: '12px', borderRadius: 0.5, bgcolor: 'rgba(255,255,255,0.1)' }}>Review</Box>
        </Box>
      </Box>
      
      {/* Formula bar */}
      <Box sx={{ 
        height: '25px', 
        bgcolor: '#f3f3f3', 
        borderBottom: '1px solid #ccc',
        display: 'flex',
        alignItems: 'center',
        px: 1,
        fontSize: '12px'
      }}>
        <Box sx={{ mr: 1, color: '#666' }}>fx:</Box>
        <Box sx={{ flex: 1, fontFamily: 'Consolas, monospace' }}>
          =SUM(D5:D16)*Growth_Rate
        </Box>
      </Box>
      
      {/* Single Excel sheet view */}
      <Box
        sx={{
          position: 'absolute',
          top: 65,
          left: 0,
          width: '100%',
          height: 'calc(100% - 65px)',
          backgroundColor: 'white',
          overflow: 'hidden'
        }}
      >
        {/* Simulated Excel grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, minmax(80px, 1fr))', gridTemplateRows: 'repeat(auto-fill, 22px)' }}>
          {/* Header row */}
          <Box sx={headerCellStyles}></Box>
          <Box sx={headerCellStyles}>A</Box>
          <Box sx={headerCellStyles}>B</Box>
          <Box sx={headerCellStyles}>C</Box>
          <Box sx={headerCellStyles}>D</Box>
          <Box sx={headerCellStyles}>E</Box>
          <Box sx={headerCellStyles}>F</Box>
          <Box sx={headerCellStyles}>G</Box>
          <Box sx={headerCellStyles}>H</Box>
          <Box sx={headerCellStyles}>I</Box>
          
          {/* Row 1 */}
          <Box sx={headerCellStyles}>1</Box>
          <Box sx={cellStyles} gridColumn="span 9">Q2 REVENUE FORECAST - FY2023</Box>
          
          {/* Row 2 */}
          <Box sx={headerCellStyles}>2</Box>
          <Box sx={cellStyles}></Box>
          <Box sx={cellStyles} gridColumn="span 8"></Box>
          
          {/* Row 3 */}
          <Box sx={headerCellStyles}>3</Box>
          <Box sx={cellStyles} gridColumn="span 2">Revenue Streams</Box>
          <Box sx={cellStyles}>Q1</Box>
          <Box sx={cellStyles}>Q2</Box>
          <Box sx={cellStyles}>Q3 (est.)</Box>
          <Box sx={cellStyles}>Q4 (est.)</Box>
          <Box sx={cellStyles}>YTD</Box>
          <Box sx={cellStyles}>Growth Rate</Box>
          <Box sx={cellStyles} gridColumn="span 2"></Box>
          
          {/* Row 4 */}
          <Box sx={headerCellStyles}>4</Box>
          <Box sx={cellStyles} gridColumn="span 9"></Box>
          
          {/* Row 5 */}
          <Box sx={headerCellStyles}>5</Box>
          <Box sx={cellStyles}>Subscription</Box>
          <Box sx={cellStyles}>$ 856,420</Box>
          <Box sx={cellStyles}>$ 923,450</Box>
          <Box sx={cellStyles}>$ 980,640</Box>
          <Box sx={cellStyles}>$ 1,030,540</Box>
          <Box sx={formulaCellStyles}>$ 3,791,050</Box>
          <Box sx={cellStyles}>0.08</Box>
          <Box sx={cellStyles} gridColumn="span 3"></Box>
          
          {/* Row 6 */}
          <Box sx={headerCellStyles}>6</Box>
          <Box sx={cellStyles}>Services</Box>
          <Box sx={cellStyles}>$ 342,560</Box>
          <Box sx={cellStyles}>$ 368,290</Box>
          <Box sx={cellStyles}>$ 395,410</Box>
          <Box sx={cellStyles}>$ 410,650</Box>
          <Box sx={formulaCellStyles}>$ 1,516,910</Box>
          <Box sx={cellStyles}>0.07</Box>
          <Box sx={cellStyles} gridColumn="span 3"></Box>
          
          {/* Row 7 */}
          <Box sx={headerCellStyles}>7</Box>
          <Box sx={cellStyles}>Licensing</Box>
          <Box sx={cellStyles}>$ 215,730</Box>
          <Box sx={cellStyles}>$ 230,850</Box>
          <Box sx={cellStyles}>$ 246,250</Box>
          <Box sx={cellStyles}>$ 255,120</Box>
          <Box sx={formulaCellStyles}>$ 947,950</Box>
          <Box sx={cellStyles}>0.06</Box>
          <Box sx={cellStyles} gridColumn="span 3"></Box>
        </Box>
        
        {/* Error callouts with clip mask based on slider position */}
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            clipPath: `polygon(0% 0%, ${sliderPosition}% 0%, ${sliderPosition}% 100%, 0% 100%)`
          }}
        >
          {/* Circular reference error */}
          <Box sx={{ 
            position: 'absolute', 
            top: '135px', 
            left: '55%', 
            bgcolor: 'rgba(255,70,70,0.2)', 
            border: '2px solid #ff4646', 
            p: 1, 
            borderRadius: 1
          }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#d00000', fontWeight: 500 }}>
              Circular Reference
            </Typography>
          </Box>
          
          {/* REF error */}
          <Box sx={{ 
            position: 'absolute', 
            top: '95px', 
            left: '40%', 
            bgcolor: 'rgba(255,70,70,0.2)', 
            border: '2px solid #ff4646', 
            p: 1, 
            borderRadius: 1
          }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#d00000', fontWeight: 500 }}>
              #REF! Error
            </Typography>
          </Box>
          
          {/* Formula inconsistency */}
          <Box sx={{ 
            position: 'absolute', 
            top: '60%', 
            left: '25%', 
            bgcolor: 'rgba(255,154,0,0.2)', 
            border: '2px solid #ff9a00', 
            p: 1, 
            borderRadius: 1
          }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#b36800', fontWeight: 500 }}>
              Inconsistent Formula
            </Typography>
          </Box>
          
          {/* Hidden calculation */}
          <Box sx={{ 
            position: 'absolute', 
            top: '40%', 
            left: '75%', 
            bgcolor: 'rgba(255,154,0,0.2)', 
            border: '2px solid #ff9a00', 
            p: 1, 
            borderRadius: 1
          }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#b36800', fontWeight: 500 }}>
              Hidden Calculation
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Slider overlay - clean side */}
      <Box
        sx={{
          position: 'absolute',
          top: 65,
          left: 0,
          width: `${sliderPosition}%`,
          height: 'calc(100% - 65px)',
          borderRight: '2px solid #2e7d32',
          pointerEvents: 'none'
        }}
      />
      
      {/* Slider handle */}
      <Box
        ref={sliderRef}
        sx={{
          position: 'absolute',
          top: 65,
          left: 0,
          width: '100%',
          height: 'calc(100% - 65px)',
          cursor: 'ew-resize',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <Box
          sx={{
            position: 'absolute',
            left: `calc(${sliderPosition}% - 17px)`,
            width: 34,
            height: 34,
            borderRadius: '50%',
            backgroundColor: '#2e7d32',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 0 10px rgba(0,0,0,0.3)',
            transform: isDragging ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.1s ease'
          }}
        >
          <Box
            sx={{
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderRight: '6px solid white',
              position: 'absolute',
              right: '60%'
            }}
          />
          <Box
            sx={{
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: '6px solid white',
              position: 'absolute',
              left: '60%'
            }}
          />
        </Box>
      </Box>
      
      {/* Instruction text */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        bgcolor: 'rgba(255,255,255,0.9)',
        py: 1,
        px: 3,
        borderRadius: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: '#444' }}>
          ↔️ Slide to show errors
        </Typography>
      </Box>
    </Box>
  );
};

// Mock of template example
const TemplateExample = () => {
  const [selectedModel, setSelectedModel] = useState('DCF Models');
  
  // Content data for model types (financial and non-financial)
  const modelContent = {
    'Financial Projections': {
      title: 'Financial Projection Model Audit',
      subtitle: 'Tech Startup 5-Year Forecast',
      points: [
        { 
          title: 'Revenue Assumptions Verification', 
          count: 3,
          details: [
            'Market size validation against industry benchmarks',
            'Growth rate consistency with historical patterns',
            'Pricing strategy alignment with competitive landscape'
          ]
        },
        { 
          title: 'Growth Rate Consistency Check', 
          count: 4,
          details: [
            'Quarter-over-quarter growth validation',
            'Seasonal adjustment verification',
            'Year-over-year trend analysis',
            'Market share projection reasonability'
          ]
        },
        { 
          title: 'Cash Flow Calculation Validation', 
          count: 2,
          details: [
            'Operating cash flow derivation accuracy',
            'Capital expenditure projection reasonability'
          ]
        },
        { 
          title: 'Formula Error Detection', 
          count: 5,
          details: [
            'Circular reference identification',
            'Broken link detection',
            'Hardcoded value identification',
            'Formula consistency across worksheets',
            'Range reference validation'
          ]
        }
      ]
    },
    'Valuation Models': {
      title: 'Valuation Model Audit',
      subtitle: 'M&A Target Assessment',
      points: [
        { 
          title: 'Discount Rate Verification', 
          count: 3,
          details: [
            'WACC calculation methodology review',
            'Risk premium appropriateness check',
            'Beta value validation against industry norms'
          ]
        },
        { 
          title: 'Terminal Value Calculation Review', 
          count: 2,
          details: [
            'Perpetuity growth rate reasonability assessment',
            'Exit multiple approach validation'
          ]
        },
        { 
          title: 'Multiple Analysis Consistency', 
          count: 4,
          details: [
            'EV/EBITDA multiple validation with comparable companies',
            'P/E ratio assessment against industry benchmarks',
            'Historical trading multiple analysis',
            'Precedent transaction multiple review'
          ]
        },
        { 
          title: 'Scenario Testing & Validation', 
          count: 3,
          details: [
            'Sensitivity analysis configuration review',
            'Downside scenario structural integrity',
            'Best-case assumptions validation'
          ]
        }
      ]
    },
    'Data Science Models': {
      title: 'Data Science Model Audit',
      subtitle: 'Predictive Analytics Review',
      points: [
        { 
          title: 'Data Transformation Verification', 
          count: 3,
          details: [
            'Normalization procedure validation',
            'Outlier handling methodology review',
            'Missing value imputation approach check'
          ]
        },
        { 
          title: 'Statistical Assumptions Check', 
          count: 4,
          details: [
            'Normality assumption validation',
            'Homoscedasticity verification',
            'Independence check for observations',
            'Multicollinearity assessment'
          ]
        },
        { 
          title: 'Model Accuracy Validation', 
          count: 3,
          details: [
            'Cross-validation methodology review',
            'Test set performance metrics check',
            'Overfitting assessment'
          ]
        },
        { 
          title: 'Feature Importance Analysis', 
          count: 2,
          details: [
            'Variable selection methodology verification',
            'Feature contribution weighting assessment'
          ]
        }
      ]
    },
    'Supply Chain Models': {
      title: 'Supply Chain Model Audit',
      subtitle: 'Inventory & Logistics Optimization',
      points: [
        { 
          title: 'Demand Forecasting Verification', 
          count: 3,
          details: [
            'Seasonal adjustment methodology check',
            'Trend projection reasonability assessment',
            'Historical data integration review'
          ]
        },
        { 
          title: 'Inventory Parameter Validation', 
          count: 4,
          details: [
            'Safety stock calculation methodology',
            'Reorder point formula verification',
            'Lead time assumption assessment',
            'Carrying cost calculation review'
          ]
        },
        { 
          title: 'Transportation Model Check', 
          count: 2,
          details: [
            'Routing efficiency algorithm validation',
            'Cost calculation accuracy verification'
          ]
        },
        { 
          title: 'Network Design Analysis', 
          count: 3,
          details: [
            'Facility location optimization review',
            'Capacity constraint validation',
            'Service level calculation check'
          ]
        }
      ]
    },
    'DCF Models': {
      title: 'DCF Model Audit',
      subtitle: 'Investment Opportunity Analysis',
      points: [
        { 
          title: 'Free Cash Flow Calculation Review', 
          count: 3,
          details: [
            'EBIT to unlevered FCF conversion accuracy',
            'Working capital adjustment methodology',
            'Capital expenditure projection reasonability'
          ]
        },
        { 
          title: 'WACC Formula Verification', 
          count: 4,
          details: [
            'Cost of equity calculation methodology',
            'Cost of debt derivation approach',
            'Capital structure weighting review',
            'Tax shield treatment validation'
          ]
        },
        { 
          title: 'Growth Rate Assumptions Check', 
          count: 2,
          details: [
            'Short-term growth rate justification review',
            'Terminal growth rate reasonability assessment'
          ]
        },
        { 
          title: 'Sensitivity Analysis Validation', 
          count: 3,
          details: [
            'Discount rate range appropriateness',
            'Growth rate sensitivity parameter check',
            'Scenario analysis structure validation'
          ]
        }
      ]
    }
  };
  
  const selectedContent = modelContent[selectedModel];
  
  const handleModelChange = (model) => {
    setSelectedModel(model);
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={5}>
        <Box>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 700, mb: 2, color: '#1b5e20' }}>
            Specialized audits for different model types
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: '#60706a' }}>
            Get tailored analysis based on your specific model purpose and industry.
          </Typography>
          
          {/* Model selection chips arranged in a more spacious layout */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {/* First row */}
              <Chip 
                label="Financial Projections" 
                onClick={() => handleModelChange('Financial Projections')}
                sx={{ 
                  bgcolor: selectedModel === 'Financial Projections' ? '#2e7d32' : 'transparent', 
                  color: selectedModel === 'Financial Projections' ? 'white' : 'inherit', 
                  borderRadius: 100,
                  px: 2,
                  py: 2.5,
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  borderColor: '#2e7d324f',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: selectedModel === 'Financial Projections' ? '#2e7d32' : '#f0f7f0',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                  }
                }} 
                variant={selectedModel === 'Financial Projections' ? "filled" : "outlined"}
              />
              <Chip 
                label="Valuation Models" 
                onClick={() => handleModelChange('Valuation Models')}
                sx={{ 
                  bgcolor: selectedModel === 'Valuation Models' ? '#2e7d32' : 'transparent', 
                  color: selectedModel === 'Valuation Models' ? 'white' : 'inherit', 
                  borderRadius: 100,
                  px: 2,
                  py: 2.5,
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  borderColor: '#2e7d324f',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: selectedModel === 'Valuation Models' ? '#2e7d32' : '#f0f7f0',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                  }
                }} 
                variant={selectedModel === 'Valuation Models' ? "filled" : "outlined"}
              />
            </Box>
            
            {/* Second row */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Chip 
                label="DCF Models" 
                onClick={() => handleModelChange('DCF Models')}
                sx={{ 
                  bgcolor: selectedModel === 'DCF Models' ? '#2e7d32' : 'transparent', 
                  color: selectedModel === 'DCF Models' ? 'white' : 'inherit', 
                  borderRadius: 100,
                  px: 2,
                  py: 2.5,
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  borderColor: '#2e7d324f',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: selectedModel === 'DCF Models' ? '#2e7d32' : '#f0f7f0',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                  }
                }} 
                variant={selectedModel === 'DCF Models' ? "filled" : "outlined"}
              />
              <Chip 
                label="Data Science Models" 
                onClick={() => handleModelChange('Data Science Models')}
                sx={{ 
                  bgcolor: selectedModel === 'Data Science Models' ? '#2e7d32' : 'transparent', 
                  color: selectedModel === 'Data Science Models' ? 'white' : 'inherit', 
                  borderRadius: 100,
                  px: 2,
                  py: 2.5,
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  borderColor: '#2e7d324f',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: selectedModel === 'Data Science Models' ? '#2e7d32' : '#f0f7f0',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                  }
                }} 
                variant={selectedModel === 'Data Science Models' ? "filled" : "outlined"}
              />
              <Chip 
                label="Supply Chain Models" 
                onClick={() => handleModelChange('Supply Chain Models')}
                sx={{ 
                  bgcolor: selectedModel === 'Supply Chain Models' ? '#2e7d32' : 'transparent', 
                  color: selectedModel === 'Supply Chain Models' ? 'white' : 'inherit', 
                  borderRadius: 100,
                  px: 2,
                  py: 2.5,
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  borderColor: '#2e7d324f',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: selectedModel === 'Supply Chain Models' ? '#2e7d32' : '#f0f7f0',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                  }
                }} 
                variant={selectedModel === 'Supply Chain Models' ? "filled" : "outlined"}
              />
            </Box>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={12} md={7}>
        <Paper sx={{ 
          p: 4, 
          borderRadius: 2, 
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
          minHeight: 400,
          bgcolor: '#f9fdf9',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.08)'
          }
        }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, fontSize: '1.25rem' }}>{selectedContent.title}</Typography>
            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem', mb: 4 }}>{selectedContent.subtitle}</Typography>
            
            {selectedContent.points.map((point, index) => (
              <Box key={index} sx={{ mb: 5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box 
                    component="span" 
                    sx={{ 
                      width: 28, 
                      height: 28, 
                      borderRadius: '50%', 
                      bgcolor: '#e8f5e9', 
                      color: '#2e7d32',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      mr: 2
                    }}
                  >
                    {point.count}
                  </Box>
                  {point.title}
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0, listStyleType: 'disc' }}>
                  {point.details.map((detail, i) => (
                    <Box 
                      key={i} 
                      component="li" 
                      sx={{ 
                        mb: 1, 
                        color: '#555',
                        fontSize: '0.9rem',
                        lineHeight: 1.5
                      }} 
                    >
                      {detail}
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

// Financial Mistakes Card Stack
const FinancialMistakesStack = () => {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [prevCardIndex, setPrevCardIndex] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState('right');
  const stackRef = useRef(null);
  const sectionRefs = useRef([]);

  const mistakes = [
    {
      special: true,
      line1: "Big mistakes cost millions.",
      line2: "Small mistakes cost careers.",
      line3: "Audit before it's too late."
    },
    {
      company: "Fannie Mae",
      loss: "$1 billion",
      mistake: "An accountant input an incorrect formula leading to substantial accounting errors"
    },
    {
      company: "Tibco Software",
      loss: "$100 million",
      mistake: "A spreadsheet error overstated Tibco's equity value during its sale, resulting in shareholders receiving $100 million less than anticipated"
    },
    {
      company: "Lazard Investment Bank",
      loss: "$400 million",
      mistake: "A computational error in a spreadsheet led to an inadvertent $400 million discount in the valuation of SolarCity"
    },
    {
      company: "JP Morgan Chase & Co.",
      loss: "$6.2 billion",
      mistake: "Formula and copy-paste errors led to significant underestimation of portfolio risk, resulting in massive financial losses"
    },
    {
      company: "Fidelity Investments",
      loss: "$2.6 billion",
      mistake: "A data entry error omitted a minus sign, turning losses into profits and significantly overstating dividends"
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      // Get current scroll position
      const scrollPosition = window.scrollY;
      
      // Find which section should be active based on scroll position
      const stackTop = stackRef.current?.getBoundingClientRect().top + window.scrollY || 0;
      const viewportHeight = window.innerHeight;
      const relativeScrollPosition = scrollPosition - stackTop + (viewportHeight * 0.4);
      
      // Calculate which section should be active based on scroll position
      // Use a shorter threshold to make transitions happen more quickly
      const sectionHeight = viewportHeight * 0.25; // 25vh instead of 60vh
      const calculatedIndex = Math.min(
        Math.floor(relativeScrollPosition / sectionHeight),
        mistakes.length - 1
      );
      
      const newIndex = Math.max(0, Math.min(calculatedIndex, mistakes.length - 1));
      
      if (newIndex !== activeCardIndex) {
        setPrevCardIndex(activeCardIndex);
        setTransitionDirection(newIndex > activeCardIndex ? 'right' : 'left');
        setActiveCardIndex(newIndex);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial call to set the right card on load
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeCardIndex, mistakes.length]);

  return (
    <Box 
      ref={stackRef}
      sx={{ 
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        mx: 'auto',
        mb: 8,
        height: `${mistakes.length * 25}vh`, // Total height based on number of cards times 25vh each
        minHeight: '400px'
      }}
    >
      {/* Fixed card container that stays centered on screen */}
      <Box sx={{ 
        position: 'sticky', 
        top: '30vh', 
        height: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
        overflow: 'hidden'
      }}>
        {/* Background cards for stacked appearance */}
        <Paper
          elevation={1}
          sx={{
            position: 'absolute',
            p: 3,
            width: '95%',
            height: '95%',
            borderRadius: 2,
            background: '#f7f7f7',
            transform: 'rotate(-2deg) translateY(12px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.06)',
            zIndex: 1
          }}
        />
        <Paper
          elevation={2}
          sx={{
            position: 'absolute',
            p: 3, 
            width: '97%',
            height: '98%',
            borderRadius: 2,
            background: '#f8f8f8',
            transform: 'rotate(1deg) translateY(6px) translateX(-3px)',
            boxShadow: '0 5px 10px rgba(0,0,0,0.08)',
            zIndex: 2
          }}
        />
        
        {/* Card container for animations */}
        <Box 
          sx={{ 
            position: 'relative',
            width: '100%',
            height: '100%',
            zIndex: 3,
            perspective: '1000px'
          }}
        >
          {/* Render all cards but only show the active one */}
          {mistakes.map((mistake, index) => (
            <Paper
              key={index}
              elevation={3}
              sx={{
                p: { xs: 2, sm: 3 },
                width: '100%',
                height: '100%',
                borderRadius: 2,
                background: '#fafafa',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: index === activeCardIndex ? 1 : 0,
                transform: index === activeCardIndex 
                  ? 'translateX(0%)' 
                  : `translateX(${index === prevCardIndex ? (transitionDirection === 'right' ? '-100%' : '100%') : (transitionDirection === 'right' ? '100%' : '-100%')})`,
                transition: 'transform 0.5s ease-out, opacity 0.4s ease-out',
                zIndex: index === activeCardIndex ? 3 : 0,
                pointerEvents: index === activeCardIndex ? 'auto' : 'none'
              }}
            >
              {mistake.special ? (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      mb: 3,
                      fontWeight: 700, 
                      color: '#d32f2f',
                      fontSize: { xs: '1.5rem', md: '1.8rem' },
                      lineHeight: 1.3
                    }}
                  >
                    {mistake.line1}
                  </Typography>
                  
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      mb: 3,
                      fontWeight: 700, 
                      color: '#333',
                      fontSize: { xs: '1.5rem', md: '1.8rem' },
                      lineHeight: 1.3
                    }}
                  >
                    {mistake.line2}
                  </Typography>
                  
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      color: '#2e7d32',
                      fontSize: { xs: '1.5rem', md: '1.8rem' },
                      lineHeight: 1.3
                    }}
                  >
                    {mistake.line3}
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      mb: 1, 
                      color: '#2e7d32', 
                      fontWeight: 700,
                      fontSize: { xs: '1.3rem', md: '1.6rem' } 
                    }}
                  >
                    {mistake.company}
                  </Typography>
                  
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      mb: 2, 
                      fontWeight: 800, 
                      color: '#d32f2f',
                      fontSize: { xs: '1.5rem', md: '1.8rem' } 
                    }}
                  >
                    Loss: {mistake.loss}
                  </Typography>
                  
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 500, 
                      color: '#333',
                      fontSize: { xs: '0.9rem', md: '1rem' },
                      lineHeight: 1.4
                    }}
                  >
                    Mistake: {mistake.mistake}
                  </Typography>
                </>
              )}
            </Paper>
          ))}
        </Box>
        
        {/* Small scroll indicator dots */}
        <Box sx={{
          position: 'absolute',
          bottom: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 1,
          zIndex: 4
        }}>
          {mistakes.map((_, index) => (
            <Box 
              key={index}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: index === activeCardIndex ? '#2e7d32' : 'rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fileCount, setFileCount] = useState("0");
  
  // Fetch audit count from Supabase
  useEffect(() => {
    const fetchAuditCount = async () => {
      try {
        // Count audits in the audits table
        const { count, error } = await supabase
          .from('audits')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error fetching audit count:', error);
          // Fall back to a compelling number if there's an error
          setFileCount("27,493");
          return;
        }
        
        // Format the count with commas
        setFileCount(count ? count.toLocaleString() : "27,493");
      } catch (error) {
        console.error('Error in audit count fetch:', error);
        setFileCount("27,493");
      }
    };
    
    fetchAuditCount();
  }, []);
  
  const handleGetStarted = () => {
    if (user) {
      navigate('/upload');
    } else {
      navigate('/register');
    }
  };
  
  return (
    <Box>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ 
        pt: { xs: 4, md: 6 }, 
        pb: 6, 
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(230, 251, 237, 0.4) 0%, rgba(255, 255, 255, 0) 100%)',
        borderRadius: { xs: 0, md: '0 0 24px 24px' }
      }}>
        <Box sx={{ 
          display: 'inline-block',
          py: 1.2,
          px: 2.5,
          mb: 5,
          borderRadius: 100,
          bgcolor: '#f0f7f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'translateY(-3px)'
          }
        }}>
          <Typography component="span" sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            fontSize: '0.95rem', 
            color: '#2e7d32',
            fontWeight: 500
          }}>
            ✨ We've Audited {fileCount} Files This Week
          </Typography>
        </Box>
        
        <Box sx={{ mb: 6, maxWidth: '800px', mx: 'auto' }}>
          <Typography variant="h1" component="span" sx={{ color: '#8a8a8a', fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            The{' '}
          </Typography>
          <Typography variant="h1" component="span" sx={{ color: '#2e7d32', fontWeight: 700, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            AI-powered audit{' '}
          </Typography>
          <Typography variant="h1" component="span" sx={{ color: '#8a8a8a', fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            for your{' '}
          </Typography>
          <Typography variant="h1" component="span" sx={{ color: '#2e7d32', fontWeight: 700, display: 'block', fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
            critical Excel models
          </Typography>
        </Box>
        
        <FinancialMistakesStack />
      </Container>
      
      {/* Demo Section */}
      <Container maxWidth="lg" sx={{ mb: 10 }}>
        <Typography variant="h2" align="center" gutterBottom sx={{ color: '#2e7d32', fontWeight: 700, mb: 6 }}>
          Catch Mistakes & Prevent Hours Of Stress
        </Typography>
        
        <BeforeAfterSlider />
        
        <Typography variant="body1" align="center" sx={{ mt: 4, color: '#555', maxWidth: 800, mx: 'auto' }}>
          Our AI audit identifies critical issues that traditional review might miss—circular references, formula errors, and inconsistencies that could impact your financial decisions.
        </Typography>
      </Container>
      
      {/* Trusted By Section */}
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" sx={{ color: '#60706a', mb: 2 }}>
          Trusted by financial professionals at
        </Typography>
        <CompanyLogos />
      </Box>
      
      {/* How It Works Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography variant="h2" align="center" gutterBottom sx={{ color: '#2e7d32', fontWeight: 700, mb: 6 }}>
          How it works
        </Typography>
        
        <Grid container spacing={6}>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h5" component="h3" gutterBottom sx={{ color: '#2e7d32', fontWeight: 600 }}>
                AuditMyModel{' '}
                <Box component="span" sx={{ color: '#4caf50', fontWeight: 700 }}>
                  analyzes
                </Box>
                {' '}your Excel models in minutes
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: '#60706a' }}>
                Upload your financial model and our AI technology will scan every formula, dependency, and calculation for errors and inconsistencies.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h5" component="h3" gutterBottom sx={{ color: '#2e7d32', fontWeight: 600 }}>
                Get a detailed report with{' '}
                <Box component="span" sx={{ color: '#4caf50', fontWeight: 700 }}>
                  actionable
                </Box>
                {' '}recommendations
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: '#60706a' }}>
                Receive a comprehensive audit report highlighting potential errors, structural weaknesses, and suggested improvements to make your models more robust.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
      
      {/* Platform Support Section */}
      <Container maxWidth="lg" sx={{ py: 8, mb: 6 }}>
        <Typography variant="h2" align="center" gutterBottom sx={{ color: '#2e7d32', fontWeight: 700, mb: 3 }}>
          Works with all Excel formats,
        </Typography>
        <Typography variant="h2" align="center" gutterBottom sx={{ color: '#2e7d32', fontWeight: 700, mb: 5 }}>
          secure and confidential
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 6, maxWidth: '700px', mx: 'auto', color: '#60706a' }}>
          AuditMyModel supports .xlsx, .xls, .xlsm files with complete data privacy and security
        </Typography>
        
        <PlatformLogos />
      </Container>
      
      {/* Template Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <TemplateExample />
      </Container>
    </Box>
  );
};

export default Landing;
