-- 
SELECT create_update_user_detail( 
    '${user_id|sanitizeText}',
    '${job_title|sanitizeText}',
    ${now}
);