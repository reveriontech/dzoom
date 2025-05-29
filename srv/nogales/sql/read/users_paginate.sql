SELECT
user_id,
email,
title,
name,
middle_name,
last_name,
created,
updated
FROM public."user"
$[if ${use_q}]
WHERE deleted = b'0' AND (email LIKE '%${q|sanitizeText}%' OR name LIKE '%${q|sanitizeText}%' OR middle_name LIKE '%${q|sanitizeText}%' OR last_name LIKE '%${q|sanitizeText}%')
$[else]
WHERE deleted = b'0'
$[endif]
ORDER BY ${order_column|sanitizeText} ${direction|sanitizeText}
LIMIT ${limit|sanitizeNumber}
OFFSET ${offset|sanitizeNumber};