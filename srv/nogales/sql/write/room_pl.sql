CREATE OR REPLACE FUNCTION create_update_room(
    p_room_id character varying(40),
    p_owner character varying(40),
    p_title character varying(50),
    p_is_public bit,
    p_is_creation bit,
    p_now bigint
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    old_room_deleted bit;
    old_room_id character varying(40);
BEGIN

    -- search old room
    SELECT room.room_id, room.deleted
    INTO old_room_id, old_room_deleted
    FROM public."room" room
    WHERE room.room_id = p_room_id;

    IF p_is_creation = b'1' AND old_room_id IS NOT NULL AND old_room_deleted = b'0' THEN
        RAISE EXCEPTION 'Room already exists';
    END IF;

    IF old_room_id IS NULL THEN
        -- create room
        INSERT INTO public."room"(
        room_id, is_public, title, owner, created, updated)
        VALUES (p_room_id, p_is_public, p_title, p_owner, p_now, p_now);
    ELSE
        -- update room
        UPDATE public."room"
        SET 
        is_public=p_is_public,
        title=p_title, 
        updated=p_now,
        deleted=b'0'
        WHERE room_id=p_room_id;
    END IF;

    result := json_build_object(
        'old_room_id', old_room_id
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;