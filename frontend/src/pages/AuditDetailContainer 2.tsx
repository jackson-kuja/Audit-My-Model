import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Audit } from '../types';
import AuditDetail from './AuditDetail';
import { supabase } from '../utils/supabase';

export default function AuditDetailContainer() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

        const { data, error } = await supabase
          .from('audits')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        setAudit(data as Audit);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch audit');
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [id]);

  return <AuditDetail audit={audit} loading={loading} error={error} />;
} 