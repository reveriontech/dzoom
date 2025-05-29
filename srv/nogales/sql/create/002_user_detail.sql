-- Table: public.user_detail

-- DROP TABLE IF EXISTS public.user_detail;

CREATE TABLE IF NOT EXISTS public.user_detail
(
    user_detail_id character varying(70) COLLATE pg_catalog."default" NOT NULL,
    job_title character varying(50) COLLATE pg_catalog."default",
    created bigint NOT NULL,
    updated bigint NOT NULL,
    CONSTRAINT user_detail_pkey PRIMARY KEY (user_detail_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.user_detail
    OWNER to postgres;