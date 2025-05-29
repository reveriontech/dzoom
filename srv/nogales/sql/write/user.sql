-- 
SELECT create_update_user( 
    '${user_id|sanitizeText}',
    '${title|sanitizeText}',
    '${name|sanitizeText}',
    '${middle_name|sanitizeText}',
    '${last_name|sanitizeText}',
    ${now}
);