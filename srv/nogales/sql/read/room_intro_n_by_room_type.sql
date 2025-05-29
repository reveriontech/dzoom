select *
from room_intro
where
room_name IN ('${roomName}')
and type='${type}';