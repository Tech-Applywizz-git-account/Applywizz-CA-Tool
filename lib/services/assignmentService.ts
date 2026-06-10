import { SupabaseClient } from '@supabase/supabase-js';

export interface CACandidate {
  ca_id: string;
  name: string;
  email: string;
  designation: string;
  system_name: string | null;
  team_name: string | null;
  min_capacity: number;
  max_capacity: number;
  weighted_active_load: number;
  pending_assignments: number;
  effective_load: number;
  available_capacity: number;
  deficit_to_min: number;
  utilization_percentage: number;
  productivity_average: number;
}

export interface ClientAssignment {
  id: string;
  applywizz_id: string;
  suggested_ca_email: string;
  final_ca_email: string | null;
  recommendation_accepted: boolean | null;
  status: 'PENDING' | 'APPROVED' | 'REASSIGNED';
  created_at: string;
  updated_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  remarks: string | null;
}

export interface CapacityDashboardRow {
  ca_id: string;
  name: string;
  email: string;
  designation: string;
  system_name: string | null;
  team_name: string | null;
  min_capacity: number;
  max_capacity: number;
  weighted_active_load: number;
  pending_assignments: number;
  effective_load: number;
  available_capacity: number;
  deficit_to_min: number;
  utilization_percentage: number;
  productivity_average: number;
}

export interface TeamEntry {
  id: string;
  name: string;
}

/**
 * Load all candidates from the database view.
 */
export async function getAssignmentCandidates(supabase: SupabaseClient): Promise<CACandidate[]> {
  const { data, error } = await supabase
    .from('ca_assignment_candidates')
    .select('*');

  if (error) {
    console.error('[AssignmentService] Error loading candidates:', error);
    throw new Error(`Failed to load candidates: ${error.message}`);
  }

  return (data || []) as CACandidate[];
}

/**
 * Get the current metrics of a specific CA by email from the dashboard view.
 */
export async function getCADashboardRowByEmail(supabase: SupabaseClient, email: string): Promise<CapacityDashboardRow | null> {
  const { data, error } = await supabase
    .from('ca_capacity_dashboard')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error(`[AssignmentService] Error loading dashboard row for email ${email}:`, error);
    throw new Error(`Failed to fetch dashboard metrics for CA: ${error.message}`);
  }

  return data as CapacityDashboardRow | null;
}

/**
 * Core business logic: Suggest the best CA based on current load, min capacity, utilization, and productivity.
 */
export function calculateBestCA(candidates: CACandidate[], applywizzId: string): CACandidate {
  if (candidates.length === 0) {
    throw new Error('No assignable CAs found (all at max capacity or no CAs exist).');
  }

  console.log(`[AssignmentService] Running assignment logic for client ${applywizzId}. Candidate count: ${candidates.length}`);

  // Priority 1: CAs with effective_load < min_capacity
  const underMin = candidates.filter(ca => ca.effective_load < ca.min_capacity);

  if (underMin.length > 0) {
    console.log(`[AssignmentService] Found ${underMin.length} CAs under minimum capacity:`, 
      underMin.map(ca => `${ca.email} (load: ${ca.effective_load}/${ca.min_capacity})`).join(', ')
    );

    // Calculate deficits and sort
    // Deficit = min_capacity - effective_load
    // Select highest deficit.
    const sortedUnderMin = [...underMin].sort((a, b) => {
      const deficitA = a.min_capacity - a.effective_load;
      const deficitB = b.min_capacity - b.effective_load;

      if (deficitB !== deficitA) {
        return deficitB - deficitA; // Descending deficit (highest deficit first)
      }

      // Tie breaker 1: lowest utilization percentage
      if (a.utilization_percentage !== b.utilization_percentage) {
        return a.utilization_percentage - b.utilization_percentage;
      }

      // Tie breaker 2: lowest productivity average
      if (a.productivity_average !== b.productivity_average) {
        return a.productivity_average - b.productivity_average;
      }

      // Final fallback tie-breaker to ensure deterministic selection
      return a.ca_id.localeCompare(b.ca_id);
    });

    const selected = sortedUnderMin[0];
    const deficit = selected.min_capacity - selected.effective_load;
    console.log(`[AssignmentService] Selected under-capacity CA ${selected.email} (Deficit: ${deficit.toFixed(2)}, Utilization: ${selected.utilization_percentage}%, Productivity: ${selected.productivity_average})`);
    return selected;
  }

  // If all min capacities are satisfied, select based on lowest utilization percentage
  console.log('[AssignmentService] All candidates satisfy minimum capacities. Sorting by utilization percentage...');

  const sortedByUtilization = [...candidates].sort((a, b) => {
    // Priority: Lowest utilization_percentage
    if (a.utilization_percentage !== b.utilization_percentage) {
      return a.utilization_percentage - b.utilization_percentage;
    }

    // Tie breaker: Lowest productivity_average
    if (a.productivity_average !== b.productivity_average) {
      return a.productivity_average - b.productivity_average;
    }

    // Final fallback tie-breaker to ensure deterministic selection
    return a.ca_id.localeCompare(b.ca_id);
  });

  const selected = sortedByUtilization[0];
  console.log(`[AssignmentService] Selected CA ${selected.email} by lowest utilization (Utilization: ${selected.utilization_percentage}%, Productivity: ${selected.productivity_average})`);
  return selected;
}

