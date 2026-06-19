-- deal_rooms + deal_room_messages: private deal negotiation rooms
CREATE TABLE IF NOT EXISTS public.deal_rooms (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text        NOT NULL,
  listing_ref      text,
  initiator_id     uuid        REFERENCES auth.users(id),
  counterparty_id  uuid        REFERENCES auth.users(id),
  status           text        NOT NULL DEFAULT 'active',
  nda_required     boolean     NOT NULL DEFAULT false,
  nda_accepted_by  uuid[],
  access_token     text        UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_rooms_initiator    ON public.deal_rooms (initiator_id);
CREATE INDEX idx_deal_rooms_counterparty ON public.deal_rooms (counterparty_id);

ALTER TABLE public.deal_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY deal_room_participants_select ON public.deal_rooms
  FOR SELECT USING (auth.uid() = initiator_id OR auth.uid() = counterparty_id);

CREATE POLICY deal_room_initiator_insert ON public.deal_rooms
  FOR INSERT WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY deal_room_participants_update ON public.deal_rooms
  FOR UPDATE USING (auth.uid() = initiator_id OR auth.uid() = counterparty_id);

CREATE POLICY service_write_deal_rooms ON public.deal_rooms
  FOR ALL USING (auth.role() = 'service_role');

-- Deal room messages
CREATE TABLE IF NOT EXISTS public.deal_room_messages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      uuid        NOT NULL REFERENCES public.deal_rooms(id) ON DELETE CASCADE,
  sender_id    uuid        REFERENCES auth.users(id),
  message_type text        NOT NULL DEFAULT 'text',
  body         text        NOT NULL,
  attachments  jsonb       NOT NULL DEFAULT '[]',
  read_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_room_messages_room ON public.deal_room_messages (room_id, created_at);

ALTER TABLE public.deal_room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY deal_room_messages_participants_select ON public.deal_room_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deal_rooms dr
      WHERE dr.id = deal_room_messages.room_id
        AND (dr.initiator_id = auth.uid() OR dr.counterparty_id = auth.uid())
    )
  );

CREATE POLICY deal_room_messages_participants_insert ON public.deal_room_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM deal_rooms dr
      WHERE dr.id = deal_room_messages.room_id
        AND (dr.initiator_id = auth.uid() OR dr.counterparty_id = auth.uid())
    )
  );

CREATE POLICY service_write_deal_room_messages ON public.deal_room_messages
  FOR ALL USING (auth.role() = 'service_role');
