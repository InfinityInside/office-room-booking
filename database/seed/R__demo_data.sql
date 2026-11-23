-- Demo data for LOCAL DEVELOPMENT ONLY. Never applied in tests or production.
-- A repeatable migration: Flyway re-runs it whenever this file changes,
-- so it first wipes every table, then inserts the demo data fresh.
--
-- Demo accounts, all with the password: demo-password
--   anna@office.test  (Admin)
--   tom@office.test   (no grants)
--   ivy@office.test   (IT)

-- pgcrypto provides crypt() and gen_salt(), used below to hash the demo password with bcrypt.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Start from an empty database. RESTART IDENTITY resets the ids to 1,
-- so the demo data gets the same ids every time.
TRUNCATE booking, room_grant, room_equipment, room, equipment_type,
         user_grant, app_user, access_grant
    RESTART IDENTITY;

-- A helper that exists only for this session: a moment relative to today, in the office's time zone.
-- local_time(1, '09:00') = tomorrow at 09:00 in Warsaw.
CREATE FUNCTION pg_temp.local_time(day_offset integer, clock time) RETURNS timestamptz AS $$
SELECT (date_trunc('day', now() AT TIME ZONE 'Europe/Warsaw')
    + make_interval(days => day_offset)
    + clock) AT TIME ZONE 'Europe/Warsaw';
$$ LANGUAGE sql;


-- ---------- Grants ----------

INSERT INTO access_grant (code, name, type, description) VALUES
                                                             ('ADMIN',      'Admin',      'SYSTEM',      'Access to admin pages'),
                                                             ('IT',         'IT',         'ROOM_ACCESS', 'IT department rooms'),
                                                             ('MANAGEMENT', 'Management', 'ROOM_ACCESS', 'Board and management rooms');


-- ---------- Users ----------

INSERT INTO app_user (first_name, last_name, email, password_hash) VALUES
                                                                       ('Anna', 'Admin', 'anna@office.test', crypt('demo-password', gen_salt('bf', 10))),
                                                                       ('Tom',  'Novak', 'tom@office.test',  crypt('demo-password', gen_salt('bf', 10))),
                                                                       ('Ivy',  'Tech',  'ivy@office.test',  crypt('demo-password', gen_salt('bf', 10)));

INSERT INTO user_grant (user_id, grant_id)
SELECT u.id, g.id
FROM (VALUES
          ('anna@office.test', 'ADMIN'),
          ('ivy@office.test',  'IT')
     ) AS link (email, code)
         JOIN app_user u     ON u.email = link.email
         JOIN access_grant g ON g.code = link.code;


-- ---------- Equipment types ----------

INSERT INTO equipment_type (code, name) VALUES
                                            ('PROJECTOR',          'Projector'),
                                            ('TV_SCREEN',          'TV screen'),
                                            ('WHITEBOARD',         'Whiteboard'),
                                            ('VIDEO_CONFERENCING', 'Video conferencing');


-- ---------- Rooms ----------

INSERT INTO room (name, floor, capacity, description, active) VALUES
                                                                  ('Aurora',             1,  6, 'Small meeting room by the kitchen.', true),
                                                                  ('Borealis',           1, 12, 'Main conference room.',              true),
                                                                  ('Cosmos',             2,  4, '',                                   true),
                                                                  ('Server Room Huddle', 2,  3, 'Next to the server room.',           true),
                                                                  ('Boardroom',          3, 16, 'For management meetings.',           true),
                                                                  ('Old Library',        0,  8, 'Closed for renovation.',             false);

INSERT INTO room_equipment (room_id, equipment_type_id)
SELECT r.id, e.id
FROM (VALUES
          ('Aurora',             'TV_SCREEN'),
          ('Aurora',             'WHITEBOARD'),
          ('Borealis',           'PROJECTOR'),
          ('Borealis',           'WHITEBOARD'),
          ('Borealis',           'VIDEO_CONFERENCING'),
          ('Cosmos',             'TV_SCREEN'),
          ('Server Room Huddle', 'WHITEBOARD'),
          ('Boardroom',          'PROJECTOR'),
          ('Boardroom',          'TV_SCREEN'),
          ('Boardroom',          'WHITEBOARD'),
          ('Boardroom',          'VIDEO_CONFERENCING')
     ) AS link (room_name, code)
         JOIN room r           ON r.name = link.room_name
         JOIN equipment_type e ON e.code = link.code;

INSERT INTO room_grant (room_id, grant_id)
SELECT r.id, g.id
FROM (VALUES
          ('Server Room Huddle', 'IT'),
          ('Boardroom',          'MANAGEMENT')
     ) AS link (room_name, code)
         JOIN room r         ON r.name = link.room_name
         JOIN access_grant g ON g.code = link.code;


-- ---------- Bookings (relative to today, so the demo always has upcoming and past ones) ----------

INSERT INTO booking (room_id, user_id, title, start_time, end_time, created_at)
SELECT r.id, u.id, b.title,
       pg_temp.local_time(b.day_offset, b.start_clock),
       pg_temp.local_time(b.day_offset, b.end_clock),
       pg_temp.local_time(b.day_offset - 3, '12:00')
FROM (VALUES
          ('Aurora',             'tom@office.test',  'Team standup',          1, time '09:00', time '09:30'),
          ('Borealis',           'anna@office.test', 'Quarterly planning',    1, time '13:00', time '15:00'),
          ('Aurora',             'ivy@office.test',  'Sprint review',         2, time '10:00', time '11:00'),
          ('Cosmos',             'tom@office.test',  '1:1 with manager',     -2, time '14:00', time '14:30'),
          ('Server Room Huddle', 'ivy@office.test',  'Server migration sync', 1, time '11:00', time '12:00')
     ) AS b (room_name, email, title, day_offset, start_clock, end_clock)
         JOIN room r     ON r.name = b.room_name
         JOIN app_user u ON u.email = b.email;