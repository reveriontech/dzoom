-- Search permission in room
SELECT
the_user.user_id as user_id,
the_user.title as title,
the_user.name as name,
the_user.middle_name as middle_name,
the_user.last_name as last_name,
--room.is_public AS is_public,
(SELECT is_public FROM public.room WHERE room_id = permission.room_id) AS is_public,
(CASE 
    WHEN permission.created IS NOT NULL THEN TRUE 
    ELSE FALSE 
END) AS permission_granted
FROM public."user" the_user
LEFT JOIN public.room_permission permission
ON the_user.user_id = permission.user_id
--LEFT JOIN public.room room
--ON room.room_id = permission.room_id
AND permission.room_id='${room_id|sanitizeText}'
$[if ${use_q}]
WHERE 
the_user.deleted = b'0' 
AND (
    LOWER(the_user.email) LIKE LOWER('%${q|sanitizeText}%') 
    OR LOWER(the_user.name) LIKE LOWER('%${q|sanitizeText}%') 
    OR LOWER(the_user.middle_name) LIKE LOWER('%${q|sanitizeText}%') 
    OR LOWER(the_user.last_name) LIKE LOWER('%${q|sanitizeText}%')
)
$[else]
WHERE 
the_user.deleted = b'0' 
$[endif]
ORDER BY the_user.${order_column|sanitizeText} ${direction|sanitizeText}
LIMIT ${limit|sanitizeNumber}
OFFSET ${offset|sanitizeNumber};