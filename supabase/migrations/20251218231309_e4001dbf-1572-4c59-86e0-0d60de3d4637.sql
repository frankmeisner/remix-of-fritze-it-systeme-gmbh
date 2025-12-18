-- Fix RLS policies on tasks table to use PERMISSIVE policies correctly
-- Currently all policies are RESTRICTIVE which may cause access issues

-- Drop existing policies on tasks
DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Employees can view assigned tasks" ON public.tasks;

-- Create PERMISSIVE policies (default behavior)
-- Admins can do everything with tasks
CREATE POLICY "Admins can manage all tasks" 
ON public.tasks 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Employees can ONLY view tasks they are assigned to (not all tasks)
-- This is the key security fix - uses EXISTS to check assignment table
CREATE POLICY "Employees can only view their assigned tasks" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (
  -- Employee must have an assignment for this specific task
  EXISTS (
    SELECT 1 
    FROM public.task_assignments 
    WHERE task_assignments.task_id = tasks.id 
    AND task_assignments.user_id = auth.uid()
  )
);