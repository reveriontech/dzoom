SELECT
room_id,
owner,
title,
is_public,
created,
updated
FROM public.room
$[if ${use_q}]
WHERE is_public = b'1' 
AND deleted = b'0' 
AND (
    room_id LIKE '%${q|sanitizeText}%' 
    OR owner LIKE '%${q|sanitizeText}%' 
    OR LOWER(title) LIKE LOWER('%${q|sanitizeText}%')
    )
$[else]
WHERE is_public = b'1' AND deleted = b'0'
$[endif]
ORDER BY ${order_column|sanitizeText} ${direction|sanitizeText}
LIMIT ${limit|sanitizeNumber}
OFFSET ${offset|sanitizeNumber};