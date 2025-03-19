import React from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Link,
  Divider,
  Stack,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';

const Footer = () => {
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 8,
        bgcolor: '#f8f8f8',
        borderTop: '1px solid',
        borderColor: '#eaeaea',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h6" 
                component={RouterLink} 
                to="/" 
                sx={{ 
                  textDecoration: 'none',
                  color: '#1b5e20',
                  fontWeight: 700,
                  display: 'inline-block',
                }}
              >
                AuditMyModel
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#60706a', mb: 2 }}>
              Take your raw meeting notes and transform them into comprehensive, organized summaries
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#2e7d32' }}>
              Product
            </Typography>
            <Stack spacing={1.5}>
              <Link 
                component={RouterLink} 
                to="/features" 
                sx={{ 
                  color: '#60706a', 
                  textDecoration: 'none',
                  '&:hover': { color: '#2e7d32' },
                  fontSize: '0.9rem'
                }}
              >
                Features
              </Link>
              <Link 
                component={RouterLink} 
                to="/pricing" 
                sx={{ 
                  color: '#60706a', 
                  textDecoration: 'none',
                  '&:hover': { color: '#2e7d32' },
                  fontSize: '0.9rem'
                }}
              >
                Pricing
              </Link>
              <Link 
                component="a" 
                href="https://docs.auditmymodel.com" 
                target="_blank"
                sx={{ 
                  color: '#60706a', 
                  textDecoration: 'none',
                  '&:hover': { color: '#2e7d32' },
                  fontSize: '0.9rem'
                }}
              >
                Documentation
              </Link>
              <Link 
                component={RouterLink} 
                to="/download" 
                sx={{ 
                  color: '#60706a', 
                  textDecoration: 'none',
                  '&:hover': { color: '#2e7d32' },
                  fontSize: '0.9rem'
                }}
              >
                Download
              </Link>
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#2e7d32' }}>
              Company
            </Typography>
            <Stack spacing={1.5}>
              <Link 
                component={RouterLink} 
                to="/about" 
                sx={{ 
                  color: '#60706a', 
                  textDecoration: 'none',
                  '&:hover': { color: '#2e7d32' },
                  fontSize: '0.9rem'
                }}
              >
                About
              </Link>
              <Link 
                component={RouterLink} 
                to="/blog" 
                sx={{ 
                  color: '#60706a', 
                  textDecoration: 'none',
                  '&:hover': { color: '#2e7d32' },
                  fontSize: '0.9rem'
                }}
              >
                Blog
              </Link>
              <Link 
                component={RouterLink} 
                to="/careers" 
                sx={{ 
                  color: '#60706a', 
                  textDecoration: 'none',
                  '&:hover': { color: '#2e7d32' },
                  fontSize: '0.9rem'
                }}
              >
                Careers
              </Link>
              <Link 
                component="a" 
                href="mailto:contact@auditmymodel.com"
                sx={{ 
                  color: '#60706a', 
                  textDecoration: 'none',
                  '&:hover': { color: '#2e7d32' },
                  fontSize: '0.9rem'
                }}
              >
                Contact
              </Link>
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#2e7d32' }}>
              Legal
            </Typography>
            <Stack spacing={1.5}>
              <Link 
                component={RouterLink} 
                to="/privacy" 
                sx={{ 
                  color: '#60706a', 
                  textDecoration: 'none',
                  '&:hover': { color: '#2e7d32' },
                  fontSize: '0.9rem'
                }}
              >
                Privacy
              </Link>
              <Link 
                component={RouterLink} 
                to="/terms" 
                sx={{ 
                  color: '#60706a', 
                  textDecoration: 'none',
                  '&:hover': { color: '#2e7d32' },
                  fontSize: '0.9rem'
                }}
              >
                Terms
              </Link>
              <Link 
                component={RouterLink} 
                to="/security" 
                sx={{ 
                  color: '#60706a', 
                  textDecoration: 'none',
                  '&:hover': { color: '#2e7d32' },
                  fontSize: '0.9rem'
                }}
              >
                Security
              </Link>
              <Link 
                component={RouterLink} 
                to="/gdpr" 
                sx={{ 
                  color: '#60706a', 
                  textDecoration: 'none',
                  '&:hover': { color: '#2e7d32' },
                  fontSize: '0.9rem'
                }}
              >
                GDPR
              </Link>
            </Stack>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 4, borderColor: alpha('#000', 0.08) }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ color: '#60706a' }}>
            © {new Date().getFullYear()} AuditMyModel Inc. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={3} sx={{ mt: { xs: 2, sm: 0 } }}>
            <Link 
              component="a" 
              href="https://twitter.com/auditmymodel" 
              target="_blank"
              sx={{ 
                color: '#60706a', 
                textDecoration: 'none',
                '&:hover': { color: '#2e7d32' },
                fontSize: '0.9rem'
              }}
            >
              Twitter
            </Link>
            <Link 
              component="a" 
              href="https://linkedin.com/company/auditmymodel" 
              target="_blank"
              sx={{ 
                color: '#60706a', 
                textDecoration: 'none',
                '&:hover': { color: '#2e7d32' },
                fontSize: '0.9rem'
              }}
            >
              LinkedIn
            </Link>
            <Link 
              component="a" 
              href="https://github.com/auditmymodel" 
              target="_blank"
              sx={{ 
                color: '#60706a', 
                textDecoration: 'none',
                '&:hover': { color: '#2e7d32' },
                fontSize: '0.9rem'
              }}
            >
              GitHub
            </Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
