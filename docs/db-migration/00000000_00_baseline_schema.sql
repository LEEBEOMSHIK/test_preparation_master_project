-- ═══════════════════════════════════════════════════════════════════════════
-- 베이스라인 스키마 (전체 테이블 정의) — 이 프로젝트의 스키마 기준점
-- ═══════════════════════════════════════════════════════════════════════════
-- 목적:
--   이 프로젝트는 Flyway/Liquibase 를 쓰지 않고 `docs/db-migration/` 에 수동 SQL 을
--   쌓아가는 방식이다(`docs/db-guidelines.md` §10). 그런데 기존 마이그레이션 34개는
--   전부 "이미 테이블이 존재한다"는 전제의 ALTER/데이터 보정이라, 빈 DB 에서는
--   첫 파일(20260701_01)부터 `relation "exams" does not exist` 로 실패했다.
--   이 파일이 그 앞단의 베이스라인(전체 CREATE TABLE)을 담당한다.
--
-- 적용 대상: PostgreSQL 15 / public 스키마 전체 33개 테이블
--
-- 기준 시점:
--   2026-08-02 원본 로컬 DB(`tpmp-db`)의 `pg_dump --schema-only` 결과.
--   즉 `docs/db-migration/` 의 20260722_06 까지 **전부 적용된 최종 상태**다.
--   따라서 신규 DB 는 이 파일 하나로 스키마가 완성된다.
--
-- ⚠️ 기존 델타 마이그레이션 34개(20260701_01 ~ 20260722_06)와의 관계:
--   이 베이스라인을 적용한 신규 DB 에 34개를 이어서 돌리면 **10개가 실패한다.**
--   실패하는 것들은 스키마 변경이 아니라 "이미 있는 콘텐츠를 고치는 데이터 보정"
--   (기출문제 백필·재채점·AI 커스텀 시험 생성)이라, 콘텐츠가 없는 빈 DB 에서는
--   전제 조건 검사나 FK 에서 걸린다.
--   → 신규 DB 는 34개를 돌리지 말 것. 스키마는 이 파일이, 데이터는
--     `docs/sql/tpmp_content_data.sql`(34개가 모두 적용된 뒤의 상태를 덤프한 것)이
--     각각 담당한다. 34개 파일은 변경 이력 추적용으로 보존만 한다.
--
-- 실행 순서상 위치:
--   파일명이 `00000000_00` 이라 정렬상 항상 맨 앞이다. 다만 위 경고대로
--   `docs/db-migration/*.sql` 을 통째로 순회 실행하는 방식은 더 이상 쓰지 않는다.
--   정확한 절차는 `docs/sql/README.md` 의 "로드 순서" 참고.
--
-- 정책:
--   - 재실행 안전(idempotent). 모든 문장이 IF NOT EXISTS 또는 존재 여부 가드/예외 처리다.
--   - 이미 일부 스키마가 있는 로컬에도 적용 가능하다.
--     [1] 없는 테이블만 생성 → [4] 기존 테이블의 누락 컬럼만 추가 →
--     [5] 없는 제약조건만 추가 → [6] 없는 인덱스만 추가.
--   - [4] 단계로 추가되는 컬럼은 **nullable 로 추가**된다. 기존 행이 있는 테이블에
--     NOT NULL 컬럼을 붙이면 실패하기 때문이다. 신규(빈) DB 는 [1]에서 이미 정확한
--     NOT NULL 정의를 받으므로 영향이 없다. 부분 적용 로컬은 [7] 검증 쿼리로
--     nullability 차이를 확인하고, 필요하면 데이터 백필 후 수동으로 SET NOT NULL 한다.
--   - 이 파일은 **스키마만** 담당한다. 콘텐츠 데이터는 `docs/sql/tpmp_content_data.sql`,
--     사용자/메뉴/권한 시드는 백엔드 `DataInitializer` 가 담당한다.
--
-- 앞으로의 유지보수:
--   새 컬럼/테이블을 추가할 때는 지금까지처럼 `{YYYYMMDD}_{순번}_{설명}.sql` 을 새로
--   만들면 된다. 이 베이스라인 파일은 손대지 않는다(스키마가 많이 앞서가 재생성이
--   필요해지면 그때 새 날짜의 베이스라인으로 교체하고 이전 델타는 archive 로 옮긴다).
--
-- 롤백: 파일 하단의 ROLLBACK 절차 참고.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- [0] 적용 전 확인 — 현재 DB 에 테이블이 몇 개나 있는지
--     0 이면 신규 DB, 33 이면 이미 최신, 그 사이면 부분 적용 상태
-- ─────────────────────────────────────────────────────────────
SELECT count(*) AS existing_table_count
FROM pg_tables
WHERE schemaname = 'public';


BEGIN;

