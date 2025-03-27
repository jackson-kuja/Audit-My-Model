const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS
const allowedOrigins = [
  'https://auditmyfile.com',
  'https://www.auditmyfile.com',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.CORS_ORIGIN === origin) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Temporarily allow all origins until this is resolved
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Parse JSON request bodies
app.use(express.json());

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Basic health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Audit My File API is running' });
});

// Audits endpoint - GET all audits
app.get('/api/audits', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching audits:', error);
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
});

// Audits endpoint - GET a single audit
app.get('/api/audits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Audit not found' });
    
    res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching audit ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch audit' });
  }
});

// Simple OPTIONS handler for CORS preflight requests
app.options('/api/audits', (req, res) => {
  res.status(200).end();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Supabase URL: ${supabaseUrl ? 'Configured' : 'Missing'}`); 
});
