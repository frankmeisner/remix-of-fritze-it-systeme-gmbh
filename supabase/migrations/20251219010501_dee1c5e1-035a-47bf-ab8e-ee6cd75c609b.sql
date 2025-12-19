-- Drop the insecure INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a new policy that only allows admins to insert notifications
CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));