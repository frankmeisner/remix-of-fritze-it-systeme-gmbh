export type AppRole = 'admin' | 'employee';

export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'sms_requested' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TimeEntryType = 'check_in' | 'check_out' | 'pause_start' | 'pause_end';

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  message: string;
  is_group_message: boolean;
  created_at: string;
  read_at: string | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  customer_name: string;
  customer_phone: string | null;
  deadline: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  special_compensation: number | null;
  notes: string | null;
  test_email: string | null;
  test_password: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
  assigned_at: string;
  accepted_at: string | null;
  status: string;
  progress_notes: string | null;
  task?: Task;
  profile?: Profile;
}

export interface Document {
  id: string;
  user_id: string;
  task_id: string | null;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  document_type: string;
  uploaded_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  entry_type: TimeEntryType;
  timestamp: string;
  notes: string | null;
}

export interface VacationRequest {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  profile?: Profile;
}

export interface SmsCodeRequest {
  id: string;
  task_id: string;
  user_id: string;
  requested_at: string;
  sms_code: string | null;
  forwarded_at: string | null;
  forwarded_by: string | null;
  status: string;
  task?: Task;
  profile?: Profile;
}
