-- V1: The initial schema for Office Room Booking.
-- Shared by all backends.

-- Lets GiST indexes handle plain equality (room_id =), needed by the booking overlap constraint.
CREATE EXTENSION IF NOT EXISTS btree_gist;


-- ============================================================================
-- Users and grants
-- ============================================================================

CREATE TABLE app_user (
                          id            bigint       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                          first_name    varchar(100) NOT NULL,
                          last_name     varchar(100) NOT NULL,
                          email         varchar(254) NOT NULL,
                          password_hash varchar(255) NOT NULL,
                          active        boolean      NOT NULL DEFAULT true,
                          created_at    timestamptz  NOT NULL DEFAULT now(),

                          CONSTRAINT app_user_names_not_blank CHECK (btrim(first_name) <> '' AND btrim(last_name) <> '')
);

-- Emails are unique regardless of case: Tom@Office.test and tom@office.test are one account.
CREATE UNIQUE INDEX app_user_email_key ON app_user (lower(email));


CREATE TABLE access_grant (
                              id          bigint       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                              code        varchar(50)  NOT NULL,
                              name        varchar(100) NOT NULL,
                              type        varchar(20)  NOT NULL,
                              description varchar(500) NOT NULL DEFAULT '',
                              active      boolean      NOT NULL DEFAULT true,

                              CONSTRAINT access_grant_code_key          UNIQUE (code),
                              CONSTRAINT access_grant_code_format       CHECK (code ~ '^[A-Z][A-Z0-9_]*$'),
    CONSTRAINT access_grant_type_valid        CHECK (type IN ('SYSTEM', 'ROOM_ACCESS')),
    CONSTRAINT access_grant_name_not_blank    CHECK (btrim(name) <> ''),
    CONSTRAINT access_grant_system_is_active  CHECK (type <> 'SYSTEM' OR active)
);

CREATE UNIQUE INDEX access_grant_name_key ON access_grant (lower(name));


-- Which grants each user holds (many-to-many).
CREATE TABLE user_grant (
                            user_id  bigint NOT NULL REFERENCES app_user (id)     ON DELETE CASCADE,
                            grant_id bigint NOT NULL REFERENCES access_grant (id) ON DELETE RESTRICT,

                            PRIMARY KEY (user_id, grant_id)
);

CREATE INDEX user_grant_grant_id_idx ON user_grant (grant_id);


-- ============================================================================
-- Rooms and equipment
-- ============================================================================

CREATE TABLE equipment_type (
                                id   bigint       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                code varchar(50)  NOT NULL,
                                name varchar(100) NOT NULL,

                                CONSTRAINT equipment_type_code_key        UNIQUE (code),
                                CONSTRAINT equipment_type_code_format     CHECK (code ~ '^[A-Z][A-Z0-9_]*$'),
    CONSTRAINT equipment_type_name_not_blank  CHECK (btrim(name) <> '')
);

CREATE UNIQUE INDEX equipment_type_name_key ON equipment_type (lower(name));


CREATE TABLE room (
                      id          bigint        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                      name        varchar(100)  NOT NULL,
                      floor       integer       NOT NULL,
                      capacity    integer       NOT NULL,
                      description varchar(1000) NOT NULL DEFAULT '',
                      active      boolean       NOT NULL DEFAULT true,

                      CONSTRAINT room_name_not_blank     CHECK (btrim(name) <> ''),
                      CONSTRAINT room_capacity_positive  CHECK (capacity >= 1)
);

CREATE UNIQUE INDEX room_name_key ON room (lower(name));


-- Which equipment each room has (many-to-many).
CREATE TABLE room_equipment (
                                room_id           bigint NOT NULL REFERENCES room (id)           ON DELETE CASCADE,
                                equipment_type_id bigint NOT NULL REFERENCES equipment_type (id) ON DELETE RESTRICT,

                                PRIMARY KEY (room_id, equipment_type_id)
);

CREATE INDEX room_equipment_equipment_type_id_idx ON room_equipment (equipment_type_id);


-- Which grants allow booking a room (many-to-many). No rows means the room is open to everyone.
-- Only ROOM_ACCESS grants belong here; the backends enforce that.
CREATE TABLE room_grant (
                            room_id  bigint NOT NULL REFERENCES room (id)         ON DELETE CASCADE,
                            grant_id bigint NOT NULL REFERENCES access_grant (id) ON DELETE RESTRICT,

                            PRIMARY KEY (room_id, grant_id)
);

CREATE INDEX room_grant_grant_id_idx ON room_grant (grant_id);


-- ============================================================================
-- Bookings
-- ============================================================================

CREATE TABLE booking (
                         id           bigint        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                         room_id      bigint        NOT NULL REFERENCES room (id)     ON DELETE RESTRICT,
                         user_id      bigint        NOT NULL REFERENCES app_user (id) ON DELETE RESTRICT,
                         title        varchar(200)  NOT NULL,
                         description  varchar(2000) NOT NULL DEFAULT '',
                         start_time   timestamptz   NOT NULL,
                         end_time     timestamptz   NOT NULL,
                         status       varchar(20)   NOT NULL DEFAULT 'CONFIRMED',
                         created_at   timestamptz   NOT NULL DEFAULT now(),
                         cancelled_at timestamptz,

                         CONSTRAINT booking_title_not_blank   CHECK (btrim(title) <> ''),
                         CONSTRAINT booking_status_valid      CHECK (status IN ('CONFIRMED', 'CANCELLED')),
                         CONSTRAINT booking_end_after_start   CHECK (end_time > start_time),
                         CONSTRAINT booking_cancelled_at_set  CHECK ((status = 'CANCELLED') = (cancelled_at IS NOT NULL)),

    -- The heart of the system: two confirmed bookings of the same room may never overlap.
    -- '[)' includes the start and excludes the end, so back-to-back bookings are allowed.
                         CONSTRAINT booking_no_overlap EXCLUDE USING gist (
        room_id                                  WITH =,
        tstzrange(start_time, end_time, '[)')    WITH &&
    ) WHERE (status = 'CONFIRMED')
);

-- "My bookings", newest or soonest first.
CREATE INDEX booking_user_start_idx ON booking (user_id, start_time);

-- The admin overview: filtering by date, newest first.
CREATE INDEX booking_start_idx ON booking (start_time);