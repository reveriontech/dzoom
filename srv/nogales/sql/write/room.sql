-- Create or update room
SELECT create_update_room( 
    '${room_id|sanitizeText}',
    '${owner|sanitizeText}',
    '${title|sanitizeText}',
    b'${is_public|sanitizeNumber}',
    b'${is_creation|sanitizeNumber}',
    ${now|sanitizeNumber}
);