/**
 * Suggest best CA: Check existing, load candidates, apply logic, save, return.
 */
export async function suggestBestCA(supabase: SupabaseClient, applywizzId: string): Promise<ClientAssignment> {
  const normalizedId = applywizzId.trim().toUpperCase();

  // Step 1: Check whether this ApplyWizz ID already exists in queue
  const { data: existing, error: findError } = await supabase
    .from('client_assignment_queue')
    .select('*')
    .eq('applywizz_id', normalizedId)
    .maybeSingle();

  if (findError) {
    console.error(`[AssignmentService] Find existing recommendation error for ${normalizedId}:`, findError);
    throw new Error(`Failed to check existing recommendation: ${findError.message}`);
  }

  if (existing) {
    console.log(`[AssignmentService] Recommendation already exists for ${normalizedId}. Returning stored suggestion for CA: ${existing.suggested_ca_email}`);
    return existing as ClientAssignment;
  }

  // Look up client by applywizz_id to retrieve the UUID client_id
  const { data: clientRow, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('applywizz_id', normalizedId)
    .maybeSingle();

  if (clientError) {
    console.error(`[AssignmentService] Client lookup error for ${normalizedId}:`, clientError);
    throw new Error(`Failed to look up client: ${clientError.message}`);
  }

  if (!clientRow) {
    throw new Error(`Client with ApplyWizz ID '${normalizedId}' does not exist in the clients table.`);
  }

  // Step 2: Load candidates
  const candidates = await getAssignmentCandidates(supabase);

  // Step 3-5: Calculate best CA
  const selectedCA = calculateBestCA(candidates, normalizedId);

  // Step 6: Insert recommendation with client_id link and suggested_ca_id link
  const { data: inserted, error: insertError } = await supabase
    .from('client_assignment_queue')
    .insert([
      {
        client_id: clientRow.id,
        suggested_ca_id: selectedCA.ca_id,
        applywizz_id: normalizedId,
        suggested_ca_email: selectedCA.email,
        status: 'PENDING'
      }
    ])
    .select('*')
    .single();

  if (insertError) {
    // Safe handling for concurrent/duplicate writes
    if (insertError.code === '23505') {
      console.log(`[AssignmentService] Concurrent insert collision for ${normalizedId}. Retrying lookup.`);
      const { data: reLookup } = await supabase
        .from('client_assignment_queue')
        .select('*')
        .eq('applywizz_id', normalizedId)
        .single();
      if (reLookup) {
        return reLookup as ClientAssignment;
      }
    }
    console.error(`[AssignmentService] Insert recommendation error for ${normalizedId}:`, insertError);
    throw new Error(`Failed to store recommendation: ${insertError.message}`);
  }

  console.log(`[AssignmentService] Stored pending recommendation for ${normalizedId} -> ${selectedCA.email}`);
  return inserted as ClientAssignment;
}

/**
 * Approve or reassign: find recommendation, check match, update, return status.
 */
export async function approveOrReassignCA(
  supabase: SupabaseClient, 
  applywizzId: string, 
  caEmail: string,
  reviewedBy?: string,
  remarks?: string
): Promise<ClientAssignment> {
  const normalizedId = applywizzId.trim().toUpperCase();
  const targetEmail = caEmail.trim().toLowerCase();

  // Find assignment record
  const { data: assignment, error: findError } = await supabase
    .from('client_assignment_queue')
    .select('*')
    .eq('applywizz_id', normalizedId)
    .maybeSingle();

  if (findError) {
    console.error(`[AssignmentService] Error locating assignment for approve/reassign on ${normalizedId}:`, findError);
    throw new Error(`Failed to query assignment queue: ${findError.message}`);
  }

  if (!assignment) {
    throw new Error(`Assignment record not found for ApplyWizz ID: ${normalizedId}`);
  }

  const isMatch = assignment.suggested_ca_email.trim().toLowerCase() === targetEmail;
  const status = isMatch ? 'APPROVED' : 'REASSIGNED';
  const recommendationAccepted = isMatch;
  const nowStr = new Date().toISOString();

  // Update record
  const updates: Partial<ClientAssignment> = {
    status,
    final_ca_email: targetEmail,
    recommendation_accepted: recommendationAccepted,
    reviewed_at: nowStr,
    updated_at: nowStr
  };

  if (reviewedBy) {
    updates.reviewed_by = reviewedBy;
  }
  if (remarks !== undefined) {
    updates.remarks = remarks;
  }

  const { data: updated, error: updateError } = await supabase
    .from('client_assignment_queue')
    .update(updates)
    .eq('applywizz_id', normalizedId)
    .select('*')
    .single();

  if (updateError) {
    console.error(`[AssignmentService] Error updating assignment status for ${normalizedId}:`, updateError);
    throw new Error(`Failed to update assignment: ${updateError.message}`);
  }

  console.log(`[AssignmentService] Assignment ${normalizedId} updated. Status: ${status}, CA Email: ${targetEmail}`);
  return updated as ClientAssignment;
}

/**
 * Get current recommendation state.
 */
export async function getAssignmentByApplyWizzId(supabase: SupabaseClient, applywizzId: string): Promise<ClientAssignment | null> {
  const normalizedId = applywizzId.trim().toUpperCase();
  const { data, error } = await supabase
    .from('client_assignment_queue')
    .select('*')
    .eq('applywizz_id', normalizedId)
    .maybeSingle();

  if (error) {
    console.error(`[AssignmentService] Error getting assignment by id ${normalizedId}:`, error);
    throw new Error(`Failed to fetch assignment details: ${error.message}`);
  }

  return data as ClientAssignment | null;
}

/**
 * Get dashboard capacity records with optional sorting.
 */
export async function getCapacityDashboard(
  supabase: SupabaseClient,
  sortBy?: string,
  order: 'asc' | 'desc' = 'asc'
): Promise<CapacityDashboardRow[]> {
  let query = supabase.from('ca_capacity_dashboard').select('*');

  if (sortBy) {
    // Validate sort columns to prevent SQL injection or bad queries
    const validColumns = ['utilization_percentage', 'effective_load', 'available_capacity', 'name', 'email', 'designation'];
    if (validColumns.includes(sortBy)) {
      query = query.order(sortBy, { ascending: order === 'asc' });
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('[AssignmentService] Error fetching dashboard capacity:', error);
    throw new Error(`Failed to retrieve capacity dashboard: ${error.message}`);
  }

  return (data || []) as CapacityDashboardRow[];
}

/**
 * Get all teams from the teams table for filter dropdowns.
 */
export async function getTeamsList(supabase: SupabaseClient): Promise<TeamEntry[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('[AssignmentService] Error fetching teams:', error);
    throw new Error(`Failed to fetch teams: ${error.message}`);
  }

  return (data || []) as TeamEntry[];
}
