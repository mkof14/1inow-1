
CREATE TABLE public.ai_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  reminder_time timestamptz NOT NULL,
  related_object_type text,
  related_object_id uuid,
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_reminders TO authenticated;
GRANT ALL ON public.ai_reminders TO service_role;

ALTER TABLE public.ai_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reminders" ON public.ai_reminders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_ai_reminders_updated_at
  BEFORE UPDATE ON public.ai_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ai_reminders_user_time ON public.ai_reminders(user_id, reminder_time);
CREATE INDEX idx_ai_reminders_status ON public.ai_reminders(status) WHERE status = 'pending';
