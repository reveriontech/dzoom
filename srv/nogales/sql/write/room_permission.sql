-- Grant or deny permission
SELECT user_room_permission_update( 
    '${room_id|sanitizeText}',
    '${user_id|sanitizeText}',
    b'${grant|sanitizeNumber}',
    ${now|sanitizeNumber}
);