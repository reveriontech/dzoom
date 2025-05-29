UPDATE public.room
SET deleted=b'1'
WHERE room_id='${room_id}';