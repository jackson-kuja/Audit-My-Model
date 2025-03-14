import supabase from '../utils/supabase';

// Service for interacting with audits in Supabase
export const auditService = {
  // Get audits for the current user with pagination
  getAudits: async (page = 1, perPage = 10) => {
    try {
      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No authenticated user');
      
      // Calculate pagination
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      
      // Get audits for the current user
      const { data, error, count } = await supabase
        .from('audits')
        .select('*', { count: 'exact' })
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      const totalPages = Math.ceil(count / perPage);
      
      return { 
        audits: data || [], 
        pages: totalPages || 1 
      };
    } catch (error) {
      console.error('Error fetching audits:', error);
      throw error;
    }
  },
  
  // Get a single audit by ID
  getAuditById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching audit with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Create a new audit
  createAudit: async (auditData) => {
    try {
      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No authenticated user');
      
      // Add user_id to the audit data
      const newAudit = {
        ...auditData,
        user_id: session.user.id,
        created_at: new Date(),
        updated_at: new Date(),
        status: 'pending' // Initial status
      };
      
      const { data, error } = await supabase
        .from('audits')
        .insert([newAudit])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error creating audit:', error);
      throw error;
    }
  },
  
  // Update an existing audit
  updateAudit: async (id, updateData) => {
    try {
      const { data, error } = await supabase
        .from('audits')
        .update({
          ...updateData,
          updated_at: new Date()
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error(`Error updating audit with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Delete an audit by ID
  deleteAudit: async (id) => {
    try {
      const { error } = await supabase
        .from('audits')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error(`Error deleting audit with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Cancel an in-progress or pending audit
  cancelAudit: async (id) => {
    try {
      const { data, error } = await supabase
        .from('audits')
        .update({
          status: 'error',
          updated_at: new Date()
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error(`Error cancelling audit with ID ${id}:`, error);
      throw error;
    }
  }
};
