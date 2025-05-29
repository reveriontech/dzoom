-- Table: public.user

-- DROP TABLE IF EXISTS public."user";

CREATE TABLE IF NOT EXISTS public."user"
(
    user_id character varying(70) COLLATE pg_catalog."default" NOT NULL,
    created bigint NOT NULL,
    updated bigint NOT NULL,
    email character varying(70) COLLATE pg_catalog."default",
    title character varying(5) COLLATE pg_catalog."default",
    name character varying(100) COLLATE pg_catalog."default",
    middle_name character varying(100) COLLATE pg_catalog."default",
    last_name character varying(100) COLLATE pg_catalog."default",
    deleted bit(1) NOT NULL DEFAULT '0'::"bit",
    CONSTRAINT user_pkey PRIMARY KEY (user_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."user"
    OWNER to postgres;