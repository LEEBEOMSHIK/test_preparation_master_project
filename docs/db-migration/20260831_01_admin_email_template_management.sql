BEGIN;

CREATE TABLE IF NOT EXISTS email_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    scope VARCHAR(50) NOT NULL,
    subject_template VARCHAR(200) NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT NOT NULL,
    active BOOLEAN NOT NULL,
    system_key VARCHAR(80) UNIQUE,
    created_by_admin_id BIGINT REFERENCES users(id),
    updated_by_admin_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP,
    deleted_by_admin_id BIGINT REFERENCES users(id),
    CONSTRAINT email_templates_scope_check CHECK (scope IN ('INQUIRY_STATUS'))
);

CREATE TABLE IF NOT EXISTS email_template_bindings (
    event_code VARCHAR(80) PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES email_templates(id) ON DELETE RESTRICT,
    created_by_admin_id BIGINT REFERENCES users(id),
    updated_by_admin_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

ALTER TABLE inquiry_email_deliveries ADD COLUMN IF NOT EXISTS html_body TEXT;

DO $$
DECLARE
    current_definition TEXT;
    current_statuses TEXT[];
BEGIN
    SELECT pg_get_constraintdef(c.oid)
    INTO current_definition
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = CURRENT_SCHEMA()
      AND t.relname = 'inquiries'
      AND c.conname = 'inquiries_status_check';

    SELECT ARRAY(
        SELECT value[1]
        FROM regexp_matches(COALESCE(current_definition, ''), '''([A-Z_]+)''', 'g') AS matched(value)
        ORDER BY value[1]
    )
    INTO current_statuses;

    IF current_statuses <> ARRAY[
        'ANSWERED',
        'COMPLETED',
        'IN_PROGRESS',
        'ON_HOLD',
        'PENDING',
        'UNABLE_TO_PROCESS'
    ]::TEXT[] THEN
        IF current_definition IS NOT NULL THEN
            ALTER TABLE inquiries DROP CONSTRAINT inquiries_status_check;
        END IF;

        ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check CHECK
            (status IN ('PENDING','IN_PROGRESS','ON_HOLD','ANSWERED','COMPLETED','UNABLE_TO_PROCESS'));
    END IF;
END $$;

WITH seed_guard AS (
    SELECT NOT EXISTS (
        SELECT 1 FROM email_templates
        WHERE system_key IN (
            'INQUIRY_ANSWERED_DEFAULT',
            'INQUIRY_COMPLETED_DEFAULT',
            'INQUIRY_UNABLE_TO_PROCESS_DEFAULT'
        )
    ) AS should_seed
), inserted AS (
    INSERT INTO email_templates
        (name, scope, subject_template, html_body, text_body, active, system_key, created_at, updated_at)
    SELECT seed.name, 'INQUIRY_STATUS', seed.subject_template, seed.html_body,
           seed.text_body, true, seed.system_key,
           CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM seed_guard
    CROSS JOIN (VALUES
        ('INQUIRY_ANSWERED_DEFAULT', '문의 답변 완료 안내',
         '[TPMP] 문의 답변이 완료되었습니다: {{inquiryTitle}}',
         '<h2>{{serviceName}} 문의 상태 안내</h2><p>{{recipientName}}님, 접수하신 문의에 대한 답변이 완료되었습니다.</p><p><strong>접수 번호</strong>: {{inquiryId}}<br><strong>접수 유형</strong>: {{inquiryType}}<br><strong>제목</strong>: {{inquiryTitle}}<br><strong>현재 상태</strong>: {{statusLabel}}</p><p><a href="{{inquiryDetailUrl}}">문의 상세에서 답변 확인하기</a></p><p>이 메일은 상태 변경 안내이며 관리자 답변 내용은 문의 상세에서 확인할 수 있습니다.</p>',
         '{{serviceName}} 문의 상태 안내 {{recipientName}}님, 접수하신 문의에 대한 답변이 완료되었습니다. 접수 번호: {{inquiryId}} 접수 유형: {{inquiryType}} 제목: {{inquiryTitle}} 현재 상태: {{statusLabel}} 문의 상세에서 답변 확인하기 {{inquiryDetailUrl}} 이 메일은 상태 변경 안내이며 관리자 답변 내용은 문의 상세에서 확인할 수 있습니다.'),
        ('INQUIRY_COMPLETED_DEFAULT', '문의 처리 완료 안내',
         '[TPMP] 문의 처리가 완료되었습니다: {{inquiryTitle}}',
         '<h2>{{serviceName}} 문의 상태 안내</h2><p>{{recipientName}}님, 요청하신 사항의 처리가 완료되었습니다.</p><p><strong>접수 번호</strong>: {{inquiryId}}<br><strong>접수 유형</strong>: {{inquiryType}}<br><strong>제목</strong>: {{inquiryTitle}}<br><strong>현재 상태</strong>: {{statusLabel}}</p><p><a href="{{inquiryDetailUrl}}">문의 상세 확인하기</a></p><p>이 메일은 상태 변경 안내이며 관리자 답변 내용과는 별도로 발송되었습니다.</p>',
         '{{serviceName}} 문의 상태 안내 {{recipientName}}님, 요청하신 사항의 처리가 완료되었습니다. 접수 번호: {{inquiryId}} 접수 유형: {{inquiryType}} 제목: {{inquiryTitle}} 현재 상태: {{statusLabel}} 문의 상세 확인하기 {{inquiryDetailUrl}} 이 메일은 상태 변경 안내이며 관리자 답변 내용과는 별도로 발송되었습니다.'),
        ('INQUIRY_UNABLE_TO_PROCESS_DEFAULT', '문의 처리 불가 안내',
         '[TPMP] 문의 처리 결과를 안내드립니다: {{inquiryTitle}}',
         '<h2>{{serviceName}} 문의 상태 안내</h2><p>{{recipientName}}님, 요청하신 사항을 현재 처리하기 어려워 결과를 안내드립니다.</p><p><strong>접수 번호</strong>: {{inquiryId}}<br><strong>접수 유형</strong>: {{inquiryType}}<br><strong>제목</strong>: {{inquiryTitle}}<br><strong>현재 상태</strong>: {{statusLabel}}</p><p><a href="{{inquiryDetailUrl}}">문의 상세 확인하기</a></p><p>이 메일은 상태 변경 안내이며 상세 사유가 등록된 경우 문의 상세에서 확인할 수 있습니다.</p>',
         '{{serviceName}} 문의 상태 안내 {{recipientName}}님, 요청하신 사항을 현재 처리하기 어려워 결과를 안내드립니다. 접수 번호: {{inquiryId}} 접수 유형: {{inquiryType}} 제목: {{inquiryTitle}} 현재 상태: {{statusLabel}} 문의 상세 확인하기 {{inquiryDetailUrl}} 이 메일은 상태 변경 안내이며 상세 사유가 등록된 경우 문의 상세에서 확인할 수 있습니다.')
    ) AS seed(system_key, name, subject_template, html_body, text_body)
    ON CONFLICT (system_key) DO NOTHING
    RETURNING id, system_key
)
INSERT INTO email_template_bindings
    (event_code, template_id, created_at, updated_at)
SELECT mapping.event_code, inserted.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM inserted
JOIN (VALUES
    ('INQUIRY_ANSWERED_DEFAULT', 'INQUIRY_ANSWERED'),
    ('INQUIRY_COMPLETED_DEFAULT', 'INQUIRY_COMPLETED'),
    ('INQUIRY_UNABLE_TO_PROCESS_DEFAULT', 'INQUIRY_UNABLE_TO_PROCESS')
) AS mapping(system_key, event_code) ON mapping.system_key = inserted.system_key
CROSS JOIN seed_guard
WHERE seed_guard.should_seed
ON CONFLICT (event_code) DO NOTHING;

COMMIT;
