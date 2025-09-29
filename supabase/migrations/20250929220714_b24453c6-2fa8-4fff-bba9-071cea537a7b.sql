-- Create table for export history
CREATE TABLE IF NOT EXISTS public.export_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  filters JSONB,
  record_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all export history
CREATE POLICY "Admins can view all export history"
ON public.export_history
FOR SELECT
USING (get_current_user_role() IN ('admin', 'desenvolvedor'));

-- System can insert export history
CREATE POLICY "System can insert export history"
ON public.export_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_export_history_created_at ON public.export_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON public.export_history (user_id);
CREATE INDEX IF NOT EXISTS idx_export_history_table_name ON public.export_history (table_name);

-- Add audit trigger
DROP TRIGGER IF EXISTS audit_export_history_changes ON public.export_history;
CREATE TRIGGER audit_export_history_changes
AFTER INSERT OR UPDATE OR DELETE ON public.export_history
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();