export type HvVerificationQueuePrivateDto = {
  id: string;
  airtable_record_id: string;
  destination_table: string;
  destination_record_id: string | null;
  queue_status: string;
  review_notes_private: string | null;
  operator_comments: string | null;
  sensitivity: 'internal' | 'confidential' | 'restricted';
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type HvEvidenceItemPrivateDto = {
  id: string;
  airtable_record_id: string;
  source_id: string | null;
  claim_table: string | null;
  claim_record_id: string | null;
  evidence_type: string | null;
  evidence_url: string | null;
  evidence_title: string | null;
  evidence_notes_private: string | null;
  verification_status: string;
  review_status: string;
  public_summary: string | null;
  public_visibility: boolean;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  created_at: string;
  updated_at: string;
};
