-- Migration: add secure sharing to itineraries

ALTER TABLE public.itineraries 
ADD COLUMN share_enabled boolean DEFAULT false,
ADD COLUMN share_token uuid UNIQUE DEFAULT NULL;

-- Create an index to quickly lookup itineraries by share_token
CREATE INDEX idx_itineraries_share_token ON public.itineraries(share_token);
