-- Table: public.room_intro

-- DROP TABLE IF EXISTS public.room_intro;

CREATE TABLE IF NOT EXISTS public.room_intro
(
    room_intro_id uuid NOT NULL DEFAULT uuid_generate_v4(),
    type character varying(16) COLLATE pg_catalog."default" NOT NULL,
    room_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    content text COLLATE pg_catalog."default" NOT NULL,
    created bigint NOT NULL,
    updated bigint NOT NULL,
    CONSTRAINT room_intro_pkey PRIMARY KEY (room_intro_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.room_intro
    OWNER to postgres;