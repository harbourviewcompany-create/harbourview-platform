\set ON_ERROR_STOP on
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid NOT NULL,
  role text NOT NULL,
  PRIMARY KEY (user_id, role)
);
INSERT INTO public.profiles (id,email) VALUES ('10000000-0000-0000-0000-000000000001','preserve@example.invalid');
INSERT INTO public.user_roles (user_id,role) VALUES ('10000000-0000-0000-0000-000000000001','admin');
