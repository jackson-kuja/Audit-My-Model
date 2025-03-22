import { supabase } from '../utils/supabase';
import { Audit } from '../types/index';

export interface CreateAuditData {
  name: string;
  model_type?: string;
  file_path?: string;
  audit_type?: string;
  description?: string;
}

const auditService = {
  async getAudits(): Promise<Audit[]> {
    console.log('[Frontend] Getting all audits');
    try {
      // Try multiple approaches to get the user ID
      let userId: string | undefined;
      
      // First approach: Get user directly
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        userId = userData.user.id;
        console.log('[Frontend] Found user ID from auth.getUser():', userId);
      } else if (userError) {
        console.warn('[Frontend] Error getting user:', userError);
      }
      
      // Second approach: Try getting from session if first approach failed
      if (!userId) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user?.id) {
          userId = sessionData.session.user.id;
          console.log('[Frontend] Found user ID from auth.getSession():', userId);
        }
      }
      
      // Last attempt: Check localStorage directly for auth token
      if (!userId) {
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('supabase.auth.token')) {
              const tokenData = JSON.parse(localStorage.getItem(key) || '{}');
              if (tokenData?.currentSession?.user?.id) {
                userId = tokenData.currentSession.user.id;
                console.log('[Frontend] Found user ID from localStorage:', userId);
                break;
              }
            }
          }
        } catch (e) {
          console.error('[Frontend] Error parsing localStorage tokens:', e);
        }
      }
      
      // If we still don't have a user ID, we can't fetch audits
      if (!userId) {
        console.error('[Frontend] No authenticated user found after all attempts');
        return [];
      }
      
      console.log('[Frontend] Fetching audits for user:', userId);
      
      // Get audits with more detailed logging and filter by user_id
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Frontend] Error fetching audits:', error);
        throw error;
      }

      console.log(`[Frontend] Retrieved ${data?.length || 0} audits for user ${userId}`, data);
      
      // If no data but no error, return empty array with warning
      if (!data || data.length === 0) {
        console.warn('[Frontend] No audits found for user');
        return [];
      }

      // Transform database objects to match our Audit type
      return (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name || item.model_name || '',
        model_name: item.model_name,
        model_type: item.model_type,
        description: item.description,
        file_path: item.file_path,
        audit_type: item.audit_type,
        results: item.results,
        original_filename: item.original_filename,
        status: mapStatus(item.status),
        created_at: item.created_at,
        updated_at: item.updated_at,
        completed_at: item.completed_at,
        risk_score: (item.score || item.risk_score || 0) as number,
        score: (item.score || 0) as number,
        summary: item.summary,
        audit_result: item.audit_result,
        error_message: item.error_message
      }));
    } catch (error) {
      console.error('[Frontend] Error fetching audits:', error);
      throw error;
    }
  },

  async getAuditById(id: string): Promise<Audit> {
    console.log(`[Frontend] Getting audit by ID: ${id}`);
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`[Frontend] Error fetching audit ${id}:`, error);
      throw error;
    }

    if (!data) {
      console.error(`[Frontend] Audit not found: ${id}`);
      throw new Error('Audit not found');
    }

    console.log(`[Frontend] Retrieved audit: ${id}`);

    // Transform database object to match our Audit type
    return {
      id: data.id,
      user_id: data.user_id,
      name: data.name || data.model_name || '',
      model_name: data.model_name,
      model_type: data.model_type,
      description: data.description,
      file_path: data.file_path,
      audit_type: data.audit_type,
      results: data.results,
      original_filename: data.original_filename,
      status: mapStatus(data.status),
      created_at: data.created_at,
      updated_at: data.updated_at,
      completed_at: data.completed_at,
      risk_score: (data.score || data.risk_score || 0) as number,
      score: (data.score || 0) as number,
      summary: data.summary,
      audit_result: data.audit_result,
      error_message: data.error_message
    };
  },

  async createAudit(auditData: CreateAuditData): Promise<Audit> {
    console.log(`[Frontend] Creating new audit: ${auditData.name}`);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      console.error('[Frontend] User not authenticated for audit creation');
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('audits')
      .insert({
        user_id: user.id,
        name: auditData.name,
        model_type: auditData.model_type,
        file_path: auditData.file_path,
        audit_type: auditData.audit_type,
        description: auditData.description,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('[Frontend] Error creating audit:', error);
      throw error;
    }

    console.log(`[Frontend] Successfully created audit: ${data.id}`);

    // Transform database object to match our Audit type
    return {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      model_name: data.model_name,
      model_type: data.model_type,
      description: data.description,
      file_path: data.file_path,
      audit_type: data.audit_type,
      results: data.results,
      original_filename: data.original_filename,
      status: mapStatus(data.status),
      created_at: data.created_at,
      updated_at: data.updated_at,
      completed_at: data.completed_at,
      risk_score: (data.score || data.risk_score || 0) as number,
      score: (data.score || 0) as number,
      summary: data.summary,
      audit_result: data.audit_result,
      error_message: data.error_message
    };
  },

  async updateAudit(id: string, updates: Partial<Audit>): Promise<Audit> {
    const { data, error } = await supabase
      .from('audits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Transform database object to match our Audit type
    return {
      id: data.id,
      user_id: data.user_id,
      name: data.name || data.model_name || '',
      model_name: data.model_name,
      model_type: data.model_type,
      description: data.description,
      file_path: data.file_path,
      audit_type: data.audit_type,
      results: data.results,
      original_filename: data.original_filename,
      status: mapStatus(data.status),
      created_at: data.created_at,
      updated_at: data.updated_at,
      completed_at: data.completed_at,
      risk_score: (data.score || data.risk_score || 0) as number,
      score: (data.score || 0) as number,
      summary: data.summary,
      audit_result: data.audit_result,
      error_message: data.error_message
    };
  },

  async deleteAudit(id: string): Promise<void> {
    const { error } = await supabase
      .from('audits')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  async cancelAudit(id: string): Promise<Audit> {
    const { data, error } = await supabase
      .from('audits')
      .update({
        status: 'cancelled',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Transform database object to match our Audit type
    return {
      id: data.id,
      user_id: data.user_id,
      name: data.name || data.model_name || '',
      model_name: data.model_name,
      model_type: data.model_type,
      description: data.description,
      file_path: data.file_path,
      audit_type: data.audit_type,
      results: data.results,
      original_filename: data.original_filename,
      status: mapStatus(data.status),
      created_at: data.created_at,
      updated_at: data.updated_at,
      completed_at: data.completed_at,
      risk_score: (data.score || data.risk_score || 0) as number,
      score: (data.score || 0) as number,
      summary: data.summary,
      audit_result: data.audit_result,
      error_message: data.error_message
    };
  },

  /**
   * Deletes all audits for the current user.
   * Requires authentication.
   */
  deleteAllAudits: async (): Promise<void> => {
    console.log('[Frontend] Deleting all audits for current user');
    
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      console.error('[Frontend] User not authenticated for bulk audit deletion');
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('audits')
      .delete()
      .eq('user_id', user.id);
    
    if (error) {
      console.error('[Frontend] Error deleting all audits:', error);
      throw error;
    }
    
    console.log('[Frontend] Successfully deleted all audits for user:', user.id);
  }
};

// Helper function to map database status to our AuditStatus type
function mapStatus(status: string): Audit['status'] {
  switch (status) {
    case 'processing':
      return 'in_progress';
    case 'pending':
    case 'in_progress':
    case 'completed':
    case 'error':
    case 'failed':
    case 'cancelled':
      return status as Audit['status'];
    default:
      return 'pending';
  }
}

export default auditService;
