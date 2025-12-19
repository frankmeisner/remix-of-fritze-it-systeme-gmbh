-- Create activity_logs table to track login events
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert their own logs
CREATE POLICY "Users can insert own activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_type ON public.activity_logs(activity_type);

-- Enable realtime for activity_logs
ALTER TABLE public.activity_logs REPLICA IDENTITY FULL;

COMMENT ON TABLE public.activity_logs IS 'Tracks user activity like logins for admin visibility';