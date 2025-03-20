import { supabase } from '../utils/supabase';

// Define finding status type
export type FindingStatus = 'open' | 'in_progress' | 'resolved' | 'ignored';

// Define the interface for a finding status
export interface FindingStatusRecord {
  id?: string;
  audit_id: string;
  finding_id: string;
  status: FindingStatus;
  created_at?: string;
  updated_at?: string;
}

const findingService = {
  /**
   * Get all status records for a specific audit
   */
  async getFindingStatuses(auditId: string): Promise<Record<string, FindingStatus>> {
    console.log(`[Frontend] Getting finding statuses for audit: ${auditId}`);
    
    // Use any type to avoid TypeScript errors with custom tables
    const { data, error } = await supabase
      .from('finding_statuses')
      .select('*')
      .eq('audit_id', auditId) as any;

    if (error) {
      console.error(`[Frontend] Error fetching finding statuses: ${error.message}`);
      throw error;
    }

    // Convert array of status records to an object mapping findingId -> status
    const statusMap: Record<string, FindingStatus> = {};
    
    if (data) {
      data.forEach((record: any) => {
        statusMap[record.finding_id] = record.status as FindingStatus;
      });
    }
    
    console.log(`[Frontend] Retrieved ${data?.length || 0} finding statuses`);
    return statusMap;
  },

  /**
   * Update or create a status record for a finding
   */
  async updateFindingStatus(auditId: string, findingId: string, status: FindingStatus): Promise<void> {
    console.log(`[Frontend] Updating finding status: ${findingId} to ${status}`);
    
    // First check if a record already exists
    const { data: existingRecord, error: fetchError } = await supabase
      .from('finding_statuses')
      .select('*')
      .eq('audit_id', auditId)
      .eq('finding_id', findingId)
      .maybeSingle() as any;
    
    if (fetchError) {
      console.error(`[Frontend] Error checking existing status: ${fetchError.message}`);
      throw fetchError;
    }

    // If record exists, update it
    if (existingRecord) {
      const { error: updateError } = await supabase
        .from('finding_statuses')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id) as any;
      
      if (updateError) {
        console.error(`[Frontend] Error updating finding status: ${updateError.message}`);
        throw updateError;
      }
    } 
    // Otherwise create a new record
    else {
      const { error: insertError } = await supabase
        .from('finding_statuses')
        .insert({
          audit_id: auditId,
          finding_id: findingId,
          status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }) as any;
      
      if (insertError) {
        console.error(`[Frontend] Error creating finding status: ${insertError.message}`);
        throw insertError;
      }
    }

    console.log(`[Frontend] Successfully updated finding status for ${findingId}`);
  },

  /**
   * Bulk update or create status records for multiple findings
   */
  async bulkUpdateFindingStatuses(
    auditId: string, 
    statuses: Record<string, FindingStatus>
  ): Promise<void> {
    console.log(`[Frontend] Bulk updating ${Object.keys(statuses).length} finding statuses`);
    
    const records = Object.entries(statuses).map(([findingId, status]) => ({
      audit_id: auditId,
      finding_id: findingId,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // Use upsert to handle both insert and update cases
    const { error } = await supabase
      .from('finding_statuses')
      .upsert(records, { 
        onConflict: 'audit_id,finding_id',
        ignoreDuplicates: false 
      }) as any;
    
    if (error) {
      console.error(`[Frontend] Error bulk updating finding statuses: ${error.message}`);
      throw error;
    }
    
    console.log(`[Frontend] Successfully bulk updated finding statuses`);
  }
};

export default findingService; 