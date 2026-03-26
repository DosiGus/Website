-- =============================================================================
-- Migration: conversations — channel-agnostische Sender-ID
-- Datum: 2026-03-26
-- Zweck: instagram_sender_id nullable machen und durch channel_sender_id ersetzen
--        als primären Lookup-Key — ermöglicht WhatsApp/Facebook-Erweiterung.
-- =============================================================================
-- REIHENFOLGE:
-- 1. Backfill channel_sender_id für ältere Zeilen (falls noch nicht gesetzt)
-- 2. Alten Unique-Index auf instagram_sender_id droppen
-- 3. NOT NULL Constraint von instagram_sender_id entfernen
-- 4. Neuen Unique-Index auf (integration_id, channel, channel_sender_id) anlegen
-- =============================================================================

-- 1. Backfill: channel_sender_id = instagram_sender_id für alle Zeilen wo noch leer
UPDATE public.conversations
SET channel_sender_id = instagram_sender_id
WHERE channel_sender_id IS NULL
  AND instagram_sender_id IS NOT NULL;

-- 2. Alten Unique-Index droppen (war auf instagram_sender_id — blockiert Nicht-Instagram-Channels)
DROP INDEX IF EXISTS public.conversations_integration_sender_idx;

-- 3. NOT NULL Constraint entfernen — instagram_sender_id wird für Instagram weiterhin befüllt,
--    aber für andere Channels (WhatsApp, Facebook) leer gelassen
ALTER TABLE public.conversations
  ALTER COLUMN instagram_sender_id DROP NOT NULL;

-- 4. Neuen channel-agnostischen Unique-Index anlegen
--    WHERE channel_sender_id IS NOT NULL: verhindert dass mehrere NULL-Rows als eindeutig gelten
CREATE UNIQUE INDEX IF NOT EXISTS conversations_integration_channel_sender_idx
  ON public.conversations(integration_id, channel, channel_sender_id)
  WHERE channel_sender_id IS NOT NULL;

-- Verifikation (optional — kann nach Ausführung geprüft werden):
-- SELECT COUNT(*) FROM conversations WHERE channel_sender_id IS NULL; -- sollte 0 sein
-- SELECT COUNT(*) FROM conversations WHERE instagram_sender_id IS NULL; -- sollte 0 sein (erstmal)
