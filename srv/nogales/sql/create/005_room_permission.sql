-- Table: public.room_permission

-- DROP TABLE IF EXISTS public.room_permission;

CREATE TABLE IF NOT EXISTS public.room_permission
(
    user_id character varying(70) COLLATE pg_catalog."default" NOT NULL,
    room_id character varying(40) COLLATE pg_catalog."default" NOT NULL,
    created bigint NOT NULL,
    CONSTRAINT room_permission_room_fk FOREIGN KEY (room_id)
        REFERENCES public.room (room_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT room_permission_user_fk FOREIGN KEY (user_id)
        REFERENCES public."user" (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.room_permission
    OWNER to postgres;