CREATE OR REPLACE FUNCTION create_update_intro(
    p_room_name character varying(100),
    p_type character varying(16),
    p_content text,
    p_now bigint 
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    old_room_intro_id UUID;
BEGIN
    -- Validación de parámetros
    IF p_room_name IS NULL OR p_type IS NULL THEN
        RAISE EXCEPTION 'Parameters cannot be NULL';
    END IF;

    -- Obtener el id del patient_answer asociado a la respuesta anterior
    SELECT room_intro.room_intro_id
    INTO old_room_intro_id
    FROM room_intro
    WHERE room_intro.room_name = p_room_name
    AND room_intro.type = p_type;

    IF old_room_intro_id IS NULL THEN
        -- Insertar una nueva respuesta del paciente
        INSERT INTO room_intro (room_name, type, content, created, updated)
        VALUES (p_room_name, p_type, p_content, p_now, p_now);
    ELSE
        -- Actualizar la respuesta existente del paciente
        UPDATE room_intro
        SET 
        content = p_content, 
        updated = p_now
        WHERE room_intro_id = old_room_intro_id;
    END IF;

    result := json_build_object(
        'old_room_intro_id', old_room_intro_id
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;