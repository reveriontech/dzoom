CREATE OR REPLACE FUNCTION create_update_user_detail(
    p_user_detail_id character varying(40),
    p_job_title character varying(50),
    p_now bigint
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    old_user_detail_id character varying(40);
BEGIN

    -- search old user_detail
    SELECT user_detail_id
    INTO old_user_detail_id
    FROM public."user_detail"
    WHERE user_detail_id = p_user_detail_id;

    IF old_user_detail_id IS NULL THEN
        -- create user_detail
        INSERT INTO public."user_detail"(
        user_detail_id, job_title, created, updated)
        VALUES (p_user_detail_id, p_job_title, p_now, p_now);
    ELSE
        -- update user_detail
        UPDATE public."user_detail"
        SET 
        job_title=p_job_title, 
        updated=p_now
        WHERE user_detail_id=p_user_detail_id;
    END IF;

    result := json_build_object(
        'old_user_detail_id', old_user_detail_id
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;


