import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Audit } from '../types/index';
import AuditDetail from './AuditDetail';
import { supabase } from '../utils/supabase';

export default function AuditDetailContainer() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = async () => {
    if (!id) {
      setError('No audit ID provided');
      setLoading(false);
      return;
    }

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      console.log(`Fetching audit data for ID: ${id}`);
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      console.log('Audit data fetched:', data);
      setAudit(data as Audit);
    } catch (err) {
      console.error('Error fetching audit:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch audit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();

    // Set up polling for in-progress audits
    const pollInterval = setInterval(() => {
      if (audit?.status?.toLowerCase() === 'in_progress' || 
          audit?.status?.toLowerCase() === 'processing') {
        console.log('Polling for audit updates...');
        fetchAudit();
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [id, audit?.status]);

  return <AuditDetail audit={audit} loading={loading} error={error} />;
} 