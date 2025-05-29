SELECT 
user_detail_id as "userId",
created,
updated,
job_title as "jobTitle"
FROM public."user_detail"
WHERE user_detail_id='${user_id|sanitizeText}';