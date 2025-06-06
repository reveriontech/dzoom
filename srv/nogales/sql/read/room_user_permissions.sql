SELECT r.room_id, r.title AS room_name, r.is_public
FROM public.room r
JOIN public.room_permission rp ON rp.room_id = r.room_id
WHERE rp.user_id = LOWER('${user_id|sanitizeText}');