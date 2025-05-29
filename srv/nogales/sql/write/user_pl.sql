CREATE OR REPLACE FUNCTION create_update_user(
    p_user_id character varying(40),
    p_title character varying(5),
    p_name character varying(50),
    p_middle_name character varying(50),
    p_last_name character varying(50),
    p_now bigint
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    old_user_id character varying(40);
BEGIN

    -- search old user
    SELECT this_user.user_id
    INTO old_user_id
    FROM public."user" this_user
    WHERE this_user.user_id = p_user_id;

    IF old_user_id IS NULL THEN
        -- create user
        INSERT INTO public."user"(
        user_id, email, title, name, middle_name, last_name, created, updated)
        VALUES (p_user_id, p_user_id, p_title, p_name, p_middle_name, p_last_name, p_now, p_now);
    ELSE
        -- update user
        UPDATE public."user"
        SET 
        title=p_title, 
        name=p_name, 
        middle_name=p_middle_name, 
        last_name=p_last_name,
        updated=p_now
        WHERE user_id=p_user_id;
    END IF;

    result := json_build_object(
        'old_user_id', old_user_id
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;


