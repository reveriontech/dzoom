CREATE OR REPLACE FUNCTION user_room_permission_update(
    p_room_id character varying(40),
    p_user_id character varying(40),
    p_grant bit,
    p_now bigint
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    old_room_permission_created bigint;
BEGIN

    -- search old permission
    SELECT room_permission.created
    INTO old_room_permission_created
    FROM public."room_permission" room_permission
    WHERE room_permission.room_id = p_room_id 
    AND room_permission.user_id = p_user_id;

    IF old_room_permission_created IS NULL AND p_grant = b'1' THEN
        -- create permission
        INSERT INTO public."room_permission"(
        room_id, user_id, created)
        VALUES (p_room_id, p_user_id, p_now);
    END IF;

    IF old_room_permission_created IS NOT NULL AND p_grant = b'0' THEN
        -- delete permission
        DELETE FROM public."room_permission"
        WHERE room_permission.room_id = p_room_id 
        AND room_permission.user_id = p_user_id;
    END IF;

    result := json_build_object(
        'old_room_permission_created', old_room_permission_created
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;