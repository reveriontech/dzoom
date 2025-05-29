-- Ejecutar la función con los-- Ejecutar la función con los parámetros de ejemplo 
SELECT create_update_intro( 
'${roomName}', 
'${type}',
'${content|sanitizeText}',
${now}
);