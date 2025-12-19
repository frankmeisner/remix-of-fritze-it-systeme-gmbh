-- Create a security definer function to notify admins when a task is completed
CREATE OR REPLACE FUNCTION public.notify_admins_task_completed(
  _task_id UUID,
  _task_title TEXT,
  _employee_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Loop through all admins and create notifications
  FOR admin_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, related_task_id, related_user_id)
    VALUES (
      admin_id,
      'Auftrag abgeschlossen',
      _employee_name || ' hat den Auftrag "' || _task_title || '" abgegeben.',
      'task_completed',
      _task_id,
      auth.uid()
    );
  END LOOP;
END;
$$;