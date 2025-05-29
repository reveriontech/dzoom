-- Table: public.room

-- DROP TABLE IF EXISTS public.room;

CREATE TABLE IF NOT EXISTS public.room
(
    room_id character varying(40) COLLATE pg_catalog."default" NOT NULL,
    created bigint NOT NULL,
    updated bigint NOT NULL,
    is_public bit(1),
    title character varying(50) COLLATE pg_catalog."default",
    owner character varying(70) COLLATE pg_catalog."default" NOT NULL,
    deleted bit(1) NOT NULL DEFAULT '0'::"bit",
    CONSTRAINT room_pkey PRIMARY KEY (room_id),
    CONSTRAINT room_user_fk FOREIGN KEY (owner)
        REFERENCES public."user" (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.room
    OWNER to postgres;