-- ─────────────────────────────────────────────────────────────
-- [1] 테이블 생성 (신규 DB 기준 정확한 정의)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.attachments (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    file_size bigint,
    file_url character varying(255) NOT NULL,
    mime_type character varying(100),
    original_filename character varying(255) NOT NULL,
    ref_id bigint,
    ref_type character varying(50),
    stored_filename character varying(255) NOT NULL,
    CONSTRAINT attachments_ref_type_check CHECK (((ref_type)::text = ANY ((ARRAY['INQUIRY'::character varying, 'QUESTION_BANK'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.concept_notes (
    id bigint NOT NULL,
    content text NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    is_public boolean NOT NULL,
    title character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone,
    question_id bigint,
    question_bank_id bigint,
    user_id bigint NOT NULL,
    notion_page_id character varying(64)
);

CREATE TABLE IF NOT EXISTS public.dialect_conversion_rules (
    id bigint NOT NULL,
    admin_label character varying(100) NOT NULL,
    complex boolean NOT NULL,
    dialect character varying(10) NOT NULL,
    display_order integer NOT NULL,
    enabled boolean NOT NULL,
    rule_key character varying(50) NOT NULL,
    user_label text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.domain_master (
    id bigint NOT NULL,
    code character varying(50),
    name character varying(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.domain_slave (
    id bigint NOT NULL,
    display_order integer NOT NULL,
    name character varying(100) NOT NULL,
    master_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS public.exam_history (
    id bigint NOT NULL,
    correct_count integer NOT NULL,
    score double precision NOT NULL,
    taken_at timestamp(6) without time zone NOT NULL,
    total_questions integer NOT NULL,
    examination_id bigint NOT NULL,
    user_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS public.exam_history_details (
    id bigint NOT NULL,
    code text,
    content text NOT NULL,
    correct boolean NOT NULL,
    correct_answer text,
    explanation text,
    language character varying(20),
    options jsonb,
    question_id bigint,
    question_type character varying(255) NOT NULL,
    seq integer NOT NULL,
    user_answer text,
    exam_history_id bigint NOT NULL,
    category_name character varying(100),
    instruction text,
    scheduling_data jsonb,
    sql_data jsonb,
    title character varying(200),
    question_bank_id bigint,
    disable_alternative_answer boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS public.exam_info (
    id bigint NOT NULL,
    application_period character varying(300),
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    display_order integer NOT NULL,
    exam_schedule character varying(300),
    exam_type character varying(100) NOT NULL,
    is_active boolean NOT NULL,
    official_url character varying(500),
    result_date character varying(300),
    title character varying(200) NOT NULL,
    updated_at timestamp(6) without time zone,
    application_url character varying(500)
);

CREATE TABLE IF NOT EXISTS public.exam_session (
    id bigint NOT NULL,
    started_at timestamp(6) without time zone NOT NULL,
    examination_id bigint NOT NULL,
    user_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS public.examinations (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    time_limit integer NOT NULL,
    title character varying(200) NOT NULL,
    category_id bigint NOT NULL,
    created_by bigint NOT NULL,
    exam_paper_id bigint NOT NULL,
    exam_year integer,
    exam_round integer,
    is_ai_custom boolean DEFAULT false NOT NULL,
    del_yn character varying(1) DEFAULT 'N'::character varying NOT NULL,
    use_yn character varying(1) DEFAULT 'Y'::character varying NOT NULL
);

CREATE TABLE IF NOT EXISTS public.exams (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    del_yn character varying(1) DEFAULT 'N'::character varying NOT NULL,
    order_no integer NOT NULL,
    question_mode character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    created_by bigint NOT NULL,
    use_yn character varying(1) DEFAULT 'Y'::character varying NOT NULL,
    CONSTRAINT exams_question_mode_check CHECK (((question_mode)::text = ANY ((ARRAY['RANDOM'::character varying, 'SEQUENTIAL'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.faqs (
    id bigint NOT NULL,
    answer text NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    display_order integer NOT NULL,
    is_active boolean NOT NULL,
    question character varying(255) NOT NULL,
    updated_at timestamp(6) without time zone
);

CREATE TABLE IF NOT EXISTS public.inquiries (
    id bigint NOT NULL,
    content text NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    image_urls text,
    inquiry_type character varying(255) NOT NULL,
    replied_at timestamp(6) without time zone,
    reply text,
    status character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT inquiries_inquiry_type_check CHECK (((inquiry_type)::text = ANY ((ARRAY['EXAM'::character varying, 'CONCEPT_NOTE'::character varying, 'DAILY_QUIZ'::character varying, 'PRACTICE'::character varying, 'OTHER'::character varying])::text[]))),
    CONSTRAINT inquiries_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'ON_HOLD'::character varying, 'ANSWERED'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.login_history (
    id bigint NOT NULL,
    email character varying(255) NOT NULL,
    ip_address character varying(45) NOT NULL,
    login_at timestamp(6) without time zone NOT NULL,
    member_name character varying(255) NOT NULL,
    user_agent text
);

CREATE TABLE IF NOT EXISTS public.menu_config (
    id bigint NOT NULL,
    allowed_roles character varying(200),
    created_at timestamp(6) without time zone NOT NULL,
    display_order integer NOT NULL,
    icon_key character varying(50),
    is_active boolean NOT NULL,
    menu_type character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    parent_id bigint,
    updated_at timestamp(6) without time zone,
    url character varying(200) NOT NULL,
    CONSTRAINT menu_config_menu_type_check CHECK (((menu_type)::text = ANY ((ARRAY['USER'::character varying, 'ADMIN'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.notion_integrations (
    id bigint NOT NULL,
    access_token_enc text NOT NULL,
    bot_id character varying(64),
    created_at timestamp(6) without time zone NOT NULL,
    notion_database_id character varying(64),
    parent_page_id character varying(64),
    updated_at timestamp(6) without time zone,
    user_id bigint NOT NULL,
    workspace_id character varying(64),
    workspace_name character varying(200)
);

CREATE TABLE IF NOT EXISTS public.permission_detail (
    id bigint NOT NULL,
    code character varying(100),
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    name character varying(100) NOT NULL,
    updated_at timestamp(6) without time zone,
    master_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS public.permission_master (
    id bigint NOT NULL,
    code character varying(50) NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    description text,
    name character varying(100) NOT NULL,
    scope character varying(20),
    CONSTRAINT permission_master_scope_check CHECK (((scope)::text = ANY ((ARRAY['USER'::character varying, 'ADMIN'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.prac_departments (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    location character varying(100),
    budget numeric(15,2)
);

CREATE TABLE IF NOT EXISTS public.prac_employees (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    department_id integer,
    salary numeric(10,2),
    hire_date date,
    email character varying(100),
    job_title character varying(100)
);

CREATE TABLE IF NOT EXISTS public.prac_orders (
    id integer NOT NULL,
    customer_name character varying(100) NOT NULL,
    product_id integer,
    quantity integer NOT NULL,
    total_amount numeric(10,2),
    order_date date NOT NULL
);

CREATE TABLE IF NOT EXISTS public.prac_products (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    category character varying(100),
    price numeric(10,2),
    stock integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.practice_history (
    id bigint NOT NULL,
    dialect character varying(20),
    error_message text,
    executed_at timestamp(6) without time zone NOT NULL,
    result_type character varying(20),
    row_count integer,
    sql_content text NOT NULL,
    user_email character varying(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.question_bank (
    id bigint NOT NULL,
    create_dt timestamp(6) without time zone NOT NULL,
    create_uno bigint NOT NULL,
    del_yn character varying(1) NOT NULL,
    modified_dt timestamp(6) without time zone NOT NULL,
    modified_uno bigint NOT NULL,
    use_yn character varying(1) NOT NULL,
    answer text,
    code text,
    content text NOT NULL,
    exam_round integer,
    exam_year integer,
    explanation text,
    language character varying(50),
    options jsonb,
    question_type character varying(30) NOT NULL,
    title character varying(200),
    category_id bigint,
    exam_type_id bigint,
    ai_difficulty character varying(10),
    ai_domains jsonb,
    ai_keywords jsonb,
    ai_summary text,
    scheduling_data jsonb,
    instruction text,
    question_no integer,
    sql_data jsonb,
    disable_alternative_answer boolean DEFAULT false NOT NULL,
    CONSTRAINT question_bank_question_type_check CHECK (((question_type)::text = ANY ((ARRAY['MULTIPLE_CHOICE'::character varying, 'SHORT_ANSWER'::character varying, 'OX'::character varying, 'CODE'::character varying, 'SCHEDULING'::character varying, 'SQL'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.questions (
    id bigint NOT NULL,
    answer text,
    code text,
    content text NOT NULL,
    explanation text,
    language character varying(20),
    options jsonb,
    question_type character varying(255) NOT NULL,
    seq integer NOT NULL,
    source_file character varying(255),
    exam_id bigint NOT NULL,
    category_id bigint,
    source_question_bank_id bigint,
    instruction text,
    scheduling_data jsonb,
    sql_data jsonb,
    disable_alternative_answer boolean DEFAULT false NOT NULL,
    del_yn character varying(1) DEFAULT 'N'::character varying NOT NULL,
    use_yn character varying(1) DEFAULT 'Y'::character varying NOT NULL,
    CONSTRAINT questions_question_type_check CHECK (((question_type)::text = ANY ((ARRAY['MULTIPLE_CHOICE'::character varying, 'SHORT_ANSWER'::character varying, 'OX'::character varying, 'CODE'::character varying, 'SCHEDULING'::character varying, 'SQL'::character varying])::text[])))
);

CREATE TABLE IF NOT EXISTS public.quiz_history (
    id bigint NOT NULL,
    category_id bigint,
    correct boolean NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    domain_name character varying(100),
    question_bank_id bigint,
    question_type character varying(30) NOT NULL,
    user_answer character varying(500),
    user_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quotes (
    id bigint NOT NULL,
    author character varying(200),
    content text NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    use_yn character varying(1) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.support_settings (
    id bigint NOT NULL,
    toss_url character varying(500),
    kakaopay_url character varying(500),
    kakao_gift_url character varying(500),
    updated_at timestamp without time zone
);

CREATE TABLE IF NOT EXISTS public.user_exam_applications (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    exam_info_id bigint,
    exam_name character varying(200) NOT NULL,
    application_date date,
    exam_date date,
    memo character varying(300),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);

CREATE TABLE IF NOT EXISTS public.user_granted_permissions (
    user_id bigint NOT NULL,
    detail_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_interested_exam (
    id bigint NOT NULL,
    domain_slave_id bigint NOT NULL,
    user_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_question_bookmarks (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    question_bank_id bigint NOT NULL,
    user_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS public.users (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    email character varying(255) NOT NULL,
    is_first_login boolean,
    name character varying(255) NOT NULL,
    password character varying(255),
    provider character varying(20),
    provider_id character varying(255),
    role character varying(255) NOT NULL,
    nickname character varying(50),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['USER'::character varying, 'ADMIN'::character varying])::text[])))
);

-- ─────────────────────────────────────────────────────────────
-- [2] 시퀀스 (prac_* 샘플 테이블용 · IDENTITY 미사용 레거시)
-- ─────────────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS public.prac_departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.prac_employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.prac_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.prac_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.prac_departments_id_seq OWNED BY public.prac_departments.id;

ALTER SEQUENCE public.prac_employees_id_seq OWNED BY public.prac_employees.id;

ALTER SEQUENCE public.prac_orders_id_seq OWNED BY public.prac_orders.id;

ALTER SEQUENCE public.prac_products_id_seq OWNED BY public.prac_products.id;

ALTER TABLE ONLY public.prac_departments ALTER COLUMN id SET DEFAULT nextval('public.prac_departments_id_seq'::regclass);

ALTER TABLE ONLY public.prac_employees ALTER COLUMN id SET DEFAULT nextval('public.prac_employees_id_seq'::regclass);

ALTER TABLE ONLY public.prac_orders ALTER COLUMN id SET DEFAULT nextval('public.prac_orders_id_seq'::regclass);

ALTER TABLE ONLY public.prac_products ALTER COLUMN id SET DEFAULT nextval('public.prac_products_id_seq'::regclass);

-- ─────────────────────────────────────────────────────────────
-- [3] IDENTITY 컬럼 (이미 IDENTITY 면 건너뜀)
-- ─────────────────────────────────────────────────────────────

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'attachments'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.attachments ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.attachments_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'concept_notes'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.concept_notes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.concept_notes_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'dialect_conversion_rules'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.dialect_conversion_rules ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.dialect_conversion_rules_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'domain_master'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.domain_master ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.domain_master_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'domain_slave'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.domain_slave ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.domain_slave_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'exam_history_details'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.exam_history_details ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.exam_history_details_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'exam_history'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.exam_history ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.exam_history_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'exam_info'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.exam_info ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.exam_info_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'exam_session'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.exam_session ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.exam_session_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'examinations'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.examinations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.examinations_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'exams'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.exams ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.exams_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'faqs'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.faqs ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.faqs_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'inquiries'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.inquiries ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.inquiries_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'login_history'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.login_history ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.login_history_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'menu_config'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.menu_config ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.menu_config_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'notion_integrations'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.notion_integrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.notion_integrations_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'permission_detail'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.permission_detail ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.permission_detail_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'permission_master'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.permission_master ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.permission_master_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'practice_history'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.practice_history ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.practice_history_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'question_bank'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.question_bank ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.question_bank_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'questions'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.questions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.questions_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'quiz_history'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.quiz_history ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.quiz_history_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'quotes'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.quotes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.quotes_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'support_settings'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.support_settings ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.support_settings_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'user_exam_applications'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.user_exam_applications ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.user_exam_applications_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'user_interested_exam'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.user_interested_exam ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.user_interested_exam_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'user_question_bookmarks'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.user_question_bookmarks ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.user_question_bookmarks_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'users'
          AND a.attname = 'id' AND a.attidentity <> ''
    ) THEN
        ALTER TABLE public.users ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
            SEQUENCE NAME public.users_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1
        );
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- [4] 컬럼 보정 — 이미 테이블이 있는 로컬에서 누락 컬럼만 추가
--     · 기존 행이 있을 수 있으므로 NOT NULL 없이(nullable) 추가한다.
--     · 신규(빈) DB 에서는 [1]이 이미 정확히 만들었으므로 전부 no-op.
--     · 이 단계로 추가된 컬럼의 NOT NULL 여부는 [7] 검증 쿼리로 확인할 것.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS created_at timestamp(6) without time zone;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS file_url character varying(255);
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS mime_type character varying(100);
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS original_filename character varying(255);
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS ref_id bigint;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS ref_type character varying(50);
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS stored_filename character varying(255);

ALTER TABLE public.concept_notes ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.concept_notes ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.concept_notes ADD COLUMN IF NOT EXISTS created_at timestamp(6) without time zone;
ALTER TABLE public.concept_notes ADD COLUMN IF NOT EXISTS is_public boolean;
ALTER TABLE public.concept_notes ADD COLUMN IF NOT EXISTS title character varying(255);
ALTER TABLE public.concept_notes ADD COLUMN IF NOT EXISTS updated_at timestamp(6) without time zone;
ALTER TABLE public.concept_notes ADD COLUMN IF NOT EXISTS question_id bigint;
ALTER TABLE public.concept_notes ADD COLUMN IF NOT EXISTS question_bank_id bigint;
ALTER TABLE public.concept_notes ADD COLUMN IF NOT EXISTS user_id bigint;
ALTER TABLE public.concept_notes ADD COLUMN IF NOT EXISTS notion_page_id character varying(64);

ALTER TABLE public.dialect_conversion_rules ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.dialect_conversion_rules ADD COLUMN IF NOT EXISTS admin_label character varying(100);
ALTER TABLE public.dialect_conversion_rules ADD COLUMN IF NOT EXISTS complex boolean;
ALTER TABLE public.dialect_conversion_rules ADD COLUMN IF NOT EXISTS dialect character varying(10);
ALTER TABLE public.dialect_conversion_rules ADD COLUMN IF NOT EXISTS display_order integer;
ALTER TABLE public.dialect_conversion_rules ADD COLUMN IF NOT EXISTS enabled boolean;
ALTER TABLE public.dialect_conversion_rules ADD COLUMN IF NOT EXISTS rule_key character varying(50);
ALTER TABLE public.dialect_conversion_rules ADD COLUMN IF NOT EXISTS user_label text;

ALTER TABLE public.domain_master ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.domain_master ADD COLUMN IF NOT EXISTS code character varying(50);
ALTER TABLE public.domain_master ADD COLUMN IF NOT EXISTS name character varying(100);

ALTER TABLE public.domain_slave ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.domain_slave ADD COLUMN IF NOT EXISTS display_order integer;
ALTER TABLE public.domain_slave ADD COLUMN IF NOT EXISTS name character varying(100);
ALTER TABLE public.domain_slave ADD COLUMN IF NOT EXISTS master_id bigint;

ALTER TABLE public.exam_history ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.exam_history ADD COLUMN IF NOT EXISTS correct_count integer;
ALTER TABLE public.exam_history ADD COLUMN IF NOT EXISTS score double precision;
ALTER TABLE public.exam_history ADD COLUMN IF NOT EXISTS taken_at timestamp(6) without time zone;
ALTER TABLE public.exam_history ADD COLUMN IF NOT EXISTS total_questions integer;
ALTER TABLE public.exam_history ADD COLUMN IF NOT EXISTS examination_id bigint;
ALTER TABLE public.exam_history ADD COLUMN IF NOT EXISTS user_id bigint;

ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS correct boolean;
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS correct_answer text;
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS explanation text;
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS language character varying(20);
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS options jsonb;
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS question_id bigint;
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS question_type character varying(255);
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS seq integer;
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS user_answer text;
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS exam_history_id bigint;
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS category_name character varying(100);
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS instruction text;
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS scheduling_data jsonb;
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS sql_data jsonb;
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS title character varying(200);
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS question_bank_id bigint;
ALTER TABLE public.exam_history_details ADD COLUMN IF NOT EXISTS disable_alternative_answer boolean DEFAULT false;

ALTER TABLE public.exam_info ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.exam_info ADD COLUMN IF NOT EXISTS application_period character varying(300);
ALTER TABLE public.exam_info ADD COLUMN IF NOT EXISTS created_at timestamp(6) without time zone;
ALTER TABLE public.exam_info ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.exam_info ADD COLUMN IF NOT EXISTS display_order integer;
ALTER TABLE public.exam_info ADD COLUMN IF NOT EXISTS exam_schedule character varying(300);
ALTER TABLE public.exam_info ADD COLUMN IF NOT EXISTS exam_type character varying(100);
ALTER TABLE public.exam_info ADD COLUMN IF NOT EXISTS is_active boolean;
ALTER TABLE public.exam_info ADD COLUMN IF NOT EXISTS official_url character varying(500);
ALTER TABLE public.exam_info ADD COLUMN IF NOT EXISTS result_date character varying(300);
ALTER TABLE public.exam_info ADD COLUMN IF NOT EXISTS title character varying(200);
ALTER TABLE public.exam_info ADD COLUMN IF NOT EXISTS updated_at timestamp(6) without time zone;
ALTER TABLE public.exam_info ADD COLUMN IF NOT EXISTS application_url character varying(500);

ALTER TABLE public.exam_session ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.exam_session ADD COLUMN IF NOT EXISTS started_at timestamp(6) without time zone;
ALTER TABLE public.exam_session ADD COLUMN IF NOT EXISTS examination_id bigint;
ALTER TABLE public.exam_session ADD COLUMN IF NOT EXISTS user_id bigint;

ALTER TABLE public.examinations ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.examinations ADD COLUMN IF NOT EXISTS created_at timestamp(6) without time zone;
ALTER TABLE public.examinations ADD COLUMN IF NOT EXISTS time_limit integer;
ALTER TABLE public.examinations ADD COLUMN IF NOT EXISTS title character varying(200);
ALTER TABLE public.examinations ADD COLUMN IF NOT EXISTS category_id bigint;
ALTER TABLE public.examinations ADD COLUMN IF NOT EXISTS created_by bigint;
ALTER TABLE public.examinations ADD COLUMN IF NOT EXISTS exam_paper_id bigint;
ALTER TABLE public.examinations ADD COLUMN IF NOT EXISTS exam_year integer;
ALTER TABLE public.examinations ADD COLUMN IF NOT EXISTS exam_round integer;
ALTER TABLE public.examinations ADD COLUMN IF NOT EXISTS is_ai_custom boolean DEFAULT false;
ALTER TABLE public.examinations ADD COLUMN IF NOT EXISTS del_yn character varying(1) DEFAULT 'N'::character varying;
ALTER TABLE public.examinations ADD COLUMN IF NOT EXISTS use_yn character varying(1) DEFAULT 'Y'::character varying;

ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS created_at timestamp(6) without time zone;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS del_yn character varying(1) DEFAULT 'N'::character varying;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS order_no integer;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS question_mode character varying(255);
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS title character varying(255);
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS created_by bigint;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS use_yn character varying(1) DEFAULT 'Y'::character varying;

ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS answer text;
ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS created_at timestamp(6) without time zone;
ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS display_order integer;
ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS is_active boolean;
ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS question character varying(255);
ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS updated_at timestamp(6) without time zone;

ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS created_at timestamp(6) without time zone;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS image_urls text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS inquiry_type character varying(255);
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS replied_at timestamp(6) without time zone;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS reply text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS status character varying(255);
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS title character varying(255);
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS user_id bigint;

ALTER TABLE public.login_history ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.login_history ADD COLUMN IF NOT EXISTS email character varying(255);
ALTER TABLE public.login_history ADD COLUMN IF NOT EXISTS ip_address character varying(45);
ALTER TABLE public.login_history ADD COLUMN IF NOT EXISTS login_at timestamp(6) without time zone;
ALTER TABLE public.login_history ADD COLUMN IF NOT EXISTS member_name character varying(255);
ALTER TABLE public.login_history ADD COLUMN IF NOT EXISTS user_agent text;

ALTER TABLE public.menu_config ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.menu_config ADD COLUMN IF NOT EXISTS allowed_roles character varying(200);
ALTER TABLE public.menu_config ADD COLUMN IF NOT EXISTS created_at timestamp(6) without time zone;
ALTER TABLE public.menu_config ADD COLUMN IF NOT EXISTS display_order integer;
ALTER TABLE public.menu_config ADD COLUMN IF NOT EXISTS icon_key character varying(50);
ALTER TABLE public.menu_config ADD COLUMN IF NOT EXISTS is_active boolean;
ALTER TABLE public.menu_config ADD COLUMN IF NOT EXISTS menu_type character varying(20);
ALTER TABLE public.menu_config ADD COLUMN IF NOT EXISTS name character varying(100);
ALTER TABLE public.menu_config ADD COLUMN IF NOT EXISTS parent_id bigint;
ALTER TABLE public.menu_config ADD COLUMN IF NOT EXISTS updated_at timestamp(6) without time zone;
ALTER TABLE public.menu_config ADD COLUMN IF NOT EXISTS url character varying(200);

ALTER TABLE public.notion_integrations ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.notion_integrations ADD COLUMN IF NOT EXISTS access_token_enc text;
ALTER TABLE public.notion_integrations ADD COLUMN IF NOT EXISTS bot_id character varying(64);
ALTER TABLE public.notion_integrations ADD COLUMN IF NOT EXISTS created_at timestamp(6) without time zone;
ALTER TABLE public.notion_integrations ADD COLUMN IF NOT EXISTS notion_database_id character varying(64);
ALTER TABLE public.notion_integrations ADD COLUMN IF NOT EXISTS parent_page_id character varying(64);
ALTER TABLE public.notion_integrations ADD COLUMN IF NOT EXISTS updated_at timestamp(6) without time zone;
ALTER TABLE public.notion_integrations ADD COLUMN IF NOT EXISTS user_id bigint;
ALTER TABLE public.notion_integrations ADD COLUMN IF NOT EXISTS workspace_id character varying(64);
ALTER TABLE public.notion_integrations ADD COLUMN IF NOT EXISTS workspace_name character varying(200);

ALTER TABLE public.permission_detail ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.permission_detail ADD COLUMN IF NOT EXISTS code character varying(100);
ALTER TABLE public.permission_detail ADD COLUMN IF NOT EXISTS created_at timestamp(6) without time zone;
ALTER TABLE public.permission_detail ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.permission_detail ADD COLUMN IF NOT EXISTS name character varying(100);
ALTER TABLE public.permission_detail ADD COLUMN IF NOT EXISTS updated_at timestamp(6) without time zone;
ALTER TABLE public.permission_detail ADD COLUMN IF NOT EXISTS master_id bigint;

ALTER TABLE public.permission_master ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.permission_master ADD COLUMN IF NOT EXISTS code character varying(50);
ALTER TABLE public.permission_master ADD COLUMN IF NOT EXISTS created_at timestamp(6) without time zone;
ALTER TABLE public.permission_master ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.permission_master ADD COLUMN IF NOT EXISTS name character varying(100);
ALTER TABLE public.permission_master ADD COLUMN IF NOT EXISTS scope character varying(20);

ALTER TABLE public.prac_departments ADD COLUMN IF NOT EXISTS id integer;
ALTER TABLE public.prac_departments ADD COLUMN IF NOT EXISTS name character varying(100);
ALTER TABLE public.prac_departments ADD COLUMN IF NOT EXISTS location character varying(100);
ALTER TABLE public.prac_departments ADD COLUMN IF NOT EXISTS budget numeric(15,2);

ALTER TABLE public.prac_employees ADD COLUMN IF NOT EXISTS id integer;
ALTER TABLE public.prac_employees ADD COLUMN IF NOT EXISTS name character varying(100);
ALTER TABLE public.prac_employees ADD COLUMN IF NOT EXISTS department_id integer;
ALTER TABLE public.prac_employees ADD COLUMN IF NOT EXISTS salary numeric(10,2);
ALTER TABLE public.prac_employees ADD COLUMN IF NOT EXISTS hire_date date;
ALTER TABLE public.prac_employees ADD COLUMN IF NOT EXISTS email character varying(100);
ALTER TABLE public.prac_employees ADD COLUMN IF NOT EXISTS job_title character varying(100);

ALTER TABLE public.prac_orders ADD COLUMN IF NOT EXISTS id integer;
ALTER TABLE public.prac_orders ADD COLUMN IF NOT EXISTS customer_name character varying(100);
ALTER TABLE public.prac_orders ADD COLUMN IF NOT EXISTS product_id integer;
ALTER TABLE public.prac_orders ADD COLUMN IF NOT EXISTS quantity integer;
ALTER TABLE public.prac_orders ADD COLUMN IF NOT EXISTS total_amount numeric(10,2);
ALTER TABLE public.prac_orders ADD COLUMN IF NOT EXISTS order_date date;

ALTER TABLE public.prac_products ADD COLUMN IF NOT EXISTS id integer;
ALTER TABLE public.prac_products ADD COLUMN IF NOT EXISTS name character varying(200);
ALTER TABLE public.prac_products ADD COLUMN IF NOT EXISTS category character varying(100);
ALTER TABLE public.prac_products ADD COLUMN IF NOT EXISTS price numeric(10,2);
ALTER TABLE public.prac_products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0;

ALTER TABLE public.practice_history ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.practice_history ADD COLUMN IF NOT EXISTS dialect character varying(20);
ALTER TABLE public.practice_history ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE public.practice_history ADD COLUMN IF NOT EXISTS executed_at timestamp(6) without time zone;
ALTER TABLE public.practice_history ADD COLUMN IF NOT EXISTS result_type character varying(20);
ALTER TABLE public.practice_history ADD COLUMN IF NOT EXISTS row_count integer;
ALTER TABLE public.practice_history ADD COLUMN IF NOT EXISTS sql_content text;
ALTER TABLE public.practice_history ADD COLUMN IF NOT EXISTS user_email character varying(100);

ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS create_dt timestamp(6) without time zone;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS create_uno bigint;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS del_yn character varying(1);
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS modified_dt timestamp(6) without time zone;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS modified_uno bigint;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS use_yn character varying(1);
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS answer text;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS exam_round integer;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS exam_year integer;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS explanation text;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS language character varying(50);
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS options jsonb;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS question_type character varying(30);
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS title character varying(200);
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS category_id bigint;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS exam_type_id bigint;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS ai_difficulty character varying(10);
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS ai_domains jsonb;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS ai_keywords jsonb;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS ai_summary text;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS scheduling_data jsonb;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS instruction text;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS question_no integer;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS sql_data jsonb;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS disable_alternative_answer boolean DEFAULT false;

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS answer text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS language character varying(20);
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS options jsonb;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_type character varying(255);
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS seq integer;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source_file character varying(255);
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS exam_id bigint;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS category_id bigint;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source_question_bank_id bigint;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS instruction text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS scheduling_data jsonb;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS sql_data jsonb;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS disable_alternative_answer boolean DEFAULT false;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS del_yn character varying(1) DEFAULT 'N'::character varying;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS use_yn character varying(1) DEFAULT 'Y'::character varying;

ALTER TABLE public.quiz_history ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.quiz_history ADD COLUMN IF NOT EXISTS category_id bigint;
ALTER TABLE public.quiz_history ADD COLUMN IF NOT EXISTS correct boolean;
ALTER TABLE public.quiz_history ADD COLUMN IF NOT EXISTS created_at timestamp(6) without time zone;
ALTER TABLE public.quiz_history ADD COLUMN IF NOT EXISTS domain_name character varying(100);
ALTER TABLE public.quiz_history ADD COLUMN IF NOT EXISTS question_bank_id bigint;
ALTER TABLE public.quiz_history ADD COLUMN IF NOT EXISTS question_type character varying(30);
ALTER TABLE public.quiz_history ADD COLUMN IF NOT EXISTS user_answer character varying(500);
ALTER TABLE public.quiz_history ADD COLUMN IF NOT EXISTS user_id bigint;

ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS author character varying(200);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS created_at timestamp(6) without time zone;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS use_yn character varying(1);

ALTER TABLE public.support_settings ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.support_settings ADD COLUMN IF NOT EXISTS toss_url character varying(500);
ALTER TABLE public.support_settings ADD COLUMN IF NOT EXISTS kakaopay_url character varying(500);
ALTER TABLE public.support_settings ADD COLUMN IF NOT EXISTS kakao_gift_url character varying(500);
ALTER TABLE public.support_settings ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone;

ALTER TABLE public.user_exam_applications ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.user_exam_applications ADD COLUMN IF NOT EXISTS user_id bigint;
ALTER TABLE public.user_exam_applications ADD COLUMN IF NOT EXISTS exam_info_id bigint;
ALTER TABLE public.user_exam_applications ADD COLUMN IF NOT EXISTS exam_name character varying(200);
ALTER TABLE public.user_exam_applications ADD COLUMN IF NOT EXISTS application_date date;
ALTER TABLE public.user_exam_applications ADD COLUMN IF NOT EXISTS exam_date date;
ALTER TABLE public.user_exam_applications ADD COLUMN IF NOT EXISTS memo character varying(300);
ALTER TABLE public.user_exam_applications ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT now();
ALTER TABLE public.user_exam_applications ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone;

ALTER TABLE public.user_granted_permissions ADD COLUMN IF NOT EXISTS user_id bigint;
ALTER TABLE public.user_granted_permissions ADD COLUMN IF NOT EXISTS detail_id bigint;

ALTER TABLE public.user_interested_exam ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.user_interested_exam ADD COLUMN IF NOT EXISTS domain_slave_id bigint;
ALTER TABLE public.user_interested_exam ADD COLUMN IF NOT EXISTS user_id bigint;

ALTER TABLE public.user_question_bookmarks ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.user_question_bookmarks ADD COLUMN IF NOT EXISTS created_at timestamp(6) without time zone;
ALTER TABLE public.user_question_bookmarks ADD COLUMN IF NOT EXISTS question_bank_id bigint;
ALTER TABLE public.user_question_bookmarks ADD COLUMN IF NOT EXISTS user_id bigint;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id bigint;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at timestamp(6) without time zone;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email character varying(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_first_login boolean;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name character varying(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password character varying(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS provider character varying(20);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS provider_id character varying(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role character varying(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nickname character varying(50);

-- ─────────────────────────────────────────────────────────────
-- [4b] NOT NULL 승격 — [4]에서 nullable 로 추가된 컬럼 중
--      실제 NULL 값이 하나도 없는 것만 NOT NULL 로 되돌린다.
--      · DEFAULT 가 있는 컬럼은 [4]의 ADD COLUMN 시점에 기존 행이 이미
--        백필되므로 여기서 대부분 자동 승격된다.
--      · NULL 이 남아있는 컬럼은 건너뛰고 NOTICE 로 알린다.
--        (데이터 백필 정책이 필요하므로 자동 처리하지 않는다 — [7-4] 참고)
-- ─────────────────────────────────────────────────────────────

DO $$
DECLARE
    r         record;
    null_cnt  bigint;
BEGIN
    FOR r IN SELECT * FROM (VALUES
        ('attachments', 'id'),
        ('attachments', 'created_at'),
        ('attachments', 'file_url'),
        ('attachments', 'original_filename'),
        ('attachments', 'stored_filename'),
        ('concept_notes', 'id'),
        ('concept_notes', 'content'),
        ('concept_notes', 'created_at'),
        ('concept_notes', 'is_public'),
        ('concept_notes', 'title'),
        ('concept_notes', 'user_id'),
        ('dialect_conversion_rules', 'id'),
        ('dialect_conversion_rules', 'admin_label'),
        ('dialect_conversion_rules', 'complex'),
        ('dialect_conversion_rules', 'dialect'),
        ('dialect_conversion_rules', 'display_order'),
        ('dialect_conversion_rules', 'enabled'),
        ('dialect_conversion_rules', 'rule_key'),
        ('dialect_conversion_rules', 'user_label'),
        ('domain_master', 'id'),
        ('domain_master', 'name'),
        ('domain_slave', 'id'),
        ('domain_slave', 'display_order'),
        ('domain_slave', 'name'),
        ('domain_slave', 'master_id'),
        ('exam_history', 'id'),
        ('exam_history', 'correct_count'),
        ('exam_history', 'score'),
        ('exam_history', 'taken_at'),
        ('exam_history', 'total_questions'),
        ('exam_history', 'examination_id'),
        ('exam_history', 'user_id'),
        ('exam_history_details', 'id'),
        ('exam_history_details', 'content'),
        ('exam_history_details', 'correct'),
        ('exam_history_details', 'question_type'),
        ('exam_history_details', 'seq'),
        ('exam_history_details', 'exam_history_id'),
        ('exam_history_details', 'disable_alternative_answer'),
        ('exam_info', 'id'),
        ('exam_info', 'created_at'),
        ('exam_info', 'display_order'),
        ('exam_info', 'exam_type'),
        ('exam_info', 'is_active'),
        ('exam_info', 'title'),
        ('exam_session', 'id'),
        ('exam_session', 'started_at'),
        ('exam_session', 'examination_id'),
        ('exam_session', 'user_id'),
        ('examinations', 'id'),
        ('examinations', 'created_at'),
        ('examinations', 'time_limit'),
        ('examinations', 'title'),
        ('examinations', 'category_id'),
        ('examinations', 'created_by'),
        ('examinations', 'exam_paper_id'),
        ('examinations', 'is_ai_custom'),
        ('examinations', 'del_yn'),
        ('examinations', 'use_yn'),
        ('exams', 'id'),
        ('exams', 'created_at'),
        ('exams', 'del_yn'),
        ('exams', 'order_no'),
        ('exams', 'question_mode'),
        ('exams', 'title'),
        ('exams', 'created_by'),
        ('exams', 'use_yn'),
        ('faqs', 'id'),
        ('faqs', 'answer'),
        ('faqs', 'created_at'),
        ('faqs', 'display_order'),
        ('faqs', 'is_active'),
        ('faqs', 'question'),
        ('inquiries', 'id'),
        ('inquiries', 'content'),
        ('inquiries', 'created_at'),
        ('inquiries', 'inquiry_type'),
        ('inquiries', 'status'),
        ('inquiries', 'title'),
        ('inquiries', 'user_id'),
        ('login_history', 'id'),
        ('login_history', 'email'),
        ('login_history', 'ip_address'),
        ('login_history', 'login_at'),
        ('login_history', 'member_name'),
        ('menu_config', 'id'),
        ('menu_config', 'created_at'),
        ('menu_config', 'display_order'),
        ('menu_config', 'is_active'),
        ('menu_config', 'menu_type'),
        ('menu_config', 'name'),
        ('menu_config', 'url'),
        ('notion_integrations', 'id'),
        ('notion_integrations', 'access_token_enc'),
        ('notion_integrations', 'created_at'),
        ('notion_integrations', 'user_id'),
        ('permission_detail', 'id'),
        ('permission_detail', 'created_at'),
        ('permission_detail', 'name'),
        ('permission_detail', 'master_id'),
        ('permission_master', 'id'),
        ('permission_master', 'code'),
        ('permission_master', 'created_at'),
        ('permission_master', 'name'),
        ('prac_departments', 'id'),
        ('prac_departments', 'name'),
        ('prac_employees', 'id'),
        ('prac_employees', 'name'),
        ('prac_orders', 'id'),
        ('prac_orders', 'customer_name'),
        ('prac_orders', 'quantity'),
        ('prac_orders', 'order_date'),
        ('prac_products', 'id'),
        ('prac_products', 'name'),
        ('practice_history', 'id'),
        ('practice_history', 'executed_at'),
        ('practice_history', 'sql_content'),
        ('practice_history', 'user_email'),
        ('question_bank', 'id'),
        ('question_bank', 'create_dt'),
        ('question_bank', 'create_uno'),
        ('question_bank', 'del_yn'),
        ('question_bank', 'modified_dt'),
        ('question_bank', 'modified_uno'),
        ('question_bank', 'use_yn'),
        ('question_bank', 'content'),
        ('question_bank', 'question_type'),
        ('question_bank', 'disable_alternative_answer'),
        ('questions', 'id'),
        ('questions', 'content'),
        ('questions', 'question_type'),
        ('questions', 'seq'),
        ('questions', 'exam_id'),
        ('questions', 'disable_alternative_answer'),
        ('questions', 'del_yn'),
        ('questions', 'use_yn'),
        ('quiz_history', 'id'),
        ('quiz_history', 'correct'),
        ('quiz_history', 'created_at'),
        ('quiz_history', 'question_type'),
        ('quiz_history', 'user_id'),
        ('quotes', 'id'),
        ('quotes', 'content'),
        ('quotes', 'created_at'),
        ('quotes', 'use_yn'),
        ('support_settings', 'id'),
        ('user_exam_applications', 'id'),
        ('user_exam_applications', 'user_id'),
        ('user_exam_applications', 'exam_name'),
        ('user_exam_applications', 'created_at'),
        ('user_granted_permissions', 'user_id'),
        ('user_granted_permissions', 'detail_id'),
        ('user_interested_exam', 'id'),
        ('user_interested_exam', 'domain_slave_id'),
        ('user_interested_exam', 'user_id'),
        ('user_question_bookmarks', 'id'),
        ('user_question_bookmarks', 'created_at'),
        ('user_question_bookmarks', 'question_bank_id'),
        ('user_question_bookmarks', 'user_id'),
        ('users', 'id'),
        ('users', 'created_at'),
        ('users', 'email'),
        ('users', 'name'),
        ('users', 'role')
    ) AS v(tbl, col) LOOP
        -- 이미 NOT NULL 이면 건너뜀
        CONTINUE WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = r.tbl AND column_name = r.col
              AND is_nullable = 'YES'
        );

        EXECUTE format('SELECT count(*) FROM public.%I WHERE %I IS NULL', r.tbl, r.col)
            INTO null_cnt;

        IF null_cnt = 0 THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET NOT NULL', r.tbl, r.col);
        ELSE
            RAISE NOTICE '[4b] %.% : NULL % 건 → NOT NULL 승격 보류(수동 백필 필요)',
                r.tbl, r.col, null_cnt;
        END IF;
    END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────
-- [5] 제약조건 (PK / FK / UNIQUE / CHECK) — 이미 있으면 건너뜀
-- ─────────────────────────────────────────────────────────────

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.attachments'::regclass
          AND (c.conname = 'attachments_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.attachments
            ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.concept_notes'::regclass
          AND (c.conname = 'concept_notes_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.concept_notes
            ADD CONSTRAINT concept_notes_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.dialect_conversion_rules'::regclass
          AND (c.conname = 'dialect_conversion_rules_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.dialect_conversion_rules
            ADD CONSTRAINT dialect_conversion_rules_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.domain_master'::regclass
          AND (c.conname = 'domain_master_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.domain_master
            ADD CONSTRAINT domain_master_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.domain_slave'::regclass
          AND (c.conname = 'domain_slave_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.domain_slave
            ADD CONSTRAINT domain_slave_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.exam_history_details'::regclass
          AND (c.conname = 'exam_history_details_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.exam_history_details
            ADD CONSTRAINT exam_history_details_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.exam_history'::regclass
          AND (c.conname = 'exam_history_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.exam_history
            ADD CONSTRAINT exam_history_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.exam_info'::regclass
          AND (c.conname = 'exam_info_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.exam_info
            ADD CONSTRAINT exam_info_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.exam_session'::regclass
          AND (c.conname = 'exam_session_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.exam_session
            ADD CONSTRAINT exam_session_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.examinations'::regclass
          AND (c.conname = 'examinations_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.examinations
            ADD CONSTRAINT examinations_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.exams'::regclass
          AND (c.conname = 'exams_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.exams
            ADD CONSTRAINT exams_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.faqs'::regclass
          AND (c.conname = 'faqs_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.faqs
            ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.exam_session'::regclass
          AND c.conname = 'idx_exam_session_user_exam'
    ) THEN
        ALTER TABLE ONLY public.exam_session
            ADD CONSTRAINT idx_exam_session_user_exam UNIQUE (user_id, examination_id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.inquiries'::regclass
          AND (c.conname = 'inquiries_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.inquiries
            ADD CONSTRAINT inquiries_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.login_history'::regclass
          AND (c.conname = 'login_history_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.login_history
            ADD CONSTRAINT login_history_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.menu_config'::regclass
          AND (c.conname = 'menu_config_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.menu_config
            ADD CONSTRAINT menu_config_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.notion_integrations'::regclass
          AND (c.conname = 'notion_integrations_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.notion_integrations
            ADD CONSTRAINT notion_integrations_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.permission_detail'::regclass
          AND (c.conname = 'permission_detail_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.permission_detail
            ADD CONSTRAINT permission_detail_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.permission_master'::regclass
          AND (c.conname = 'permission_master_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.permission_master
            ADD CONSTRAINT permission_master_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.prac_departments'::regclass
          AND (c.conname = 'prac_departments_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.prac_departments
            ADD CONSTRAINT prac_departments_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.prac_employees'::regclass
          AND (c.conname = 'prac_employees_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.prac_employees
            ADD CONSTRAINT prac_employees_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.prac_orders'::regclass
          AND (c.conname = 'prac_orders_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.prac_orders
            ADD CONSTRAINT prac_orders_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.prac_products'::regclass
          AND (c.conname = 'prac_products_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.prac_products
            ADD CONSTRAINT prac_products_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.practice_history'::regclass
          AND (c.conname = 'practice_history_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.practice_history
            ADD CONSTRAINT practice_history_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.question_bank'::regclass
          AND (c.conname = 'question_bank_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.question_bank
            ADD CONSTRAINT question_bank_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.questions'::regclass
          AND (c.conname = 'questions_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.questions
            ADD CONSTRAINT questions_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.quiz_history'::regclass
          AND (c.conname = 'quiz_history_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.quiz_history
            ADD CONSTRAINT quiz_history_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.quotes'::regclass
          AND (c.conname = 'quotes_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.quotes
            ADD CONSTRAINT quotes_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.support_settings'::regclass
          AND (c.conname = 'support_settings_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.support_settings
            ADD CONSTRAINT support_settings_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.domain_master'::regclass
          AND c.conname = 'uk3dhjs3qxindqperaiygj8cffx'
    ) THEN
        ALTER TABLE ONLY public.domain_master
            ADD CONSTRAINT uk3dhjs3qxindqperaiygj8cffx UNIQUE (code);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.permission_detail'::regclass
          AND c.conname = 'uk3ysx11940aqneo7onof1mo12w'
    ) THEN
        ALTER TABLE ONLY public.permission_detail
            ADD CONSTRAINT uk3ysx11940aqneo7onof1mo12w UNIQUE (code);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.users'::regclass
          AND c.conname = 'uk6dotkott2kjsp8vw4d0m25fb7'
    ) THEN
        ALTER TABLE ONLY public.users
            ADD CONSTRAINT uk6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.dialect_conversion_rules'::regclass
          AND c.conname = 'uke097bl2ovq5qsqt9nbyj6qh99'
    ) THEN
        ALTER TABLE ONLY public.dialect_conversion_rules
            ADD CONSTRAINT uke097bl2ovq5qsqt9nbyj6qh99 UNIQUE (rule_key);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.user_interested_exam'::regclass
          AND c.conname = 'ukie68n30e50jq2y3u3smios5j9'
    ) THEN
        ALTER TABLE ONLY public.user_interested_exam
            ADD CONSTRAINT ukie68n30e50jq2y3u3smios5j9 UNIQUE (user_id, domain_slave_id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.user_question_bookmarks'::regclass
          AND c.conname = 'ukm0v110o4qmnu9xvhl3qdyafef'
    ) THEN
        ALTER TABLE ONLY public.user_question_bookmarks
            ADD CONSTRAINT ukm0v110o4qmnu9xvhl3qdyafef UNIQUE (user_id, question_bank_id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.permission_master'::regclass
          AND c.conname = 'uknnximweopffod8shwa64gx365'
    ) THEN
        ALTER TABLE ONLY public.permission_master
            ADD CONSTRAINT uknnximweopffod8shwa64gx365 UNIQUE (code);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.notion_integrations'::regclass
          AND c.conname = 'ukqmjnjy104429pd000aiy5sh5b'
    ) THEN
        ALTER TABLE ONLY public.notion_integrations
            ADD CONSTRAINT ukqmjnjy104429pd000aiy5sh5b UNIQUE (user_id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.user_exam_applications'::regclass
          AND (c.conname = 'user_exam_applications_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.user_exam_applications
            ADD CONSTRAINT user_exam_applications_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.user_granted_permissions'::regclass
          AND (c.conname = 'user_granted_permissions_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.user_granted_permissions
            ADD CONSTRAINT user_granted_permissions_pkey PRIMARY KEY (user_id, detail_id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.user_interested_exam'::regclass
          AND (c.conname = 'user_interested_exam_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.user_interested_exam
            ADD CONSTRAINT user_interested_exam_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.user_question_bookmarks'::regclass
          AND (c.conname = 'user_question_bookmarks_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.user_question_bookmarks
            ADD CONSTRAINT user_question_bookmarks_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.users'::regclass
          AND (c.conname = 'users_pkey' OR c.contype = 'p')
    ) THEN
        ALTER TABLE ONLY public.users
            ADD CONSTRAINT users_pkey PRIMARY KEY (id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.examinations'::regclass
          AND c.conname = 'fk1vlnp5pk0vmb9k9ruwm6w3qkw'
    ) THEN
        ALTER TABLE ONLY public.examinations
            ADD CONSTRAINT fk1vlnp5pk0vmb9k9ruwm6w3qkw FOREIGN KEY (created_by) REFERENCES public.users(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.exam_history'::regclass
          AND c.conname = 'fk3cndxqnxyjqo724arqvxdkbkd'
    ) THEN
        ALTER TABLE ONLY public.exam_history
            ADD CONSTRAINT fk3cndxqnxyjqo724arqvxdkbkd FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.exam_session'::regclass
          AND c.conname = 'fk3oqhk1vmkkkjtncxt1tevwsui'
    ) THEN
        ALTER TABLE ONLY public.exam_session
            ADD CONSTRAINT fk3oqhk1vmkkkjtncxt1tevwsui FOREIGN KEY (examination_id) REFERENCES public.examinations(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.quiz_history'::regclass
          AND c.conname = 'fk43kq759p6wyvu5av6sx8jv7i4'
    ) THEN
        ALTER TABLE ONLY public.quiz_history
            ADD CONSTRAINT fk43kq759p6wyvu5av6sx8jv7i4 FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.domain_slave'::regclass
          AND c.conname = 'fk4ptitdns5wsvauq73df8606t'
    ) THEN
        ALTER TABLE ONLY public.domain_slave
            ADD CONSTRAINT fk4ptitdns5wsvauq73df8606t FOREIGN KEY (master_id) REFERENCES public.domain_master(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.user_granted_permissions'::regclass
          AND c.conname = 'fk6s4m5slls3xvyk5t108drkovq'
    ) THEN
        ALTER TABLE ONLY public.user_granted_permissions
            ADD CONSTRAINT fk6s4m5slls3xvyk5t108drkovq FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.concept_notes'::regclass
          AND c.conname = 'fk7e9d4lleauw77bj94vf064l5k'
    ) THEN
        ALTER TABLE ONLY public.concept_notes
            ADD CONSTRAINT fk7e9d4lleauw77bj94vf064l5k FOREIGN KEY (question_bank_id) REFERENCES public.question_bank(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.permission_detail'::regclass
          AND c.conname = 'fk7ivgruhngpixual9ifbnqyv2c'
    ) THEN
        ALTER TABLE ONLY public.permission_detail
            ADD CONSTRAINT fk7ivgruhngpixual9ifbnqyv2c FOREIGN KEY (master_id) REFERENCES public.permission_master(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.examinations'::regclass
          AND c.conname = 'fk8lanmsfi6xg3xnrk6ijj1a808'
    ) THEN
        ALTER TABLE ONLY public.examinations
            ADD CONSTRAINT fk8lanmsfi6xg3xnrk6ijj1a808 FOREIGN KEY (category_id) REFERENCES public.domain_slave(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.examinations'::regclass
          AND c.conname = 'fk9hqpyy1kv4ru9gd2c3k6ct51x'
    ) THEN
        ALTER TABLE ONLY public.examinations
            ADD CONSTRAINT fk9hqpyy1kv4ru9gd2c3k6ct51x FOREIGN KEY (exam_paper_id) REFERENCES public.exams(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.questions'::regclass
          AND c.conname = 'fk_questions_source_question_bank'
    ) THEN
        ALTER TABLE ONLY public.questions
            ADD CONSTRAINT fk_questions_source_question_bank FOREIGN KEY (source_question_bank_id) REFERENCES public.question_bank(id) ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.user_exam_applications'::regclass
          AND c.conname = 'fk_user_exam_applications_exam_info'
    ) THEN
        ALTER TABLE ONLY public.user_exam_applications
            ADD CONSTRAINT fk_user_exam_applications_exam_info FOREIGN KEY (exam_info_id) REFERENCES public.exam_info(id) ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.user_exam_applications'::regclass
          AND c.conname = 'fk_user_exam_applications_user'
    ) THEN
        ALTER TABLE ONLY public.user_exam_applications
            ADD CONSTRAINT fk_user_exam_applications_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.exams'::regclass
          AND c.conname = 'fka9pp7fvh0i6302peis1x76ots'
    ) THEN
        ALTER TABLE ONLY public.exams
            ADD CONSTRAINT fka9pp7fvh0i6302peis1x76ots FOREIGN KEY (created_by) REFERENCES public.users(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.user_interested_exam'::regclass
          AND c.conname = 'fkakgmrh0v544g890ok6ajddlu3'
    ) THEN
        ALTER TABLE ONLY public.user_interested_exam
            ADD CONSTRAINT fkakgmrh0v544g890ok6ajddlu3 FOREIGN KEY (domain_slave_id) REFERENCES public.domain_slave(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.user_question_bookmarks'::regclass
          AND c.conname = 'fkbw3xj1te414gm9cesdcr4pmj0'
    ) THEN
        ALTER TABLE ONLY public.user_question_bookmarks
            ADD CONSTRAINT fkbw3xj1te414gm9cesdcr4pmj0 FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.user_granted_permissions'::regclass
          AND c.conname = 'fkbxihr13teakym79fskykq8xu0'
    ) THEN
        ALTER TABLE ONLY public.user_granted_permissions
            ADD CONSTRAINT fkbxihr13teakym79fskykq8xu0 FOREIGN KEY (detail_id) REFERENCES public.permission_detail(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.user_interested_exam'::regclass
          AND c.conname = 'fkc0cdlei4hk5jgoe50r0j8aajv'
    ) THEN
        ALTER TABLE ONLY public.user_interested_exam
            ADD CONSTRAINT fkc0cdlei4hk5jgoe50r0j8aajv FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.inquiries'::regclass
          AND c.conname = 'fkfks94q8sobcuibrudbr3im380'
    ) THEN
        ALTER TABLE ONLY public.inquiries
            ADD CONSTRAINT fkfks94q8sobcuibrudbr3im380 FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.question_bank'::regclass
          AND c.conname = 'fkh1l6616hg03ivrcempqm5h30s'
    ) THEN
        ALTER TABLE ONLY public.question_bank
            ADD CONSTRAINT fkh1l6616hg03ivrcempqm5h30s FOREIGN KEY (exam_type_id) REFERENCES public.domain_slave(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.question_bank'::regclass
          AND c.conname = 'fkhaoqtyh9g25bw51ebf5p71vod'
    ) THEN
        ALTER TABLE ONLY public.question_bank
            ADD CONSTRAINT fkhaoqtyh9g25bw51ebf5p71vod FOREIGN KEY (category_id) REFERENCES public.domain_slave(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.concept_notes'::regclass
          AND c.conname = 'fkjnkhmo8x2fnj4g220py9vjy0e'
    ) THEN
        ALTER TABLE ONLY public.concept_notes
            ADD CONSTRAINT fkjnkhmo8x2fnj4g220py9vjy0e FOREIGN KEY (question_id) REFERENCES public.questions(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.questions'::regclass
          AND c.conname = 'fkkeq5cvppc9e4ls870r9jgnm86'
    ) THEN
        ALTER TABLE ONLY public.questions
            ADD CONSTRAINT fkkeq5cvppc9e4ls870r9jgnm86 FOREIGN KEY (category_id) REFERENCES public.domain_slave(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.exam_history_details'::regclass
          AND c.conname = 'fkmjdphnbwvr9cqhob28qd7b51w'
    ) THEN
        ALTER TABLE ONLY public.exam_history_details
            ADD CONSTRAINT fkmjdphnbwvr9cqhob28qd7b51w FOREIGN KEY (exam_history_id) REFERENCES public.exam_history(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.concept_notes'::regclass
          AND c.conname = 'fknyaqklkhi216tufj3c5wqpvt1'
    ) THEN
        ALTER TABLE ONLY public.concept_notes
            ADD CONSTRAINT fknyaqklkhi216tufj3c5wqpvt1 FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.user_question_bookmarks'::regclass
          AND c.conname = 'fkpfxy7e7lnnwy7pahb7x7p6y48'
    ) THEN
        ALTER TABLE ONLY public.user_question_bookmarks
            ADD CONSTRAINT fkpfxy7e7lnnwy7pahb7x7p6y48 FOREIGN KEY (question_bank_id) REFERENCES public.question_bank(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.exam_session'::regclass
          AND c.conname = 'fkr0eaie2ptdpo7ckcc9x5nqkj7'
    ) THEN
        ALTER TABLE ONLY public.exam_session
            ADD CONSTRAINT fkr0eaie2ptdpo7ckcc9x5nqkj7 FOREIGN KEY (user_id) REFERENCES public.users(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.questions'::regclass
          AND c.conname = 'fkrk78bmt53fns7np8casqa3q44'
    ) THEN
        ALTER TABLE ONLY public.questions
            ADD CONSTRAINT fkrk78bmt53fns7np8casqa3q44 FOREIGN KEY (exam_id) REFERENCES public.exams(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.exam_history'::regclass
          AND c.conname = 'fkt3xaqbrffw70joweicfeuxek9'
    ) THEN
        ALTER TABLE ONLY public.exam_history
            ADD CONSTRAINT fkt3xaqbrffw70joweicfeuxek9 FOREIGN KEY (examination_id) REFERENCES public.examinations(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.prac_employees'::regclass
          AND c.conname = 'prac_employees_department_id_fkey'
    ) THEN
        ALTER TABLE ONLY public.prac_employees
            ADD CONSTRAINT prac_employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.prac_departments(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.prac_orders'::regclass
          AND c.conname = 'prac_orders_product_id_fkey'
    ) THEN
        ALTER TABLE ONLY public.prac_orders
            ADD CONSTRAINT prac_orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.prac_products(id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

-- CHECK 제약 갱신 — question_type 허용값이 SCHEDULING/SQL 추가 전(구버전)으로
-- 남아있는 기존 테이블(문항 유형 CHECK만 좁게 존재하던 로컬)을 최신 정의로 승격.
-- CREATE TABLE IF NOT EXISTS는 테이블이 이미 있으면 스킵되므로 위 [1]의 CHECK 정의가
-- 적용되지 않는 로컬을 위한 보정.
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.question_bank'::regclass
          AND c.conname = 'question_bank_question_type_check'
          AND pg_get_constraintdef(c.oid) NOT ILIKE '%SCHEDULING%'
    ) THEN
        ALTER TABLE public.question_bank DROP CONSTRAINT question_bank_question_type_check;
        ALTER TABLE public.question_bank ADD CONSTRAINT question_bank_question_type_check
            CHECK (question_type IN ('MULTIPLE_CHOICE', 'SHORT_ANSWER', 'OX', 'CODE', 'SCHEDULING', 'SQL'));
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public'
          AND c.conrelid = 'public.questions'::regclass
          AND c.conname = 'questions_question_type_check'
          AND pg_get_constraintdef(c.oid) NOT ILIKE '%SCHEDULING%'
    ) THEN
        ALTER TABLE public.questions DROP CONSTRAINT questions_question_type_check;
        ALTER TABLE public.questions ADD CONSTRAINT questions_question_type_check
            CHECK (question_type IN ('MULTIPLE_CHOICE', 'SHORT_ANSWER', 'OX', 'CODE', 'SCHEDULING', 'SQL'));
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────
-- [6] 인덱스
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_concept_notes_public_updated ON public.concept_notes USING btree (is_public, updated_at);

CREATE INDEX IF NOT EXISTS idx_exam_history_examination_id ON public.exam_history USING btree (examination_id);

CREATE INDEX IF NOT EXISTS idx_exam_history_taken_at ON public.exam_history USING btree (taken_at);

CREATE INDEX IF NOT EXISTS idx_exam_history_user_id ON public.exam_history USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_login_history_email ON public.login_history USING btree (email);

CREATE INDEX IF NOT EXISTS idx_login_history_login_at ON public.login_history USING btree (login_at);

CREATE INDEX IF NOT EXISTS idx_practice_history_user_email ON public.practice_history USING btree (user_email);

CREATE INDEX IF NOT EXISTS idx_questions_source_question_bank_id ON public.questions USING btree (source_question_bank_id);

CREATE INDEX IF NOT EXISTS idx_quiz_history_category_id ON public.quiz_history USING btree (category_id);

CREATE INDEX IF NOT EXISTS idx_quiz_history_created_at ON public.quiz_history USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_quiz_history_user_id ON public.quiz_history USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_user_exam_applications_exam_info_id ON public.user_exam_applications USING btree (exam_info_id);

CREATE INDEX IF NOT EXISTS idx_user_exam_applications_user_id ON public.user_exam_applications USING btree (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_nickname_lower ON public.users USING btree (lower((nickname)::text));


COMMIT;


-- ─────────────────────────────────────────────────────────────
-- [7] 적용 후 검증
-- ─────────────────────────────────────────────────────────────

-- 7-1) 테이블 33개가 모두 있는지 (기대값: 33, missing 없음)
SELECT count(*) AS table_count
FROM pg_tables
WHERE schemaname = 'public';

SELECT t AS missing_table
FROM unnest(ARRAY[
    'attachments','concept_notes','dialect_conversion_rules','domain_master','domain_slave',
    'exam_history','exam_history_details','exam_info','exam_session','examinations','exams',
    'faqs','inquiries','login_history','menu_config','notion_integrations','permission_detail',
    'permission_master','prac_departments','prac_employees','prac_orders','prac_products',
    'practice_history','question_bank','questions','quiz_history','quotes','support_settings',
    'user_exam_applications','user_granted_permissions','user_interested_exam',
    'user_question_bookmarks','users'
]) AS t
WHERE NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t
);

-- 7-2) 컬럼 총계 (기대값: 279)
SELECT count(*) AS column_count
FROM information_schema.columns
WHERE table_schema = 'public';

-- 7-3) 제약조건/인덱스 개수 (기대값: PK 33, FK 32, 인덱스 14+)
SELECT contype, count(*)
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public'
GROUP BY contype
ORDER BY contype;

-- 7-4) [4] 단계로 nullable 하게 추가된 컬럼이 있는지 점검
--      (부분 적용 로컬 전용. 신규 DB 면 결과가 비어 있어야 정상)
--      결과가 나오면: 해당 컬럼 데이터 백필 후
--      ALTER TABLE <t> ALTER COLUMN <c> SET NOT NULL; 을 수동 실행.
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND is_nullable = 'YES'
  AND (table_name, column_name) IN (
      -- 원본 스키마에서 NOT NULL 인 컬럼 목록
('attachments', 'id'),
      ('attachments', 'created_at'),
      ('attachments', 'file_url'),
      ('attachments', 'original_filename'),
      ('attachments', 'stored_filename'),
      ('concept_notes', 'id'),
      ('concept_notes', 'content'),
      ('concept_notes', 'created_at'),
      ('concept_notes', 'is_public'),
      ('concept_notes', 'title'),
      ('concept_notes', 'user_id'),
      ('dialect_conversion_rules', 'id'),
      ('dialect_conversion_rules', 'admin_label'),
      ('dialect_conversion_rules', 'complex'),
      ('dialect_conversion_rules', 'dialect'),
      ('dialect_conversion_rules', 'display_order'),
      ('dialect_conversion_rules', 'enabled'),
      ('dialect_conversion_rules', 'rule_key'),
      ('dialect_conversion_rules', 'user_label'),
      ('domain_master', 'id'),
      ('domain_master', 'name'),
      ('domain_slave', 'id'),
      ('domain_slave', 'display_order'),
      ('domain_slave', 'name'),
      ('domain_slave', 'master_id'),
      ('exam_history', 'id'),
      ('exam_history', 'correct_count'),
      ('exam_history', 'score'),
      ('exam_history', 'taken_at'),
      ('exam_history', 'total_questions'),
      ('exam_history', 'examination_id'),
      ('exam_history', 'user_id'),
      ('exam_history_details', 'id'),
      ('exam_history_details', 'content'),
      ('exam_history_details', 'correct'),
      ('exam_history_details', 'question_type'),
      ('exam_history_details', 'seq'),
      ('exam_history_details', 'exam_history_id'),
      ('exam_history_details', 'disable_alternative_answer'),
      ('exam_info', 'id'),
      ('exam_info', 'created_at'),
      ('exam_info', 'display_order'),
      ('exam_info', 'exam_type'),
      ('exam_info', 'is_active'),
      ('exam_info', 'title'),
      ('exam_session', 'id'),
      ('exam_session', 'started_at'),
      ('exam_session', 'examination_id'),
      ('exam_session', 'user_id'),
      ('examinations', 'id'),
      ('examinations', 'created_at'),
      ('examinations', 'time_limit'),
      ('examinations', 'title'),
      ('examinations', 'category_id'),
      ('examinations', 'created_by'),
      ('examinations', 'exam_paper_id'),
      ('examinations', 'is_ai_custom'),
      ('examinations', 'del_yn'),
      ('examinations', 'use_yn'),
      ('exams', 'id'),
      ('exams', 'created_at'),
      ('exams', 'del_yn'),
      ('exams', 'order_no'),
      ('exams', 'question_mode'),
      ('exams', 'title'),
      ('exams', 'created_by'),
      ('exams', 'use_yn'),
      ('faqs', 'id'),
      ('faqs', 'answer'),
      ('faqs', 'created_at'),
      ('faqs', 'display_order'),
      ('faqs', 'is_active'),
      ('faqs', 'question'),
      ('inquiries', 'id'),
      ('inquiries', 'content'),
      ('inquiries', 'created_at'),
      ('inquiries', 'inquiry_type'),
      ('inquiries', 'status'),
      ('inquiries', 'title'),
      ('inquiries', 'user_id'),
      ('login_history', 'id'),
      ('login_history', 'email'),
      ('login_history', 'ip_address'),
      ('login_history', 'login_at'),
      ('login_history', 'member_name'),
      ('menu_config', 'id'),
      ('menu_config', 'created_at'),
      ('menu_config', 'display_order'),
      ('menu_config', 'is_active'),
      ('menu_config', 'menu_type'),
      ('menu_config', 'name'),
      ('menu_config', 'url'),
      ('notion_integrations', 'id'),
      ('notion_integrations', 'access_token_enc'),
      ('notion_integrations', 'created_at'),
      ('notion_integrations', 'user_id'),
      ('permission_detail', 'id'),
      ('permission_detail', 'created_at'),
      ('permission_detail', 'name'),
      ('permission_detail', 'master_id'),
      ('permission_master', 'id'),
      ('permission_master', 'code'),
      ('permission_master', 'created_at'),
      ('permission_master', 'name'),
      ('prac_departments', 'id'),
      ('prac_departments', 'name'),
      ('prac_employees', 'id'),
      ('prac_employees', 'name'),
      ('prac_orders', 'id'),
      ('prac_orders', 'customer_name'),
      ('prac_orders', 'quantity'),
      ('prac_orders', 'order_date'),
      ('prac_products', 'id'),
      ('prac_products', 'name'),
      ('practice_history', 'id'),
      ('practice_history', 'executed_at'),
      ('practice_history', 'sql_content'),
      ('practice_history', 'user_email'),
      ('question_bank', 'id'),
      ('question_bank', 'create_dt'),
      ('question_bank', 'create_uno'),
      ('question_bank', 'del_yn'),
      ('question_bank', 'modified_dt'),
      ('question_bank', 'modified_uno'),
      ('question_bank', 'use_yn'),
      ('question_bank', 'content'),
      ('question_bank', 'question_type'),
      ('question_bank', 'disable_alternative_answer'),
      ('questions', 'id'),
      ('questions', 'content'),
      ('questions', 'question_type'),
      ('questions', 'seq'),
      ('questions', 'exam_id'),
      ('questions', 'disable_alternative_answer'),
      ('questions', 'del_yn'),
      ('questions', 'use_yn'),
      ('quiz_history', 'id'),
      ('quiz_history', 'correct'),
      ('quiz_history', 'created_at'),
      ('quiz_history', 'question_type'),
      ('quiz_history', 'user_id'),
      ('quotes', 'id'),
      ('quotes', 'content'),
      ('quotes', 'created_at'),
      ('quotes', 'use_yn'),
      ('support_settings', 'id'),
      ('user_exam_applications', 'id'),
      ('user_exam_applications', 'user_id'),
      ('user_exam_applications', 'exam_name'),
      ('user_exam_applications', 'created_at'),
      ('user_granted_permissions', 'user_id'),
      ('user_granted_permissions', 'detail_id'),
      ('user_interested_exam', 'id'),
      ('user_interested_exam', 'domain_slave_id'),
      ('user_interested_exam', 'user_id'),
      ('user_question_bookmarks', 'id'),
      ('user_question_bookmarks', 'created_at'),
      ('user_question_bookmarks', 'question_bank_id'),
      ('user_question_bookmarks', 'user_id'),
      ('users', 'id'),
      ('users', 'created_at'),
      ('users', 'email'),
      ('users', 'name'),
      ('users', 'role')
  )
ORDER BY table_name, column_name;


-- ─────────────────────────────────────────────────────────────
-- ROLLBACK (필요 시 별도 트랜잭션으로 실행)
-- ─────────────────────────────────────────────────────────────
-- 이 파일은 "스키마 전체 생성"이므로 개별 롤백이 아니라 스키마 초기화가 롤백이다.
-- 데이터가 전부 사라지므로 신규 DB 를 잘못 세팅했을 때만 사용할 것.
--
-- BEGIN;
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- COMMIT;
