SELECT 
user_id as "userId",
created,
updated,
email,
title,
name,
middle_name as "middleName",
last_name as "lastName"
FROM public."user"
WHERE user_id='${user_id|sanitizeText}';