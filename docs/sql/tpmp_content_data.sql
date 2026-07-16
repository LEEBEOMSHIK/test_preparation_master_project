-- ==========================================================
-- TPMP 콘텐츠 데이터 덤프 (data-only, ON CONFLICT DO NOTHING)
-- 생성 시각: 2026-07-17 04:36:52
--
-- [포함] 도메인(카테고리/시험유형/연도/회차) · 문항은행(question_bank)
--        · 시험지(exams)/시험(examinations)/시험문항(questions) · 시험정보
--        · SQL 방언 변환규칙 · 연습용 샘플 DB(prac_*) · 개념노트
-- [제외] users · *_history · exam_session · notion_integrations · 북마크
--        · user_interested_exam · 권한/메뉴(앱이 시드) 등 개인/인증/자동시드 데이터
--
-- 로드 방법:
--   docker exec -i tpmp-db psql -U tpmp -d tpmp < docs/sql/tpmp_content_data.sql
-- 백엔드가 이미 도메인/사용자(admin=1, user=2)를 시드한 상태에서 로드해도
-- ON CONFLICT DO NOTHING 이라 기존 행은 건너뛰고 새 콘텐츠만 채워집니다.
-- 가장 깔끔한 결과를 원하면 신규(빈) DB에 백엔드 최초 기동 후 로드하세요.
-- ==========================================================
BEGIN;

-- ============ domain_master ============
INSERT INTO public.domain_master (id, code, name) VALUES (1, 'QUESTION_TYPE', '문제 유형') ON CONFLICT DO NOTHING;
INSERT INTO public.domain_master (id, code, name) VALUES (2, 'EXAM_TYPE', '시험 유형') ON CONFLICT DO NOTHING;
INSERT INTO public.domain_master (id, code, name) VALUES (3, 'EXAM_YEAR', '시험 연도') ON CONFLICT DO NOTHING;
INSERT INTO public.domain_master (id, code, name) VALUES (4, 'EXAM_ROUND', '시험 회차') ON CONFLICT DO NOTHING;
INSERT INTO public.domain_master (id, code, name) VALUES (5, 'INQUIRY_CATEGORY', '문의 카테고리') ON CONFLICT DO NOTHING;

-- ============ domain_slave ============
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (1, 1, '운영체제', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (2, 2, 'SQL', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (3, 3, '프로그래밍 언어', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (4, 4, '네트워크', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (5, 5, '정보보안', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (6, 1, 'SQLD', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (7, 2, '정보처리기사 실기', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (8, 3, '정보처리기사 필기', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (9, 4, '리눅스마스터 1급', 2) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (10, 1, '2026', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (11, 2, '2025', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (12, 3, '2024', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (13, 4, '2023', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (14, 5, '2022', 3) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (15, 1, '1', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (16, 2, '2', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (17, 3, '3', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (18, 4, '4', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (19, 5, '5', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (20, 6, '6', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (21, 7, '7', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (22, 8, '8', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (23, 9, '9', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (24, 10, '10', 4) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (25, 1, 'EXAM', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (26, 2, 'CONCEPT_NOTE', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (27, 3, 'DAILY_QUIZ', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (28, 4, 'PRACTICE', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (29, 5, 'OTHER', 5) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (30, 6, '소프트웨어공학', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (31, 7, '관계형 DB 이론', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.domain_slave (id, display_order, name, master_id) VALUES (33, 8, '웹 기술', 1) ON CONFLICT DO NOTHING;

-- ============ exams ============
INSERT INTO public.exams (id, created_at, del_yn, order_no, question_mode, title, created_by) VALUES (1, '2026-05-29 09:53:13.075239', 'N', 1, 'SEQUENTIAL', '2024년 3회 정보처리기사 실기', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.exams (id, created_at, del_yn, order_no, question_mode, title, created_by) VALUES (2, '2026-05-29 09:53:13.400828', 'N', 2, 'SEQUENTIAL', '2025년 1회 정보처리기사 실기', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.exams (id, created_at, del_yn, order_no, question_mode, title, created_by) VALUES (3, '2026-05-29 09:53:13.467609', 'N', 3, 'SEQUENTIAL', '2025년 2회 정보처리기사 실기', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.exams (id, created_at, del_yn, order_no, question_mode, title, created_by) VALUES (4, '2026-05-29 09:53:13.53012', 'N', 4, 'SEQUENTIAL', '2025년 3회 정보처리기사 실기', 1) ON CONFLICT DO NOTHING;
INSERT INTO public.exams (id, created_at, del_yn, order_no, question_mode, title, created_by) VALUES (5, '2026-05-29 09:53:13.728815', 'N', 5, 'SEQUENTIAL', '2026년 1회 정보처리기사 실기', 1) ON CONFLICT DO NOTHING;

-- ============ examinations ============
INSERT INTO public.examinations (id, created_at, time_limit, title, category_id, created_by, exam_paper_id) VALUES (10, '2026-06-13 02:07:00.370894', 150, '2024년 3회 정보처리기사 실기', 7, 1, 1) ON CONFLICT DO NOTHING;
INSERT INTO public.examinations (id, created_at, time_limit, title, category_id, created_by, exam_paper_id) VALUES (11, '2026-06-13 02:07:00.391068', 150, '2025년 1회 정보처리기사 실기', 7, 1, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.examinations (id, created_at, time_limit, title, category_id, created_by, exam_paper_id) VALUES (12, '2026-06-13 02:07:00.411877', 150, '2025년 2회 정보처리기사 실기', 7, 1, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.examinations (id, created_at, time_limit, title, category_id, created_by, exam_paper_id) VALUES (13, '2026-06-13 02:07:00.432395', 150, '2025년 3회 정보처리기사 실기', 7, 1, 4) ON CONFLICT DO NOTHING;
INSERT INTO public.examinations (id, created_at, time_limit, title, category_id, created_by, exam_paper_id) VALUES (14, '2026-06-13 02:07:00.455255', 150, '2026년 1회 정보처리기사 실기', 7, 1, 5) ON CONFLICT DO NOTHING;

-- ============ questions ============
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (56, '3 1 2', '#include <stdio.h>
struct node {
    int p;
    struct node* n;
};
int main() {
    struct node a = {1, NULL};
    struct node b = {2, NULL};
    struct node c = {3, NULL};
    a.n = &b; b.n = &c; c.n = NULL;
    c.n = &a; a.n = &b; b.n = NULL;
    struct node* head = &c;
    printf("%d %d %d", head->p, head->n->p, head->n->n->p);
    return 0;
}', '<p>다음 C 코드의 실행 결과를 쓰시오.</p>', '재연결 후: c.n=&a, a.n=&b, b.n=NULL. head=&c. head->p=3, head->n->p=a.p=1, head->n->n->p=b.p=2', 'c', '[]', 'CODE', 16, NULL, 3, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (75, '0', '#include <stdio.h>
int main() {
    int x=7, y=4, z;
    z = y%3<3 ? 2 : 1;
    z = z & z >> 1;
    z = x>5 && z<=3 ? z*x : z/x;
    printf("%d", z);
    return 0;
}', '<p>다음 C 코드의 실행 결과를 쓰시오.</p>', 'y%3=1, 1<3 참 → z=2. z&(z>>1)=2&1=0. x>5&&z<=3 → 참이지만 z=0. z*x=0*7=0', 'c', '[]', 'CODE', 15, NULL, 4, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (92, '32', '#include <stdio.h>
struct fns {
    int* (*fn)(int*);
} mine;
int* dummy(int *d) {
    return d + 1;
}
int main() {
    struct fns mine;
    int n[] = {16, 32};
    mine.fn = dummy;
    printf("%d", *mine.fn(n));
    return 0;
}', '<p>다음 C 코드의 실행 결과를 쓰시오.</p>', 'mine.fn(n)은 n+1 즉 &n[1]을 반환하고, *(&n[1]) = 32', 'c', '[]', 'CODE', 12, NULL, 5, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (100, '1. 절차 / 2. 교환 / 3. 기능', '', '<p>응집도의 유형에 대한 설명이다. 괄호 안에 들어갈 알맞은 용어를 쓰시오.</p>
<ol>
<li>( 1 )적 응집도는 모듈이 다수의 관련 기능을 가질 때, 모듈 안의 구성요소들이 그 기능을 순차적으로 수행하는 경우의 응집도이다.</li>
<li>( 2 )적 응집도는 동일한 입력과 출력을 사용하여 서로 다른 기능을 수행하는 활동들이 모여 있는 경우의 응집도이다.</li>
<li>( 3 )적 응집도는 모듈 내부의 모든 기능이 단일한 목적을 위해 수행되는 경우의 응집도이다.</li>
</ol>', '', 'other', '[]', 'SHORT_ANSWER', 20, NULL, 5, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (81, '106.00', '#include <stdio.h>
double arr1(int p[], int len) {
    double av = 0;
    int i;
    for (i = 0; i < len; i++) {
        av += (double) p[i];
    }
    return av / len;
}
double arr2(int * p, int len) {
    double av = 0;
    int i;
    for (i = 0; i < len; i++) {
        av += (double)(*(p + i));
    }
    return av / len;
}
int main() {
    int arr[10] = {80, 20, 50, 55, 45, 95, 55, 10, 40, 80};
    int len = 10;
    printf("%.2f", arr1(arr, len) + arr2(arr, len));
    return 0;
}', '<p>다음 C 코드의 실행 결과를 쓰시오.</p>', 'arr1과 arr2는 동일한 배열의 평균을 각각 구하므로 53.00 + 53.00 = 106.00', 'c', '[]', 'CODE', 1, NULL, 5, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (67, '187', '#include <stdio.h>
struct Node {
    struct Node* next;
    unsigned int x;
};
int main() {
    struct Node t1 = { 0, 5u };
    struct Node t2 = { 0, 7u };
    struct Node t3 = { 0, 11u };
    t3.next = &t2;
    t2.next = &t1;
    struct Node* curr = &t3;
    int sum = 0;
    while (curr) {
        sum = sum * 3 + curr->x;
        curr = curr->next;
    }
    sum = (sum ^ 42u) + 100u;
    printf("%u\n", sum);
}', '<p>다음 C 코드의 실행 결과를 쓰시오.</p>', 't3→t2→t1 순서로 순회. sum: 0*3+11=11 → 11*3+7=40 → 40*3+5=125. 125^42=87. 87+100=187', 'c', '[]', 'CODE', 7, NULL, 4, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (66, 'E', '#include <stdio.h>
int main(void) {
    char str[] = "REPUBLICOFKOREA";
    int a = 0;
    while (str[a] != ''\0'')
        ++a;
    putchar(str[a - 2]);
    return 0;
}', '<p>다음 C 코드의 실행 결과를 쓰시오.</p>', 'str 길이는 15. a=15(null 위치). str[15-2]=str[13]=''E''', 'c', '[]', 'CODE', 6, NULL, 4, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (65, 'C', '#include <stdio.h>
struct Test {
    int i;
    const char *g;
};
int main() {
    struct Test test[] = {{1, "AB"}, {2, "DC"}, {3, "EB"}};
    struct Test *p = &test[1];
    printf("%s", p->g + (p->i - 1));
    return 0;
}', '<p>다음 C 코드의 실행 결과를 쓰시오.</p>', 'p는 test[1]을 가리키며 i=2, g="DC". p->g + (p->i - 1) = "DC" + 1 = "C" 출력', 'c', '[]', 'CODE', 5, NULL, 4, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (58, 'TSEB', '#include <stdio.h>
#include <stdlib.h>
struct node {
    char c;
    struct node* p;
};
struct node* func(char* s) {
    struct node* h = NULL, *n;
    while (*s) {
        n = malloc(sizeof(struct node));
        n->c = *s++;
        n->p = h;
        h = n;
    }
    return h;
}
int main() {
    struct node* n = func("BEST");
    while (n) {
        putchar(n->c);
        struct node* t = n;
        n = n->p;
        free(t);
    }
    return 0;
}', '<p>다음 C 코드의 실행 결과를 쓰시오.</p>', 'func은 문자를 스택처럼 역순으로 연결. B→E→S→T 순으로 삽입되므로 헤드는 T. T→S→E→B 순으로 출력 → ''TSEB''', 'c', '[]', 'CODE', 18, NULL, 3, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (54, '5 그리고 6', '#include <stdio.h>
struct dat {
    int x;
    int y;
};
int main() {
    struct dat a[] = {{1, 2}, {3, 4}, {5, 6}};
    struct dat* ptr = a;
    struct dat** pptr = &ptr;
    (*pptr)[1] = (*pptr)[2];
    printf("%d 그리고 %d", a[1].x, a[1].y);
    return 0;
}', '<p>다음 C 코드의 실행 결과를 쓰시오.</p>', '(*pptr)=ptr=a. (*pptr)[1]=a[1], (*pptr)[2]=a[2]={5,6}. a[1]에 a[2] 복사 → a[1]={5,6}', 'c', '[]', 'CODE', 14, NULL, 3, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (52, '2 그리고 3', '#include <stdio.h>
#define SIZE 3
typedef struct {
    int a[SIZE];
    int front;
    int rear;
} Queue;
void enq(Queue* q, int val) {
    q->a[q->rear] = val;
    q->rear = (q->rear + 1) % SIZE;
}
int deq(Queue* q) {
    int val = q->a[q->front];
    q->front = (q->front + 1) % SIZE;
    return val;
}
int main() {
    Queue q = {{0}, 0, 0};
    enq(&q, 1); enq(&q, 2); deq(&q); enq(&q, 3);
    int first = deq(&q);
    int second = deq(&q);
    printf("%d 그리고 %d", first, second);
    return 0;
}', '<p>다음 C 코드의 실행 결과를 쓰시오.</p>', 'enq 1,2 → deq(반환1) → enq 3. 큐 상태:[2,3]. deq→2, deq→3. 출력: ''2 그리고 3''', 'c', '[]', 'CODE', 12, NULL, 3, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (83, 'ㄱ. 요구사항 분석 / ㄴ. 개념적 설계 / ㄷ. 논리적 설계 / ㄹ. 물리적 설계 / ㅁ. 구현', '', '<p>데이터베이스 설계 절차를 순서대로 나타낸 것이다. 각 빈칸에 들어갈 알맞은 용어를 쓰시오.</p>
<p>( ㄱ ) → ( ㄴ ) → ( ㄷ ) → ( ㄹ ) → ( ㅁ )</p>', '', 'other', '[]', 'SHORT_ANSWER', 3, NULL, 5, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (85, 'ISMS', '', '<p>다음 용어의 영문 약자를 쓰시오.</p><p>정보보호 관리체계 : 조직의 정보보호 정책을 수립하고 위험을 관리하여 지속적으로 보호수준을 유지하는 체계</p>', '', 'other', '[]', 'SHORT_ANSWER', 5, NULL, 5, 5) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (86, '1. 정보 / 2. 감독 / 3. 비번호 / 4. 비동기 균형 모드 / 5. 비동기 응답 모드', '', '<p>HDLC는 비트 중심의 데이터 링크 제어 프로토콜로, 프레임 단위로 데이터를 전송하며 흐름 제어 및 오류 복구 기능을 제공한다. 다음 설명에 알맞은 용어를 쓰시오.</p>
<ol>
<li>HDLC 프레임의 구성 단위로, 실제 사용자 데이터를 전송하는 프레임</li>
<li>데이터 링크의 흐름을 관리하고 오류 제어 및 통신 상태를 감시하는 프레임</li>
<li>순서 번호 없이 링크 설정, 해제, 모드 설정 등 제어 기능을 수행하는 프레임</li>
<li>두 국(Station)이 동등한 위치에서 서로 명령과 응답을 주고받는 모드</li>
<li>종국(Secondary)이 주국(Primary)의 허가 없이도 자발적으로 응답을 전송할 수 있는 모드</li>
</ol>', '', 'other', '[]', 'SHORT_ANSWER', 6, NULL, 5, 4) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (97, '1123', 'public class Main {
    public static void main(String[] args) {
        int x1 = 9;
        int x2 = 2;
        String x3 = "3";
        System.out.println(x1 + x2 + "2" + x3);
    }
}', '<p>다음 Java 코드의 실행 결과를 쓰시오.</p>', 'x1+x2=11(정수), 11+"2"="112"(문자열), "112"+x3="1123"', 'java', '[]', 'CODE', 17, NULL, 5, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (87, '2', 'class A {
    String f(Object x) {
        return "1";
    }
    String g() {
        return f("a");
    }
}
class B extends A {
    String f(Object x) {
        return "2";
    }
    String f(String x) {
        return "3";
    }
}
public class Main {
    public static void main(String[] args) {
        A a = new B();
        System.out.println(a.g());
    }
}', '<p>다음 Java 코드의 실행 결과를 쓰시오.</p>', 'a는 A 타입이지만 실제 객체는 B이다. g()는 A에 정의되고 f("a")를 호출할 때 정적 바인딩으로 f(Object)를 호출하므로, B의 f(Object)가 동적 바인딩되어 "2" 반환', 'java', '[]', 'CODE', 7, NULL, 5, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (77, 'AB', 'enum Tri {
    A("A"), B("AB"), C("ABC");
    private String code;
    Tri(String code) {
        this.code = code;
    }
    public String code() {
        return code;
    }
}
public class Main {
    public static void main(String[] args) {
        Tri t = Tri.values()[Tri.A.name().length()];
        System.out.print(t.code());
    }
}', '<p>다음 Java 코드의 실행 결과를 쓰시오.</p>', 'Tri.A.name()=''A'', length()=1. Tri.values()[1]=Tri.B. Tri.B.code()=''AB''', 'java', '[]', 'CODE', 17, NULL, 4, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (72, '100', 'class Rectangle {
    int width, height;
    Rectangle(int width, int height) {
        this.width = width;
        this.height = height;
    }
}
class Square extends Rectangle {
    Square(int a) {
        super(a, a);
    }
    int getSquareArea() {
        return width * height;
    }
}
public class Main {
    public static void main(String[] args) {
        Square sq = new Square(10);
        System.out.println(sq.getSquareArea());
    }
}', '<p>다음 Java 코드의 실행 결과를 쓰시오.</p>', 'super(a, a)는 부모 Rectangle 생성자를 호출. width=height=10. 10*10=100', 'java', '[]', 'CODE', 12, NULL, 4, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (55, '1a3b3', 'public class Main {
    public static class BO {
        public int v;
        public BO(int v) { this.v = v; }
    }
    public static void main(String[] args) {
        BO a = new BO(1);
        BO b = new BO(2);
        BO c = new BO(3);
        BO[] arr = {a, b, c};
        BO t = arr[0];
        arr[0] = arr[2];
        arr[2] = t;
        arr[1].v = arr[0].v;
        System.out.println(a.v + "a" + b.v + "b" + c.v);
    }
}', '<p>다음 Java 코드의 실행 결과를 쓰시오.</p>', 'arr 스왑: arr[0]=c, arr[2]=a. arr[1].v=arr[0].v=c.v=3 → b.v=3. a.v=1, b.v=3, c.v=3. 출력: 1a3b3', 'java', '[]', 'CODE', 15, NULL, 3, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (50, '5P', 'public class Main {
    public static class Parent {
        public int x(int i) { return i + 2; }
        public static String id() { return "P"; }
    }
    public static class Child extends Parent {
        public int x(int i) { return i + 3; }
        public String x(String s) { return s + "R"; }
        public static String id() { return "C"; }
    }
    public static void main(String[] args) {
        Parent ref = new Child();
        System.out.println(ref.x(2) + ref.id());
    }
}', '<p>다음 Java 코드의 실행 결과를 쓰시오.</p>', 'ref.x(2): 인스턴스 메서드는 동적 바인딩 → Child.x(2)=2+3=5. ref.id(): 정적 메서드는 정적 바인딩 → Parent.id()=''P''. 출력: ''5P''', 'java', '[]', 'CODE', 10, NULL, 3, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (49, '19', 'public class Main {
    static interface F {
        int apply(int x) throws Exception;
    }
    public static int run(F f) {
        try {
            return f.apply(3);
        } catch (Exception e) {
            return 7;
        }
    }
    public static void main(String[] args) {
        F f = (x) -> {
            if (x > 2) {
                throw new Exception();
            }
            return x * 2;
        };
        System.out.print(run(f) + run((int n) -> n + 9));
    }
}', '<p>다음 Java 코드의 실행 결과를 쓰시오.</p>', 'run(f): x=3>2 → 예외 발생 → catch에서 7 반환. run(n->n+9): 3+9=12 반환. 7+12=19', 'java', '[]', 'CODE', 9, NULL, 3, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (45, 'BB', 'public class Main {
    public static void change(String[] data, String s) {
        data[0] = s;
        s = "Z";
    }
    public static void main(String[] args) {
        String data[] = { "A" };
        String s = "B";
        change(data, s);
        System.out.print(data[0] + s);
    }
}', '<p>다음 Java 코드의 실행 결과를 쓰시오.</p>', 'data는 배열 참조 전달 → data[0]=''B''로 변경됨. s는 값 복사 전달 → 원본 s=''B'' 유지. 출력: ''B''+''B''=''BB''', 'java', '[]', 'CODE', 5, NULL, 3, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (88, 'veDamuH', 'i = input()
x = []
for word in i.split():
    x.append(word)
y = ''''.join(x)
z = ''''.join(c for c in y[::-1] if c not in ''ong'')
print(z)', '<p>다음 Python 코드에서 입력값이 <strong>HumanDev</strong>일 때의 실행 결과를 쓰시오.</p>', 'y=''HumanDev'', 역순=''veDnamuH'', ''o'',''n'',''g'' 제거 → ''veDamuH''', 'python', '[]', 'CODE', 8, NULL, 5, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (89, '1. 200 / 2. 3 / 3. 1', '', '<p>STUDENT 테이블에는 컴퓨터과 50명, 인터넷과 100명, 사무자동화과 50명이 저장되어 있다. 다음 각 SQL 구문의 실행 결과로 조회되는 행의 수를 쓰시오.</p>
<ol>
<li><code>SELECT DEPT FROM STUDENT;</code></li>
<li><code>SELECT DISTINCT DEPT FROM STUDENT;</code></li>
<li><code>SELECT COUNT(DISTINCT DEPT) FROM STUDENT WHERE DEPT = ''컴퓨터과'';</code></li>
</ol>', '', 'other', '[]', 'SHORT_ANSWER', 9, NULL, 5, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (90, '① CONSTRAINT / ② FOREIGN / ③ TEAM_ID / ④ REFERENCES / ⑤ TEAM_ID2', '', '<p>다음 조건을 참고하여 괄호 ①~⑤에 들어갈 적절한 예약어 또는 칼럼명을 쓰시오.</p>
<p><strong>조건:</strong></p>
<ul>
<li>외래키 제약 조건의 이름은 TEAM_TF로 지정</li>
<li>PLAYER 테이블의 TEAM_ID 칼럼이 외래키 역할</li>
<li>TEAM 테이블의 TEAM_ID2 칼럼을 참조 대상으로 지정</li>
</ul>
<pre><code>CREATE TABLE PLAYER (
  PLAYER_ID    CHAR(7)      NOT NULL,
  PLAYER_NAME  VARCHAR2(20) NOT NULL,
  TEAM_ID      CHAR(3)      NOT NULL,
  PRIMARY KEY (PLAYER_ID),
  ( ① ) TEAM_TF
  ( ② ) KEY ( ③ )
  ( ④ ) TEAM ( ⑤ )
);</code></pre>', '', 'other', '[]', 'SHORT_ANSWER', 10, NULL, 5, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (91, 'a. 192.168.10.0/23 / b. 192.168.12.0/23', '', '<p>다음 조건을 참고하여 호스트 a, b의 네트워크 주소를 CIDR 표기법으로 쓰시오.</p>
<ul>
<li>호스트 a의 IP 주소: 192.168.11.20</li>
<li>호스트 b의 IP 주소: 192.168.12.200</li>
<li>서브넷 마스크: 255.255.254.0</li>
</ul>', '', 'other', '[]', 'SHORT_ANSWER', 11, NULL, 5, 4) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (94, '10', 'def f(a):
    m = [[x] for x in a]
    b = m[:]
    for i in range(len(b) - 1):
        b[i+1] += b[i]
    return sum(len(x) for x in m)
print(f([1, 2, 3, 4]))', '<p>다음 Python 코드의 실행 결과를 쓰시오.</p>', 'b=m[:]은 얕은 복사로 내부 리스트를 공유. b[i+1]+=b[i]는 in-place 확장이므로 m도 같이 변경됨. 최종 m 길이 합: 1+2+3+4=10', 'python', '[]', 'CODE', 14, NULL, 5, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (93, '9A7A5A3A1A', 'lst = list(range(10))
for c in lst[::-2]:
    print(c, end=''A'')
print()', '<p>다음 Python 코드의 실행 결과를 쓰시오.</p>', 'range(10) = [0..9], [::-2]는 9,7,5,3,1 순으로 출력하며 각 뒤에 ''A'' 붙임', 'python', '[]', 'CODE', 13, NULL, 5, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (69, '{0: (15, 5), 1: (10, 3), 2: (18, 5), 3: (9, 2)}', 'data = [
    [3, 5, 2, 4, 1],
    [4, 5, 1],
    [4, 4, 1, 5, 4],
    [4, 5]
]
result = {}
for index, lis in enumerate(data):
    list_sum = sum(lis)
    list_len = len(lis)
    result[index] = (list_sum, list_len)
print(result)', '<p>다음 Python 코드의 실행 결과를 쓰시오.</p>', '각 리스트의 합과 길이를 튜플로 딕셔너리에 저장', 'python', '[]', 'CODE', 9, NULL, 4, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (57, '2', 'lst = [1, 2, 3]
dst = {i: i * 2 for i in lst}
s = set(dst.values())
lst[0] = 99
dst[2] = 7
s.add(99)
print(len(s & set(dst.values())))', '<p>다음 Python 코드의 실행 결과를 쓰시오.</p>', 'dst={1:2,2:4,3:6}. s={2,4,6}. dst[2]=7 → dst={1:2,2:4,3:7}. s.add(99)→s={2,4,6,99}. set(dst.values())={2,4,7}. 교집합={2,4}. len=2', 'python', '[]', 'CODE', 17, NULL, 3, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (95, '심볼릭링크', '', '<p>다음 설명에 해당하는 공격 기법을 &lt;보기&gt;에서 고르시오.</p>
<blockquote>원본 데이터 파일은 별도로 존재하며, 공격자는 해당 파일의 경로를 가리키는 특수 파일을 생성한다. 프로그램이 임시 파일을 생성할 때 공격자가 미리 만들어 놓은 특수 파일로 대체되어 원본 파일이 덮어쓰여지거나 조작될 수 있다.</blockquote>
<p><strong>&lt;보기&gt;</strong> 하드링크 / 심볼릭링크 / 소프트링크 / 정적링크 / 동적링크</p>', '', 'other', '[]', 'SHORT_ANSWER', 15, NULL, 5, 5) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (96, '워터링 홀 (Watering Hole)', '', '<p>다음 설명에 해당하는 보안 공격 기법의 이름을 쓰시오.</p>
<blockquote>공격자는 목표 대상이 자주 방문하는 합법적인 웹사이트에 악성코드를 삽입한다. 방문자 중 특정 조건(IP 대역, 브라우저 버전 등)에 해당하는 사용자에게만 선택적으로 악성코드를 실행시켜 특정 조직이나 인물을 집중적으로 공격한다.</blockquote>', '', 'other', '[]', 'SHORT_ANSWER', 16, NULL, 5, 5) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (98, '2', '', '<p>다음 테이블과 SQL 구문을 참고하여 실행 결과로 조회되는 행의 수를 쓰시오.</p>
<p>EMP 테이블과 DEPT 테이블을 JOIN하고 서브쿼리로 특정 조건의 사원만 조회한다.</p>
<p>(복원 문제로 정확한 SQL은 생략)</p>', '', 'other', '[]', 'SHORT_ANSWER', 18, NULL, 5, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (82, 'ㄱ. Bridge / ㄴ. Observer', '', '<p>다음 설명에 해당하는 디자인 패턴의 유형을 괄호 안에 쓰시오.</p>
<ul>
<li>( ㄱ ) 패턴은 기능의 클래스 계층과 구현의 클래스 계층을 연결하며, 구현에서 추상을 분리하여 독립적으로 다양성을 가질 수 있도록 한다.</li>
<li>( ㄴ ) 패턴은 한 객체의 상태가 바뀌면 그 객체에 의존하는 다른 객체들에게 연락이 가고 자동으로 내용이 갱신되는 방식으로 일대다 의존성을 정의한다.</li>
</ul>', '', 'other', '[]', 'SHORT_ANSWER', 2, NULL, 5, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (84, '1. 운영 / 2. 자원 / 3. 성능', '', '<p>다음은 비기능적 요구사항에 대한 설명이다. 각 항목이 의미하는 요구사항 유형을 &lt;보기&gt;에서 골라 쓰시오.</p>
<ol>
<li>시스템 운영 중 로그 관리 및 모니터링 기능을 제공해야 한다.</li>
<li>시스템 운영 시 최소 메모리 용량을 확보해야 하며, 자원 사용량은 제한 범위 내에 있어야 한다.</li>
<li>사용자 요청에 대한 응답 시간은 최대 1분을 초과하지 않아야 한다.</li>
</ol>
<p><strong>&lt;보기&gt;</strong> 신뢰성, 가용성, 운영, 유지보수성, 자원, 성능, 이식성, 보안, 품질</p>', '', 'other', '[]', 'SHORT_ANSWER', 4, NULL, 5, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (99, '1. 스텁(Stub) / 2. 드라이버(Driver)', '', '<p>통합 테스트에서 사용되는 더미 모듈에 대한 설명이다. 괄호 안에 들어갈 알맞은 용어를 쓰시오.</p>
<ol>
<li>( 1 )은/는 하위 모듈을 대신하여 단순한 결과값만 반환하도록 임시로 작성된 더미 모듈로, 하향식 통합 테스트 수행 시 필요하다.</li>
<li>( 2 )은/는 상위 모듈을 대신하여 하위 모듈의 데이터 입력과 출력을 확인하기 위한 더미 모듈로, 상향식 통합 테스트 수행 시 필요하다.</li>
</ol>', '', 'other', '[]', 'SHORT_ANSWER', 19, NULL, 5, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (61, '패키지 다이어그램', '', '<p>다음 설명에 해당하는 UML 다이어그램의 명칭을 쓰시오.</p>
<blockquote>폴더 모양의 단위로 구성 요소들을 그룹화하여 표현하며, 각 그룹 간의 의존 관계를 나타내는 구조 다이어그램이다. 소프트웨어의 전체 구조와 구성 요소 사이의 관계를 시각적으로 표현할 때 사용한다.</blockquote>', '', 'other', '[]', 'SHORT_ANSWER', 1, NULL, 4, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (62, '조건 커버리지', '', '<p>다음 설명에 해당하는 화이트박스 테스트 커버리지 기법을 &lt;보기&gt;에서 고르시오.</p>
<blockquote>각 조건식이 True와 False 두 가지 경우를 모두 한 번 이상 만족하도록 테스트 케이스를 설계하는 기법이다.</blockquote>
<p><strong>&lt;보기&gt;</strong> 경로, 결정, 조건/결정, 변경 조건/결정, 다중 조건, 문장, 분기, 조건, 루프</p>', '결정(분기) 커버리지는 조건식 전체의 T/F를 다루고, 조건 커버리지는 개별 조건식 각각의 T/F를 다룬다.', 'other', '[]', 'SHORT_ANSWER', 2, NULL, 4, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (63, '1. pwd / 2. ls / 3. cd / 4. cp', '', '<p>다음 설명에 해당하는 유닉스/리눅스 명령어를 쓰시오.</p>
<ol>
<li>현재 작업 중인 디렉터리의 경로를 출력한다.</li>
<li>현재 디렉터리 내의 파일 및 디렉터리 목록을 표시한다.</li>
<li>다른 디렉터리로 이동한다.</li>
<li>파일을 다른 위치로 복사한다.</li>
</ol>', '', 'other', '[]', 'SHORT_ANSWER', 3, NULL, 4, 1) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (64, '① Hamming / ② FEC / ③ BEC / ④ Parity / ⑤ CRC', '', '<p>다음은 오류 검출 및 정정 방식에 관한 설명이다. 괄호 안에 알맞은 용어를 쓰시오.</p>
<ul>
<li>( ① ) 코드는 데이터 비트에 여러 개의 패리티 비트를 추가하여 오류를 검출하고 정정할 수 있는 자기 정정 코드이다.</li>
<li>( ② )는 수신 측에서 오류를 검출하고 스스로 수정하는 전진 오류 수정 방식이다.</li>
<li>( ③ )는 오류 검출 후 재전송을 요청하는 후진 오류 수정 방식이다.</li>
<li>( ④ ) 검사는 데이터 블록의 각 비트를 XOR 연산하여 오류를 검출하는 간단한 방식이다.</li>
<li>( ⑤ )는 다항식을 이용해 데이터를 나눈 나머지를 이용하여 오류를 검출하는 방식이다.</li>
</ul>', '', 'other', '[]', 'SHORT_ANSWER', 4, NULL, 4, 4) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (68, 'implements', '', '<p>다음 Java 코드에서 인터페이스를 구현할 때 사용하는 빈칸 ①에 들어갈 키워드를 쓰시오.</p>
<pre><code>interface Drawable {
    void draw();
}
class Circle ( ① ) Drawable {
    public void draw() {
        System.out.println("Circle");
    }
}</code></pre>', '', 'other', '[]', 'SHORT_ANSWER', 8, NULL, 4, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (70, '4', '', '<p>테이블 A의 컬럼 구조와 데이터가 아래와 같을 때, 다음 SQL의 실행 결과로 조회되는 행의 수를 쓰시오.</p>
<pre><code>SELECT * FROM A WHERE col1 IN (2, 3) OR col2 IN (3, 5);</code></pre>
<p>(복원 문제 — 테이블 A에 조건을 만족하는 행이 4개 존재)</p>', '', 'other', '[]', 'SHORT_ANSWER', 10, NULL, 4, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (71, 'OTP', '', '<p>다음 설명에 해당하는 인증 기술의 영문 약자를 쓰시오.</p>
<blockquote>한 번 사용하면 즉시 폐기되며 재사용이 불가능한 비밀번호를 생성하는 인증 기술이다. 특정 알고리즘을 통해 매번 다른 비밀번호를 생성하여 보안성을 높인다.</blockquote>', 'One Time Password. 시간 기반(TOTP) 또는 카운터 기반(HOTP) 방식으로 구현', 'other', '[]', 'SHORT_ANSWER', 11, NULL, 4, 5) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (73, 'OAuth', '', '<p>다음 설명에 해당하는 인증/인가 프로토콜의 명칭을 쓰시오.</p>
<blockquote>사용자가 새로운 사이트에 별도로 가입하지 않고 기존에 보유한 계정(Google, GitHub 등)으로 로그인할 수 있게 하며, 제3자 애플리케이션에 Access Token을 발급하여 제한된 자원에 접근할 수 있도록 하는 개방형 인증 표준 프로토콜이다.</blockquote>', '', 'other', '[]', 'SHORT_ANSWER', 13, NULL, 4, 5) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (78, 'ㄱ. MAC / ㄴ. RBAC / ㄷ. DAC', '', '<p>다음 설명에 해당하는 접근통제 모델의 명칭을 쓰시오.</p>
<ul>
<li>( ㄱ ) : 주체와 객체의 등급을 비교하여 접근 권한을 부여하며, 관리자가 중앙에서 통제하는 강제적 접근통제 모델이다.</li>
<li>( ㄴ ) : 사용자에게 역할을 부여하고 역할에 따라 접근 권한이 결정되는 역할 기반 접근통제 모델이다.</li>
<li>( ㄷ ) : 객체의 소유자가 접근 권한을 직접 설정하고 관리하는 임의적 접근통제 모델이다.</li>
</ul>', '', 'other', '[]', 'SHORT_ANSWER', 18, NULL, 4, 5) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (79, '1. 테스트 조건 / 2. 테스트 데이터 / 3. 예상 결과', '', '<p>테스트케이스(Test Case)의 구성요소를 순서대로 나열한 것이다. 빈칸에 들어갈 알맞은 용어를 쓰시오.</p>
<p>( 1 ) → ( 2 ) → ( 3 )</p>
<ul>
<li>( 1 ) : 테스트할 조건 또는 기능을 명세한 것</li>
<li>( 2 ) : 테스트 실행에 사용할 실제 입력값</li>
<li>( 3 ) : 테스트 수행 후 도출되어야 할 올바른 결과</li>
</ul>', '', 'other', '[]', 'SHORT_ANSWER', 19, NULL, 4, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (80, '4', '', '<p>테이블 A의 데이터가 아래 조건을 만족할 때, 다음 SQL의 실행 결과를 쓰시오.</p>
<pre><code>SELECT COUNT(col2)
FROM A
WHERE col1 IN (2, 3) OR col2 IN (3, 5);</code></pre>
<p>(복원 문제 — COUNT 결과: 조건을 만족하는 col2 값이 4개 존재)</p>', '', 'other', '[]', 'SHORT_ANSWER', 20, NULL, 4, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (76, 'ㄱ. 튜플 / ㄴ. 인스턴스 / ㄷ. 카디널리티', '', '<p>다음 설명에 해당하는 관계형 데이터베이스 용어를 쓰시오.</p>
<ul>
<li>( ㄱ ) : 릴레이션의 행(Row)에 해당하며, 테이블에서 하나의 레코드를 나타낸다.</li>
<li>( ㄴ ) : 릴레이션에 실제로 저장된 데이터의 집합 전체를 의미하며, 특정 시점의 데이터 상태이다.</li>
<li>( ㄷ ) : 릴레이션의 행의 수 또는 튜플의 개수를 나타낸다.</li>
</ul>', '', 'other', '[]', 'SHORT_ANSWER', 16, NULL, 4, 31) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (74, 'A, a1', '', '<p>관계형 데이터베이스의 나누기(Division) 연산 R ÷ S의 결과를 쓰시오.</p>
<p>R 테이블: {(A, a1, b1), (A, a1, b2), (B, a2, b1)} / S 테이블: {b1, b2}</p>
<p>(S의 모든 값과 매핑되는 R의 튜플에서 S 속성을 제외한 결과)</p>', 'a1은 b1, b2 모두와 매핑되므로 나누기 결과에 포함. a2는 b2가 없으므로 제외', 'other', '[]', 'SHORT_ANSWER', 14, NULL, 4, 31) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (41, '인덱스(색인)', '', '<p>다음 괄호 안에 들어갈 알맞은 파일 접근 방식을 쓰시오.</p>
<blockquote>파일 접근 방식에는 순차 접근 방법, ( ) 방법, 해싱 방법 등이 있다. 이 방식은 키 값을 통해 데이터를 직접 검색할 수 있도록 별도의 인덱스 구조를 유지한다.</blockquote>', '', 'other', '[]', 'SHORT_ANSWER', 1, NULL, 3, 1) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (42, 'ㄷ. Attribute', '', '<p>다음 보기의 용어 중 아래 설명에 해당하는 것을 고르시오.</p>
<p><strong>&lt;보기&gt;</strong> ㄱ. Tuple / ㄴ. Cardinality / ㄷ. Attribute / ㄹ. Domain / ㅁ. Degree</p>
<blockquote>릴레이션에서 열(Column)을 의미하며, 개체의 특성이나 상태를 기술하는 데이터 항목의 속성을 나타낸다.</blockquote>', '', 'other', '[]', 'SHORT_ANSWER', 2, NULL, 3, 31) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (43, 'SSH', '', '<p>다음 설명에 해당하는 보안 프로토콜의 영문 약자를 쓰시오.</p>
<blockquote>원격 접속 시 암호화된 통신을 제공하는 보안 접속용 프로토콜이다. Telnet의 보안 취약점을 보완하며, 포트 22번을 기본으로 사용한다. 공개키 암호화 방식을 통해 인증과 데이터 암호화를 지원한다.</blockquote>', 'Secure Shell. 네트워크 계층에서 안전한 원격 로그인 및 파일 전송을 위한 프로토콜', 'other', '[]', 'SHORT_ANSWER', 3, NULL, 3, 5) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (44, '1. SJF (Shortest Job First) / 2. SRT (Shortest Remaining Time)', '', '<p>다음 설명에 해당하는 CPU 스케줄링 알고리즘을 쓰시오.</p>
<ol>
<li>준비 큐에 있는 프로세스 중 CPU 버스트 시간이 가장 짧은 프로세스를 우선적으로 처리하는 비선점형 스케줄링 방식이다.</li>
<li>위 방식을 선점형으로 구현한 형태로, 실행 중인 프로세스보다 더 짧은 잔여 시간을 가진 프로세스가 도착하면 선점한다.</li>
</ol>', '', 'other', '[]', 'SHORT_ANSWER', 4, NULL, 3, 1) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (46, '① 128 / ② 62', '', '<p>IP 주소 223.13.234.132, 서브넷 마스크 255.255.255.192를 기준으로 다음 물음에 답하시오.</p>
<ol>
<li>해당 IP가 속한 서브넷의 네트워크 주소의 마지막 옥텟 값을 쓰시오.</li>
<li>해당 서브넷에서 사용 가능한 호스트 수를 쓰시오.</li>
</ol>', '255.255.255.192=/26. 마지막 옥텟 0,64,128,192 단위 분할. 132는 128 네트워크 대역. 호스트=2^6-2=62', 'other', '[]', 'SHORT_ANSWER', 6, NULL, 3, 4) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (47, 'Proxy', '', '<p>다음 설명에 해당하는 디자인 패턴의 이름을 쓰시오.</p>
<blockquote>실제 객체에 대한 접근을 제어하거나 추가적인 기능을 부여하기 위해 대리 객체(Surrogate)를 사용하는 구조 패턴이다. 원격 접근, 가상 접근, 보호 접근 등 다양한 용도로 활용된다.</blockquote>', '', 'other', '[]', 'SHORT_ANSWER', 7, NULL, 3, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (48, 'AJAX', '', '<p>다음 설명에 해당하는 웹 기술의 영문 약자를 쓰시오.</p>
<blockquote>웹 페이지 전체를 다시 로드하지 않고 필요한 데이터만 서버로부터 비동기적으로 받아 일부 콘텐츠만 동적으로 갱신할 수 있는 웹 개발 기술이다. JavaScript와 XML을 기반으로 하며 현재는 JSON과 함께 주로 사용된다.</blockquote>', 'Asynchronous JavaScript And XML', 'other', '[]', 'SHORT_ANSWER', 8, NULL, 3, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (51, '1-2-3-4-5-6-1, 1-2-4-5-7 (또는 동등한 경로 집합)', '', '<p>다음 제어 흐름 그래프에서 분기 커버리지(Branch Coverage)를 만족하는 테스트 경로를 쓰시오.</p>
<p>노드 번호: 1→2→3→4→5→6→7 (순차), 2→4 (분기), 5→7 (분기), 6→1 (반복)</p>
<p>분기 커버리지를 충족하는 최소 테스트 경로 집합을 쓰시오.</p>', '모든 엣지(분기)를 최소 한 번씩 커버하는 경로 집합', 'other', '[]', 'SHORT_ANSWER', 11, NULL, 3, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (53, '11.75ms', '', '<p>타임 퀀텀 4ms, 다음 4개의 프로세스에 대해 라운드로빈 스케줄링을 적용할 때 평균 대기시간을 구하시오.</p>
<table>
<tr><th>프로세스</th><th>도착시간</th><th>버스트 시간</th></tr>
<tr><td>P1</td><td>0</td><td>6ms</td></tr>
<tr><td>P2</td><td>0</td><td>8ms</td></tr>
<tr><td>P3</td><td>0</td><td>7ms</td></tr>
<tr><td>P4</td><td>0</td><td>3ms</td></tr>
</table>', '', 'other', '[]', 'SHORT_ANSWER', 13, NULL, 3, 1) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (59, 'SYN Flooding', '', '<p>다음 설명에 해당하는 네트워크 보안 공격의 명칭을 쓰시오.</p>
<blockquote>TCP 3-way handshake 과정의 취약점을 이용한 서비스 거부(DoS) 공격이다. 공격자는 출발지 IP를 위조한 대량의 SYN 패킷을 서버에 전송하여 서버가 SYN-ACK를 보내고 ACK를 기다리는 상태(Half-Open)를 유지하게 만들어 자원을 고갈시킨다.</blockquote>', '', 'other', '[]', 'SHORT_ANSWER', 19, NULL, 3, 5) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (60, '부장, 대리, 과장, 차장 (4개 튜플)', '', '<p>다음 employee 테이블에 대해 투영(Projection) 연산 π<sub>직급</sub>(employee)을 수행한 결과를 쓰시오.</p>
<table>
<tr><th>이름</th><th>직급</th><th>부서</th></tr>
<tr><td>홍길동</td><td>부장</td><td>영업부</td></tr>
<tr><td>이순신</td><td>대리</td><td>개발부</td></tr>
<tr><td>강감찬</td><td>과장</td><td>영업부</td></tr>
<tr><td>유관순</td><td>차장</td><td>인사부</td></tr>
<tr><td>김유신</td><td>대리</td><td>개발부</td></tr>
</table>
<p>(중복 제거 후 직급 열만 반환)</p>', '투영 연산은 특정 열만 선택하며 중복 제거. 대리가 2명이지만 중복 제거 후 4가지 직급만 반환', 'other', '[]', 'SHORT_ANSWER', 20, NULL, 3, 31) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (21, '① 세션 하이재킹 / ② (TCP) 세션 하이재킹', '', '<p>다음은 네트워크 보안에 관련된 문제이다. 괄호 안에 알맞은 용어를 작성하시오.</p><ul><li>( ① )은/는 ''세션을 가로채다''라는 의미로, 다른 사람의 세션 상태를 훔치거나 도용하여 액세스하는 해킹 기법이다.</li><li>TCP ( ② )은/는 TCP의 3-way 핸드셰이크가 완료된 후 공격자가 시퀀스 번호 등을 조작하여 정상적인 세션을 가로채고 인증 없이 통신을 탈취하는 공격이다.</li></ul>', '', 'other', '[]', 'SHORT_ANSWER', 1, NULL, 2, 5) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (23, 'CRC', '', '<p>아래 설명의 괄호 안에 들어갈 용어를 영문 약자로 작성하시오.</p><ul><li>( )은/는 3글자의 영어 약자로 이루어진 오류 검출 기법으로, 데이터를 전송하거나 저장할 때 데이터의 오류를 감지하는 데 사용된다.</li><li>데이터에 체크섬을 추가해 전송·저장한 뒤, 수신·읽을 때 체크섬을 다시 계산하여 데이터 변경 여부를 확인한다.</li><li>데이터는 이진수(0과 1)로 표현되며, 정해진 다항식(x³ + x + 1)을 기반으로 2진 나눗셈하여 그 나머지를 ( ) 값으로 삼는다.</li></ul>', '', 'other', '[]', 'SHORT_ANSWER', 3, NULL, 2, 4) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (24, 'ㄹ (스캐어웨어)', '', '<p>다음은 악성코드와 관련된 문제이다. 아래 설명에 해당하는 용어를 보기에서 골라 작성하시오.</p><ul><li>사용자가 원치 않는 소프트웨어를 구매하도록 조작하기 위해 사회공학을 사용하여 충격·불안·위협에 대한 인식을 유발하는 악성 소프트웨어이다.</li><li>''겁을 주다''라는 영어 단어에서 유래했으며, 공포를 이용해 피해자를 속여 대가를 지불하거나 특정 행동을 유도한다.</li><li>가짜 바이러스 경고나 시스템 문제를 표시하여 돈을 지불하거나 특정 소프트웨어를 설치하도록 속인다.</li></ul><p>[보기] ㄱ. 컴포넌트웨어 ㄴ. 유즈웨어 ㄷ. 셔블웨어 ㄹ. 스캐어웨어 ㅁ. 안티스파이웨어 ㅂ. 네트웨어 ㅅ. 그룹웨어 ㅇ. 애드웨어</p>', '', 'other', '[]', 'SHORT_ANSWER', 4, NULL, 2, 5) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (40, '4', 'public class Main {
  public static void main(String[] args) {
    System.out.println(calc("5"));
  }
  static int calc(int value) {
    if (value <= 1) return value;
    return calc(value - 1) + calc(value - 2);
  }
  static int calc(String str) {
    int value = Integer.valueOf(str);
    if (value <= 1) return value;
    return calc(value - 1) + calc(value - 3);
  }
}', '<p>다음 Java 코드의 실행 결과를 작성하시오.</p>', 'calc("5")는 String 오버로드 진입 후 calc(value-1)+calc(value-3) 분기, 이후 int 오버로드(피보나치형)로 재귀 → 4', 'java', '[]', 'CODE', 20, NULL, 2, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (36, '20', 'public class Main {
    public static void main(String[] args) {
        int[] data = {3, 5, 8, 12, 17};
        System.out.println(func(data, 0, data.length - 1));
    }
    static int func(int[] a, int st, int end) {
        if (st >= end) return 0;
        int mid = (st + end) / 2;
        return a[mid] + Math.max(func(a, st, mid), func(a, mid + 1, end));
    }
}', '<p>다음 Java 코드의 실행 결과를 작성하시오.</p>', '분할 재귀로 각 구간의 중앙값 a[mid]에 좌·우 재귀 중 큰 값을 더해 누적 → 20', 'java', '[]', 'CODE', 16, NULL, 2, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (33, '54', 'public class Main {
    public static void main(String[] args) {
        new Child();
        System.out.println(Parent.total);
    }
}
class Parent {
    static int total = 0;
    int v = 1;
    public Parent() {
        total += (++v);
        show();
    }
    public void show() {
        total += total;
    }
}
class Child extends Parent {
    int v = 10;
    public Child() {
        v += 2;
        total += v++;
        show();
    }
    @Override
    public void show() {
        total += total * 2;
    }
}', '<p>다음 Java 코드의 실행 결과를 작성하시오.</p>', 'Parent 생성자에서 total+=(++v)=2, 동적 바인딩된 Child.show()로 total+=total*2 → 6. 이후 Child 생성자에서 total+=12=18, 다시 show()로 total+=total*2 → 54', 'java', '[]', 'CODE', 13, NULL, 2, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (25, '출력1출력5', 'public class Main {
  public static void main(String[] args) {
    int a=5,b=0;
    try{
      System.out.print(a/b);
    }catch(ArithmeticException e){
      System.out.print("출력1");
    }catch(ArrayIndexOutOfBoundsException e) {
      System.out.print("출력2");
    }catch(NumberFormatException e) {
      System.out.print("출력3");
    }catch(Exception e){
      System.out.print("출력4");
    }finally{
      System.out.print("출력5");
    }
  }
}', '<p>다음 Java 코드의 실행 결과를 작성하시오.</p>', 'a/b는 5/0이므로 ArithmeticException 발생 → "출력1", finally 블록은 항상 실행되어 "출력5" 출력', 'java', '[]', 'CODE', 5, NULL, 2, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (19, 'B0', 'class Main {
  public static class Collection<T>{
    T value;
    public Collection(T t){
      value = t;
    }
    public void print(){
      new Printer().print(value);
    }
    class Printer{
      void print(Integer a){
        System.out.print("A" + a);
      }
      void print(Object a){
        System.out.print("B" + a);
      }
      void print(Number a){
        System.out.print("C" + a);
      }
    }
  }
  public static void main(String[] args) {
    new Collection<>(0).print();
  }
}', '<p>다음 Java 코드의 실행 결과를 작성하시오.</p>', 'value의 타입은 제네릭 T로 컴파일 시 Object로 소거되므로, 오버로딩 해석 결과 print(Object)가 선택되어 "B0" 출력', 'java', '[]', 'CODE', 19, NULL, 1, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (18, '101', 'public class ExceptionHandling {
  public static void main(String[] args) {
    int sum = 0;
    try {
      func();
    } catch (NullPointerException e) {
      sum = sum + 1;
    } catch (Exception e) {
      sum = sum + 10;
    } finally {
      sum = sum + 100;
    }
    System.out.print(sum);
  }
  static void func() throws Exception {
    throw new NullPointerException();
  }
}', '<p>다음 Java 코드의 실행 결과를 작성하시오.</p>', 'NullPointerException이 발생하여 첫 catch에서 sum=1, finally에서 +100 → 101', 'java', '[]', 'CODE', 18, NULL, 1, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (11, '52', 'public class Main{
  public static void main(String[] args){
    Base a = new Derivate();
    Derivate b = new Derivate();
    System.out.print(a.getX() + a.x + b.getX() + b.x);
  }
}
class Base{
  int x = 3;
  int getX(){
    return x * 2;
  }
}
class Derivate extends Base{
  int x = 7;
  int getX(){
    return x * 3;
  }
}', '<p>다음 Java 코드의 실행 결과를 작성하시오.</p>', '메서드는 동적 바인딩되어 a.getX()=b.getX()=7*3=21. 필드는 정적 타입을 따라 a.x=Base의 3, b.x=Derivate의 7 → 21+3+21+7 = 52', 'java', '[]', 'CODE', 11, NULL, 1, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (1, 'OOAAA', 'public class Main{
  static String[] s = new String[3];
  static void func(String[] s, int size){
    for(int i=1; i<size; i++){
      if(s[i-1].equals(s[i])){
        System.out.print("O");
      }else{
        System.out.print("N");
      }
    }
    for (String m : s){
      System.out.print(m);
    }
  }
  public static void main(String[] args){
    s[0] = "A";
    s[1] = "A";
    s[2] = new String("A");
    func(s, 3);
  }
}', '<p>다음 Java 코드의 실행 결과를 작성하시오.</p>', 'equals는 값 비교이므로 "A".equals("A")는 모두 true → "OO", 이후 배열 원소를 출력 → "AAA" → OOAAA', 'java', '[]', 'CODE', 1, NULL, 1, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (26, '(1) ARP / (2) RARP', '', '<p>아래는 ARP/RARP에 대한 설명이다. 각 설명에 해당하는 프로토콜을 작성하시오.</p><ul><li>( 1 )은/는 네트워크상에서 IP 주소를 MAC 주소로 변환하는 프로토콜이다.</li><li>( 2 )은/는 MAC 주소를 IP 주소로 변환하는 프로토콜이다.</li></ul>', '', 'other', '[]', 'SHORT_ANSWER', 6, NULL, 2, 4) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (28, '(1) ㄷ / (2) ㅁ / (3) ㅅ / (4) ㄱ', '', '<p>아래는 데이터베이스에 관련된 설명이다. 알맞은 용어를 보기에서 골라 괄호에 작성하시오.</p><ul><li>1. 릴레이션에서 속성(컬럼)의 개수를 의미: ( 1 )</li><li>2. 릴레이션에서 튜플(행)의 개수를 의미: ( 2 )</li><li>3. 한 릴레이션의 속성이 다른 릴레이션의 기본키를 참조할 때 그 속성을 의미: ( 3 )</li><li>4. 특정 속성에 입력될 수 있는 값의 유형·범위를 의미하며 무결성을 보장하는 기준: ( 4 )</li></ul><p>[보기] ㄱ. domain ㄴ. primary ㄷ. degree ㄹ. candidate ㅁ. cardinality ㅂ. attribute ㅅ. foreign</p>', '', 'other', '[]', 'SHORT_ANSWER', 8, NULL, 2, 31) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (29, 'ㄱ, ㄴ, ㄷ, ㄹ, ㅁ', '', '<p>IP 주소가 192.168.35.10, 서브넷 마스크가 255.255.252.0인 PC에서 브로드캐스트로 정보를 전달할 때, 수신할 수 있는 IP를 보기에서 모두 고르시오.</p><p>[보기]<br/>ㄱ. 192.168.34.1<br/>ㄴ. 192.168.32.19<br/>ㄷ. 192.168.35.200<br/>ㄹ. 192.168.33.138<br/>ㅁ. 192.168.35.50</p>', '서브넷 255.255.252.0 → 네트워크 범위 192.168.32.0 ~ 192.168.35.255. 보기의 모든 IP가 동일한 브로드캐스트 도메인에 속한다.', 'other', '[]', 'SHORT_ANSWER', 9, NULL, 2, 4) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (39, '908', '#include <stdio.h>
typedef struct student {
    char* name;
    int score[3];
} Student;
int dec(int enc) {
    return enc & 0xA5;
}
int sum(Student* p) {
    return dec(p->score[0]) + dec(p->score[1]) + dec(p->score[2]);
}
int main() {
    Student s[2] = { "Kim", {0xA0, 0xA5, 0xDB}, "Lee", {0xA0, 0xED, 0x81} };
    Student* p = s;
    int result = 0;
    for (int i = 0; i < 2; i++) {
        result += sum(&s[i]);
    }
    printf("%d", result);
    return 0;
}', '<p>다음 C 코드의 실행 결과를 작성하시오.</p>', '각 score를 0xA5와 비트 AND 한 값들의 합 → 908', 'c', '[]', 'CODE', 19, NULL, 2, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (38, '35421', '#include <stdio.h>
#include <stdlib.h>
typedef struct Data {
    int value;
    struct Data *next;
} Data;
Data* insert(Data* head, int value) {
    Data* new_node = (Data*)malloc(sizeof(Data));
    new_node->value = value;
    new_node->next = head;
    return new_node;
}
Data* reconnect(Data* head, int value) {
    if (head == NULL || head->value == value) return head;
    Data *prev = NULL, *curr = head;
    while (curr != NULL && curr->value != value) {
        prev = curr;
        curr = curr->next;
    }
    if (curr != NULL && prev != NULL) {
        prev->next = curr->next;
        curr->next = head;
        head = curr;
    }
    return head;
}
int main() {
    Data *head = NULL, *curr;
    for (int i = 1; i <= 5; i++)
        head = insert(head, i);
    head = reconnect(head, 3);
    for (curr = head; curr != NULL; curr = curr->next)
        printf("%d", curr->value);
    return 0;
}', '<p>다음 C 코드의 실행 결과를 작성하시오.</p>', 'insert로 5→4→3→2→1 구성 후 reconnect(3)으로 값 3 노드를 맨 앞으로 이동 → 35421', 'c', '[]', 'CODE', 18, NULL, 2, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (31, '13', '#include <stdio.h>
#include <stdlib.h>
void set(int** arr, int* data, int rows, int cols) {
    for (int i = 0; i < rows * cols; ++i) {
        arr[((i + 1) / rows) % rows][(i + 1) % cols] = data[i];
    }
}
int main() {
    int rows = 3, cols = 3, sum = 0;
    int data[] = {5, 2, 7, 4, 1, 8, 3, 6, 9};
    int** arr;
    arr = (int**) malloc(sizeof(int*) * rows);
    for (int i = 0; i < cols; i++) {
        arr[i] = (int*) malloc(sizeof(int) * cols);
    }
    set(arr, data, rows, cols);
    for (int i = 0; i < rows * cols; i++) {
        sum += arr[i / rows][i % cols] * (i % 2 == 0 ? 1 : -1);
    }
    for(int i=0; i<rows; i++) {
        free(arr[i]);
    }
    free(arr);
    printf("%d", sum);
}', '<p>다음 C 코드의 실행 결과를 작성하시오.</p>', 'set()의 인덱스 계산으로 배열을 채운 뒤, 짝수·홀수 인덱스에 +/- 부호를 교대 적용해 합산 → 13', 'c', '[]', 'CODE', 11, NULL, 2, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (30, '4
BACDE', '#include <stdio.h>
char Data[5] = {''B'', ''A'', ''D'', ''E''};
char c;
int main(){
    int i, temp, temp2;
    c = ''C'';
    printf("%d\n", Data[3]-Data[1]);
    for(i=0;i<5;++i){
        if(Data[i]>c)
            break;
    }
    temp = Data[i];
    Data[i] = c;
    i++;
    for(;i<5;++i){
        temp2 = Data[i];
        Data[i] = temp;
        temp = temp2;
    }
    for(i=0;i<5;i++){
        printf("%c", Data[i]);
    }
}', '<p>다음 C 코드의 실행 결과를 작성하시오.</p>', 'Data[3]-Data[1] = ''E''-''A'' = 4. 이후 ''C''를 알맞은 위치에 삽입하며 뒤 원소를 한 칸씩 밀어 BACDE 출력', 'c', '[]', 'CODE', 10, NULL, 2, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (16, '1', '#include <stdio.h>
void func(int** arr, int size){
  for(int i=0; i<size; i++){
    *(*arr + i) = (*(*arr+i) + i) % size;
  }
}
int main(){
  int arr[] = {3, 1, 4, 1, 5};
  int* p = arr;
  int** pp = &p;
  int num = 6;
  func(pp, 5);
  num = arr[2];
  printf("%d", num);
  return 0;
}', '<p>다음 C 코드의 실행 결과를 작성하시오.</p>', 'func는 arr[i] = (arr[i]+i)%5로 갱신 → arr[2] = (4+2)%5 = 1 → 출력 1', 'c', '[]', 'CODE', 16, NULL, 1, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (12, '312', '#include <stdio.h>
struct Node {
  int value;
  struct Node* next;
};
void func(struct Node* node){
  while(node != NULL && node->next != NULL){
    int t = node->value;
    node->value = node->next->value;
    node->next->value = t;
    node = node->next->next;
  }
}
int main(){
  struct Node n1 = {1, NULL};
  struct Node n2 = {2, NULL};
  struct Node n3 = {3, NULL};
  n1.next = &n3;
  n3.next = &n2;
  func(&n1);
  struct Node* current = &n1;
  while(current != NULL){
    printf("%d", current->value);
    current = current->next;
  }
  return 0;
}', '<p>다음 C 코드의 실행 결과를 작성하시오.</p>', '리스트는 1→3→2. func가 인접 쌍(n1,n3)의 값을 교환하여 3→1→2가 되고, 남은 노드는 한 개라 멈춤 → 출력 312', 'c', '[]', 'CODE', 12, NULL, 1, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (7, '20', '#include <stdio.h>
int func(){
  static int x = 0;
  x += 2;
  return x;
}
int main(){
  int x = 1;
  int sum = 0;
  for(int i=0; i<4; i++) {
    x++;
    sum += func();
  }
  printf("%d", sum);
  return 0;
}', '<p>다음 C 코드의 실행 결과를 작성하시오.</p>', 'static x는 호출마다 값을 유지하며 2, 4, 6, 8을 반환 → sum = 2+4+6+8 = 20', 'c', '[]', 'CODE', 7, NULL, 1, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (32, '(1) ㅁ / (2) ㄴ / (3) ㄹ', '', '<p>다음은 결합도(Coupling)와 관련된 설명이다. 보기에서 알맞은 답을 골라 작성하시오.</p><ul><li>(1) 다른 모듈 내부에 있는 변수나 기능을 다른 모듈에서 직접 사용하는 경우의 결합도</li><li>(2) 모듈 간 인터페이스로 배열·오브젝트·자료구조 등이 전달되는 경우의 결합도</li><li>(3) 파라미터가 아닌, 모듈 밖에 선언된 전역 변수를 참조·갱신하며 상호작용하는 경우의 결합도</li></ul><p>[보기] ㄱ. 자료 결합도 ㄴ. 스탬프 결합도 ㄷ. 제어 결합도 ㄹ. 공통 결합도 ㅁ. 내용 결합도 ㅂ. 외부 결합도</p>', '', 'other', '[]', 'SHORT_ANSWER', 12, NULL, 2, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (35, '① int a = 0 / ② a < m || b[a] < x / ③ b[a] < 0 / ④ b[a] = -b[a]; / ⑤ a++; / ⑥ return 1; / ⑦ ③ → ④ → ⑤ → ② → ⑥', '', '<p>문장(Statement) 커버리지 테스트를 수행하려고 한다. 아래 코드를 제어 흐름도 빈칸에 연결되도록 작성하고, 문장 커버리지 순서대로 작성하시오.</p><pre><code>int Main(int b[], int m, int x) {
    int a = 0;
    while (a &lt; m || b[a] &lt; x) {
        if (b[a] &lt; 0)
            b[a] = -b[a];
        a++;
    }
    return 1;
}</code></pre><p>1.( ① ) 2.( ② ) 3.( ③ ) 4.( ④ ) 5.( ⑤ ) 6.( ⑥ )</p><p>문장 커버리지 순서: 1 → 2 → ( ⑦ )</p>', '', 'other', '[]', 'SHORT_ANSWER', 15, NULL, 2, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (37, '13', 'class Node:
    def __init__(self, value):
        self.value = value
        self.children = []
def tree(li):
    nodes = [Node(i) for i in li]
    for i in range(1, len(li)):
        nodes[(i - 1) // 2].children.append(nodes[i])
    return nodes[0]
def calc(node, level=0):
    if node is None:
        return 0
    return (node.value if level % 2 == 1 else 0) + sum(calc(n, level + 1) for n in node.children)
li = [3, 5, 8, 12, 15, 18, 21]
root = tree(li)
print(calc(root))', '<p>다음 Python 코드의 실행 결과를 작성하시오.</p>', '리스트로 완전 이진 트리를 구성한 뒤 홀수 레벨(level%2==1) 노드의 값만 합산 → 5+8=13', 'python', '[]', 'CODE', 17, NULL, 2, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (10, '45', 'def func(value):
    if type(value) == type(100):
        return 100
    elif type(value) == type(""):
        return len(value)
    else:
        return 20
a = ''100.0''
b = 100.0
c = (100, 200)
print(func(a) + func(b) + func(c))', '<p>다음 Python 코드의 실행 결과를 작성하시오.</p>', 'a는 문자열이므로 len(''100.0'')=5, b는 float이므로 else 20, c는 tuple이므로 else 20 → 5+20+20 = 45', 'python', '[]', 'CODE', 10, NULL, 1, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (2, '3', 'def func(lst):
  for i in range(len(lst) // 2):
    lst[i], lst[-i-1] = lst[-i-1], lst[i]
lst = [1, 2, 3, 4, 5, 6]
func(lst)
print(sum(lst[::2]) - sum(lst[1::2]))', '<p>다음 Python 코드의 실행 결과를 작성하시오.</p>', 'func는 리스트를 뒤집어 [6,5,4,3,2,1]. 짝수 인덱스 합(6+4+2=12) - 홀수 인덱스 합(5+3+1=9) = 3', 'python', '[]', 'CODE', 2, NULL, 1, 3) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (27, 'name=이순신 / incentives=1000', '', '<p>다음은 SQL 문제이다. 아래 두 테이블 emp, sal을 참고하여 쿼리의 실행 결과를 작성하시오.</p><p><strong>[emp 테이블]</strong></p><table border="1"><thead><tr><th>id</th><th>name</th></tr></thead><tbody><tr><td>1001</td><td>김철수</td></tr><tr><td>1002</td><td>홍길동</td></tr><tr><td>1004</td><td>강감찬</td></tr><tr><td>1008</td><td>이순신</td></tr></tbody></table><p><strong>[sal 테이블]</strong></p><table border="1"><thead><tr><th>id</th><th>incentives</th></tr></thead><tbody><tr><td>1002</td><td>300</td></tr><tr><td>1004</td><td>300</td></tr><tr><td>1008</td><td>1000</td></tr><tr><td>1009</td><td>500</td></tr></tbody></table><pre><code>SELECT name, incentive
FROM emp, sal
WHERE emp.id = sal.id AND incentives &gt;= 500</code></pre>', 'emp와 sal을 id로 조인하면 홍길동(300)·강감찬(300)·이순신(1000)이 매칭되고, 그중 incentives가 500 이상인 행은 이순신(1000)뿐이다.', 'other', '[]', 'SHORT_ANSWER', 7, NULL, 2, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (22, 'ㄱ. 도메인 / ㄴ. 개체 / ㄷ. 참조', '', '<p>다음은 무결성 제약조건과 관련된 문제이다. 아래 표의 ( ㄱ )·( ㄴ )·( ㄷ )에 들어갈 무결성 제약조건의 종류를 보기에서 골라 작성하시오.</p><table border="1"><thead><tr><th>구분</th><th>( ㄱ ) 무결성 제약조건</th><th>( ㄴ ) 무결성 제약조건</th><th>( ㄷ ) 무결성 제약조건</th></tr></thead><tbody><tr><td>제약 대상</td><td>속성</td><td>튜플</td><td>속성과 튜플</td></tr><tr><td>NULL 값</td><td>-</td><td>기본키</td><td>외래키</td></tr><tr><td>릴레이션 내 제약조건의 개수</td><td>속성의 개수와 동일</td><td>1개</td><td>0~여러 개</td></tr><tr><td>기타</td><td>튜플 삽입/수정 시 제약사항 우선 확인</td><td>튜플 삽입/수정 시 제약사항 우선 확인</td><td>튜플 삽입/수정 시 제약사항 우선 확인, 부모 릴레이션의 튜플 수정/삭제 시 제약사항 우선 확인</td></tr></tbody></table><p>[보기] 개체, 참조, 도메인</p>', 'ㄱ은 속성 값이 정의된 범위(도메인)에 속해야 하므로 도메인 무결성, ㄴ은 기본키가 NULL일 수 없고 유일해야 하므로 개체 무결성, ㄷ은 외래키가 참조 대상의 기본키 값이거나 NULL이어야 하므로 참조 무결성이다.', 'other', '[]', 'SHORT_ANSWER', 2, NULL, 2, 31) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (34, 'Adapter', '', '<p>아래는 디자인 패턴에 대한 설명이다. 설명에 해당하는 패턴명을 보기에서 골라 작성하시오.</p><ul><li>서로 다른 인터페이스를 가진 클래스들을 연결해 함께 사용할 수 있게 한다.</li><li>기존 클래스(Adaptee)를 원하는 인터페이스(Target)에 맞게 변환하는 어댑터(Adapter)를 만든다.</li><li>기존 클래스를 감싸서(wrapper) 인터페이스를 변환하는 역할을 한다.</li></ul><p><strong>[보기]</strong></p><table border="1"><thead><tr><th>생성</th><th>구조</th><th>행위</th></tr></thead><tbody><tr><td>Singleton</td><td>Adapter</td><td>Strategy</td></tr><tr><td>Factory Method</td><td>Bridge</td><td>Template Method</td></tr><tr><td>Abstract Factory</td><td>Composite</td><td>Observer</td></tr><tr><td>Builder</td><td>Decorator</td><td>State</td></tr><tr><td>Prototype</td><td>Façade</td><td>Command</td></tr></tbody></table>', '기존 클래스(Adaptee)를 원하는 인터페이스(Target)에 맞게 변환·연결하는 구조(Structural) 패턴은 Adapter이다.', 'other', '[]', 'SHORT_ANSWER', 14, NULL, 2, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (3, '1', '', '<p>아래 employee 테이블과 project 테이블을 참고하여, 보기의 SQL 명령어 실행 결과를 작성하시오.</p><p><strong>[employee]</strong></p><table border="1"><thead><tr><th>no</th><th>first_name</th><th>last_name</th><th>project_id</th></tr></thead><tbody><tr><td>1</td><td>John</td><td>Doe</td><td>10</td></tr><tr><td>2</td><td>Jim</td><td>Carry</td><td>20</td></tr><tr><td>3</td><td>Rachel</td><td>Redmond</td><td>10</td></tr></tbody></table><p><strong>[project]</strong></p><table border="1"><thead><tr><th>project_id</th><th>name</th></tr></thead><tbody><tr><td>10</td><td>Alpha</td></tr><tr><td>20</td><td>Beta</td></tr><tr><td>10</td><td>Gamma</td></tr></tbody></table><pre><code>SELECT count(*)
FROM employee AS e JOIN project AS p ON e.project_id = p.project_id
WHERE p.name IN (
    SELECT name FROM project p WHERE p.project_id IN (
        SELECT project_id FROM employee GROUP BY project_id HAVING count(*) &lt; 2
    )
);</code></pre>', '서브쿼리: employee가 1건뿐인 project_id=20(Beta)을 구함. 외부 조인 결과 중 name=''Beta''인 행은 Jim 1건 → count(*) = 1', 'other', '[]', 'SHORT_ANSWER', 3, NULL, 1, 2) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (4, '12', '', '<p>다음 페이지 참조 순서를 참고하여, 할당된 프레임 수가 3개일 때 LRU 알고리즘의 페이지 부재(Page Fault) 횟수를 작성하시오.</p><p>페이지 참조 순서: 7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1</p>', '', 'other', '[]', 'SHORT_ANSWER', 4, NULL, 1, 1) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (5, '스머프(Smurf) 또는 스머핑(Smurfing)', '', '<p>다음은 네트워크 취약점에 대한 문제이다. 아래 설명에 해당하는 용어를 작성하시오.</p><ul><li>IP나 ICMP의 특성을 악용하여 엄청난 양의 데이터를 한 사이트에 집중적으로 보냄으로써 네트워크의 일부를 불능 상태로 만드는 공격이다.</li><li>여러 호스트가 특정 대상에게 다량의 ICMP Echo Reply를 보내게 하여 서비스 거부(DoS)를 유발시키는 보안 공격이다.</li><li>공격 대상 호스트는 다량으로 유입되는 패킷으로 인해 서비스 불능 상태에 빠진다.</li></ul>', '', 'other', '[]', 'SHORT_ANSWER', 5, NULL, 1, 5) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (6, '행위(Behavioral)', '', '<p>다음은 GoF 디자인 패턴과 관련된 문제이다. 괄호 안에 알맞은 용어를 작성하시오.</p><ul><li>( ) 패턴은 클래스나 객체들이 서로 상호작용하는 방법이나 책임 분배 방법을 정의하는 패턴이다.</li><li>( ) 패턴은 객체들 간의 통신 방법을 정의하고 알고리즘을 캡슐화하여 객체 간의 결합도를 낮춘다.</li><li>( ) 패턴에는 Chain of Responsibility, Command, Observer 패턴 등이 있다.</li></ul>', '', 'other', '[]', 'SHORT_ANSWER', 6, NULL, 1, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (8, '개체(Entity) 무결성', '', '<p>다음은 무결성 제약조건에 대한 문제이다. 아래 표(StudentID가 기본키)에서 위반한 ( ) 무결성의 종류를 작성하시오.</p><table border="1"><thead><tr><th>StudentID (PK)</th><th>Name</th><th>Age</th><th>Major</th></tr></thead><tbody><tr><td>101</td><td>Alice</td><td>20</td><td>Computer Science</td></tr><tr><td>102</td><td>Bob</td><td>21</td><td>Mathematics</td></tr><tr><td>101</td><td>David</td><td>23</td><td>Chemistry</td></tr><tr><td>NULL</td><td>Eve</td><td>22</td><td>Biology</td></tr></tbody></table>', '기본키 StudentID에 중복값(101)과 NULL(Eve)이 존재한다. 기본키는 유일하고 NULL일 수 없으므로 개체 무결성을 위반한다.', 'other', '[]', 'SHORT_ANSWER', 8, NULL, 1, 31) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (9, '43125', '', '<p>다음은 URL 구조에 관한 문제이다. 아래 URL의 (1)~(5) 영역에 대해, 보기의 용어 순서대로 해당하는 번호를 작성하시오.</p><pre><code>foo://localhost:8080/over/there?name=ferret#nose
(1) foo   (2) localhost:8080   (3) /over/there   (4) name=ferret   (5) nose</code></pre><p>[보기]<br/>query : 서버에 전달할 추가 데이터<br/>path : 서버 내의 특정 자원을 가리키는 경로<br/>scheme : 리소스에 접근하는 방법이나 프로토콜<br/>authority : 사용자 정보, 호스트명, 포트 번호<br/>fragment : 특정 문서 내의 위치</p>', 'URL 구조는 scheme(1)://authority(2)/path(3)?query(4)#fragment(5). 보기 순서(query, path, scheme, authority, fragment) → 4, 3, 1, 2, 5', 'other', '[]', 'SHORT_ANSWER', 9, NULL, 1, 33) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (13, '1. 문장 / 2. 분기 / 3. 조건', '', '<p>다음은 테스트 커버리지에 대한 문제이다. 아래 설명에 알맞은 답을 보기에서 골라 작성하시오.</p><ul><li>1. 테스트를 통해 프로그램의 모든 문장을 최소한 한 번씩 실행했는지를 측정</li><li>2. 프로그램 내의 모든 분기(조건문)의 각 분기를 최소한 한 번씩 실행했는지를 측정</li><li>3. 복합 조건 내의 각 개별 조건이 참과 거짓으로 평가되는 경우를 모두 테스트했는지를 측정</li></ul><p>[보기] ㄱ. 조건 ㄴ. 경로 ㄷ. 결정 ㄹ. 분기 ㅁ. 함수 ㅂ. 문장 ㅅ. 루프</p>', '', 'other', '[]', 'SHORT_ANSWER', 13, NULL, 1, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (14, '(1) 연관 / (2) 일반화 / (3) 의존', '', '<p>아래는 UML 클래스의 관계에 관한 문제이다. 보기를 보고 (1)~(3)에 알맞은 관계를 골라 작성하시오.</p><ul><li>(1) ''차''와 ''타이어·바퀴·엔진''이 실선으로 연결된 관계</li><li>(2) ''버스·택시·승용차''가 속이 빈 삼각형 화살표(▷)로 ''차''를 가리키는 관계</li><li>(3) ''텔레비전''이 점선 화살표(⇢)로 ''리모콘''을 가리키는 관계</li></ul><p>[보기] ㄱ. 의존 ㄴ. 연관 ㄷ. 일반화</p>', '', 'other', '[]', 'SHORT_ANSWER', 14, NULL, 1, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (15, '(1) 외래키 / (2) 후보키 / (3) 대체키 / (4) 슈퍼키', '', '<p>다음은 데이터베이스 키에 관한 문제이다. 아래 설명에 알맞은 답을 보기에서 골라 작성하시오.</p><ul><li>(1) 다른 테이블(릴레이션)의 기본 키를 참조하는 속성 또는 속성들의 집합</li><li>(2) 테이블에서 각 행을 유일하게 식별할 수 있는 최소한의 속성들의 집합</li><li>(3) 후보 키 중에서 선정된 기본 키를 제외한 나머지 후보 키</li><li>(4) 테이블에서 각 행을 유일하게 식별할 수 있는 속성들의 집합</li></ul><p>[보기] ㄱ. 슈퍼키 ㄴ. 외래키 ㄷ. 대체키 ㄹ. 후보키</p>', '', 'other', '[]', 'SHORT_ANSWER', 15, NULL, 1, 31) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (17, 'VPN', '', '<p>다음 설명을 보고 알맞은 용어를 3글자(영문 약자)로 작성하시오.</p><ul><li>공용 네트워크를 통해 사설 네트워크를 확장하는 기술이다.</li><li>사용자의 IP 주소를 숨기고, 사용자가 어디에서 접속하는지를 추적하기 어렵게 만든다.</li><li>종류로는 IPsec, SSL, L2TP 등이 있다.</li></ul>', '', 'other', '[]', 'SHORT_ANSWER', 17, NULL, 1, 5) ON CONFLICT DO NOTHING;
INSERT INTO public.questions (id, answer, code, content, explanation, language, options, question_type, seq, source_file, exam_id, category_id) VALUES (20, 'ㄹ. Ad-hoc Network', '', '<p>다음은 네트워크에 대한 문제이다. 아래 설명을 보고 알맞은 용어를 보기에서 골라 작성하시오.</p><ul><li>중앙 관리나 고정된 인프라 없이 임시로 구성되는 네트워크이다.</li><li>일반적으로 무선 통신을 통해 노드들이 직접 연결되어 데이터를 주고받는다.</li><li>긴급 구조, 긴급 회의, 군사적 상황 등에서 유용하게 활용될 수 있다.</li></ul><p>[보기] ㄱ. Infrastructure Network ㄴ. Firmware Network ㄷ. Peer-to-Peer Network ㄹ. Ad-hoc Network ㅁ. Mesh Network ㅂ. Sensor Network ㅅ. Virtual Private Network</p>', '', 'other', '[]', 'SHORT_ANSWER', 20, NULL, 1, 4) ON CONFLICT DO NOTHING;

-- ============ question_bank ============
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (5, '2026-05-29 01:16:43.935619', 1, 'N', '2026-07-08 16:08:44.384283', 1, 'Y', 'ISMS', NULL, '<p>정보보호 관리체계 : 조직의 정보보호 정책을 수립하고 위험을 관리하여 지속적으로 보호수준을 유지하는 체계</p>', 1, 2026, NULL, 'other', NULL, 'SHORT_ANSWER', '2026년 1회 5번 — 정보보호 관리체계 약자', 5, 7, NULL, NULL, NULL, NULL, NULL, '다음 용어의 영문 약자를 쓰시오.', 5, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (11, '2026-05-29 01:16:43.939618', 1, 'N', '2026-07-08 16:10:55.955643', 1, 'Y', 'a. 192.168.10.0/23 / b. 192.168.12.0/23', NULL, '<p><br></p><ul><li>호스트 a의 IP 주소: 192.168.11.20</li><li>호스트 b의 IP 주소: 192.168.12.200</li><li>서브넷 마스크: 255.255.254.0</li></ul>', 1, 2026, NULL, 'other', NULL, 'SHORT_ANSWER', '2026년 1회 11번 — IP 네트워크 주소 (CIDR)', 4, 7, NULL, NULL, NULL, NULL, NULL, '다음 조건을 참고하여 호스트 a, b의 네트워크 주소를 CIDR 표기법으로 쓰시오.', 11, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (12, '2026-05-29 01:16:43.939618', 1, 'N', '2026-05-29 01:16:43.939618', 1, 'Y', '32', '#include <stdio.h>
struct fns {
    int* (*fn)(int*);
} mine;
int* dummy(int *d) {
    return d + 1;
}
int main() {
    struct fns mine;
    int n[] = {16, 32};
    mine.fn = dummy;
    printf("%d", *mine.fn(n));
    return 0;
}', '<p>다음 C 코드의 실행 결과를 쓰시오.</p>', 1, 2026, 'mine.fn(n)은 n+1 즉 &n[1]을 반환하고, *(&n[1]) = 32', 'c', '[]', 'CODE', '2026년 1회 12번 — C언어 구조체 함수 포인터', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 12, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (3, '2026-05-29 01:16:43.933619', 1, 'N', '2026-07-08 22:46:00.091026', 1, 'Y', 'ㄱ. 요구사항 분석 / ㄴ. 개념적 설계 / ㄷ. 논리적 설계 / ㄹ. 물리적 설계 / ㅁ. 구현', NULL, '<p><img src="/uploads/images/8eb3a757-0fcf-4a4e-83a2-8806cefbd654.png"></p>', 1, 2026, NULL, 'other', NULL, 'SHORT_ANSWER', '2026년 1회 3번 — 데이터베이스 설계 절차', 2, 7, NULL, NULL, NULL, NULL, NULL, '데이터베이스 설계 절차를 순서대로 나타낸 것이다. 각 빈칸에 들어갈 알맞은 용어를 쓰시오.', 3, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (7, '2026-05-29 01:16:43.938619', 1, 'N', '2026-05-29 01:16:43.938619', 1, 'Y', '2', 'class A {
    String f(Object x) {
        return "1";
    }
    String g() {
        return f("a");
    }
}
class B extends A {
    String f(Object x) {
        return "2";
    }
    String f(String x) {
        return "3";
    }
}
public class Main {
    public static void main(String[] args) {
        A a = new B();
        System.out.println(a.g());
    }
}', '<p>다음 Java 코드의 실행 결과를 쓰시오.</p>', 1, 2026, 'a는 A 타입이지만 실제 객체는 B이다. g()는 A에 정의되고 f("a")를 호출할 때 정적 바인딩으로 f(Object)를 호출하므로, B의 f(Object)가 동적 바인딩되어 "2" 반환', 'java', '[]', 'CODE', '2026년 1회 7번 — Java 메서드 오버라이딩', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 7, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (8, '2026-05-29 01:16:43.938619', 1, 'N', '2026-05-29 01:16:43.938619', 1, 'Y', 'veDamuH', 'i = input()
x = []
for word in i.split():
    x.append(word)
y = ''''.join(x)
z = ''''.join(c for c in y[::-1] if c not in ''ong'')
print(z)', '<p>다음 Python 코드에서 입력값이 <strong>HumanDev</strong>일 때의 실행 결과를 쓰시오.</p>', 1, 2026, 'y=''HumanDev'', 역순=''veDnamuH'', ''o'',''n'',''g'' 제거 → ''veDamuH''', 'python', '[]', 'CODE', '2026년 1회 8번 — Python 문자열 처리', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 8, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (1, '2026-05-29 01:16:43.923619', 1, 'N', '2026-07-01 13:12:30.961002', 1, 'Y', '106.00', '#include <stdio.h>
double arr1(int p[], int len) {
    double av = 0;
    int i;
    for (i = 0; i < len; i++) {
        av += (double) p[i];
    }
    return av / len;
}
double arr2(int * p, int len) {
    double av = 0;
    int i;
    for (i = 0; i < len; i++) {
        av += (double)(*(p + i));
    }
    return av / len;
}
int main() {
    int arr[10] = {80, 20, 50, 55, 45, 95, 55, 10, 40, 80};
    int len = 10;
    printf("%.2f", arr1(arr, len) + arr2(arr, len));
    return 0;
}', '<p>다음 C 코드의 실행 결과를 쓰시오.</p>', 1, 2026, 'arr1과 arr2는 동일한 배열의 평균을 각각 구하므로 53.00 + 53.00 = 106.00', 'c', '[]', 'CODE', '2026년 1회 1번 — C언어 평균값 계산', 3, 7, '중', '["알고리즘", "프로그래밍 언어"]', '["C 언어", "함수", "배열", "평균값", "포인터"]', '두 함수가 같은 배열과 길이를 받아 평균값을 계산하고 합한 값을 출력합니다.', NULL, NULL, 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (9, '2026-05-29 01:16:43.939618', 1, 'N', '2026-07-08 16:09:49.562753', 1, 'Y', '1. 200 / 2. 3 / 3. 1', NULL, '<p>STUDENT 테이블에는 컴퓨터과 50명, 인터넷과 100명, 사무자동화과 50명이 저장되어 있다.&nbsp;</p><ol><li>SELECT DEPT FROM STUDENT;</li><li>SELECT DISTINCT DEPT FROM STUDENT;</li><li>SELECT COUNT(DISTINCT DEPT) FROM STUDENT WHERE DEPT = ''컴퓨터과'';</li></ol>', 1, 2026, NULL, 'other', NULL, 'SHORT_ANSWER', '2026년 1회 9번 — SQL 실행 결과 행 수', 2, 7, NULL, NULL, NULL, NULL, NULL, '다음 각 SQL 구문의 실행 결과로 조회되는 행의 수를 쓰시오.', 9, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (10, '2026-05-29 01:16:43.939618', 1, 'N', '2026-07-08 16:10:28.586568', 1, 'Y', '① CONSTRAINT / ② FOREIGN / ③ TEAM_ID / ④ REFERENCES / ⑤ TEAM_ID2', NULL, '<p><strong>조건:</strong></p><ul><li>외래키 제약 조건의 이름은 TEAM_TF로 지정</li><li>PLAYER 테이블의 TEAM_ID 칼럼이 외래키 역할</li><li>TEAM 테이블의 TEAM_ID2 칼럼을 참조 대상으로 지정</li></ul><p><br></p><p>CREATE TABLE PLAYER (</p><p>PLAYER_ID CHAR(7) NOT NULL,</p><p>PLAYER_NAME VARCHAR2(20) NOT NULL,</p><p>TEAM_ID CHAR(3) NOT NULL,</p><p>PRIMARY KEY (PLAYER_ID),</p><p>( ① ) TEAM_TF</p><p>( ② ) KEY ( ③ )</p><p>( ④ ) TEAM ( ⑤ )</p><p>);</p>', 1, 2026, NULL, 'other', NULL, 'SHORT_ANSWER', '2026년 1회 10번 — SQL 외래키 제약 조건', 2, 7, NULL, NULL, NULL, NULL, NULL, '다음 조건을 참고하여 괄호 ①~⑤에 들어갈 적절한 예약어 또는 칼럼명을 쓰시오.', 10, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (4, '2026-05-29 01:16:43.933619', 1, 'N', '2026-07-08 22:45:55.887544', 1, 'Y', '3', NULL, '<p><br></p><ol><li>시스템 운영 중 로그 관리 및 모니터링 기능을 제공해야 한다.</li><li>시스템 운영 시 최소 메모리 용량을 확보해야 하며, 자원 사용량은 제한 범위 내에 있어야 한다.</li><li>사용자 요청에 대한 응답 시간은 최대 1분을 초과하지 않아야 한다.</li></ol><p><strong>&lt;보기&gt;</strong> 신뢰성, 가용성, 운영, 유지보수성, 자원, 성능, 이식성, 보안, 품질</p>', 1, 2026, NULL, 'other', '["신뢰성", "가용성", "운영", "유지보수성", "자원", "성능", "이식성", "품질"]', 'SHORT_ANSWER', '2026년 1회 4번 — 비기능적 요구사항 유형', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음은 비기능적 요구사항에 대한 설명이다. 각 항목이 의미하는 요구사항 유형을 <보기>에서 골라 쓰시오.', 4, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (14, '2026-05-29 01:16:43.940619', 1, 'N', '2026-07-02 00:10:21.560674', 1, 'Y', '10', 'def f(a):
    m = [[x] for x in a]
    b = m[:]
    for i in range(len(b) - 1):
        b[i+1] += b[i]
    return sum(len(x) for x in m)
print(f([1, 2, 3, 4]))', '<p>다음 Python 코드의 실행 결과를 쓰시오.</p>', 1, 2026, 'b=m[:]은 얕은 복사로 내부 리스트를 공유. b[i+1]+=b[i]는 in-place 확장이므로 m도 같이 변경됨. 최종 m 길이 합: 1+2+3+4=10', 'python', '[]', 'CODE', '2026년 1회 14번 — Python 얕은 복사 및 누적 연산', 3, 7, '중', '["알고리즘", "프로그래밍 언어"]', '["Python", "리스트 복사", "누적 합계", "리스트 컴프레헨션"]', '함수 f는 입력 리스트의 각 요소를 원소가 하나인 하위 리스트로 묶은 후, 누적 합계를 계산합니다.', NULL, NULL, 14, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (2, '2026-05-29 01:16:43.93162', 1, 'N', '2026-07-08 16:06:44.259199', 1, 'Y', 'ㄱ. Bridge / ㄴ. Observer', NULL, '<p><br></p><ul><li>( ㄱ ) 패턴은 기능의 클래스 계층과 구현의 클래스 계층을 연결하며, 구현에서 추상을 분리하여 독립적으로 다양성을 가질 수 있도록 한다.</li><li>( ㄴ ) 패턴은 한 객체의 상태가 바뀌면 그 객체에 의존하는 다른 객체들에게 연락이 가고 자동으로 내용이 갱신되는 방식으로 일대다 의존성을 정의한다.</li></ul>', 1, 2026, NULL, 'other', '["Adapter", "Bridge ", "Decorator", "Facade", "Memento", "Observer", "State", "Visitor"]', 'SHORT_ANSWER', '2026년 1회 2번 — 디자인 패턴', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 디자인 패턴의 유형을 괄호 안에 쓰시오.', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (18, '2026-05-29 01:16:43.940619', 1, 'N', '2026-07-08 16:13:43.834154', 1, 'Y', '2', NULL, '<p><img src="/uploads/images/187bb124-dddf-4eca-bde1-dbe314d0aa11.png"></p><p><br></p><p><span style="color: rgb(255, 255, 255);">SELECT COUNT(*)</span></p><p><span style="color: rgb(255, 255, 255);">FROM employee e</span></p><p><span style="color: rgb(255, 255, 255);">JOIN dept d ON e.dep_id = d.dept_id</span></p><p><span style="color: rgb(255, 255, 255);">WHERE d.budget &gt; (</span></p><p><span style="color: rgb(255, 255, 255);">&nbsp;&nbsp;&nbsp;&nbsp;SELECT AVG(budget) FROM dept</span></p><p><span style="color: rgb(255, 255, 255);">);</span></p>', 1, 2026, NULL, 'other', NULL, 'SHORT_ANSWER', '2026년 1회 18번 — SQL JOIN과 서브쿼리 결과', 2, 7, NULL, NULL, NULL, NULL, NULL, '다음 테이블과 SQL 구문을 참고하여 실행 결과로 조회되는 행의 수를 쓰시오.', 18, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (13, '2026-05-29 01:16:43.939618', 1, 'N', '2026-05-29 01:16:43.939618', 1, 'Y', '9A7A5A3A1A', 'lst = list(range(10))
for c in lst[::-2]:
    print(c, end=''A'')
print()', '<p>다음 Python 코드의 실행 결과를 쓰시오.</p>', 1, 2026, 'range(10) = [0..9], [::-2]는 9,7,5,3,1 순으로 출력하며 각 뒤에 ''A'' 붙임', 'python', '[]', 'CODE', '2026년 1회 13번 — Python 리스트 역순 슬라이싱', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 13, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (20, '2026-05-29 01:16:43.94262', 1, 'N', '2026-07-08 16:14:22.163505', 1, 'Y', '1. 절차 / 2. 교환 / 3. 기능', NULL, '<p><br></p><ol><li>( 1 )적 응집도는 모듈이 다수의 관련 기능을 가질 때, 모듈 안의 구성요소들이 그 기능을 순차적으로 수행하는 경우의 응집도이다.</li><li>( 2 )적 응집도는 동일한 입력과 출력을 사용하여 서로 다른 기능을 수행하는 활동들이 모여 있는 경우의 응집도이다.</li><li>( 3 )적 응집도는 모듈 내부의 모든 기능이 단일한 목적을 위해 수행되는 경우의 응집도이다.</li></ol>', 1, 2026, NULL, 'other', NULL, 'SHORT_ANSWER', '2026년 1회 20번 — 응집도 유형', 30, 7, NULL, NULL, NULL, NULL, NULL, '응집도의 유형에 대한 설명이다. 괄호 안에 들어갈 알맞은 용어를 쓰시오.', 20, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (17, '2026-05-29 01:16:43.940619', 1, 'N', '2026-05-29 01:16:43.940619', 1, 'Y', '1123', 'public class Main {
    public static void main(String[] args) {
        int x1 = 9;
        int x2 = 2;
        String x3 = "3";
        System.out.println(x1 + x2 + "2" + x3);
    }
}', '<p>다음 Java 코드의 실행 결과를 쓰시오.</p>', 1, 2026, 'x1+x2=11(정수), 11+"2"="112"(문자열), "112"+x3="1123"', 'java', '[]', 'CODE', '2026년 1회 17번 — Java 문자열 연결 및 정수 연산', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 17, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (19, '2026-05-29 01:16:43.941619', 1, 'N', '2026-05-29 01:38:11.80283', 1, 'Y', '1. 스텁(Stub) / 2. 드라이버(Driver)', '', '<p>통합 테스트에서 사용되는 더미 모듈에 대한 설명이다. 괄호 안에 들어갈 알맞은 용어를 쓰시오.</p>
<ol>
<li>( 1 )은/는 하위 모듈을 대신하여 단순한 결과값만 반환하도록 임시로 작성된 더미 모듈로, 하향식 통합 테스트 수행 시 필요하다.</li>
<li>( 2 )은/는 상위 모듈을 대신하여 하위 모듈의 데이터 입력과 출력을 확인하기 위한 더미 모듈로, 상향식 통합 테스트 수행 시 필요하다.</li>
</ol>', 1, 2026, '', 'other', '[]', 'SHORT_ANSWER', '2026년 1회 19번 — 통합 테스트 더미 모듈', 30, 7, NULL, NULL, NULL, NULL, NULL, NULL, 19, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (23, '2026-05-29 01:42:26.727088', 1, 'N', '2026-07-08 15:35:39.17909', 1, 'Y', '1. pwd / 2. ls / 3. cd / 4. cp', NULL, '<p><br></p><ol><li>현재 작업 중인 디렉터리의 경로를 출력한다.</li><li>현재 디렉터리 내의 파일 및 디렉터리 목록을 표시한다.</li><li>다른 디렉터리로 이동한다.</li><li>파일을 다른 위치로 복사한다.</li></ol>', 3, 2025, NULL, 'other', '["ls", "cd", "cp", "pwd"]', 'SHORT_ANSWER', '2025년 3회 3번 — 유닉스/리눅스 기본 명령어', 1, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 유닉스/리눅스 명령어를 쓰시오.', 3, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (24, '2026-05-29 01:42:26.731088', 1, 'N', '2026-07-08 15:46:21.716158', 1, 'Y', '① Hamming / ② FEC / ③ BEC / ④ Parity / ⑤ CRC', NULL, '<p><br></p><ul><li>( ① ) 코드는 데이터 비트에 여러 개의 패리티 비트를 추가하여 오류를 검출하고 정정할 수 있는 자기 정정 코드이다.</li><li>( ② )는 수신 측에서 오류를 검출하고 스스로 수정하는 전진 오류 수정 방식이다.</li><li>( ③ )는 오류 검출 후 재전송을 요청하는 후진 오류 수정 방식이다.</li><li>( ④ ) 검사는 데이터 블록의 각 비트를 XOR 연산하여 오류를 검출하는 간단한 방식이다.</li><li>( ⑤ )는 다항식을 이용해 데이터를 나눈 나머지를 이용하여 오류를 검출하는 방식이다.</li></ul>', 3, 2025, NULL, 'other', '["CRC ", "FEC", "BEC", "NAK", "Parity", "MD5", "BCD", "Hamming"]', 'SHORT_ANSWER', '2025년 3회 4번 — 오류 검출 및 정정 방식', 4, 7, NULL, NULL, NULL, NULL, NULL, '다음은 오류 검출 및 정정 방식에 관한 설명이다. 괄호 안에 알맞은 용어를 쓰시오.', 4, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (25, '2026-05-29 01:42:26.734087', 1, 'N', '2026-05-29 01:42:26.734087', 1, 'Y', 'C', '#include <stdio.h>
struct Test {
    int i;
    const char *g;
};
int main() {
    struct Test test[] = {{1, "AB"}, {2, "DC"}, {3, "EB"}};
    struct Test *p = &test[1];
    printf("%s", p->g + (p->i - 1));
    return 0;
}', '<p>다음 C 코드의 실행 결과를 쓰시오.</p>', 3, 2025, 'p는 test[1]을 가리키며 i=2, g="DC". p->g + (p->i - 1) = "DC" + 1 = "C" 출력', 'c', '[]', 'CODE', '2025년 3회 5번 — C언어 구조체 포인터', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 5, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (26, '2026-05-29 01:42:26.734087', 1, 'N', '2026-05-29 01:42:26.734087', 1, 'Y', 'E', '#include <stdio.h>
int main(void) {
    char str[] = "REPUBLICOFKOREA";
    int a = 0;
    while (str[a] != ''\0'')
        ++a;
    putchar(str[a - 2]);
    return 0;
}', '<p>다음 C 코드의 실행 결과를 쓰시오.</p>', 3, 2025, 'str 길이는 15. a=15(null 위치). str[15-2]=str[13]=''E''', 'c', '[]', 'CODE', '2025년 3회 6번 — C언어 문자열 인덱싱', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 6, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (27, '2026-05-29 01:42:26.734087', 1, 'N', '2026-05-29 01:42:26.734087', 1, 'Y', '187', '#include <stdio.h>
struct Node {
    struct Node* next;
    unsigned int x;
};
int main() {
    struct Node t1 = { 0, 5u };
    struct Node t2 = { 0, 7u };
    struct Node t3 = { 0, 11u };
    t3.next = &t2;
    t2.next = &t1;
    struct Node* curr = &t3;
    int sum = 0;
    while (curr) {
        sum = sum * 3 + curr->x;
        curr = curr->next;
    }
    sum = (sum ^ 42u) + 100u;
    printf("%u\n", sum);
}', '<p>다음 C 코드의 실행 결과를 쓰시오.</p>', 3, 2025, 't3→t2→t1 순서로 순회. sum: 0*3+11=11 → 11*3+7=40 → 40*3+5=125. 125^42=87. 87+100=187', 'c', '[]', 'CODE', '2025년 3회 7번 — C언어 링크드 리스트 순회', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 7, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (28, '2026-05-29 01:42:26.735087', 1, 'N', '2026-05-29 01:42:26.735087', 1, 'Y', 'implements', '', '<p>다음 Java 코드에서 인터페이스를 구현할 때 사용하는 빈칸 ①에 들어갈 키워드를 쓰시오.</p>
<pre><code>interface Drawable {
    void draw();
}
class Circle ( ① ) Drawable {
    public void draw() {
        System.out.println("Circle");
    }
}</code></pre>', 3, 2025, '', 'other', '[]', 'SHORT_ANSWER', '2025년 3회 8번 — Java 인터페이스 구현 키워드', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 8, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (29, '2026-05-29 01:42:26.735087', 1, 'N', '2026-05-29 01:42:26.735087', 1, 'Y', '{0: (15, 5), 1: (10, 3), 2: (18, 5), 3: (9, 2)}', 'data = [
    [3, 5, 2, 4, 1],
    [4, 5, 1],
    [4, 4, 1, 5, 4],
    [4, 5]
]
result = {}
for index, lis in enumerate(data):
    list_sum = sum(lis)
    list_len = len(lis)
    result[index] = (list_sum, list_len)
print(result)', '<p>다음 Python 코드의 실행 결과를 쓰시오.</p>', 3, 2025, '각 리스트의 합과 길이를 튜플로 딕셔너리에 저장', 'python', '[]', 'CODE', '2025년 3회 9번 — Python 딕셔너리 리스트 처리', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 9, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (32, '2026-05-29 01:42:26.743087', 1, 'N', '2026-05-29 01:42:26.743087', 1, 'Y', '100', 'class Rectangle {
    int width, height;
    Rectangle(int width, int height) {
        this.width = width;
        this.height = height;
    }
}
class Square extends Rectangle {
    Square(int a) {
        super(a, a);
    }
    int getSquareArea() {
        return width * height;
    }
}
public class Main {
    public static void main(String[] args) {
        Square sq = new Square(10);
        System.out.println(sq.getSquareArea());
    }
}', '<p>다음 Java 코드의 실행 결과를 쓰시오.</p>', 3, 2025, 'super(a, a)는 부모 Rectangle 생성자를 호출. width=height=10. 10*10=100', 'java', '[]', 'CODE', '2025년 3회 12번 — Java 부모 생성자 호출 (super)', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 12, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (30, '2026-05-29 01:42:26.739088', 1, 'N', '2026-07-08 15:59:17.773231', 1, 'Y', '4', NULL, '<p><img src="/uploads/images/d251e088-60dc-435c-b228-e18e910de8c5.png"></p>', 3, 2025, NULL, 'other', NULL, 'SHORT_ANSWER', '2025년 3회 10번 — SQL 조건 조회 결과 행 수', 2, 7, NULL, NULL, NULL, NULL, NULL, '테이블 A의 컬럼 구조와 데이터가 아래와 같을 때, 다음 SQL의 실행 결과로 조회되는 행의 수를 쓰시오.', 10, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (31, '2026-05-29 01:42:26.742087', 1, 'N', '2026-07-08 15:59:46.867719', 1, 'Y', 'OTP', NULL, '<p>한 번 사용하면 즉시 폐기되어 재사용이 불가능하다.</p><p>&nbsp;</p><p>서버와 토큰(또는 앱)은 시간 동기화나 카운터 기반 방식으로 매번 새로운 값을 생성하고, 내부 검증은 해시 함수를 이용한 방식으로 서버에 평문을 저장하지 않고도 유효성을 확인할 수 있다.</p><p>&nbsp;</p><p>이 특성 때문에 은행 인증 등 고보안 영역에서 널리 사용되며 재전송 공격 방지와 사용자 편의성을 동시에 만족한다.</p>', 3, 2025, 'One Time Password. 시간 기반(TOTP) 또는 카운터 기반(HOTP) 방식으로 구현', 'other', NULL, 'SHORT_ANSWER', '2025년 3회 11번 — 일회용 비밀번호', 5, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 인증 기술의 영문 약자를 쓰시오.', 11, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (105, '2026-07-09 22:36:23.560066', 1, 'N', '2026-07-10 23:19:45.43036', 1, 'Y', '8', '#include <stdio.h>
int main() {
    int x = 5;
    int y = 9;
    int z;
    z = ((x & y) << 1) + ((x | y) >> 1);
    printf("%d", z);
    return 0;
}', '', NULL, NULL, NULL, 'javascript', NULL, 'CODE', '정보처리기사 실기 / 프로그래밍 언어/c언어 연산 문제 - 005', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C언어 프로그램의 실행 결과를 쓰시오.', 5, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (104, '2026-07-09 22:36:23.550828', 1, 'N', '2026-07-10 23:19:55.099604', 1, 'Y', '5 3 1', '#include <stdio.h>
int main() {
    int a = 6;
    int b = 3;
    int c = 1;
    a ^= b;
    b |= c;
    c &= a;
    printf("%d %d %d", a, b, c);
    return 0;
}', '', NULL, NULL, NULL, 'javascript', NULL, 'CODE', '정보처리기사 실기 / 프로그래밍 언어/c언어 연산 문제 - 004', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C언어 프로그램의 실행 결과를 쓰시오.', 4, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (39, '2026-05-29 01:42:26.747089', 1, 'N', '2026-07-08 16:03:47.487965', 1, 'Y', '1. 테스트 조건 / 2. 테스트 데이터 / 3. 예상 결과', NULL, '<ul><li><img src="/uploads/images/2a038153-bb4e-434f-b94d-2ea5842b43f4.png"></li></ul>', 3, 2025, NULL, 'other', '["테스트 조건", "테스트 환경", "테스트 유형", "테스트 데이터", "예상 결과", "수행 단계", "성공/실패 기준"]', 'SHORT_ANSWER', '2025년 3회 19번 — 테스트케이스 구성요소', 30, 7, NULL, NULL, NULL, NULL, NULL, '테스트케이스(Test Case)의 구성요소를 순서대로 나열한 것이다. 빈칸에 들어갈 알맞은 용어를 쓰시오.', 19, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (34, '2026-05-29 01:42:26.745087', 1, 'N', '2026-07-08 16:00:58.919335', 1, 'Y', 'A, a1', NULL, '<p><img src="/uploads/images/691cef4c-223f-4f0f-a8cb-197fe03ef3ae.png"></p>', 3, 2025, 'a1은 b1, b2 모두와 매핑되므로 나누기 결과에 포함. a2는 b2가 없으므로 제외', 'other', NULL, 'SHORT_ANSWER', '2025년 3회 14번 — 관계형 데이터베이스 나누기 연산', 31, 7, NULL, NULL, NULL, NULL, NULL, '다음 아래의 테이블을 확인하여 R%S의 결과를 테이블 형태로 기재하시오.', 14, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (38, '2026-05-29 01:42:26.747089', 1, 'N', '2026-07-08 16:02:29.826383', 1, 'Y', 'ㄱ. MAC / ㄴ. RBAC / ㄷ. DAC', NULL, '<p>다음 설명에 해당하는 접근통제 모델의 명칭을 쓰시오.</p><ul><li>( ㄱ ) : 주체와 객체의 등급을 비교하여 접근 권한을 부여하며, 관리자가 중앙에서 통제하는 강제적 접근통제 모델이다.</li><li>( ㄴ ) : 사용자에게 역할을 부여하고 역할에 따라 접근 권한이 결정되는 역할 기반 접근통제 모델이다.</li><li>( ㄷ ) : 객체의 소유자가 접근 권한을 직접 설정하고 관리하는 임의적 접근통제 모델이다.</li></ul>', 3, 2025, NULL, 'other', '["DAC", "MAC", "RBAC"]', 'SHORT_ANSWER', '2025년 3회 18번 — 접근통제 모델', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 18, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (40, '2026-05-29 01:42:26.753086', 1, 'N', '2026-07-08 16:04:19.779813', 1, 'Y', '4', NULL, '<p><img src="/uploads/images/27d6643e-4241-4e1b-962e-a69baa135ddc.png"></p><p><br></p><p>SELECT COUNT(col2)</p><p>FROM A</p><p>WHERE col1 IN (2, 3) OR col2 IN (3, 5);</p>', 3, 2025, NULL, 'other', NULL, 'SHORT_ANSWER', '2025년 3회 20번 — SQL COUNT 집계', 2, 7, NULL, NULL, NULL, NULL, NULL, '테이블 A의 데이터가 아래 조건을 만족할 때, 다음 SQL의 실행 결과를 쓰시오.', 20, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (41, '2026-05-29 01:51:18.132038', 1, 'N', '2026-07-08 16:16:57.795264', 1, 'Y', '인덱스(색인)', NULL, '<p>데이터베이스의 물리 설계 시, 레코드에 접근하는 방법은 순차 접근 방법, [ ] 방법, 해싱 방법 등이 있다.</p><p>&nbsp;</p><p>이 중 [ ] 방법은 레코드의 키 값과 포인터를 쌍으로 묶어 저장하며 검색 시 키 값을 기준으로 빠르게 탐색할 수 있도록 설계되어 있다.</p><p>&nbsp;</p><p>이 방식은 검색 속도가 빠르며 &lt;키 값, 포인터&gt; 쌍으로 구성된 자료 구조를 사용하여 해당 키가 가리키는 주소를 통해 원하는 레코드를 직접 찾을 수 있다.</p><p><br></p><p><img src="/uploads/images/6386957e-19ec-401d-ad71-02eed16eb556.png"></p>', 2, 2025, NULL, 'other', NULL, 'SHORT_ANSWER', '2025년 2회 1번 — 파일 접근 방식', 1, 7, NULL, NULL, NULL, NULL, NULL, '다음은 파일 구조와 관련된 설명이다. 설명을 읽고 괄호 안에 들어갈 가장 알맞은 용어를 작성하시오.', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (42, '2026-05-29 01:51:18.133095', 1, 'N', '2026-07-08 16:18:08.743818', 1, 'Y', '3', NULL, '<p>릴레이션(Relation)에서 열(Column)을 의미하며 데이터 항목의 속성(Attribute) 또는 특성을 나타낸다.</p><p>각 열은 고유한 이름을 가지며 특정 도메인(Domain)에서 정의된 값을 갖는다.</p><p>예를 들어 "학생" 릴레이션에서 학번, 이름, 전공 등은 각각 하나의 열이며 이 열들은 학생의 고유한 속성을 나타낸다.</p><p>이 개념은 파일 구조에서의 필드(Field)에 해당하며 릴레이션에서 행(Row, Tuple)의 구성 요소가 된다.</p>', 2, 2025, NULL, 'other', '["Cardinality", "Domain", "Attribute", "Degree", "Schema", "Tuple"]', 'SHORT_ANSWER', '2025년 2회 2번 — 관계형 데이터베이스 속성 용어', 31, 7, NULL, NULL, NULL, NULL, NULL, '다음 보기의 용어 중 아래 설명에 해당하는 것을 고르시오.', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (35, '2026-05-29 01:42:26.746087', 1, 'N', '2026-05-29 01:42:26.746087', 1, 'Y', '0', '#include <stdio.h>
int main() {
    int x=7, y=4, z;
    z = y%3<3 ? 2 : 1;
    z = z & z >> 1;
    z = x>5 && z<=3 ? z*x : z/x;
    printf("%d", z);
    return 0;
}', '<p>다음 C 코드의 실행 결과를 쓰시오.</p>', 3, 2025, 'y%3=1, 1<3 참 → z=2. z&(z>>1)=2&1=0. x>5&&z<=3 → 참이지만 z=0. z*x=0*7=0', 'c', '[]', 'CODE', '2025년 3회 15번 — C언어 조건 연산자와 비트 연산', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 15, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (37, '2026-05-29 01:42:26.746087', 1, 'N', '2026-05-29 01:42:26.746087', 1, 'Y', 'AB', 'enum Tri {
    A("A"), B("AB"), C("ABC");
    private String code;
    Tri(String code) {
        this.code = code;
    }
    public String code() {
        return code;
    }
}
public class Main {
    public static void main(String[] args) {
        Tri t = Tri.values()[Tri.A.name().length()];
        System.out.print(t.code());
    }
}', '<p>다음 Java 코드의 실행 결과를 쓰시오.</p>', 3, 2025, 'Tri.A.name()=''A'', length()=1. Tri.values()[1]=Tri.B. Tri.B.code()=''AB''', 'java', '[]', 'CODE', '2025년 3회 17번 — Java enum 배열 인덱싱', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 17, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (36, '2026-05-29 01:42:26.746087', 1, 'N', '2026-07-08 16:01:50.573041', 1, 'Y', 'ㄱ. 튜플 / ㄴ. 인스턴스 / ㄷ. 카디널리티', NULL, '<p>다음 설명에 해당하는 관계형 데이터베이스 용어를 쓰시오.</p><ul><li>( ㄱ ) : 릴레이션의 행(Row)에 해당하며, 테이블에서 하나의 레코드를 나타낸다.</li><li>( ㄴ ) : 릴레이션에 실제로 저장된 데이터의 집합 전체를 의미하며, 특정 시점의 데이터 상태이다.</li><li>( ㄷ ) : 릴레이션의 행의 수 또는 튜플의 개수를 나타낸다.</li></ul>', 3, 2025, NULL, 'other', '["스키마(Structure)", "속성(Attribute)", "튜플(Tuple)", "차수(Degree)", "인스턴스(Instance)", "카디널리티(Cardinality)"]', 'SHORT_ANSWER', '2025년 3회 16번 — 관계형 데이터베이스 개념 정의', 31, 7, NULL, NULL, NULL, NULL, NULL, NULL, 16, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (43, '2026-05-29 01:51:18.133621', 1, 'N', '2026-07-08 16:18:42.922112', 1, 'Y', 'SSH', NULL, '<p>원격 접속과 관련된 보안 프로토콜이며 암호화된 통신을 제공하는 보안 접속용 프로토콜이다.</p><p>공개키 기반의 인증 방식을 사용하며 암호화된 데이터 전송을 지원한다.</p><p>주로 원격 서버에 안전하게 접속할 때 사용되며 기본 포트 번호는 22번이다.</p><p>Telnet의 보안 취약점을 보완한 대안으로 널리 사용된다.</p>', 2, 2025, 'Secure Shell. 네트워크 계층에서 안전한 원격 로그인 및 파일 전송을 위한 프로토콜', 'other', NULL, 'SHORT_ANSWER', '2025년 2회 3번 — 원격 접속 보안 프로토콜', 5, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 보안 프로토콜의 영문 약자를 쓰시오.', 3, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (44, '2026-05-29 01:51:18.134148', 1, 'N', '2026-07-08 16:19:19.262183', 1, 'Y', '1. SJF (Shortest Job First) / 2. SRT (Shortest Remaining Time)', NULL, '<p>(1) CPU burst 시간이 짧은 프로세스를 우선적으로 처리하는 스케줄링 방식이다. "Shortest Next CPU Burst"라고도 불리며 선점형 또는 비선점형으로 구현될 수 있다.</p><p>&nbsp;</p><p>(2) 위의 스케줄링 방식을 선점형으로 구현한 형태로 실행 중인 프로세스보다 더 짧은 burst 시간을 가진 프로세스가 도착하면 현재 CPU를 선점한다.</p>', 2, 2025, NULL, 'other', NULL, 'SHORT_ANSWER', '2025년 2회 4번 — CPU 스케줄링 알고리즘', 1, 7, NULL, NULL, NULL, NULL, NULL, '스케줄링 알고리즘에 관한 다음 설명을 읽고 (1)과 (2)에 알맞은 스케줄링 알고리즘의 명칭을 각각 쓰시오.', 4, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (45, '2026-05-29 01:51:18.135206', 1, 'N', '2026-07-08 16:20:28.382349', 1, 'Y', 'BB', 'public class Main {
    public static void change(String[] data, String s) {
        data[0] = s;
        s = "Z";
    }
    public static void main(String[] args) {
        String data[] = { "A" };
        String s = "B";
        change(data, s);
        System.out.print(data[0] + s);
    }
}', '<p><br></p>', 2, 2025, 'data는 배열 참조 전달 → data[0]=''B''로 변경됨. s는 값 복사 전달 → 원본 s=''B'' 유지. 출력: ''B''+''B''=''BB''', 'java', NULL, 'CODE', '2025년 2회 5번 — Java 배열 참조와 문자열', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Java 코드의 실행 결과를 쓰시오.', 5, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (47, '2026-05-29 01:51:18.136249', 1, 'N', '2026-07-08 16:35:04.986489', 1, 'Y', 'Proxy', NULL, '<p>어떤 객체에 대한 접근을 제어하거나 추가적인 기능을 부여하기 위해 해당 객체의 대리 객체를 사용하는 방식의 디자인 패턴이다.</p><p>실제 객체에 대한 접근 전에 필요한 작업을 수행할 수 있으며 실제 객체의 생성을 지연시켜 메모리와 자원을 절약할 수 있다.</p><p>또한, 실제 객체를 감추어 정보은닉을 강화할 수 있다는 장점이 있다.&nbsp;</p>', 2, 2025, NULL, 'other', NULL, 'SHORT_ANSWER', '2025년 2회 7번 — 디자인 패턴', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 디자인 패턴의 이름을 쓰시오.', 7, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (48, '2026-05-29 01:51:18.136249', 1, 'N', '2026-07-08 16:35:44.960242', 1, 'Y', 'AJAX', NULL, '<p>( )은/는 웹 페이지 전체를 다시 불러오지 않고 JavaScript와 XML(또는 JSON)을 이용하여 일부 콘텐츠만 비동기적으로 갱신할 수 있는 기술이다.</p><p>( )은/는 HTML만으로는 구현하기 어려운 동적인 기능들을 가능하게 하여 사용자가 웹 페이지와 보다 자유롭게 상호작용할 수 있도록 해주는 웹 개발 기법이다.</p>', 2, 2025, 'Asynchronous JavaScript And XML', 'other', NULL, 'SHORT_ANSWER', '2025년 2회 8번 — 비동기 웹 기술', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 웹 기술의 영문 약자를 쓰시오.', 8, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (49, '2026-05-29 01:51:18.137823', 1, 'N', '2026-07-08 16:40:12.100323', 1, 'Y', '19', 'public class Main {
    static interface F {
        int apply(int x) throws Exception;
    }
    public static int run(F f) {
        try {
            return f.apply(3);
        } catch (Exception e) {
            return 7;
        }
    }
    public static void main(String[] args) {
        F f = (x) -> {
            if (x > 2) {
                throw new Exception();
            }
            return x * 2;
        };
        System.out.print(run(f) + run((int n) -> n + 9));
    }
}', '<p><br></p>', 2, 2025, 'run(f): x=3>2 → 예외 발생 → catch에서 7 반환. run(n->n+9): 3+9=12 반환. 7+12=19', 'java', NULL, 'CODE', '2025년 2회 9번 — Java 람다식과 예외 처리', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Java 코드의 실행 결과를 쓰시오.', 9, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (50, '2026-05-29 01:51:18.137823', 1, 'N', '2026-07-08 16:41:37.941438', 1, 'Y', '5P', 'public class Main {
    public static class Parent {
        public int x(int i) { return i + 2; }
        public static String id() { return "P"; }
    }
    public static class Child extends Parent {
        public int x(int i) { return i + 3; }
        public String x(String s) { return s + "R"; }
        public static String id() { return "C"; }
    }
    public static void main(String[] args) {
        Parent ref = new Child();
        System.out.println(ref.x(2) + ref.id());
    }
}', '<p><br></p>', 2, 2025, 'ref.x(2): 인스턴스 메서드는 동적 바인딩 → Child.x(2)=2+3=5. ref.id(): 정적 메서드는 정적 바인딩 → Parent.id()=''P''. 출력: ''5P''', 'java', NULL, 'CODE', '2025년 2회 10번 — Java 상속과 정적 메서드 바인딩', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Java 코드의 실행 결과를 쓰시오.', 10, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (51, '2026-05-29 01:51:18.142504', 1, 'N', '2026-07-08 16:42:09.847691', 1, 'Y', '1-2-3-4-5-6-1, 1-2-4-5-7 (또는 동등한 경로 집합)', NULL, '<p><img src="/uploads/images/ad9a1879-476b-4902-b806-1249c42d0884.png"></p>', 2, 2025, '모든 엣지(분기)를 최소 한 번씩 커버하는 경로 집합', 'other', NULL, 'SHORT_ANSWER', '2025년 2회 11번 — 제어 흐름 그래프 분기 커버리지', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 아래 제어 흐름 그래프가 분기 커버리지를 만족하기 위한 테스팅 순서를 쓰시오.', 11, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (52, '2026-05-29 01:51:18.142504', 1, 'N', '2026-07-08 16:54:00.016722', 1, 'Y', '2 그리고 3', '#include <stdio.h>
#define SIZE 3
typedef struct {
    int a[SIZE];
    int front;
    int rear;
} Queue;
void enq(Queue* q, int val) {
    q->a[q->rear] = val;
    q->rear = (q->rear + 1) % SIZE;
}
int deq(Queue* q) {
    int val = q->a[q->front];
    q->front = (q->front + 1) % SIZE;
    return val;
}
int main() {
    Queue q = {{0}, 0, 0};
    enq(&q, 1); enq(&q, 2); deq(&q); enq(&q, 3);
    int first = deq(&q);
    int second = deq(&q);
    printf("%d 그리고 %d", first, second);
    return 0;
}', '<p><br></p>', 2, 2025, 'enq 1,2 → deq(반환1) → enq 3. 큐 상태:[2,3]. deq→2, deq→3. 출력: ''2 그리고 3''', 'c', NULL, 'CODE', '2025년 2회 12번 — C언어 원형 큐 구현', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C 코드의 실행 결과를 쓰시오.', 12, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (54, '2026-05-29 01:51:18.142504', 1, 'N', '2026-07-08 17:36:13.405953', 1, 'Y', '5 그리고 6', '#include <stdio.h>
struct dat {
    int x;
    int y;
};
int main() {
    struct dat a[] = {{1, 2}, {3, 4}, {5, 6}};
    struct dat* ptr = a;
    struct dat** pptr = &ptr;
    (*pptr)[1] = (*pptr)[2];
    printf("%d 그리고 %d", a[1].x, a[1].y);
    return 0;
}', '<p><br></p>', 2, 2025, '(*pptr)=ptr=a. (*pptr)[1]=a[1], (*pptr)[2]=a[2]={5,6}. a[1]에 a[2] 복사 → a[1]={5,6}', 'c', NULL, 'CODE', '2025년 2회 14번 — C언어 구조체 이중 포인터', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C 코드의 실행 결과를 쓰시오.', 14, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (55, '2026-05-29 01:51:18.143031', 1, 'N', '2026-07-08 17:42:37.355378', 1, 'Y', '1a3b3', 'public class Main {
    public static class BO {
        public int v;
        public BO(int v) { this.v = v; }
    }
    public static void main(String[] args) {
        BO a = new BO(1);
        BO b = new BO(2);
        BO c = new BO(3);
        BO[] arr = {a, b, c};
        BO t = arr[0];
        arr[0] = arr[2];
        arr[2] = t;
        arr[1].v = arr[0].v;
        System.out.println(a.v + "a" + b.v + "b" + c.v);
    }
}', '<p><br></p>', 2, 2025, 'arr 스왑: arr[0]=c, arr[2]=a. arr[1].v=arr[0].v=c.v=3 → b.v=3. a.v=1, b.v=3, c.v=3. 출력: 1a3b3', 'java', NULL, 'CODE', '2025년 2회 15번 — Java 객체 참조와 배열 스왑', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Java 코드의 실행 결과를 쓰시오.', 15, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (56, '2026-05-29 01:51:18.143031', 1, 'N', '2026-07-08 17:44:25.555904', 1, 'Y', '3 1 2', '#include <stdio.h>
struct node {
    int p;
    struct node* n;
};
int main() {
    struct node a = {1, NULL};
    struct node b = {2, NULL};
    struct node c = {3, NULL};
    a.n = &b; b.n = &c; c.n = NULL;
    c.n = &a; a.n = &b; b.n = NULL;
    struct node* head = &c;
    printf("%d %d %d", head->p, head->n->p, head->n->n->p);
    return 0;
}', '<p><br></p>', 2, 2025, '재연결 후: c.n=&a, a.n=&b, b.n=NULL. head=&c. head->p=3, head->n->p=a.p=1, head->n->n->p=b.p=2', 'c', NULL, 'CODE', '2025년 2회 16번 — C언어 링크드 리스트 순회', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C 코드의 실행 결과를 쓰시오.', 16, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (57, '2026-05-29 01:51:18.143031', 1, 'N', '2026-07-08 17:47:51.134749', 1, 'Y', '2', 'lst = [1, 2, 3]
dst = {i: i * 2 for i in lst}
s = set(dst.values())
lst[0] = 99
dst[2] = 7
s.add(99)
print(len(s & set(dst.values())))', '<p><br></p>', 2, 2025, 'dst={1:2,2:4,3:6}. s={2,4,6}. dst[2]=7 → dst={1:2,2:4,3:7}. s.add(99)→s={2,4,6,99}. set(dst.values())={2,4,7}. 교집합={2,4}. len=2', 'python', NULL, 'CODE', '2025년 2회 17번 — Python 딕셔너리·집합 연산', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Python 코드의 실행 결과를 쓰시오.', 17, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (58, '2026-05-29 01:51:18.143031', 1, 'N', '2026-07-08 17:48:26.86558', 1, 'Y', 'TSEB', '#include <stdio.h>
#include <stdlib.h>
struct node {
    char c;
    struct node* p;
};
struct node* func(char* s) {
    struct node* h = NULL, *n;
    while (*s) {
        n = malloc(sizeof(struct node));
        n->c = *s++;
        n->p = h;
        h = n;
    }
    return h;
}
int main() {
    struct node* n = func("BEST");
    while (n) {
        putchar(n->c);
        struct node* t = n;
        n = n->p;
        free(t);
    }
    return 0;
}', '<p><br></p>', 2, 2025, 'func은 문자를 스택처럼 역순으로 연결. B→E→S→T 순으로 삽입되므로 헤드는 T. T→S→E→B 순으로 출력 → ''TSEB''', 'c', NULL, 'CODE', '2025년 2회 18번 — C언어 링크드 리스트 출력', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C 코드의 실행 결과를 쓰시오.', 18, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (59, '2026-05-29 01:51:18.143031', 1, 'N', '2026-07-08 17:50:43.648131', 1, 'Y', 'SYN Flooding', NULL, '<p>TCP는 연결을 수립하기 위해 클라이언트가 서버에 SYN 패킷을 보내고 서버는 SYN-ACK 패킷으로 응답한 후 클라이언트가 다시 ACK 패킷을 보내는 3-way-handshake 과정을 거친다.</p><p>&nbsp;</p><p>이때 공격자는 클라이언트 역할로 수많은 SYN 패킷을 서버에 전송한 뒤 마지막 ACK를 고의로 보내지 않아 서버가 연결 대기 상태를 계속 유지하게 만든다.</p><p>&nbsp;</p><p>이로 인해 서버의 연결 대기 큐가 가득 차면서 정상적인 접속 요청을 처리하지 못하게 되어 서비스 거부 상태가 발생한다.</p>', 2, 2025, NULL, 'other', NULL, 'SHORT_ANSWER', '2025년 2회 19번 — TCP 취약점 공격', 5, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 네트워크 보안 공격의 명칭을 쓰시오.', 19, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (60, '2026-05-29 01:51:18.143564', 1, 'N', '2026-07-08 17:52:12.453282', 1, 'Y', '1. TTL,2. 부장, 3. 대리, 4. 과장, 5. 차장', NULL, '<p><img src="/uploads/images/3127c6a5-4664-4fc0-a50a-a80a786e791b.png"></p>', 2, 2025, '투영 연산은 특정 열만 선택하며 중복 제거. 대리가 2명이지만 중복 제거 후 4가지 직급만 반환', 'other', NULL, 'SHORT_ANSWER', '2025년 2회 20번 — 관계형 데이터베이스 투영 연산', 31, 7, NULL, NULL, NULL, NULL, NULL, '다음 employee 테이블에 대해 투영(Projection) 연산 π직급(employee)을 수행한 결과를 쓰시오.', 20, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (61, '2026-05-29 02:08:47.631536', 1, 'N', '2026-07-08 21:22:11.687204', 1, 'Y', '세션 하이재킹', NULL, '<p>(&nbsp;&nbsp;&nbsp;)은/는 ''세션을 가로채다.'' 라는 의미로 다른 사람의 세션 상태를 훔치거나 도용하여 액세스하는 해킹 기법이다.&nbsp;</p><p>&nbsp;</p><p>TCP (&nbsp;&nbsp;&nbsp;)은/는 TCP의 3-way 핸드셰이크가 완료된 후에 공격자가 시퀀스 번호 등을 조작하여 정상적인 세션을 가로채고 인증 없이 통신을 탈취하는 공격 공격이다.</p>', 1, 2025, NULL, 'other', NULL, 'SHORT_ANSWER', '2025년 1회 1번 — 네트워크 보안 — 세션 하이재킹', 5, 7, NULL, NULL, NULL, NULL, NULL, '다음은 네트워크 보안에 관련된 문제이다. 괄호 안에 알맞은 용어를 작성하시오.', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (63, '2026-05-29 02:08:47.678397', 1, 'N', '2026-07-08 21:24:08.317102', 1, 'Y', 'CRC', NULL, '<p>(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;) 은/는 3글자의 영어 약자로 이루어진 오류 기법으로 데이터를 전송하거나 저장할 때 데이터의 오류를 감지하는 데 사용되는 오류 검출 코드이다.</p><p><br></p><p>(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;) 은/는 데이터에 체크섬을 추가하여 데이터를 전송하거나 저장한 후, 수신 또는 읽을 때 이 체크섬을 다시 계산하여 데이터가 변경되었는지 확인하는 기법이다.</p><p><br></p><p>(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;) 은/는 데이터 전송의 안정성을 높이는 데 중요한 역할을 한다.</p><p><br></p><p>데이터는 이진수(0과 1)로 표현되며 정해진 다항식(x³ + x + 1)을 기반으로 데이터를 2진수 나눗셈하고나머지를 (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;) 값으로 삼는다.</p>', 1, 2025, NULL, 'other', NULL, 'SHORT_ANSWER', '2025년 1회 3번 — 오류 검출 — CRC', 4, 7, NULL, NULL, NULL, NULL, NULL, '아래의 내용에서 설명 글의 괄호안의 용어를 영문 약자로 작성하시오.', 3, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (65, '2026-05-29 02:08:47.716515', 1, 'N', '2026-07-08 21:25:55.73346', 1, 'Y', '출력1출력5', 'public class Main {
  public static void main(String[] args) {
    int a=5,b=0;
    try{
      System.out.print(a/b);
    }catch(ArithmeticException e){
      System.out.print("출력1");
    }catch(ArrayIndexOutOfBoundsException e) {
      System.out.print("출력2");
    }catch(NumberFormatException e) {
      System.out.print("출력3");
    }catch(Exception e){
      System.out.print("출력4");
    }finally{
      System.out.print("출력5");
    }
  }
}', '<p><br></p>', 1, 2025, 'a/b는 5/0이므로 ArithmeticException 발생 → "출력1", finally 블록은 항상 실행되어 "출력5" 출력', 'java', NULL, 'CODE', '2025년 1회 5번 — Java 예외 처리', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Java 코드의 실행 결과를 작성하시오.', 5, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (66, '2026-05-29 02:08:47.728514', 1, 'N', '2026-07-08 21:28:23.979993', 1, 'Y', '(1) ARP / (2) RARP', NULL, '<p>( 1 ) 은/는 네트워크상에서 IP 주소를 MAC 주소로 변환하는 프로토콜이고,</p><p>( 2 ) 은/는 MAC 주소를 IP 주소로 변환하는 프로토콜이다.</p>', 1, 2025, NULL, 'other', NULL, 'SHORT_ANSWER', '2025년 1회 6번 — 프로토콜 — ARP/RARP', 4, 7, NULL, NULL, NULL, NULL, NULL, '아래는 ARP/RARP에 대한 설명이다. 각 설명에 해당하는 프로토콜을 작성하시오.', 6, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (68, '2026-05-29 02:08:47.764513', 1, 'N', '2026-07-08 21:31:10.342525', 1, 'Y', '(1) ㄷ / (2) ㅁ / (3) ㅅ / (4) ㄱ', NULL, '<p><br></p><ul><li>1. 릴레이션에서 속성(컬럼)의 개수를 의미: ( 1 )</li><li>2. 릴레이션에서 튜플(행)의 개수를 의미: ( 2 )</li><li>3. 한 릴레이션의 속성이 다른 릴레이션의 기본키를 참조할 때 그 속성을 의미: ( 3 )</li><li>4. 특정 속성에 입력될 수 있는 값의 유형·범위를 의미하며 무결성을 보장하는 기준: ( 4 )</li></ul><p>[보기] ㄱ. domain ㄴ. primary ㄷ. degree ㄹ. candidate ㅁ. cardinality ㅂ. attribute ㅅ. foreign</p>', 1, 2025, NULL, 'other', NULL, 'SHORT_ANSWER', '2025년 1회 8번 — 관계형 DB 용어', 31, 7, NULL, NULL, NULL, NULL, NULL, '아래는 데이터베이스에 관련된 설명이다. 알맞은 용어를 보기에서 골라 괄호에 작성하시오.', 8, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (69, '2026-05-29 02:08:47.779642', 1, 'N', '2026-07-08 21:47:54.417563', 1, 'Y', 'ㄱ, ㄴ, ㄷ, ㄹ, ㅁ', NULL, '<p>[보기]</p><p>ㄱ. 192.168.34.1</p><p>ㄴ. 192.168.32.19</p><p>ㄷ. 192.168.35.200</p><p>ㄹ. 192.168.33.138</p><p>ㅁ. 192.168.35.50</p>', 1, 2025, '서브넷 255.255.252.0 → 네트워크 범위 192.168.32.0 ~ 192.168.35.255. 보기의 모든 IP가 동일한 브로드캐스트 도메인에 속한다.', 'other', NULL, 'SHORT_ANSWER', '2025년 1회 9번 — 서브넷 — 브로드캐스트 도메인', 4, 7, NULL, NULL, NULL, NULL, NULL, 'IP 주소가 192.168.35.10, 서브넷 마스크가 255.255.252.0인 PC에서 브로드캐스트로 정보를 전달할 때, 수신할 수 있는 IP를 보기에서 모두 고르시오.', 9, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (70, '2026-05-29 02:08:47.790641', 1, 'N', '2026-07-08 21:59:16.374995', 1, 'Y', '4
BACDE', '#include <stdio.h>
char Data[5] = {''B'', ''A'', ''D'', ''E''};
char c;
int main(){
    int i, temp, temp2;
    c = ''C'';
    printf("%d\n", Data[3]-Data[1]);
    for(i=0;i<5;++i){
        if(Data[i]>c)
            break;
    }
    temp = Data[i];
    Data[i] = c;
    i++;
    for(;i<5;++i){
        temp2 = Data[i];
        Data[i] = temp;
        temp = temp2;
    }
    for(i=0;i<5;i++){
        printf("%c", Data[i]);
    }
}', '<p><br></p>', 1, 2025, 'Data[3]-Data[1] = ''E''-''A'' = 4. 이후 ''C''를 알맞은 위치에 삽입하며 뒤 원소를 한 칸씩 밀어 BACDE 출력', 'c', NULL, 'CODE', '2025년 1회 10번 — C언어 배열 삽입', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C 코드의 실행 결과를 작성하시오.', 10, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (71, '2026-05-29 02:08:47.804116', 1, 'N', '2026-07-08 22:13:54.478009', 1, 'Y', '13', '#include <stdio.h>
#include <stdlib.h>
void set(int** arr, int* data, int rows, int cols) {
    for (int i = 0; i < rows * cols; ++i) {
        arr[((i + 1) / rows) % rows][(i + 1) % cols] = data[i];
    }
}
int main() {
    int rows = 3, cols = 3, sum = 0;
    int data[] = {5, 2, 7, 4, 1, 8, 3, 6, 9};
    int** arr;
    arr = (int**) malloc(sizeof(int*) * rows);
    for (int i = 0; i < cols; i++) {
        arr[i] = (int*) malloc(sizeof(int) * cols);
    }
    set(arr, data, rows, cols);
    for (int i = 0; i < rows * cols; i++) {
        sum += arr[i / rows][i % cols] * (i % 2 == 0 ? 1 : -1);
    }
    for(int i=0; i<rows; i++) {
        free(arr[i]);
    }
    free(arr);
    printf("%d", sum);
}', '<p><br></p>', 1, 2025, 'set()의 인덱스 계산으로 배열을 채운 뒤, 짝수·홀수 인덱스에 +/- 부호를 교대 적용해 합산 → 13', 'c', NULL, 'CODE', '2025년 1회 11번 — C언어 2차원 배열 포인터', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C 코드의 실행 결과를 작성하시오.', 11, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (72, '2026-05-29 02:08:47.814271', 1, 'N', '2026-07-08 22:18:25.700721', 1, 'Y', '(1) ㅁ / (2) ㄴ / (3) ㄹ', NULL, '<p><span style="color: rgb(255, 255, 255);">(1) 다른 모듈 내부에 있는 변수나 기능을 다른 모듈에서 사용하는 경우의 결합도</span></p><p><br></p><p><span style="color: rgb(255, 255, 255);">(2) 모듈 간의 인터페이스로 배열이나 오브젝트, 자료구조 등이 전달되는 경우의 결합도</span></p><p><br></p><p><span style="color: rgb(255, 255, 255);">(3) 파라미터가 아닌 모듈 밖에 선언되어 있는 전역 변수를 참조하고 전역 변수를 갱신하는 식으로 상호작용하는 경우의 결합도</span></p><p><br></p><p>[보기] ㄱ. 자료 결합도 ㄴ. 스탬프 결합도 ㄷ. 제어 결합도 ㄹ. 공통 결합도 ㅁ. 내용 결합도 ㅂ. 외부 결합도</p>', 1, 2025, NULL, 'other', NULL, 'SHORT_ANSWER', '2025년 1회 12번 — 결합도(Coupling) 종류', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음은 결합도(Coupling)와 관련된 설명이다. 보기에서 알맞은 답을 골라 작성하시오.', 12, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (73, '2026-05-29 02:08:47.826271', 1, 'N', '2026-07-08 22:35:27.207792', 1, 'Y', '54', 'public class Main {
    public static void main(String[] args) {
        new Child();
        System.out.println(Parent.total);
    }
}
class Parent {
    static int total = 0;
    int v = 1;
    public Parent() {
        total += (++v);
        show();
    }
    public void show() {
        total += total;
    }
}
class Child extends Parent {
    int v = 10;
    public Child() {
        v += 2;
        total += v++;
        show();
    }
    @Override
    public void show() {
        total += total * 2;
    }
}', '<p><br></p>', 1, 2025, 'Parent 생성자에서 total+=(++v)=2, 동적 바인딩된 Child.show()로 total+=total*2 → 6. 이후 Child 생성자에서 total+=12=18, 다시 show()로 total+=total*2 → 54', 'java', NULL, 'CODE', '2025년 1회 13번 — Java 상속과 static 변수', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Java 코드의 실행 결과를 작성하시오.', 13, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (67, '2026-05-29 02:08:47.749513', 1, 'N', '2026-07-08 21:29:41.002029', 1, 'Y', 'name=이순신 / incentives=1000', NULL, '<p><img src="/uploads/images/b8fb4d3f-0c87-4dd0-b15e-ca54e7efeeec.png"></p><p><br></p><p><span style="color: rgb(255, 255, 255);">SELECT name, incentive FROM emp, sal WHERE emp.id = sal.id and incentives &gt;= 500</span></p>', 1, 2025, 'emp와 sal을 id로 조인하면 홍길동(300)·강감찬(300)·이순신(1000)이 매칭되고, 그중 incentives가 500 이상인 행은 이순신(1000)뿐이다.', 'other', NULL, 'SHORT_ANSWER', '2025년 1회 7번 — SQL 조인 실행 결과', 2, 7, NULL, NULL, NULL, NULL, NULL, '다음은 SQL 문제이다. 아래 두 테이블을 참고하여 보기에 쿼리 실행 결과를 작성하시오.', 7, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (75, '2026-05-29 02:08:47.854271', 1, 'N', '2026-07-08 22:41:55.82045', 1, 'Y', '① int a = 0 / ② a < m || b[a] < x / ③ b[a] < 0 / ④ b[a] = -b[a]; / ⑤ a++; / ⑥ return 1; / ⑦ ③ → ④ → ⑤ → ② → ⑥', NULL, '<p>int Main(int b[], int m, int x) {</p><p>    int a = 0;</p><p>    while (a &lt; m || b[a] &lt; x) {</p><p>        if (b[a] &lt; 0)</p><p>            b[a] = -b[a];</p><p>        a++;</p><p>    }</p><p>    return 1;</p><p>}</p><p><br></p><p>1.( ① ) 2.( ② ) 3.( ③ ) 4.( ④ ) 5.( ⑤ ) 6.( ⑥ )</p><p>문장 커버리지 순서: 1 → 2 → ( ⑦ )</p>', 1, 2025, NULL, 'other', NULL, 'SHORT_ANSWER', '2025년 1회 15번 — 문장 커버리지 제어 흐름도', 30, 7, NULL, NULL, NULL, NULL, NULL, '문장(Statement) 커버리지 테스트를 수행하려고 한다. 아래 코드를 제어 흐름도 빈칸에 연결되도록 작성하고, 문장 커버리지 순서대로 작성하시오.', 15, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (76, '2026-05-29 02:08:47.875261', 1, 'N', '2026-07-08 22:42:27.208802', 1, 'Y', '20', 'public class Main {
    public static void main(String[] args) {
        int[] data = {3, 5, 8, 12, 17};
        System.out.println(func(data, 0, data.length - 1));
    }
    static int func(int[] a, int st, int end) {
        if (st >= end) return 0;
        int mid = (st + end) / 2;
        return a[mid] + Math.max(func(a, st, mid), func(a, mid + 1, end));
    }
}', '<p><br></p>', 1, 2025, '분할 재귀로 각 구간의 중앙값 a[mid]에 좌·우 재귀 중 큰 값을 더해 누적 → 20', 'java', NULL, 'CODE', '2025년 1회 16번 — Java 재귀 함수', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Java 코드의 실행 결과를 작성하시오.', 16, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (77, '2026-05-29 02:08:47.890564', 1, 'N', '2026-07-08 22:44:06.283463', 1, 'Y', '13', 'class Node:
    def __init__(self, value):
        self.value = value
        self.children = []
def tree(li):
    nodes = [Node(i) for i in li]
    for i in range(1, len(li)):
        nodes[(i - 1) // 2].children.append(nodes[i])
    return nodes[0]
def calc(node, level=0):
    if node is None:
        return 0
    return (node.value if level % 2 == 1 else 0) + sum(calc(n, level + 1) for n in node.children)
li = [3, 5, 8, 12, 15, 18, 21]
root = tree(li)
print(calc(root))', '<p><br></p>', 1, 2025, '리스트로 완전 이진 트리를 구성한 뒤 홀수 레벨(level%2==1) 노드의 값만 합산 → 5+8=13', 'python', NULL, 'CODE', '2025년 1회 17번 — Python 트리 순회', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Python 코드의 실행 결과를 작성하시오.', 17, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (78, '2026-05-29 02:08:47.903787', 1, 'N', '2026-07-08 22:44:28.347609', 1, 'Y', '35421', '#include <stdio.h>
#include <stdlib.h>
typedef struct Data {
    int value;
    struct Data *next;
} Data;
Data* insert(Data* head, int value) {
    Data* new_node = (Data*)malloc(sizeof(Data));
    new_node->value = value;
    new_node->next = head;
    return new_node;
}
Data* reconnect(Data* head, int value) {
    if (head == NULL || head->value == value) return head;
    Data *prev = NULL, *curr = head;
    while (curr != NULL && curr->value != value) {
        prev = curr;
        curr = curr->next;
    }
    if (curr != NULL && prev != NULL) {
        prev->next = curr->next;
        curr->next = head;
        head = curr;
    }
    return head;
}
int main() {
    Data *head = NULL, *curr;
    for (int i = 1; i <= 5; i++)
        head = insert(head, i);
    head = reconnect(head, 3);
    for (curr = head; curr != NULL; curr = curr->next)
        printf("%d", curr->value);
    return 0;
}', '<p><br></p>', 1, 2025, 'insert로 5→4→3→2→1 구성 후 reconnect(3)으로 값 3 노드를 맨 앞으로 이동 → 35421', 'c', NULL, 'CODE', '2025년 1회 18번 — C언어 연결 리스트 재배치', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C 코드의 실행 결과를 작성하시오.', 18, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (79, '2026-05-29 02:08:47.917711', 1, 'N', '2026-07-08 22:44:48.80625', 1, 'Y', '908', '#include <stdio.h>
typedef struct student {
    char* name;
    int score[3];
} Student;
int dec(int enc) {
    return enc & 0xA5;
}
int sum(Student* p) {
    return dec(p->score[0]) + dec(p->score[1]) + dec(p->score[2]);
}
int main() {
    Student s[2] = { "Kim", {0xA0, 0xA5, 0xDB}, "Lee", {0xA0, 0xED, 0x81} };
    Student* p = s;
    int result = 0;
    for (int i = 0; i < 2; i++) {
        result += sum(&s[i]);
    }
    printf("%d", result);
    return 0;
}', '<p><br></p>', 1, 2025, '각 score를 0xA5와 비트 AND 한 값들의 합 → 908', 'c', NULL, 'CODE', '2025년 1회 19번 — C언어 비트 AND 연산', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C 코드의 실행 결과를 작성하시오.', 19, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (80, '2026-05-29 02:08:47.931712', 1, 'N', '2026-07-08 22:45:16.095868', 1, 'Y', '4', 'public class Main {
  public static void main(String[] args) {
    System.out.println(calc("5"));
  }
  static int calc(int value) {
    if (value <= 1) return value;
    return calc(value - 1) + calc(value - 2);
  }
  static int calc(String str) {
    int value = Integer.valueOf(str);
    if (value <= 1) return value;
    return calc(value - 1) + calc(value - 3);
  }
}', '<p><br></p>', 1, 2025, 'calc("5")는 String 오버로드 진입 후 calc(value-1)+calc(value-3) 분기, 이후 int 오버로드(피보나치형)로 재귀 → 4', 'java', NULL, 'CODE', '2025년 1회 20번 — Java 메서드 오버로딩', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Java 코드의 실행 결과를 작성하시오.', 20, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (81, '2026-05-29 02:22:45.134631', 1, 'N', '2026-05-29 02:22:45.134631', 1, 'Y', 'OOAAA', 'public class Main{
  static String[] s = new String[3];
  static void func(String[] s, int size){
    for(int i=1; i<size; i++){
      if(s[i-1].equals(s[i])){
        System.out.print("O");
      }else{
        System.out.print("N");
      }
    }
    for (String m : s){
      System.out.print(m);
    }
  }
  public static void main(String[] args){
    s[0] = "A";
    s[1] = "A";
    s[2] = new String("A");
    func(s, 3);
  }
}', '<p>다음 Java 코드의 실행 결과를 작성하시오.</p>', 3, 2024, 'equals는 값 비교이므로 "A".equals("A")는 모두 true → "OO", 이후 배열 원소를 출력 → "AAA" → OOAAA', 'java', '[]', 'CODE', '2024년 3회 1번 — Java 문자열 equals 비교', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (82, '2026-05-29 02:22:45.149593', 1, 'N', '2026-05-29 02:22:45.149593', 1, 'Y', '3', 'def func(lst):
  for i in range(len(lst) // 2):
    lst[i], lst[-i-1] = lst[-i-1], lst[i]
lst = [1, 2, 3, 4, 5, 6]
func(lst)
print(sum(lst[::2]) - sum(lst[1::2]))', '<p>다음 Python 코드의 실행 결과를 작성하시오.</p>', 3, 2024, 'func는 리스트를 뒤집어 [6,5,4,3,2,1]. 짝수 인덱스 합(6+4+2=12) - 홀수 인덱스 합(5+3+1=9) = 3', 'python', '[]', 'CODE', '2024년 3회 2번 — Python 리스트 뒤집기와 슬라이싱', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (83, '2026-05-29 02:22:45.159806', 1, 'N', '2026-05-29 02:22:45.159806', 1, 'Y', '1', '', '<p>아래 employee 테이블과 project 테이블을 참고하여, 보기의 SQL 명령어 실행 결과를 작성하시오.</p><p><strong>[employee]</strong></p><table border="1"><thead><tr><th>no</th><th>first_name</th><th>last_name</th><th>project_id</th></tr></thead><tbody><tr><td>1</td><td>John</td><td>Doe</td><td>10</td></tr><tr><td>2</td><td>Jim</td><td>Carry</td><td>20</td></tr><tr><td>3</td><td>Rachel</td><td>Redmond</td><td>10</td></tr></tbody></table><p><strong>[project]</strong></p><table border="1"><thead><tr><th>project_id</th><th>name</th></tr></thead><tbody><tr><td>10</td><td>Alpha</td></tr><tr><td>20</td><td>Beta</td></tr><tr><td>10</td><td>Gamma</td></tr></tbody></table><pre><code>SELECT count(*)
FROM employee AS e JOIN project AS p ON e.project_id = p.project_id
WHERE p.name IN (
    SELECT name FROM project p WHERE p.project_id IN (
        SELECT project_id FROM employee GROUP BY project_id HAVING count(*) &lt; 2
    )
);</code></pre>', 3, 2024, '서브쿼리: employee가 1건뿐인 project_id=20(Beta)을 구함. 외부 조인 결과 중 name=''Beta''인 행은 Jim 1건 → count(*) = 1', 'other', '[]', 'SHORT_ANSWER', '2024년 3회 3번 — SQL 서브쿼리 count', 2, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (84, '2026-05-29 02:22:45.169565', 1, 'N', '2026-05-29 02:22:45.169565', 1, 'Y', '12', '', '<p>다음 페이지 참조 순서를 참고하여, 할당된 프레임 수가 3개일 때 LRU 알고리즘의 페이지 부재(Page Fault) 횟수를 작성하시오.</p><p>페이지 참조 순서: 7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1</p>', 3, 2024, '', 'other', '[]', 'SHORT_ANSWER', '2024년 3회 4번 — 운영체제 LRU 페이지 부재', 1, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (85, '2026-05-29 02:22:45.179545', 1, 'N', '2026-05-29 02:22:45.179545', 1, 'Y', '스머프(Smurf) 또는 스머핑(Smurfing)', '', '<p>다음은 네트워크 취약점에 대한 문제이다. 아래 설명에 해당하는 용어를 작성하시오.</p><ul><li>IP나 ICMP의 특성을 악용하여 엄청난 양의 데이터를 한 사이트에 집중적으로 보냄으로써 네트워크의 일부를 불능 상태로 만드는 공격이다.</li><li>여러 호스트가 특정 대상에게 다량의 ICMP Echo Reply를 보내게 하여 서비스 거부(DoS)를 유발시키는 보안 공격이다.</li><li>공격 대상 호스트는 다량으로 유입되는 패킷으로 인해 서비스 불능 상태에 빠진다.</li></ul>', 3, 2024, '', 'other', '[]', 'SHORT_ANSWER', '2024년 3회 5번 — 네트워크 취약점 — 스머프 공격', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (86, '2026-05-29 02:22:45.188796', 1, 'N', '2026-05-29 02:22:45.188796', 1, 'Y', '행위(Behavioral)', '', '<p>다음은 GoF 디자인 패턴과 관련된 문제이다. 괄호 안에 알맞은 용어를 작성하시오.</p><ul><li>( ) 패턴은 클래스나 객체들이 서로 상호작용하는 방법이나 책임 분배 방법을 정의하는 패턴이다.</li><li>( ) 패턴은 객체들 간의 통신 방법을 정의하고 알고리즘을 캡슐화하여 객체 간의 결합도를 낮춘다.</li><li>( ) 패턴에는 Chain of Responsibility, Command, Observer 패턴 등이 있다.</li></ul>', 3, 2024, '', 'other', '[]', 'SHORT_ANSWER', '2024년 3회 6번 — GoF 디자인 패턴 — 행위 패턴', 30, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (87, '2026-05-29 02:22:45.198538', 1, 'N', '2026-05-29 02:22:45.198538', 1, 'Y', '20', '#include <stdio.h>
int func(){
  static int x = 0;
  x += 2;
  return x;
}
int main(){
  int x = 1;
  int sum = 0;
  for(int i=0; i<4; i++) {
    x++;
    sum += func();
  }
  printf("%d", sum);
  return 0;
}', '<p>다음 C 코드의 실행 결과를 작성하시오.</p>', 3, 2024, 'static x는 호출마다 값을 유지하며 2, 4, 6, 8을 반환 → sum = 2+4+6+8 = 20', 'c', '[]', 'CODE', '2024년 3회 7번 — C언어 static 변수', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (88, '2026-05-29 02:22:45.207892', 1, 'N', '2026-05-29 02:22:45.207892', 1, 'Y', '개체(Entity) 무결성', '', '<p>다음은 무결성 제약조건에 대한 문제이다. 아래 표(StudentID가 기본키)에서 위반한 ( ) 무결성의 종류를 작성하시오.</p><table border="1"><thead><tr><th>StudentID (PK)</th><th>Name</th><th>Age</th><th>Major</th></tr></thead><tbody><tr><td>101</td><td>Alice</td><td>20</td><td>Computer Science</td></tr><tr><td>102</td><td>Bob</td><td>21</td><td>Mathematics</td></tr><tr><td>101</td><td>David</td><td>23</td><td>Chemistry</td></tr><tr><td>NULL</td><td>Eve</td><td>22</td><td>Biology</td></tr></tbody></table>', 3, 2024, '기본키 StudentID에 중복값(101)과 NULL(Eve)이 존재한다. 기본키는 유일하고 NULL일 수 없으므로 개체 무결성을 위반한다.', 'other', '[]', 'SHORT_ANSWER', '2024년 3회 8번 — 무결성 위반 — 개체 무결성', 31, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (103, '2026-07-09 22:35:22.253624', 1, 'N', '2026-07-10 23:20:13.911992', 1, 'Y', '19', '#include <stdio.h>
int main() {
    int a = 7;
    int b = 2;
    int c = 0;
    c = (a >> 1) + (b << 3);
    printf("%d", c);
    return 0;
}', '', NULL, NULL, NULL, 'javascript', NULL, 'CODE', '정보처리기사 실기 / 프로그래밍 언어/c언어 연산 문제 - 003', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C언어 프로그램의 실행 결과를 쓰시오.', 3, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (101, '2026-07-09 22:33:02.170152', 1, 'N', '2026-07-10 23:18:52.017513', 1, 'Y', '13', '#include <stdio.h>
int main() {
    int a = 12;
    int b = 5;
    int c;
    c = (a & b) | (a ^ b);
    printf("%d", c);
    return 0;
}', '', NULL, NULL, NULL, 'javascript', NULL, 'CODE', '정보처리기사 실기 / 프로그래밍 언어/C언어 연산 문제 - 001', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C언어 프로그램의 실행 결과를 쓰시오.', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (102, '2026-07-09 22:34:05.913863', 1, 'N', '2026-07-10 23:20:05.727877', 1, 'Y', '20 12 28', '#include <stdio.h>
int main() {
    int x = 10;
    int y = 3;
    x = x << 1;
    y = y << 2;
    printf("%d %d %d", x, y, x | y);
    return 0;
}', '<p><br></p>', NULL, NULL, NULL, 'javascript', NULL, 'CODE', '정보처리기사 실기 / 프로그래밍 언어/c언어 연산 문제 - 002', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C언어 프로그램의 실행 결과를 쓰시오.', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (89, '2026-05-29 02:22:45.217915', 1, 'N', '2026-05-29 02:22:45.217915', 1, 'Y', '43125', '', '<p>다음은 URL 구조에 관한 문제이다. 아래 URL의 (1)~(5) 영역에 대해, 보기의 용어 순서대로 해당하는 번호를 작성하시오.</p><pre><code>foo://localhost:8080/over/there?name=ferret#nose
(1) foo   (2) localhost:8080   (3) /over/there   (4) name=ferret   (5) nose</code></pre><p>[보기]<br/>query : 서버에 전달할 추가 데이터<br/>path : 서버 내의 특정 자원을 가리키는 경로<br/>scheme : 리소스에 접근하는 방법이나 프로토콜<br/>authority : 사용자 정보, 호스트명, 포트 번호<br/>fragment : 특정 문서 내의 위치</p>', 3, 2024, 'URL 구조는 scheme(1)://authority(2)/path(3)?query(4)#fragment(5). 보기 순서(query, path, scheme, authority, fragment) → 4, 3, 1, 2, 5', 'other', '[]', 'SHORT_ANSWER', '2024년 3회 9번 — URL 구조', 33, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (90, '2026-05-29 02:22:45.227394', 1, 'N', '2026-05-29 02:22:45.227394', 1, 'Y', '45', 'def func(value):
    if type(value) == type(100):
        return 100
    elif type(value) == type(""):
        return len(value)
    else:
        return 20
a = ''100.0''
b = 100.0
c = (100, 200)
print(func(a) + func(b) + func(c))', '<p>다음 Python 코드의 실행 결과를 작성하시오.</p>', 3, 2024, 'a는 문자열이므로 len(''100.0'')=5, b는 float이므로 else 20, c는 tuple이므로 else 20 → 5+20+20 = 45', 'python', '[]', 'CODE', '2024년 3회 10번 — Python type 판별', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (91, '2026-05-29 02:22:45.236251', 1, 'N', '2026-05-29 02:22:45.236251', 1, 'Y', '52', 'public class Main{
  public static void main(String[] args){
    Base a = new Derivate();
    Derivate b = new Derivate();
    System.out.print(a.getX() + a.x + b.getX() + b.x);
  }
}
class Base{
  int x = 3;
  int getX(){
    return x * 2;
  }
}
class Derivate extends Base{
  int x = 7;
  int getX(){
    return x * 3;
  }
}', '<p>다음 Java 코드의 실행 결과를 작성하시오.</p>', 3, 2024, '메서드는 동적 바인딩되어 a.getX()=b.getX()=7*3=21. 필드는 정적 타입을 따라 a.x=Base의 3, b.x=Derivate의 7 → 21+3+21+7 = 52', 'java', '[]', 'CODE', '2024년 3회 11번 — Java 상속 필드/메서드 바인딩', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (92, '2026-05-29 02:22:45.245282', 1, 'N', '2026-05-29 02:22:45.245282', 1, 'Y', '312', '#include <stdio.h>
struct Node {
  int value;
  struct Node* next;
};
void func(struct Node* node){
  while(node != NULL && node->next != NULL){
    int t = node->value;
    node->value = node->next->value;
    node->next->value = t;
    node = node->next->next;
  }
}
int main(){
  struct Node n1 = {1, NULL};
  struct Node n2 = {2, NULL};
  struct Node n3 = {3, NULL};
  n1.next = &n3;
  n3.next = &n2;
  func(&n1);
  struct Node* current = &n1;
  while(current != NULL){
    printf("%d", current->value);
    current = current->next;
  }
  return 0;
}', '<p>다음 C 코드의 실행 결과를 작성하시오.</p>', 3, 2024, '리스트는 1→3→2. func가 인접 쌍(n1,n3)의 값을 교환하여 3→1→2가 되고, 남은 노드는 한 개라 멈춤 → 출력 312', 'c', '[]', 'CODE', '2024년 3회 12번 — C언어 연결 리스트 값 교환', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (93, '2026-05-29 02:22:45.25399', 1, 'N', '2026-05-29 02:22:45.25399', 1, 'Y', '1. 문장 / 2. 분기 / 3. 조건', '', '<p>다음은 테스트 커버리지에 대한 문제이다. 아래 설명에 알맞은 답을 보기에서 골라 작성하시오.</p><ul><li>1. 테스트를 통해 프로그램의 모든 문장을 최소한 한 번씩 실행했는지를 측정</li><li>2. 프로그램 내의 모든 분기(조건문)의 각 분기를 최소한 한 번씩 실행했는지를 측정</li><li>3. 복합 조건 내의 각 개별 조건이 참과 거짓으로 평가되는 경우를 모두 테스트했는지를 측정</li></ul><p>[보기] ㄱ. 조건 ㄴ. 경로 ㄷ. 결정 ㄹ. 분기 ㅁ. 함수 ㅂ. 문장 ㅅ. 루프</p>', 3, 2024, '', 'other', '[]', 'SHORT_ANSWER', '2024년 3회 13번 — 테스트 커버리지 종류', 30, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (94, '2026-05-29 02:22:45.263749', 1, 'N', '2026-05-29 02:22:45.263749', 1, 'Y', '(1) 연관 / (2) 일반화 / (3) 의존', '', '<p>아래는 UML 클래스의 관계에 관한 문제이다. 보기를 보고 (1)~(3)에 알맞은 관계를 골라 작성하시오.</p><ul><li>(1) ''차''와 ''타이어·바퀴·엔진''이 실선으로 연결된 관계</li><li>(2) ''버스·택시·승용차''가 속이 빈 삼각형 화살표(▷)로 ''차''를 가리키는 관계</li><li>(3) ''텔레비전''이 점선 화살표(⇢)로 ''리모콘''을 가리키는 관계</li></ul><p>[보기] ㄱ. 의존 ㄴ. 연관 ㄷ. 일반화</p>', 3, 2024, '', 'other', '[]', 'SHORT_ANSWER', '2024년 3회 14번 — UML 클래스 관계', 30, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (95, '2026-05-29 02:22:45.272833', 1, 'N', '2026-05-29 02:22:45.272833', 1, 'Y', '(1) 외래키 / (2) 후보키 / (3) 대체키 / (4) 슈퍼키', '', '<p>다음은 데이터베이스 키에 관한 문제이다. 아래 설명에 알맞은 답을 보기에서 골라 작성하시오.</p><ul><li>(1) 다른 테이블(릴레이션)의 기본 키를 참조하는 속성 또는 속성들의 집합</li><li>(2) 테이블에서 각 행을 유일하게 식별할 수 있는 최소한의 속성들의 집합</li><li>(3) 후보 키 중에서 선정된 기본 키를 제외한 나머지 후보 키</li><li>(4) 테이블에서 각 행을 유일하게 식별할 수 있는 속성들의 집합</li></ul><p>[보기] ㄱ. 슈퍼키 ㄴ. 외래키 ㄷ. 대체키 ㄹ. 후보키</p>', 3, 2024, '', 'other', '[]', 'SHORT_ANSWER', '2024년 3회 15번 — 데이터베이스 키 종류', 31, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (96, '2026-05-29 02:22:45.282223', 1, 'N', '2026-05-29 02:22:45.282223', 1, 'Y', '1', '#include <stdio.h>
void func(int** arr, int size){
  for(int i=0; i<size; i++){
    *(*arr + i) = (*(*arr+i) + i) % size;
  }
}
int main(){
  int arr[] = {3, 1, 4, 1, 5};
  int* p = arr;
  int** pp = &p;
  int num = 6;
  func(pp, 5);
  num = arr[2];
  printf("%d", num);
  return 0;
}', '<p>다음 C 코드의 실행 결과를 작성하시오.</p>', 3, 2024, 'func는 arr[i] = (arr[i]+i)%5로 갱신 → arr[2] = (4+2)%5 = 1 → 출력 1', 'c', '[]', 'CODE', '2024년 3회 16번 — C언어 이중 포인터 배열 연산', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (98, '2026-05-29 02:22:45.301789', 1, 'N', '2026-05-29 02:22:45.301789', 1, 'Y', '101', 'public class ExceptionHandling {
  public static void main(String[] args) {
    int sum = 0;
    try {
      func();
    } catch (NullPointerException e) {
      sum = sum + 1;
    } catch (Exception e) {
      sum = sum + 10;
    } finally {
      sum = sum + 100;
    }
    System.out.print(sum);
  }
  static void func() throws Exception {
    throw new NullPointerException();
  }
}', '<p>다음 Java 코드의 실행 결과를 작성하시오.</p>', 3, 2024, 'NullPointerException이 발생하여 첫 catch에서 sum=1, finally에서 +100 → 101', 'java', '[]', 'CODE', '2024년 3회 18번 — Java 예외 처리와 finally', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (97, '2026-05-29 02:22:45.293203', 1, 'N', '2026-07-06 23:31:59.533424', 1, 'Y', 'VPN', NULL, '<ul><li>공용 네트워크를 통해 사설 네트워크를 확장하는 기술이다.</li><li>사용자의 IP 주소를 숨기고, 사용자가 어디에서 접속하는지를 추적하기 어렵게 만든다.</li><li>종류로는 IPsec, SSL, L2TP 등이 있다.</li></ul>', 3, 2024, NULL, 'other', NULL, 'SHORT_ANSWER', '2024년 3회 17번 — 보안 기술 — VPN', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (99, '2026-05-29 02:22:45.312291', 1, 'N', '2026-05-29 02:22:45.312291', 1, 'Y', 'B0', 'class Main {
  public static class Collection<T>{
    T value;
    public Collection(T t){
      value = t;
    }
    public void print(){
      new Printer().print(value);
    }
    class Printer{
      void print(Integer a){
        System.out.print("A" + a);
      }
      void print(Object a){
        System.out.print("B" + a);
      }
      void print(Number a){
        System.out.print("C" + a);
      }
    }
  }
  public static void main(String[] args) {
    new Collection<>(0).print();
  }
}', '<p>다음 Java 코드의 실행 결과를 작성하시오.</p>', 3, 2024, 'value의 타입은 제네릭 T로 컴파일 시 Object로 소거되므로, 오버로딩 해석 결과 print(Object)가 선택되어 "B0" 출력', 'java', '[]', 'CODE', '2024년 3회 19번 — Java 제네릭과 메서드 오버로딩', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (100, '2026-05-29 02:22:45.321295', 1, 'N', '2026-05-29 02:22:45.321295', 1, 'Y', 'ㄹ. Ad-hoc Network', '', '<p>다음은 네트워크에 대한 문제이다. 아래 설명을 보고 알맞은 용어를 보기에서 골라 작성하시오.</p><ul><li>중앙 관리나 고정된 인프라 없이 임시로 구성되는 네트워크이다.</li><li>일반적으로 무선 통신을 통해 노드들이 직접 연결되어 데이터를 주고받는다.</li><li>긴급 구조, 긴급 회의, 군사적 상황 등에서 유용하게 활용될 수 있다.</li></ul><p>[보기] ㄱ. Infrastructure Network ㄴ. Firmware Network ㄷ. Peer-to-Peer Network ㄹ. Ad-hoc Network ㅁ. Mesh Network ㅂ. Sensor Network ㅅ. Virtual Private Network</p>', 3, 2024, '', 'other', '[]', 'SHORT_ANSWER', '2024년 3회 20번 — 네트워크 — Ad-hoc Network', 4, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (21, '2026-05-29 01:42:26.720087', 1, 'N', '2026-07-08 15:31:00.660911', 1, 'Y', '6', NULL, '<p>(&nbsp;&nbsp;) 다이어그램이란</p><p>시스템을 폴더 모양의 (&nbsp;&nbsp;) 단위로 구분하여 구성 요소 간의 관계를 표현하는 UML 구조 다이어그램이다.</p><p>하나의 (&nbsp;&nbsp;) 안에는 여러 클래스나 하위 (&nbsp;&nbsp;) 가 포함될 수 있으며,</p><p>(&nbsp;&nbsp;) 간에는 «import», «access», «merge» 등의 관계를 통해 의존성(Dependency) 을 표현한다.</p><p>&nbsp;</p><p>이 다이어그램은 코드의 실제 구조(폴더 구조)와 비슷하게 표현되기 때문에</p><p>소프트웨어의 모듈화, 재사용성, 의존 관계를 시각적으로 설계할 때 자주 사용된다.</p>', 3, 2025, NULL, 'other', '["활동", "상태", "클래스", "객체", "순서", "패키지", "컴포넌트"]', 'SHORT_ANSWER', '2025년 3회 1번 — UML 다이어그램 명칭', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 UML 다이어그램의 명칭을 쓰시오.', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (22, '2026-05-29 01:42:26.722087', 1, 'N', '2026-07-08 15:33:55.999769', 1, 'Y', '8', NULL, '<p>소프트웨어 테스트의 구조 기반(화이트박스) 기법 중 하나로,</p><p>결정 포인트(Decision Point) 내에 존재하는 모든 개별 조건식(Atomic Condition) 을 대상으로 하는 커버리지 기준이 있다.</p><p>&nbsp;</p><p>하나의 결정문(예: if (A &amp;&amp; B) 또는 if (X &gt; 10 || Y == 0)) 안에는</p><p>여러 개의 조건식이 포함될 수 있는데 이 커버리지는</p><p>각각의 조건식이 True와 False 두 가지 경우를 모두 한 번 이상 만족하도록</p><p>테스트 케이스를 설계해야 한다.</p><p>&nbsp;</p><p>즉, 모든 개별 조건이 두 방향의 결과를 거쳐야 “커버되었다”고 판단하지만</p><p>그렇다고 해서 전체 결정식(Decision Expression) 의 결과(True/False)가</p><p>모두 수행된다고 보장하지는 않는다.</p>', 3, 2025, '결정(분기) 커버리지는 조건식 전체의 T/F를 다루고, 조건 커버리지는 개별 조건식 각각의 T/F를 다룬다.', 'other', '["경로(Path)", "결정(Decision)", "조건/결정(Condition/Decision)", "변경 조건/결정(Modified Condition/Decision, MC/DC)", "다중 조건(Multiple Condition)", "문장(Statement)", "분기(Branch)", "조건(Condition)"]', 'SHORT_ANSWER', '2025년 3회 2번 — 화이트박스 테스트 커버리지', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 화이트박스 테스트 커버리지 기법을 <보기>에서 고르시오.', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (6, '2026-05-29 01:16:43.937621', 1, 'N', '2026-07-08 16:09:13.890936', 1, 'Y', '1. 정보 / 2. 감독 / 3. 비번호 / 4. 비동기 균형 모드 / 5. 비동기 응답 모드', NULL, '<p><br></p><ol><li>HDLC 프레임의 구성 단위로, 실제 사용자 데이터를 전송하는 프레임</li><li>데이터 링크의 흐름을 관리하고 오류 제어 및 통신 상태를 감시하는 프레임</li><li>순서 번호 없이 링크 설정, 해제, 모드 설정 등 제어 기능을 수행하는 프레임</li><li>두 국(Station)이 동등한 위치에서 서로 명령과 응답을 주고받는 모드</li><li>종국(Secondary)이 주국(Primary)의 허가 없이도 자발적으로 응답을 전송할 수 있는 모드</li></ol>', 1, 2026, NULL, 'other', NULL, 'SHORT_ANSWER', '2026년 1회 6번 — HDLC 프레임 및 모드', 4, 7, NULL, NULL, NULL, NULL, NULL, 'HDLC는 비트 중심의 데이터 링크 제어 프로토콜로, 프레임 단위로 데이터를 전송하며 흐름 제어 및 오류 복구 기능을 제공한다. 다음 설명에 알맞은 용어를 쓰시오.', 5, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (15, '2026-05-29 01:16:43.940619', 1, 'N', '2026-07-08 16:12:23.399947', 1, 'Y', '심볼릭링크', NULL, '<p><span style="color: rgb(255, 255, 255);">원본&nbsp;데이터 파일은 별도로 존재하며, 공격자는 해당 파일의 경로를 가리키는 특수 파일을 생성한다. 프로그램이 임시 파일을 생성하는 순간을 틈타 해당 임시 파일을 미리 준비한 특수 파일로 교체한다. 이후 프로그램이 임시 파일의 존재를 확인하면 교체된 파일을 정상으로 인식하고 동작하게 된다.</span></p><p><br></p><p><strong style="color: rgb(255, 255, 255);">공격 절차</strong></p><p><br></p><p><span style="color: rgb(255, 255, 255);">1. 공격자는 실제 파일이 아닌, 특정 파일의 경로를 참조하는 특수 파일을 미리 준비한다.</span></p><p><span style="color: rgb(255, 255, 255);">2. 프로그램이 임시 파일을 생성하는 시점을 노려 해당 임시 파일을 준비한 특수 파일로 교체한다.</span></p><p><span style="color: rgb(255, 255, 255);">3. 프로그램이 임시 파일의 존재 여부를 확인할 때, 조건에 부합하면 정상으로 판단하고 동작하며 부합하지 않으면 임시 파일을 삭제한다.</span></p><p><br></p><p><strong>&lt;보기&gt;</strong> 하드링크 / 심볼릭링크 / 소프트링크 / 정적링크 / 동적링크</p>', 1, 2026, NULL, 'other', NULL, 'SHORT_ANSWER', '2026년 1회 15번 — 보안 공격 기법 (링크 공격)', 5, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 공격 기법을 <보기>에서 고르시오.', 9, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (46, '2026-05-29 01:51:18.135726', 1, 'N', '2026-07-08 16:23:58.642913', 1, 'Y', '① 128 / ② 62', NULL, '<p>호스트의 IP 주소가 223.13.234.132이고 서브넷 마스크가 255.255.255.192일 때 다음 물음에 답하시오.</p><p>&nbsp;</p><p>이 호스트가 속한 네트워크 주소는 223.13.234.( ① )이다.</p><p>&nbsp;</p><p>이 네트워크에서 사용 가능한 호스트 수는 ( ② )개이다.</p><ol><li>(단, 네트워크 주소와 브로드캐스트 주소는 제외한다.)</li></ol>', 2, 2025, '255.255.255.192=/26. 마지막 옥텟 0,64,128,192 단위 분할. 132는 128 네트워크 대역. 호스트=2^6-2=62', 'other', NULL, 'SHORT_ANSWER', '2025년 2회 6번 — IP 서브넷 계산', 4, 7, NULL, NULL, NULL, NULL, NULL, '다음은 IP 주소와 서브넷 마스크에 관한 문제이다. 주어진 정보를 참고하여 괄호 안에 들어갈 알맞은 값을 쓰시오.', 6, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (53, '2026-05-29 01:51:18.142504', 1, 'N', '2026-07-08 16:58:10.364446', 1, 'Y', '11.75', NULL, '<p>운영체제에서 라운드로빈(Round Robin, RR) 스케줄링은 각 프로세스에 동일한 시간 할당량(타임 퀀텀)을 순차적으로 부여하며 CPU를 할당하는 방식이다.</p><p>&nbsp;</p><p>다음은 4개의 프로세스가 서로 다른 시간에 도착하며 각기 다른 실행 시간을 가지는 상황이다. 이때 시간 할당량은 4ms이고 컨텍스트 스위칭 시간은 무시한다고 가정한다.</p><p>&nbsp;</p><p>아래 정보를 바탕으로 라운드로빈(RR) 방식으로 CPU 스케줄링을 수행할 경우 모든 프로세스의 평균 대기시간(Average Waiting Time)은 얼마인가?</p>', 2, 2025, NULL, 'other', NULL, 'SCHEDULING', '2025년 2회 13번 — 라운드로빈 스케줄링 평균 대기시간', 1, 7, NULL, NULL, NULL, NULL, '{"algorithm": "RR", "processes": [{"pid": "P1", "priority": null, "burstTime": 8, "arrivalTime": 0}, {"pid": "P2", "priority": null, "burstTime": 4, "arrivalTime": 1}, {"pid": "P3", "priority": null, "burstTime": 9, "arrivalTime": 2}, {"pid": "P4", "priority": null, "burstTime": 5, "arrivalTime": 3}], "timeQuantum": 4}', '다음 4개의 프로세스에 대해 라운드로빈 스케줄링을 적용할 때 평균 대기시간을 구하시오.', 13, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (62, '2026-05-29 02:08:47.661225', 1, 'N', '2026-07-08 21:22:51.855749', 1, 'Y', 'ㄱ. 도메인 / ㄴ. 개체 / ㄷ. 참조', NULL, '<p><img src="/uploads/images/782c8cef-da67-4692-8e01-9e72fd81b445.png"></p>', 1, 2025, 'ㄱ은 속성 값이 정의된 범위(도메인)에 속해야 하므로 도메인 무결성, ㄴ은 기본키가 NULL일 수 없고 유일해야 하므로 개체 무결성, ㄷ은 외래키가 참조 대상의 기본키 값이거나 NULL이어야 하므로 참조 무결성이다.', 'other', NULL, 'SHORT_ANSWER', '2025년 1회 2번 — 제약조건 — 무결성 종류', 31, 7, NULL, NULL, NULL, NULL, NULL, '다음은 제약조건과 관련된 문제이다. 괄호안에 알맞는 용어를 보기에 골라 작성하시오.', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (64, '2026-05-29 02:08:47.692397', 1, 'N', '2026-07-08 21:25:32.531825', 1, 'Y', 'ㄹ (스캐어웨어)', NULL, '<p><span style="color: rgb(255, 255, 255);">사용자가 원치 않는 소프트웨어를 구매하도록 조작하기 위해 사회 공학을 사용하여 충격, 불안 또는 위협에 대한 인식을 유발하는 악성 소프트웨어의 한 형태이다.</span></p><p><br></p><p><span style="color: rgb(255, 255, 255);">‘겁을 주다’라는 영어 단어에서 유래한 것으로 공포를 이용하여 피해자를 속여 대가를 지불 하거나 특정 행동을 유도하는 랜섬웨어이다.</span></p><p><br></p><p><span style="color: rgb(255, 255, 255);">가짜 바이러스 경고나 시스템 문제를 표시하여 사용자가 돈을 지불하거나 특정 소프트웨어를 설치하도록 속이는 방식으로 작동한다.&nbsp;</span></p><p><br></p><p><span style="color: rgb(255, 255, 255);">ㄱ. 컴포넌트 웨어&nbsp;&nbsp;ㄴ. 유즈웨어&nbsp;&nbsp;ㄷ. 셔블웨어&nbsp;&nbsp;ㄹ. 스캐어 웨어&nbsp;&nbsp;ㅁ. 안티 스파이 웨어&nbsp;&nbsp;ㅂ. 네트웨어&nbsp;&nbsp;ㅅ. 그룹웨어&nbsp;&nbsp;ㅇ. 애드웨어</span></p>', 1, 2025, NULL, 'other', NULL, 'SHORT_ANSWER', '2025년 1회 4번 — 악성코드 — 스캐어웨어', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 4, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (74, '2026-05-29 02:08:47.841271', 1, 'N', '2026-07-08 22:37:15.232888', 1, 'Y', 'Adapter', NULL, '<p><span style="color: rgb(255, 255, 255);">서로 다른 인터페이스를 가진 클래스들을 연결해 사용 가능하게 한다.</span></p><p><br></p><p><span style="color: rgb(255, 255, 255);">기존 클래스(Adaptee)를 원하는 인터페이스(Target)에 맞게 변환하는 어댑터(Adapter)를 만든다.</span></p><p><br></p><p><span style="color: rgb(255, 255, 255);">기존 클래스를 감싸서(wrapper) 인터페이스를 변환해주는 역할을 한다.&nbsp;</span></p><p><br></p><p><img src="/uploads/images/0813fc0c-07fc-41d9-ae75-a0079dc621c0.png"></p>', 1, 2025, '기존 클래스(Adaptee)를 원하는 인터페이스(Target)에 맞게 변환·연결하는 구조(Structural) 패턴은 Adapter이다.', 'other', NULL, 'SHORT_ANSWER', '2025년 1회 14번 — 디자인 패턴 — Adapter', 30, 7, NULL, NULL, NULL, NULL, NULL, '아래는 디자인 패턴에 대한 설명이다. 설명에 해당하는 패턴명을 보기에서 골라 작성하시오.', 14, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (16, '2026-05-29 01:16:43.940619', 1, 'N', '2026-07-08 16:12:55.473111', 1, 'Y', '워터링 홀 (Watering Hole)', NULL, '<p>공격자는 목표 대상이 업무 또는 관심사로 인해 자주 방문하는 합법적인 웹사이트를 사전에 파악한다.&nbsp;</p><p>&nbsp;</p><p>해당 사이트에 악성코드를 삽입하여 감염시켜 놓고, 피해자가 해당 사이트에 접속하는 순간 피해자의 시스템에 악성 프로그램이 자동으로 설치되도록 유도한다. 공격자는 불특정 다수를 노리는 것이 아니라 특정 조직이나 인물을 겨냥하며, 접속자의 IP나 환경 조건을 확인하여 목표 대상에게만 선택적으로 악성코드가 실행되도록 설계하는 경우도 있다.&nbsp;</p><p>&nbsp;</p><p>피해자는 정상적인 사이트를 방문했을 뿐이므로 감염 사실을 인지하기 어렵다는 특징이 있다.</p>', 1, 2026, NULL, 'other', NULL, 'SHORT_ANSWER', '2026년 1회 16번 — 보안 공격 기법', 5, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 보안 공격 기법의 이름을 쓰시오.', 16, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (33, '2026-05-29 01:42:26.745087', 1, 'N', '2026-07-08 16:00:21.699803', 1, 'Y', 'OAuth', NULL, '<p>사용자가 새로운 사이트에 가입하지 않고 평소에 이용하던 서비스의 계정으로 로그인할 수 있게 해주는 기술이다.</p><p>&nbsp;</p><p>사용자의 비밀번호는 절대 전달되지 않으며 사용자가 승인한 범위에 대해서만 접근 권한이 위임된다.</p><p>&nbsp;</p><p>이 방식은 직접 인증(Authentication)을 수행하지 않고 "인가(Authorization)" 절차를 통해 접근 권한을 제3자에게 부여한다.</p><p>&nbsp;</p><p>인증 완료 후, 서비스 제공자는 Access Token을 발급하며 애플리케이션은 이 토큰을 이용해 API를 호출하여 필요한 정보에 접근한다.</p><p>&nbsp;</p><p>대표적인 예는 소셜 로그인이며 SSO(Single Sign-On)과 달리 동일 시스템 내 인증이 아니라 서로 다른 서비스 간의 권한 위임에 초점이 맞춰져 있다.</p>', 3, 2025, NULL, 'other', NULL, 'SHORT_ANSWER', '2025년 3회 13번 — OAuth 인증 프로토콜', 5, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 인증/인가 프로토콜의 명칭을 쓰시오.', 13, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (110, '2026-07-09 23:45:59.315441', 1, 'N', '2026-07-10 23:19:01.341106', 1, 'Y', '1. FCFS 2. SJF 3. SRT 4. RR 5. HRN', NULL, '<h3>설명</h3><ol><li>먼저 도착한 프로세스를 먼저 처리하는 비선점 스케줄링 기법이다.</li><li>실행 시간이 가장 짧은 프로세스를 먼저 처리하는 비선점 스케줄링 기법이다.</li><li>남은 실행 시간이 가장 짧은 프로세스가 CPU를 차지하는 선점 스케줄링 기법이다.</li><li>각 프로세스에 동일한 시간 할당량을 부여하고, 할당 시간이 지나면 준비 큐의 뒤로 이동시키는 선점 스케줄링 기법이다.</li><li>대기시간과 실행시간을 이용하여 응답률이 가장 높은 프로세스를 먼저 처리하는 비선점 스케줄링 기법이다.</li></ol><p><br></p><p>&lt;보기&gt; FCFS, SJF, HRN, SRT, RR</p>', NULL, NULL, NULL, 'javascript', NULL, 'SHORT_ANSWER', 'SQLD / 운영체제/스케줄링 알고리즘 - 005', 1, 6, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 스케줄링 알고리즘을 보기에서 골라 쓰시오.', 5, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (112, '2026-07-11 11:12:17.103711', 1, 'Y', '2026-07-11 11:12:51.757867', 1, 'Y', 'name | salary
kim | 100
lee | 200', NULL, '<p>EMP 테이블에서 급여 100 이상인 사원명과 급여를 조회한 결과를 쓰시오.</p>', NULL, NULL, NULL, NULL, NULL, 'SQL', 'E2E 결과테이블 테스트용 SQL 문항', 2, 6, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{"tables": [{"name": "EMP", "rows": [["kim", "100"], ["lee", "200"], ["park", "50"]], "columns": [{"name": "name", "dataType": "VARCHAR", "primaryKey": true}, {"name": "salary", "dataType": "INT", "primaryKey": false}]}], "expectedResult": {"rows": [["kim", "100"], ["lee", "200"]], "columns": ["name", "salary"], "orderedRows": false}}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (106, '2026-07-09 23:39:24.044734', 1, 'N', '2026-07-10 22:26:47.824134', 1, 'Y', '6.5', NULL, '', NULL, NULL, '* 대기시간 = 시작시간 - 도착시간
(0 + 5 + 7 + 14) / 4 = 26 / 4 = 6.5', 'javascript', NULL, 'SCHEDULING', '정보처리기사 실기 / 운영체제/스케줄링 알고리즘 - 001', 1, 7, NULL, NULL, NULL, NULL, '{"algorithm": "FCFS", "processes": [{"pid": "P1", "priority": null, "burstTime": 6, "arrivalTime": 0}, {"pid": "P2", "priority": null, "burstTime": 3, "arrivalTime": 1}, {"pid": "P3", "priority": null, "burstTime": 8, "arrivalTime": 2}, {"pid": "P4", "priority": null, "burstTime": 4, "arrivalTime": 3}], "timeQuantum": null}', '다음은 프로세스의 도착 시간과 실행 시간을 나타낸 표이다.
FCFS 스케줄링 알고리즘을 적용할 경우, 각 프로세스의 실행 순서를 쓰고, 평균 대기시간을 구하시오.', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (109, '2026-07-09 23:44:32.731071', 1, 'N', '2026-07-10 23:19:13.306524', 1, 'Y', 'P1', NULL, '<p><br></p>', NULL, NULL, '* 우선순위 = (대기시간 + 실행시간) / 실행시간
모든 프로세스의 우선순위가 3으로 동일
동률 시 표의 순서를 따르면 P1', 'javascript', NULL, 'SCHEDULING', '정보처리기사 실기 / 운영체제/스케줄링 알고리즘 - 004', 1, 7, NULL, NULL, NULL, NULL, '{"algorithm": "FCFS", "processes": [{"pid": "P1", "priority": null, "burstTime": 3, "arrivalTime": 6}, {"pid": "P2", "priority": null, "burstTime": 2, "arrivalTime": 4}, {"pid": "P3", "priority": null, "burstTime": 4, "arrivalTime": 8}, {"pid": "P4", "priority": null, "burstTime": 5, "arrivalTime": 10}], "timeQuantum": null}', '다음은 프로세스의 대기시간과 실행시간을 나타낸 표이다.
HRN 스케줄링 알고리즘을 적용할 경우, 우선순위가 가장 높은 프로세스를 쓰시오.', 4, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (108, '2026-07-09 23:43:42.691417', 1, 'N', '2026-07-10 23:19:26.131397', 1, 'Y', '11', NULL, '', NULL, NULL, '* 대기시간 = 완료시간 - 도착시간 - 실행시간
7 + 3 + 0 + 1 = 11', 'javascript', NULL, 'SCHEDULING', '정보처리기사 실기 / 운영체제/스케줄링 알고리즘 - 003', 1, 7, NULL, NULL, NULL, NULL, '{"algorithm": "SRTF", "processes": [{"pid": "P1", "priority": null, "burstTime": 9, "arrivalTime": 0}, {"pid": "P2", "priority": null, "burstTime": 4, "arrivalTime": 1}, {"pid": "P3", "priority": null, "burstTime": 2, "arrivalTime": 2}, {"pid": "P4", "priority": null, "burstTime": 1, "arrivalTime": 3}], "timeQuantum": null}', '다음은 프로세스의 도착 시간과 실행 시간을 나타낸 표이다.
선점 SRT 스케줄링 알고리즘을 적용할 경우, 각 프로세스의 실행 구간을 간트 차트 형태로 나타내고, 대기시간의 총합을 구하시오.', 3, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (111, '2026-07-11 10:37:55.863056', 1, 'Y', '2026-07-13 11:33:46.26639', 1, 'Y', NULL, NULL, '<p>π 이름, 학년 ( σ 학과=''컴퓨터공학'' ∧ 학년&gt;=3 (학생) )</p>', NULL, NULL, NULL, 'javascript', '[]', 'SQL', '정보처리기사 실기 / 관계형 DB 이론/관계대수-관계해석-001', 31, 7, NULL, NULL, NULL, NULL, NULL, '다음 릴레이션을 이용하여 관계대수식을 해석한 결과로 알맞은 튜플을 쓰시오.', 1, '{"tables": [{"name": "학생", "rows": [["101", "김민수", "컴퓨터공학", "3"], ["102", "이지연", "경영학", "2"], ["103", "박준호", "컴퓨터공학", "4"], ["104", "최서연", "전자공학", "3"], ["105", "정다은", "컴퓨터공학", "2"]], "columns": [{"name": "학번", "dataType": "INT", "primaryKey": true}, {"name": "이름", "dataType": "VARCHAR(50)", "primaryKey": false}, {"name": "학과", "dataType": "VARCHAR(50)", "primaryKey": false}, {"name": "학년", "dataType": "INT", "primaryKey": false}]}], "expectedResult": null}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (107, '2026-07-09 23:40:59.074089', 1, 'N', '2026-07-14 22:53:25.205615', 1, 'Y', '8', NULL, '', NULL, NULL, '* 반환시간 = 완료시간 - 도착시간
(7 + 4 + 10 + 11) / 4 = 32 / 4 = 8
', 'javascript', NULL, 'SCHEDULING', '정보처리기사 실기 / 운영체제/스케줄링 알고리즘 - 002', 1, 7, NULL, NULL, NULL, NULL, '{"algorithm": "SJF", "processes": [{"pid": "P1", "priority": null, "burstTime": 7, "arrivalTime": 0}, {"pid": "P2", "priority": null, "burstTime": 4, "arrivalTime": 2}, {"pid": "P3", "priority": null, "burstTime": 1, "arrivalTime": 4}, {"pid": "P4", "priority": null, "burstTime": 4, "arrivalTime": 5}], "timeQuantum": null}', '다음은 프로세스의 도착 시간과 실행 시간을 나타낸 표이다.
비선점 SJF 스케줄링 알고리즘을 적용할 경우, 평균 반환시간을 구하시오.', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (116, '2026-07-13 13:43:58.765384', 1, 'N', '2026-07-13 22:00:23.703176', 1, 'Y', 'σ, π, ⨝, −, ÷', NULL, '<p>(1) 릴레이션에서 조건을 만족하는 튜플을 선택하는 연산이다. </p><p>(2) 릴레이션에서 특정 속성만 추출하는 연산이다. </p><p>(3) 두 릴레이션의 관련 있는 튜플을 결합하는 연산이다. </p><p>(4) 한 릴레이션의 튜플 중 다른 릴레이션에 존재하지 않는 튜플을 구하는 연산이다. </p><p>(5) 특정 속성값의 모든 조합을 만족하는 튜플을 구할 때 사용하는 연산이다.</p>', NULL, NULL, '(1) 셀렉션(σ) — 조건을 만족하는 튜플(행) 선택. (2) 프로젝션(π) — 특정 속성(열)만 추출. (3) 조인(⨝) — 공통 속성값이 같은 튜플끼리 결합. (4) 차집합(−) — R−S는 R에는 있으나 S에는 없는 튜플. (5) 디비전(÷) — R÷S는 S의 모든 튜플과 조합을 이루는 튜플을 R에서 구한다. 나머지 보기: 합집합(∪)은 두 릴레이션 튜플 전체(중복 제거), 카티션 프로덕트(×)는 가능한 모든 튜플 조합이다.', 'javascript', '["σ", "π", "∪", "−", "×", "⨝", "÷"]', 'SHORT_ANSWER', '관계대수 연산자 보기 매칭', 31, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 관계대수 연산자를 보기에서 골라 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 4, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (115, '2026-07-13 13:42:12.071297', 1, 'N', '2026-07-13 22:00:23.677418', 1, 'Y', '이름 | 과목명
김민수 | 데이터베이스
김민수 | 운영체제
박준호 | 데이터베이스
최서연 | 네트워크', NULL, '<p>관계대수식: π 이름, 과목명 ( 학생 ⨝ 학생.학번 = 수강.학번 수강 ) </p><p>위 관계대수식의 결과 릴레이션을 쓰시오.</p>', NULL, NULL, '학생 ⨝ 학생.학번=수강.학번 수강 은 두 릴레이션을 학번이 같은 튜플끼리 결합하는 세타 조인(동등 조인)이다. 수강 릴레이션에 학번이 있는 학생만 결과에 남으므로 102 이지연(수강 내역 없음)은 제외된다. 조인 결과는 (101 김민수 데이터베이스), (101 김민수 운영체제), (103 박준호 데이터베이스), (104 최서연 네트워크)이고, π 이름, 과목명 으로 이름과 과목명 속성만 추출하면 (김민수, 데이터베이스), (김민수, 운영체제), (박준호, 데이터베이스), (최서연, 네트워크)이다. 관계대수 결과는 집합이므로 행 순서는 무관하다.', 'javascript', NULL, 'SQL', '관계대수 조인 결과 릴레이션', 31, 7, NULL, NULL, NULL, NULL, NULL, '다음 두 릴레이션에 대해 관계대수 연산 결과를 구하시오.', 3, '{"tables": [{"name": "학생", "rows": [["101", "김민수", "컴퓨터공학"], ["102", "이지연", "경영학"], ["103", "박준호", "컴퓨터공학"], ["104", "최서연", "전자공학"]], "columns": [{"name": "학번", "dataType": "INT", "primaryKey": true}, {"name": "이름", "dataType": "VARCHAR(20)", "primaryKey": false}, {"name": "학과", "dataType": "VARCHAR(30)", "primaryKey": false}]}, {"name": "수강", "rows": [["101", "데이터베이스"], ["101", "운영체제"], ["103", "데이터베이스"], ["104", "네트워크"]], "columns": [{"name": "학번", "dataType": "INT", "primaryKey": true}, {"name": "과목명", "dataType": "VARCHAR(30)", "primaryKey": true}]}], "expectedResult": {"rows": [["김민수", "데이터베이스"], ["김민수", "운영체제"], ["박준호", "데이터베이스"], ["최서연", "네트워크"]], "columns": ["이름", "과목명"], "orderedRows": false}}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (114, '2026-07-13 13:33:07.726974', 1, 'N', '2026-07-13 22:00:23.651416', 1, 'Y', '과목코드=''DB''', NULL, '<p>요구사항: DB 과목을 수강한 학생의 학번과 점수만 검색하려고 한다. </p><p>아래 관계대수식의 빈칸에 들어갈 내용을 쓰시오. </p><p><br></p><p>π 학번, 점수 ( σ ________ (수강) )</p>', NULL, NULL, 'DB 과목을 수강한 튜플만 골라내야 하므로 셀렉션(σ)의 조건은 과목코드=''DB'' 이다. 셀렉션으로 조건에 맞는 튜플(101 DB 90, 102 DB 70, 103 DB 95)을 선택한 뒤, π 학번, 점수 로 학번과 점수 속성만 추출한다. 조건식은 속성명과 문자열 상수 비교 형태(과목코드=''DB'')로 작성한다.', 'javascript', NULL, 'SQL', '관계대수 셀렉션 조건 빈칸 완성', 31, 7, NULL, NULL, NULL, NULL, NULL, '다음 릴레이션을 이용하여 관계대수식을 완성하시오.', 2, '{"tables": [{"name": "수강", "rows": [["101", "DB", "90"], ["101", "OS", "85"], ["102", "DB", "70"], ["103", "DB", "95"], ["104", "OS", "80"]], "columns": [{"name": "학번", "dataType": "INT", "primaryKey": true}, {"name": "과목코드", "dataType": "VARCHAR(10)", "primaryKey": true}, {"name": "점수", "dataType": "INT", "primaryKey": false}]}], "expectedResult": null}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (113, '2026-07-13 10:58:06.878676', 1, 'N', '2026-07-13 22:00:23.580544', 1, 'Y', '이름 | 학년
김민수 | 3
박준호 | 4', NULL, '<p>관계대수식: π 이름, 학년 ( σ 학과=''컴퓨터공학'' ∧ 학년&gt;=3 (학생) )</p>', NULL, NULL, 'σ 학과=''컴퓨터공학'' ∧ 학년>=3 으로 학생 릴레이션에서 컴퓨터공학과이면서 3학년 이상인 튜플(101 김민수 3, 103 박준호 4)을 선택한 뒤, π 이름, 학년 으로 이름과 학년 속성만 추출한다. 따라서 결과는 (김민수, 3), (박준호, 4)이다. 관계대수 결과는 집합이므로 행 순서는 무관하다.', 'javascript', NULL, 'SQL', '관계대수 셀렉션·프로젝션 결과 튜플', 31, 7, NULL, NULL, NULL, NULL, NULL, '다음 릴레이션을 이용하여 관계대수식을 해석한 결과로 알맞은 튜플을 쓰시오.', 1, '{"tables": [{"name": "학생", "rows": [["101", "김민수", "컴퓨터공학", "3"], ["102", "이지연", "경영학", "2"], ["103", "박준호", "컴퓨터공학", "4"], ["104", "최서연", "전자공학", "3"], ["105", "정다은", "컴퓨터공학", "2"]], "columns": [{"name": "학번", "dataType": "INT", "primaryKey": true}, {"name": "이름", "dataType": "VARCHAR(20)", "primaryKey": false}, {"name": "학과", "dataType": "VARCHAR(30)", "primaryKey": false}, {"name": "학년", "dataType": "INT", "primaryKey": false}]}], "expectedResult": {"rows": [["김민수", "3"], ["박준호", "4"]], "columns": ["이름", "학년"], "orderedRows": false}}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (123, '2026-07-13 14:04:24.451882', 1, 'N', '2026-07-13 22:00:23.895088', 1, 'Y', '2', NULL, '<p>시스템을 구성하는 클래스, 클래스의 속성과 연산, 클래스 간의 연관 관계를 정적으로 표현하는 다이어그램이다.</p>', NULL, NULL, '클래스 다이어그램(Class Diagram)은 시스템을 구성하는 클래스와 그 속성(attribute)·연산(operation), 클래스 사이의 연관·일반화(상속)·의존·집합·복합 관계를 표현하는 대표적인 정적(구조) 다이어그램이다. UML 다이어그램은 크게 정적 구조를 표현하는 구조(Structural) 다이어그램(클래스·객체·컴포넌트·배치 등)과 동적 행위를 표현하는 행위(Behavioral) 다이어그램(유스케이스·시퀀스·액티비티·상태 등)으로 나뉜다.', 'javascript', '["유스케이스 다이어그램", "클래스 다이어그램", "시퀀스 다이어그램", "액티비티 다이어그램", "상태 다이어그램", "컴포넌트 다이어그램", "배치 다이어그램"]', 'SHORT_ANSWER', 'UML 다이어그램 — 클래스 다이어그램', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 UML 다이어그램을 보기에서 골라 쓰시오. (번호 또는 보기 텍스트로 답하시오)', 6, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (120, '2026-07-13 13:53:26.312508', 1, 'N', '2026-07-14 02:01:13.189117', 1, 'Y', '0, 1, 2, 99, 100, 101', NULL, '<p>어떤 시스템의 입력값 허용 범위가 1 이상 100 이하의 정수라고 한다. </p><p>경계값 분석을 적용하여 테스트하려고 할 때, 일반적으로 선정할 수 있는 대표 테스트 입력값 6개를 쓰시오. (콤마로 구분, 순서 무관)</p><p><br></p><p>단, 유효 범위의 경계값과 경계 바로 바깥의 값을 모두 포함한다.</p>', NULL, NULL, '경계값 분석(Boundary Value Analysis)은 오류가 입력 범위의 경계 부근에서 집중적으로 발생한다는 경험에 근거해, 경계값과 그 주변 값을 테스트 입력으로 선정하는 블랙박스 기법이다. 허용 범위가 1~100이면 하한 경계에서 0(바로 아래·무효), 1(경계·유효), 2(바로 위·유효), 상한 경계에서 99(바로 아래·유효), 100(경계·유효), 101(바로 위·무효)을 선정한다. 즉 min-1, min, min+1, max-1, max, max+1 여섯 개가 대표 테스트 값이다.', 'javascript', NULL, 'SHORT_ANSWER', '경계값 분석 테스트 입력값 선정', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 조건을 읽고 물음에 답하시오.', 3, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (119, '2026-07-13 13:50:59.279249', 1, 'N', '2026-07-13 22:00:23.782058', 1, 'Y', 'ㄷ, ㄹ, ㅂ', NULL, '<p>보기: ㄱ. 동등 분할 검사 ㄴ. 경계값 분석 ㄷ. 기초 경로 검사 ㄹ. 조건 검사 ㅁ. 원인-효과 그래프 검사 ㅂ. 데이터 흐름 검사</p>', NULL, NULL, '화이트박스 테스트는 프로그램의 내부 구조(제어 흐름·경로)를 기준으로 검사하는 기법으로, 기초 경로 검사(ㄷ, Basic Path Testing), 조건 검사(ㄹ, Condition Testing), 데이터 흐름 검사(ㅂ, Data Flow Testing), 루프 검사 등이 해당한다. 반면 동등 분할 검사(ㄱ), 경계값 분석(ㄴ), 원인-효과 그래프 검사(ㅁ)는 내부 구조를 보지 않고 명세 기반으로 입출력을 검사하는 블랙박스 테스트 기법이다.', 'javascript', NULL, 'SHORT_ANSWER', '화이트박스 테스트 기법 고르기', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 보기에서 화이트박스 테스트 기법에 해당하는 것을 모두 골라 기호(ㄱ~ㅂ)로 쓰시오. (콤마로 구분, 순서 무관)', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (121, '2026-07-13 13:55:07.702487', 1, 'N', '2026-07-13 22:00:23.830637', 1, 'Y', '2', NULL, '<p>프로그램 내의 모든 분기에서 각 결정의 결과가 참과 거짓을 최소 한 번 이상 수행되도록 테스트하는 기준이다.</p>', NULL, NULL, '결정(분기) 커버리지(Decision/Branch Coverage)는 프로그램의 모든 분기점에서 각 결정(decision)의 전체 결과가 참(true)과 거짓(false)을 각각 최소 한 번씩 갖도록 테스트하는 기준이다. 구문(문장) 커버리지는 모든 문장이 최소 한 번 수행되는지, 조건 커버리지는 결정 내 개별 조건식 각각이 참/거짓을 갖는지, 다중 조건 커버리지는 개별 조건식의 모든 참/거짓 조합을 검사한다는 점에서 구분된다.', 'javascript', '["구문(문장) 커버리지", "결정(분기) 커버리지", "조건 커버리지", "다중 조건 커버리지"]', 'SHORT_ANSWER', '화이트박스 테스트 검증 기준 — 분기 커버리지', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 화이트박스 테스트 검증 기준을 보기에서 골라 쓰시오. (번호 또는 보기 텍스트로 답하시오)', 4, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (238, '2026-07-17 00:08:55.564856', 1, 'N', '2026-07-17 00:08:55.564856', 1, 'Y', 'MAC || 맥 || Mandatory Access Control || 강제적 접근 통제 || 강제 접근 통제', NULL, '조직이 문서와 사용자에게 각각 보안 등급을 부여하고, 중앙 보안 정책에 따라 접근을 통제한다. 사용자 보안 등급이 문서 보안 등급 이상이어야 읽을 수 있다. 이 접근 통제 모델의 명칭을 영문 약어로 쓰시오.', NULL, NULL, '중앙(관리자)이 보안 등급 기반으로 강제 통제하는 모델은 MAC(강제적 접근 통제)이다.', NULL, NULL, 'SHORT_ANSWER', '보안 - 접근 통제 모델 약어(중앙 보안등급)', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 10, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (127, '2026-07-13 14:10:43.358115', 1, 'N', '2026-07-13 22:00:23.979442', 1, 'Y', '3', NULL, '<p>객체 간에 주고받는 메시지를 시간의 흐름에 따라 표현하며, 객체의 생명선과 메시지의 호출 순서를 중심으로 나타내는 다이어그램이다.</p>', NULL, NULL, '시퀀스 다이어그램(Sequence Diagram)은 객체 간에 주고받는 메시지를 시간의 흐름(위→아래)에 따라 표현하는 행위 다이어그램으로, 객체의 생명선(Lifeline), 활성 구간(Activation), 메시지(동기/비동기/응답)의 호출 순서가 핵심 구성 요소이다. 시간 순서보다 객체 간 연결 관계를 중심으로 표현하면 커뮤니케이션 다이어그램, 처리 흐름·분기·병행을 표현하면 액티비티 다이어그램이라는 점과 구분된다.', 'javascript', '["유스케이스 다이어그램", "클래스 다이어그램", "시퀀스 다이어그램", "액티비티 다이어그램", "상태 다이어그램", "컴포넌트 다이어그램", "배치 다이어그램"]', 'SHORT_ANSWER', 'UML 다이어그램 — 시퀀스 다이어그램', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 UML 다이어그램을 보기에서 골라 쓰시오. (번호 또는 보기 텍스트로 답하시오)', 10, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (126, '2026-07-13 14:09:33.682714', 1, 'N', '2026-07-13 22:00:23.958439', 1, 'Y', '2, 3, 4, 6, 1', NULL, '<p>(1) 한 객체가 다른 객체를 포함하지만, 포함된 객체가 독립적으로 존재할 수 있는 관계이다. </p><p>(2) 전체 객체가 소멸하면 부분 객체도 함께 소멸하는 강한 포함 관계이다. </p><p>(3) 상위 클래스와 하위 클래스 간의 상속 관계이다. </p><p>(4) 인터페이스와 이를 구현하는 클래스 간의 관계이다. </p><p>(5) 두 클래스가 서로 관련되어 있음을 나타내는 가장 일반적인 관계이다.</p>', NULL, NULL, '(1) 집합(Aggregation) 관계 — 전체-부분 관계지만 부분이 독립적으로 존재 가능(빈 마름모). 
(2) 포함(Composition) 관계 — 부분이 전체의 생명주기에 종속되는 강한 전체-부분 관계로, 전체가 소멸하면 부분도 소멸(채운 마름모). 
(3) 일반화(Generalization) 관계 — 상위-하위 클래스의 상속 관계(빈 삼각형 실선 화살표). 
(4) 실체화(Realization) 관계 — 인터페이스와 그것을 구현하는 클래스의 관계(빈 삼각형 점선 화살표). 
(5) 연관(Association) 관계 — 두 클래스가 관련되어 있음을 나타내는 가장 일반적인 관계(실선). 남은 보기인 의존(Dependency) 관계는 다른 클래스를 일시적으로 사용하는 관계(점선 화살표)이다.', 'javascript', '["연관 관계", "집합 관계", "포함 관계", "일반화 관계", "의존 관계", "실체화 관계"]', 'SHORT_ANSWER', 'UML 클래스 다이어그램 관계 보기 매칭', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음은 UML 클래스 다이어그램에서 사용하는 관계에 대한 설명이다. 각 설명에 해당하는 관계를 보기에서 골라 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 9, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (124, '2026-07-13 14:06:29.823386', 1, 'N', '2026-07-13 22:00:23.919087', 1, 'Y', 'ㄴ, ㄷ, ㅁ', NULL, '<p>보기: ㄱ. 클래스 다이어그램 ㄴ. 유스케이스 다이어그램 ㄷ. 시퀀스 다이어그램 ㄹ. 컴포넌트 다이어그램 ㅁ. 활동 다이어그램 ㅂ. 배치 다이어그램</p>', NULL, NULL, 'UML 다이어그램은 시스템의 정적 구조를 표현하는 구조(Structural) 다이어그램과 동적 행위를 표현하는 행위(Behavioral) 다이어그램으로 나뉜다. 행위 다이어그램에는 유스케이스(ㄴ, 사용자 관점의 기능·액터), 시퀀스(ㄷ, 객체 간 메시지 교환의 시간 순서), 활동(ㅁ, 처리 흐름·분기·병행), 상태·커뮤니케이션·타이밍 다이어그램 등이 해당한다. 클래스(ㄱ), 컴포넌트(ㄹ), 배치(ㅂ)는 구조 다이어그램이다.', 'javascript', NULL, 'SHORT_ANSWER', 'UML 행위 다이어그램 고르기', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 보기에서 행위(Behavioral) 다이어그램에 해당하는 것을 모두 골라 기호(ㄱ~ㅂ)로 쓰시오. (콤마로 구분, 순서 무관)', 7, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (125, '2026-07-13 14:08:16.574951', 1, 'N', '2026-07-13 22:00:23.939088', 1, 'Y', '5', NULL, '<p>한 클래스가 다른 클래스의 기능을 일시적으로 사용하며, 한 클래스의 변경이 다른 클래스에 영향을 줄 수 있는 관계이다. 일반적으로 점선 화살표로 표현한다.</p>', NULL, NULL, '의존(Dependency) 관계는 한 클래스가 다른 클래스를 매개변수·지역변수 등으로 일시적으로 사용하는 약한 결합 관계로, 사용되는 클래스의 변경이 사용하는 클래스에 영향을 줄 수 있으며 점선 화살표(--->)로 표현한다. 
비교: 연관(Association)은 지속적인 참조 관계(실선), 집합(Aggregation)은 전체-부분이되 부분이 독립적인 관계(빈 마름모), 복합(Composition)은 부분이 전체의 생명주기에 종속되는 관계(채운 마름모), 일반화(Generalization)는 상속 관계(빈 삼각형 실선), 실체화(Realization)는 인터페이스 구현 관계(빈 삼각형 점선)이다.', 'javascript', '["연관 관계", "집합 관계", "복합 관계", "일반화 관계", "의존 관계", "실체화 관계"]', 'SHORT_ANSWER', 'UML 관계 — 의존 관계', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 UML 관계를 보기에서 골라 쓰시오. (번호 또는 보기 텍스트로 답하시오)', 8, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (237, '2026-07-17 00:08:55.551414', 1, 'N', '2026-07-17 00:08:55.551414', 1, 'Y', '시간 동기화 방식, 이벤트 동기화 방식, 질의응답 방식', NULL, '일회용 비밀번호(OTP) 생성 방식에 대한 각 설명에 해당하는 방식을 보기에서 골라 순서대로 쓰시오.
① 일정한 시간 간격마다 새로운 인증번호를 생성한다.
② 인증 버튼을 누르거나 인증이 발생한 횟수를 기준으로 새로운 값을 생성한다.
③ 서버가 제시한 난수나 질문값에 대해 사용자가 응답값을 생성한다.', NULL, NULL, '①시간 동기화 ②이벤트 동기화 ③질의응답 방식.', NULL, '["이벤트 동기화 방식", "질의응답 방식", "시간 동기화 방식"]', 'SHORT_ANSWER', '보안 - OTP 생성 방식 연결', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 9, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (239, '2026-07-17 00:08:55.578909', 1, 'N', '2026-07-17 00:08:55.578909', 1, 'Y', 'X, Y || 문서 X, 문서 Y || X 문서, Y 문서', NULL, '보안 등급: 대외비 < 비밀 < 극비. 사용자 A=비밀. 문서 X=대외비, Y=비밀, Z=극비. 사용자 등급이 문서 등급 이상이어야 읽을 수 있다. A가 읽을 수 있는 문서를 모두 쓰시오.', NULL, NULL, 'A(비밀)는 대외비(X)·비밀(Y)을 읽을 수 있고, 극비(Z)는 등급이 높아 읽을 수 없다.', NULL, NULL, 'SHORT_ANSWER', '보안 - MAC에서 사용자 A가 읽을 수 있는 문서', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 11, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (240, '2026-07-17 00:08:55.59083', 1, 'N', '2026-07-17 00:08:55.59083', 1, 'Y', 'X || 문서 X', NULL, '보안 등급: 대외비 < 비밀 < 극비. 사용자 B=대외비. 문서 X=대외비, Y=비밀, Z=극비. 사용자 등급이 문서 등급 이상이어야 읽을 수 있다. B가 읽을 수 있는 문서를 모두 쓰시오.', NULL, NULL, 'B(대외비)는 대외비(X)만 읽을 수 있고, 비밀(Y)·극비(Z)는 등급이 높아 읽을 수 없다.', NULL, NULL, 'SHORT_ANSWER', '보안 - MAC에서 사용자 B가 읽을 수 있는 문서', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 12, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (130, '2026-07-13 16:31:00.316086', 1, 'N', '2026-07-14 02:00:55.530735', 1, 'Y', '64, 65, 78, 79', NULL, '<p>IP 주소가 10.20.30.77/28인 호스트가 있다. </p><p>이 호스트가 속한 네트워크 주소는 다음과 같다. </p><p><br></p><p>10.20.30.( ① ) 이 네트워크에서 호스트에 할당할 수 있는 첫 번째 IP 주소는 다음과 같다.</p><p>10.20.30.( ② ) 호스트에 할당할 수 있는 마지막 IP 주소는 다음과 같다. </p><p>10.20.30.( ③ ) 브로드캐스트 주소는 다음과 같다. </p><p>10.20.30.( ④ )</p>', NULL, NULL, '/28은 서브넷 마스크 255.255.255.240이며 마지막 옥텟의 블록 크기는 256-240=16이다. 서브넷 경계는 0, 16, 32, 48, 64, 80, …이고 77은 64~79 구간에 속한다. ① 네트워크 주소: 10.20.30.64. ② 첫 번째 할당 가능 IP: 네트워크 주소 다음인 10.20.30.65. ③ 마지막 할당 가능 IP: 브로드캐스트 주소 바로 앞인 10.20.30.78. ④ 브로드캐스트 주소: 블록의 마지막인 10.20.30.79. 할당 가능한 호스트 수는 2^4-2 = 14개다.', 'javascript', NULL, 'SHORT_ANSWER', '/28 서브넷 주소 범위 계산', 4, 7, NULL, NULL, NULL, NULL, NULL, '다음 조건을 참고하여 괄호 안에 들어갈 알맞은 값을 ①~④ 순서대로 콤마로 구분하여 쓰시오.', 3, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (131, '2026-07-13 16:32:31.277479', 1, 'N', '2026-07-15 00:20:00.100055', 1, 'Y', '28, 16, 14', NULL, '<p>서브넷 마스크가 다음과 같을 때 CIDR 접두사 길이를 구하시오. </p><p>255.255.255.240 CIDR 표기법의 접두사 길이는 다음과 같다. /( ① ) </p><p>이 서브넷 하나에서 사용할 수 있는 전체 IP 주소의 수는 ( ② )개이며, </p><p>실제 호스트에 할당할 수 있는 IP 주소의 수는 ( ③ )개이다. </p><p>단, 네트워크 주소와 브로드캐스트 주소는 호스트에 할당하지 않는다.</p>', NULL, NULL, '255.255.255.240을 이진수로 표현하면 11111111.11111111.11111111.11110000으로 1이 연속으로 28개이므로 접두사 길이는 /28이다(①). 호스트 비트는 32-28=4비트이므로 서브넷 하나의 전체 IP 주소 수는 2^4 = 16개(②)이고, 네트워크 주소와 브로드캐스트 주소를 제외하면 호스트에 할당할 수 있는 IP는 16-2 = 14개(③)이다.', 'javascript', NULL, 'SHORT_ANSWER', '서브넷 마스크의 CIDR 접두사 길이와 IP 수 계산', 4, 7, NULL, NULL, NULL, NULL, NULL, '다음은 서브넷 마스크와 CIDR 표기법에 관한 문제이다. 괄호 안에 들어갈 알맞은 값을 ①~③ 순서대로 콤마로 구분하여 쓰시오.', 4, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (128, '2026-07-13 16:27:30.478179', 1, 'N', '2026-07-14 01:59:21.369073', 1, 'Y', '172.16.32.0/22, 172.16.36.0/22', NULL, '<p>호스트 A의 IP 주소: 172.16.35.70 </p><p>호스트 B의 IP 주소: 172.16.36.130 </p><p>서브넷 마스크: 255.255.252.0</p>', NULL, NULL, '서브넷 마스크 255.255.252.0은 이진수로 11111111.11111111.11111100.00000000이므로 프리픽스 길이는 /22이다. 네트워크 주소는 IP 주소와 서브넷 마스크의 AND 연산으로 구한다. 호스트 A: 3옥텟 35(00100011)와 252(11111100)의 AND = 32 → 172.16.32.0/22 (이 네트워크의 범위는 172.16.32.0~172.16.35.255이므로 35.70이 포함된다). 호스트 B: 3옥텟 36(00100100)과 252의 AND = 36 → 172.16.36.0/22 (범위 172.16.36.0~172.16.39.255). 두 호스트는 서로 다른 네트워크에 속하므로 라우터 없이는 직접 통신할 수 없다.', 'javascript', NULL, 'SHORT_ANSWER', '서브넷 마스크와 CIDR 네트워크 주소 계산', 4, 7, NULL, NULL, NULL, NULL, NULL, '다음 조건을 참고하여 호스트 A와 호스트 B가 속한 네트워크 주소를 CIDR 표기법으로 각각 쓰시오. (A, B 순서로 콤마로 구분하여 입력)', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (129, '2026-07-13 16:29:46.983806', 1, 'N', '2026-07-14 02:00:10.688285', 1, 'Y', '128, 159, 30', NULL, '<p>호스트의 IP 주소가 192.168.10.150이고 </p><p>서브넷 마스크가 255.255.255.224일 때 다음 물음에 답하시오. </p><p><br></p><p>이 호스트가 속한 네트워크 주소는 다음과 같다. </p><p>192.168.10.( ① ) 이 네트워크의 브로드캐스트 주소는 다음과 같다. </p><p>192.168.10.( ② ) 이 네트워크에서 사용 가능한 호스트 수는 ( ③ )개이다. </p><p>단, 네트워크 주소와 브로드캐스트 주소는 제외한다.</p>', NULL, NULL, '서브넷 마스크 255.255.255.224는 /27이며 마지막 옥텟의 서브넷 블록 크기는 256-224=32이다. 따라서 서브넷 경계는 0, 32, 64, 96, 128, 160, …이고 150은 128~159 구간에 속한다. ① 네트워크 주소: 192.168.10.128 (150을 32로 나눈 몫 4 × 32 = 128). ② 브로드캐스트 주소: 해당 블록의 마지막 주소인 192.168.10.159 (128+32-1). ③ 사용 가능한 호스트 수: 호스트 비트가 5비트이므로 2^5-2 = 30개 (네트워크 주소와 브로드캐스트 주소 제외).', 'javascript', NULL, 'SHORT_ANSWER', '서브넷 네트워크·브로드캐스트 주소와 호스트 수 계산', 4, 7, NULL, NULL, NULL, NULL, NULL, '다음은 IP 주소와 서브넷 마스크에 관한 문제이다. 주어진 정보를 참고하여 괄호 안에 들어갈 알맞은 값을 ①, ②, ③ 순서대로 콤마로 구분하여 쓰시오.', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (117, '2026-07-13 13:46:00.939408', 1, 'N', '2026-07-13 22:00:23.728881', 1, 'Y', '이름
강현우
박지훈', NULL, '<p>튜플 관계해석식: { t.이름 | 사원(t) ∧ t.부서 = ''개발'' ∧ t.급여 &gt;= 4000 } </p><p>위 관계해석식의 결과를 쓰시오.</p>', NULL, NULL, '튜플 관계해석식 { t.이름 | 사원(t) ∧ t.부서=''개발'' ∧ t.급여>=4000 } 은 "사원 릴레이션의 튜플 t 중 부서가 ''개발''이고 급여가 4000 이상인 t의 이름"을 의미한다. 조건을 만족하는 튜플은 E01 강현우(개발, 4000)와 E03 박지훈(개발, 5000)이고, E05 최민재는 개발 부서지만 급여 2800으로 제외된다. 따라서 결과는 {강현우, 박지훈}이다. 관계해석은 원하는 결과의 조건을 선언적으로 기술하는 비절차식 언어라는 점에서, 연산자 적용 순서를 절차적으로 기술하는 관계대수와 대비된다.', 'javascript', NULL, 'SQL', '튜플 관계해석식 결과', 31, 7, NULL, NULL, NULL, NULL, NULL, '다음 릴레이션에 대해 튜플 관계해석식을 해석한 결과를 쓰시오.', 5, '{"tables": [{"name": "사원", "rows": [["E01", "강현우", "개발", "4000"], ["E02", "김서윤", "인사", "3200"], ["E03", "박지훈", "개발", "5000"], ["E04", "이나영", "영업", "3500"], ["E05", "최민재", "개발", "2800"]], "columns": [{"name": "사원번호", "dataType": "CHAR(3)", "primaryKey": true}, {"name": "이름", "dataType": "VARCHAR(20)", "primaryKey": false}, {"name": "부서", "dataType": "VARCHAR(20)", "primaryKey": false}, {"name": "급여", "dataType": "INT", "primaryKey": false}]}], "expectedResult": {"rows": [["강현우"], ["박지훈"]], "columns": ["이름"], "orderedRows": false}}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (122, '2026-07-13 13:56:39.876301', 1, 'N', '2026-07-13 22:00:23.854636', 1, 'Y', '1, 3, 4, 5, 2', NULL, '<p>(1) 입력 조건을 유효한 그룹과 무효한 그룹으로 나누고 각 그룹의 대표값을 이용하여 검사하는 기법이다. </p><p>(2) 입력 조건 사이의 논리적 관계와 출력 결과의 관계를 그래프로 표현하여 검사하는 기법이다. </p><p>(3) 과거 경험이나 확인자의 직관을 바탕으로 오류가 발생할 가능성이 높은 부분을 검사하는 기법이다. </p><p>(4) 여러 버전의 프로그램에 동일한 입력값을 넣고 결과를 비교하는 기법이다. </p><p>(5) 입력값의 범위 끝부분에서 오류가 자주 발생한다는 점을 이용하여 검사하는 기법이다.</p>', NULL, NULL, '(1) 동등 분할 검사(Equivalence Partitioning) — 입력을 유효/무효 동치 클래스로 나눠 각 클래스의 대표값으로 검사.
(2) 원인-효과 그래프 검사(Cause-Effect Graphing) — 입력(원인)과 출력(효과)의 논리 관계를 그래프화해 효용 높은 테스트 케이스 도출. 
(3) 오류 예측 검사(Error Guessing) — 경험·직관 기반으로 오류 가능성이 높은 곳을 보충 검사. 
(4) 비교 검사(Comparison Testing) — 여러 버전에 동일 입력을 주고 출력을 비교. 
(5) 경계값 분석(Boundary Value Analysis) — 경계 부근에 오류가 집중된다는 점을 이용해 경계값을 테스트 값으로 선정.', 'javascript', '["동등 분할 검사", "경계값 분석", "원인-효과 그래프 검사", "오류 예측 검사", "비교 검사"]', 'SHORT_ANSWER', '블랙박스 테스트 기법 보기 매칭', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 블랙박스 테스트 기법을 보기에서 골라 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 5, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (133, '2026-07-13 22:09:52.069192', 1, 'Y', '2026-07-13 22:09:52.1829', 1, 'Y', '임시', NULL, '', NULL, NULL, NULL, NULL, NULL, 'SHORT_ANSWER', '[자동채번 검증용 임시]', 4, 7, NULL, NULL, NULL, NULL, NULL, '임시 검증 문항', 6, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (134, '2026-07-13 22:09:52.122193', 1, 'Y', '2026-07-13 22:09:52.206898', 1, 'Y', '임시', NULL, '', NULL, NULL, NULL, NULL, NULL, 'SHORT_ANSWER', '[자동채번 검증용 임시]', 4, 7, NULL, NULL, NULL, NULL, NULL, '임시 검증 문항', 7, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (135, '2026-07-13 22:09:52.165899', 1, 'Y', '2026-07-13 22:09:52.225899', 1, 'Y', '임시', NULL, '', 99, 2099, NULL, NULL, NULL, 'SHORT_ANSWER', '[자동채번 검증용 임시]', 4, 7, NULL, NULL, NULL, NULL, NULL, '임시 검증 문항', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (136, '2026-07-13 22:09:52.240899', 1, 'Y', '2026-07-13 22:09:52.252899', 1, 'Y', '임시', NULL, '', NULL, NULL, NULL, NULL, NULL, 'SHORT_ANSWER', '[자동채번 검증용 임시]', 4, 7, NULL, NULL, NULL, NULL, NULL, '임시 검증 문항', 6, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (159, '2026-07-13 23:12:51.903203', 1, 'N', '2026-07-13 23:12:51.903203', 1, 'Y', '2', NULL, '현재 실행 중인 프로세스의 상태를 실시간으로 확인할 수 있으며, CPU 사용률과 메모리 사용량을 지속적으로 갱신하여 보여주는 명령어이다.', NULL, NULL, 'top은 프로세스 상태·CPU 사용률·메모리 사용량을 일정 주기(기본 3초)로 갱신하며 실시간으로 보여주는 명령어다. 비교: ps는 실행 시점의 프로세스 상태를 한 번만 출력(스냅샷), jobs는 현재 셸의 백그라운드 작업 목록, kill은 프로세스에 시그널 전송, nice는 프로세스 우선순위 조정 명령이다.', NULL, '["ps", "top", "jobs", "kill", "nice"]', 'SHORT_ANSWER', '리눅스 명령어 — top', 1, 9, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 리눅스 명령어를 보기에서 골라 쓰시오. (번호 또는 보기 텍스트로 답하시오)', 8, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (188, '2026-07-14 13:50:28.263119', 1, 'N', '2026-07-14 22:29:08.045311', 1, 'Y', 'DEFAULT ''F'', PRIMARY KEY, CHECK, BETWEEN', 'CREATE TABLE ENROLLMENT (
    STUDENT_ID NUMBER(6) NOT NULL,
    COURSE_ID CHAR(5) NOT NULL,
    SCORE NUMBER(3),
    GRADE CHAR(1) ( 1 ),
    CONSTRAINT ENROLLMENT_PK
        ( 2 ) (STUDENT_ID, COURSE_ID),
    CONSTRAINT SCORE_CK
        ( 3 ) (SCORE ( 4 ) 0 AND 100)
);', '<h3>조건</h3><ul><li>ENROLLMENT 테이블의 기본키는 STUDENT_ID와 COURSE_ID의 복합키이다.</li><li>기본키 제약조건의 이름은 ENROLLMENT_PK이다.</li><li>SCORE는 0 이상 100 이하의 값만 허용한다.</li><li>점수 제약조건의 이름은 SCORE_CK이다.</li><li>GRADE의 기본값은 ''F''이다.</li></ul>', NULL, NULL, '① DEFAULT ''F'' — GRADE 칼럼의 기본값 지정. ② PRIMARY KEY (STUDENT_ID, COURSE_ID) — 두 칼럼을 묶은 복합 기본키. ③ CHECK — 값 조건 제약. ④ BETWEEN — SCORE BETWEEN 0 AND 100은 0 이상 100 이하(경계 포함)를 의미한다. BETWEEN a AND b는 a <= x AND x <= b와 동치다.', 'sql', NULL, 'SHORT_ANSWER', '복합 기본키와 CHECK 제약조건', 2, 7, NULL, NULL, NULL, NULL, NULL, '다음 SQL문의 빈칸에 들어갈 내용을 번호 순서대로 콤마로 구분해 쓰시오. (대소문자 무시, 한 줄로 입력해도 됩니다)', 3, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (241, '2026-07-17 00:08:55.604865', 1, 'N', '2026-07-17 00:08:55.604865', 1, 'Y', '3 || 3차 || 3차수', NULL, 'CRC에서 생성 다항식이 1011일 때, 생성 다항식의 최고차항 차수를 쓰시오.', NULL, NULL, '1011 = x³+x+1 이므로 최고차항 차수는 3이다.', NULL, NULL, 'SHORT_ANSWER', '보안 - CRC 생성 다항식 최고차항 차수', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 13, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (242, '2026-07-17 00:08:55.616864', 1, 'N', '2026-07-17 00:08:55.616864', 1, 'Y', '3 || 3개', NULL, 'CRC에서 생성 다항식이 1011(최고차항 차수 3)일 때, 원본 데이터 뒤에 추가해야 하는 0의 개수를 쓰시오.', NULL, NULL, '추가하는 0의 개수는 생성 다항식의 차수와 같으므로 3개이다.', NULL, NULL, 'SHORT_ANSWER', '보안 - CRC 원본 데이터에 추가하는 0의 개수', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 14, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (243, '2026-07-17 00:08:55.627863', 1, 'N', '2026-07-17 00:08:55.627863', 1, 'Y', 'XOR || 배타적 논리합 || 익스클루시브 오어 || exclusive or || 엑스오알 || 모듈로-2 연산 || modulo-2', NULL, 'CRC 계산의 나눗셈 연산은 일반적인 뺄셈 대신 어떤 비트 연산을 사용하는지 쓰시오.', NULL, NULL, 'CRC의 나눗셈은 자리 올림/빌림 없는 XOR(배타적 논리합, 모듈로-2) 연산을 사용한다.', NULL, NULL, 'SHORT_ANSWER', '보안 - CRC 나눗셈에 사용하는 비트 연산', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 15, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (137, '2026-07-13 22:13:07.464834', 1, 'N', '2026-07-13 22:23:16.376844', 1, 'Y', '팩토리 메서드 || 팩토리 메소드 || factory method || 팩토리 메서드 패턴 || 팩토리 메소드 패턴', NULL, '객체의 생성 과정을 서브클래스에서 결정하도록 하여, 객체 생성에 대한 결합도를 낮추는 생성 패턴이다. 상위 클래스에서는 객체 생성에 필요한 인터페이스를 정의하고, 실제로 어떤 객체를 생성할지는 하위 클래스에서 결정한다.', NULL, NULL, '팩토리 메서드(Factory Method) 패턴은 객체 생성 인터페이스는 상위 클래스에서 정의하고 실제 생성할 구체 클래스의 결정은 서브클래스에 위임하는 생성(Creational) 패턴이다. 클라이언트 코드가 구체 클래스에 직접 의존하지 않게 되어 객체 생성에 대한 결합도가 낮아진다. 비교: 추상 팩토리(Abstract Factory)는 관련된 객체 ''군(family)''을 생성하는 인터페이스를 제공하고, 싱글톤(Singleton)은 인스턴스를 하나로 제한하며, 빌더(Builder)는 복잡한 객체의 생성 과정을 단계별로 분리한다.', NULL, NULL, 'SHORT_ANSWER', '디자인 패턴 — 팩토리 메서드', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 디자인 패턴의 명칭을 쓰시오.', 11, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (118, '2026-07-13 13:48:57.764285', 1, 'N', '2026-07-13 22:23:16.426739', 1, 'Y', '블랙박스 테스트 || 블랙박스 검사 || black box test || blackbox test', NULL, '<p>프로그램의 내부 구조나 소스 코드를 고려하지 않고, 입력값에 따른 출력 결과가 요구사항과 일치하는지를 검사하는 테스트 기법이다.</p>', NULL, NULL, '블랙박스 테스트(Black Box Test)는 소프트웨어의 내부 구조·소스 코드를 보지 않고 명세(요구사항) 기반으로 입력 대비 출력의 정확성을 검사하는 기법이다. 동치 분할(Equivalence Partitioning), 경계값 분석(Boundary Value Analysis), 원인-효과 그래프(Cause-Effect Graph), 오류 예측(Error Guessing) 등이 대표적인 블랙박스 기법이다. 반대로 내부 구조·경로를 기준으로 검사하는 기법은 화이트박스 테스트(기초 경로 검사, 제어 구조 검사 등)이다.', 'javascript', NULL, 'SHORT_ANSWER', '테스트 기법 — 블랙박스 테스트', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 테스트 기법을 쓰시오.', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (138, '2026-07-13 22:28:18.374788', 1, 'N', '2026-07-13 22:28:18.374788', 1, 'Y', '1, 4, 2, 5, 3, 6 || 1, 4, 2, 5, 6, 3 || 1, 4, 5, 2, 3, 6 || 1, 4, 5, 2, 6, 3 || 4, 1, 2, 5, 3, 6 || 4, 1, 2, 5, 6, 3 || 4, 1, 5, 2, 3, 6 || 4, 1, 5, 2, 6, 3', NULL, '답안 작성 형식: 생성 패턴 2개, 구조 패턴 2개, 행위 패턴 2개 순서로 나열
예시: 답이 1·2번(생성), 3·4번(구조), 5·6번(행위)이라면 → 1, 2, 3, 4, 5, 6', NULL, NULL, '생성(Creational) 패턴: Singleton(인스턴스 1개 보장), Builder(복잡한 객체의 생성 과정 분리) — 객체 생성 방식을 다룬다. 구조(Structural) 패턴: Adapter(인터페이스 변환으로 호환), Decorator(객체에 동적으로 기능 추가) — 클래스·객체의 조합 구조를 다룬다. 행위(Behavioral) 패턴: Observer(상태 변화를 구독자에게 통지), Strategy(알고리즘을 캡슐화해 교체 가능) — 객체 간 책임 분배와 상호작용을 다룬다.', NULL, '["Singleton", "Adapter", "Observer", "Builder", "Decorator", "Strategy"]', 'SHORT_ANSWER', '디자인 패턴 분류 (생성·구조·행위)', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 보기의 디자인 패턴을 생성 패턴, 구조 패턴, 행위 패턴으로 구분하여, 생성 → 구조 → 행위 순서로 각 2개씩 콤마로 구분해 쓰시오. (보기 번호 또는 이름, 같은 분류 안에서의 순서는 무관)', 12, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (139, '2026-07-13 22:29:44.607402', 1, 'N', '2026-07-13 22:29:44.607402', 1, 'Y', '싱글톤 || 싱글턴 || singleton || 싱글톤 패턴 || 싱글턴 패턴 || singleton pattern', 'class Printer {
    private static Printer instance = new Printer();
    private Printer() {
    }
    public static Printer getInstance() {
        return instance;
    }
    public void print() {
        System.out.println("출력");
    }
}
public class Main {
    public static void main(String[] args) {
        Printer p1 = Printer.getInstance();
        Printer p2 = Printer.getInstance();
        System.out.println(p1 == p2);
    }
}', '코드를 읽고 어떤 디자인 패턴이 적용되어 있는지 답하시오.', NULL, NULL, '싱글톤(Singleton) 패턴이다. 근거: ① 생성자가 private이라 외부에서 new로 인스턴스를 만들 수 없고, ② 클래스 내부에 static으로 유일한 인스턴스를 미리 생성해 두며(이른 초기화, eager initialization), ③ getInstance() 정적 메서드로만 그 인스턴스에 접근할 수 있다. 따라서 p1과 p2는 같은 객체를 참조하므로 p1 == p2는 true를 출력한다. 싱글톤은 인스턴스가 프로그램 전체에서 하나만 존재하도록 보장하는 생성(Creational) 패턴이다.', 'java', NULL, 'SHORT_ANSWER', '디자인 패턴 — 코드로 보는 싱글톤', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 Java 코드에서 적용된 디자인 패턴의 명칭을 쓰시오.', 13, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (157, '2026-07-13 23:12:51.799789', 1, 'N', '2026-07-13 23:12:51.799789', 1, 'Y', '2', NULL, '원본 파일의 경로 정보를 저장하는 별도의 파일로, 원본 파일이 삭제되거나 이동하면 더 이상 정상적으로 참조할 수 없다. 서로 다른 파일 시스템 사이에서도 생성할 수 있다.', NULL, NULL, '심볼릭 링크(Symbolic Link, 소프트 링크)는 원본 파일의 ''경로''를 저장하는 별도의 작은 파일이다(ln -s로 생성). 원본이 삭제·이동되면 경로가 끊어져 참조할 수 없고(dangling link), 경로 기반이므로 서로 다른 파일 시스템(파티션) 간에도 만들 수 있다. 반면 하드 링크는 동일한 inode를 공유하는 이름이라 원본을 지워도 데이터가 유지되지만, 같은 파일 시스템 안에서만 생성 가능하고 디렉터리에는 만들 수 없다.', NULL, '["하드 링크", "심볼릭 링크", "정적 링크", "동적 링크", "디렉터리 링크"]', 'SHORT_ANSWER', '리눅스 파일 종류 — 심볼릭 링크', 1, 9, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 리눅스 파일의 종류를 보기에서 골라 쓰시오. (번호 또는 보기 텍스트로 답하시오)', 6, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (141, '2026-07-13 22:33:07.90112', 1, 'N', '2026-07-13 22:33:07.90112', 1, 'Y', '전략 || 전략 패턴 || 스트래티지 || 스트래티지 패턴 || 스트레티지 || strategy || strategy pattern', NULL, '온라인 쇼핑몰에서 결제 기능을 구현하려고 한다. 결제 방식에는 신용카드 결제, 계좌이체, 간편결제가 있으며, 사용자가 선택한 결제 방식에 따라 실행되는 알고리즘이 달라진다.
결제 방식이 추가되더라도 기존 결제 처리 코드를 크게 수정하지 않고 새로운 알고리즘을 교체하여 사용할 수 있도록 설계하려고 한다.
이때 가장 적합한 디자인 패턴을 쓰시오.', NULL, NULL, '전략(Strategy) 패턴이다. 결제 방식별 알고리즘(신용카드·계좌이체·간편결제)을 각각 별도 전략 클래스로 캡슐화하고 공통 인터페이스(예: PaymentStrategy.pay())로 추상화하면, 클라이언트(결제 처리 코드)는 인터페이스에만 의존하므로 새 결제 방식이 추가돼도 새 전략 클래스만 만들어 끼우면 된다(개방-폐쇄 원칙, OCP). ''실행 중 알고리즘을 교체할 수 있다''·''조건 분기 대신 알고리즘군을 캡슐화한다''가 전략 패턴의 핵심 시그널이다. 유사 패턴과의 구분: 상태(State) 패턴은 객체의 내부 상태 변화에 따라 행위가 바뀌는 경우이고, 템플릿 메서드(Template Method)는 알고리즘의 골격은 고정하고 일부 단계만 하위 클래스에서 재정의하는 경우다.', NULL, NULL, 'SHORT_ANSWER', '디자인 패턴 — 결제 방식 교체 시나리오', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 상황에 가장 적합한 디자인 패턴의 명칭을 쓰시오.', 15, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (142, '2026-07-13 22:40:45.680579', 1, 'N', '2026-07-13 22:40:45.680579', 1, 'Y', '내용 결합도 || 내용 || content coupling || content', NULL, '한 모듈이 다른 모듈의 내부 자료나 내부 처리 로직을 직접 참조하거나 수정하는 경우의 결합도이다. 모듈 간 결합도가 가장 강한 형태에 해당한다.', NULL, NULL, '내용 결합도(Content Coupling)는 한 모듈이 다른 모듈의 내부 데이터·내부 로직을 직접 참조·수정하는 형태로, 결합도 6단계 중 가장 강한(나쁜) 결합이다. 결합도는 약한(좋은) 것부터 강한(나쁜) 순으로 자료(Data) → 스탬프(Stamp) → 제어(Control) → 외부(External) → 공통(Common) → 내용(Content) 결합도로 나뉜다. 모듈 설계는 결합도는 낮게, 응집도는 높게 하는 것이 바람직하다.', NULL, NULL, 'SHORT_ANSWER', '결합도 — 내용 결합도', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 결합도의 종류를 쓰시오.', 16, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (143, '2026-07-13 22:42:36.867848', 1, 'N', '2026-07-13 22:42:36.867848', 1, 'Y', '2, 3, 6, 4, 5, 1', NULL, '모듈 간 결합도가 강한(나쁜) 것부터 약한(좋은) 것 순서로 6개를 모두 나열하시오.', NULL, NULL, '결합도는 강한(나쁜) 것부터 약한(좋은) 순으로 내용(Content) → 공통(Common) → 외부(External) → 제어(Control) → 스탬프(Stamp) → 자료(Data) 결합도이다. 내용은 다른 모듈의 내부를 직접 참조·수정, 공통은 전역 데이터 공유, 외부는 외부 형식·프로토콜 공유, 제어는 제어 신호(플래그) 전달, 스탬프는 자료구조 전체 전달, 자료는 필요한 값만 매개변수로 전달하는 형태다. 암기 팁: ''내공외제스자''. 모듈 설계는 자료 결합도에 가까울수록 바람직하다.', NULL, '["자료 결합도", "내용 결합도", "공통 결합도", "제어 결합도", "스탬프 결합도", "외부 결합도"]', 'SHORT_ANSWER', '결합도 강한 순서 나열', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 보기의 결합도를 결합도가 강한 것에서 약한 것 순서로 나열하시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 17, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (145, '2026-07-13 22:45:57.239136', 1, 'N', '2026-07-15 00:33:32.279785', 1, 'Y', '자료 결합도 / 스탬프 결합도', NULL, '모듈 A가 모듈 B를 호출하면서 단순한 정수값이나 문자값과 같은 기본 자료형의 데이터만 매개변수로 전달한다.
이 경우 두 모듈 간의 결합도는 ( ① )이다.
반면, 모듈 A가 모듈 B에 하나의 레코드나 구조체 전체를 전달하지만, 모듈 B는 그중 일부 필드만 사용하는 경우 두 모듈 간의 결합도는 ( ② )이다.', NULL, NULL, '① 자료(Data) 결합도 — 필요한 값(기본 자료형)만 매개변수로 전달하는 가장 약한(좋은) 결합이다. ② 스탬프(Stamp) 결합도 — 레코드·구조체 같은 자료구조 전체를 전달하지만 수신 모듈은 그 일부만 사용하는 경우로, 불필요한 데이터까지 노출되어 자료 결합도보다 강하다. 두 결합도의 구분 기준은 ''필요한 값만 전달하는가(자료) vs 자료구조 전체를 전달하는가(스탬프)''이다.', NULL, '["공통 결합도", "스탬프 결합도", "제어 결합도", "내용 결합도", "자료 결합도", "외부 결합도"]', 'SHORT_ANSWER', '자료 결합도와 스탬프 결합도 구분', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음은 모듈 간 데이터 전달 방식에 대한 설명이다. 괄호 안에 들어갈 알맞은 결합도를 보기에서 골라 ①, ② 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 19, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (147, '2026-07-13 22:50:14.45365', 1, 'N', '2026-07-13 22:50:14.45365', 1, 'Y', '1', NULL, '시스템이 제공해야 하는 기능, 서비스, 입력에 대한 처리 결과, 예외 상황에서의 동작 등을 정의한 요구사항이다.', NULL, NULL, '기능(Functional) 요구사항은 시스템이 ''무엇을 해야 하는가''를 정의한다 — 제공할 기능·서비스, 입력에 대한 처리와 출력, 예외 상황에서의 동작 등이 해당한다. 반면 비기능(Non-functional) 요구사항은 성능·보안·가용성·유지보수성·이식성처럼 시스템이 ''어떠해야 하는가''라는 품질 속성과 제약 조건을 정의한다. 보기의 성능·보안 요구사항은 비기능 요구사항의 세부 유형이다.', NULL, '["기능 요구사항", "비기능 요구사항", "성능 요구사항", "보안 요구사항"]', 'SHORT_ANSWER', '요구사항 종류 — 기능 요구사항', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 요구사항의 종류를 보기에서 골라 쓰시오. (번호 또는 보기 텍스트로 답하시오)', 21, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (149, '2026-07-13 22:59:51.141536', 1, 'N', '2026-07-13 22:59:51.141536', 1, 'Y', '1, 2, 1, 2', NULL, '"사용자는 상품명으로 상품을 검색할 수 있어야 한다."는 ( ① ) 요구사항이다.
"시스템은 장애 발생 시 5분 이내에 복구되어야 한다."는 ( ② ) 요구사항이다.
"사용자는 회원 가입 시 이메일 인증을 수행해야 한다."는 ( ③ ) 요구사항이다.
"시스템의 월평균 가용률은 99.9% 이상이어야 한다."는 ( ④ ) 요구사항이다.', NULL, NULL, '① 상품 검색 — 시스템이 제공할 ''기능''을 서술하므로 기능적 요구사항. ② 장애 5분 이내 복구 — 복구 시간이라는 품질 속성(가용성·회복성)이므로 비기능적 요구사항. ③ 회원 가입 시 이메일 인증 — 가입 과정에서 수행할 ''동작''을 정의하므로 기능적 요구사항. ④ 월평균 가용률 99.9% — 수치로 표현된 품질 조건(가용성)이므로 비기능적 요구사항. 판별 요령: 사용자·시스템이 수행하는 동작이면 기능적, 시간·비율 등 수치 조건이나 품질 속성이면 비기능적이다.', NULL, '["기능적", "비기능적"]', 'SHORT_ANSWER', '요구사항 유형 판별 (기능/비기능)', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 요구사항을 읽고 괄호 안에 들어갈 알맞은 요구사항 유형을 보기에서 골라 ①~④ 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 되며 같은 보기를 여러 번 쓸 수 있습니다)', 23, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (150, '2026-07-13 23:01:36.358848', 1, 'N', '2026-07-15 22:54:12.575912', 1, 'Y', '1, 3, 4, 5, 6', NULL, '<p>(1) 시스템이 정해진 시간 안에 응답하고 처리량을 만족해야 하는 특성이다. </p><p>(2) 권한이 없는 사용자의 접근을 방지하고 데이터를 보호해야 하는 특성이다. </p><p>(3) 사용자가 시스템을 쉽게 배우고 편리하게 사용할 수 있어야 하는 특성이다. </p><p>(4) 시스템의 오류를 수정하거나 기능을 변경하기 쉬워야 하는 특성이다. </p><p>(5) 서로 다른 운영체제나 하드웨어 환경에서도 쉽게 실행될 수 있어야 하는 특성이다.</p>', NULL, NULL, '(1) 성능(Performance) — 응답 시간·처리량(throughput) 등 시간적 조건. (2) 보안성(Security) — 비인가 접근 차단과 데이터 보호. (3) 사용성(Usability) — 학습 용이성과 사용 편의성. (4) 유지보수성(Maintainability) — 오류 수정·기능 변경의 용이성. (5) 이식성(Portability) — 다른 OS·하드웨어 환경으로의 이전 용이성. 미사용 보기인 신뢰성(Reliability)은 시스템이 장애 없이 일정 시간 동안 정확하게 동작하는 특성(MTBF 등)이다. 이들은 ISO/IEC 25010(구 9126) 소프트웨어 품질 특성에 해당한다.', 'javascript', '["성능", "신뢰성", "보안성", "사용성", "유지보수성", "이식성"]', 'SHORT_ANSWER', '비기능 요구사항 품질 특성 보기 매칭', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음은 비기능적 요구사항의 품질 특성에 관한 설명이다. 각 설명에 해당하는 항목을 보기에서 골라 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 24, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (154, '2026-07-13 23:08:31.082859', 1, 'N', '2026-07-15 00:33:32.319827', 1, 'Y', 'RR / RNR / REJ / SREJ', NULL, '<p>(1) 현재 데이터 수신이 가능하며, 다음 프레임의 전송을 요구한다. </p><p>(2) 일시적으로 데이터 수신이 불가능함을 알린다. </p><p>(3) 오류가 발생한 프레임부터 이후 프레임을 다시 전송하도록 요구한다. </p><p>(4) 오류가 발생한 특정 프레임만 선택적으로 다시 전송하도록 요구한다.</p>', NULL, NULL, '(1) RR(Receive Ready) — 수신 준비 완료, 다음 프레임 전송 요구. (2) RNR(Receive Not Ready) — 버퍼 부족 등으로 일시 수신 불가 통보(흐름 제어). (3) REJ(Reject) — 오류 발생 프레임부터 그 이후 전부 재전송 요구(Go-Back-N 방식). (4) SREJ(Selective Reject) — 오류 프레임만 선택적으로 재전송 요구(Selective Repeat 방식).', 'javascript', '["SREJ", "RR", "REJ", "RNR"]', 'SHORT_ANSWER', 'HDLC 감독 프레임 명령 보기 매칭', 4, 7, NULL, NULL, NULL, NULL, NULL, '다음은 HDLC의 감독 프레임 명령에 대한 설명이다. 각 설명에 해당하는 명령을 보기에서 골라 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 8, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (156, '2026-07-13 23:08:31.187794', 1, 'N', '2026-07-15 00:33:32.339824', 1, 'Y', '주소부 / 제어부 / FCS', NULL, '<p>플래그 | ( ① ) | ( ② ) | 정보 | ( ③ ) | 플래그 </p><p><br></p><p>( ① )은 송신국 또는 수신국을 식별하는 필드이다. </p><p>( ② )은 프레임 종류, 송수신 순서 번호, 제어 명령 등을 나타내는 필드이다. </p><p>( ③ )은 전송 오류를 검출하기 위한 필드이다.</p>', NULL, NULL, 'HDLC 프레임 구조는 플래그(01111110) | 주소부(Address) | 제어부(Control) | 정보부(Information) | FCS | 플래그 순이다. ① 주소부 — 프레임을 송수신하는 국(station)을 식별한다. ② 제어부 — 프레임 종류(I/S/U), 송수신 순서 번호, 제어 명령을 나타낸다. ③ FCS(Frame Check Sequence) — CRC 기반으로 전송 오류를 검출한다. 패리티 비트는 HDLC 프레임의 표준 필드가 아니다(함정 보기).', 'javascript', '["패리티 비트", "제어부", "FCS", "주소부"]', 'SHORT_ANSWER', 'HDLC 프레임 구조 필드', 4, 7, NULL, NULL, NULL, NULL, NULL, '다음은 HDLC 프레임의 기본 구조이다. 괄호 안에 들어갈 필드명을 보기에서 골라 ①~③ 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 10, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (155, '2026-07-13 23:08:31.14275', 1, 'N', '2026-07-14 02:03:55.988979', 1, 'Y', '1, 3, 2', NULL, '<p>(1) 주국과 종국으로 구성되며, 종국은 주국의 허가가 있어야만 데이터를 전송할 수 있는 모드이다. </p><p>(2) 결합국으로 구성되며, 각 국이 대등한 입장에서 명령과 응답을 주고받을 수 있는 모드이다. </p><p>(3) 비대칭 구조이지만 종국이 주국의 명시적인 허가 없이도 데이터를 전송할 수 있는 모드이다.</p>', NULL, NULL, '(1) 정규(표준) 응답 모드 NRM(Normal Response Mode) — 주국-종국 구성, 종국은 주국의 폴링(허가)이 있어야 전송 가능. (2) 비동기 균형 모드 ABM(Asynchronous Balanced Mode) — 혼합국(결합국)끼리 대등하게 명령·응답을 주고받는 모드로 실제로 가장 많이 사용된다. (3) 비동기 응답 모드 ARM(Asynchronous Response Mode) — 주국-종국의 비대칭 구조지만 종국이 허가 없이도 전송을 시작할 수 있다.', 'javascript', '["정규 응답 모드(NRM)", "비동기 응답 모드(ARM)", "비동기 균형 모드(ABM)"]', 'SHORT_ANSWER', 'HDLC 동작 모드 보기 매칭', 4, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 HDLC 동작 모드를 보기에서 골라 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 9, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (244, '2026-07-17 00:08:55.642864', 1, 'N', '2026-07-17 00:08:55.642864', 1, 'Y', '0 || 0000 || 나머지 0', NULL, '수신 측에서 수신 데이터 전체를 생성 다항식으로 나누었을 때, 나머지가 어떤 값이면 오류가 없다고 판단하는지 쓰시오.', NULL, NULL, '나머지가 0이면 전송 오류가 없다고 판단한다.', NULL, NULL, 'SHORT_ANSWER', '보안 - CRC 오류 없음 판정 나머지', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 16, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (153, '2026-07-13 23:08:31.032063', 1, 'N', '2026-07-15 00:33:32.301826', 1, 'Y', '정보 프레임(I-Frame) / 감독 프레임(S-Frame) / 비번호 프레임(U-Frame)', NULL, '<p>(1) 사용자 데이터와 송신 순서 번호, 수신 순서 번호를 함께 전송하는 프레임이다. </p><p>(2) 흐름 제어와 오류 제어를 수행하며, 사용자 데이터는 포함하지 않는 프레임이다. </p><p>(3) 링크의 설정, 해제, 모드 지정 등 데이터 링크의 관리 기능을 수행하는 프레임이다.</p>', NULL, NULL, '(1) 정보 프레임(I-Frame) — 사용자 데이터를 실어 나르며 송신 순서 번호 N(S)와 수신 순서 번호 N(R)을 함께 전송한다. (2) 감독 프레임(S-Frame) — 데이터 없이 흐름 제어·오류 제어(RR, RNR, REJ, SREJ)를 수행한다. (3) 비번호 프레임(U-Frame) — 순서 번호 없이 링크 설정·해제·동작 모드 지정(SNRM, SABM 등) 같은 링크 관리 기능을 담당한다.', 'javascript', '["감독 프레임(S-Frame)", "비번호 프레임(U-Frame)", "정보 프레임(I-Frame)"]', 'SHORT_ANSWER', 'HDLC 프레임 종류 보기 매칭', 4, 7, NULL, NULL, NULL, NULL, NULL, '다음은 HDLC 프레임 종류에 대한 설명이다. 각 설명에 해당하는 프레임을 보기에서 골라 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 7, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (245, '2026-07-17 00:08:55.654898', 1, 'N', '2026-07-17 00:08:55.654898', 1, 'Y', '전송 오류 검출', NULL, 'CRC(순환 중복 검사)의 주된 목적을 고르시오.', NULL, NULL, 'CRC는 전송 중 발생한 비트 오류를 검출하기 위한 기법이다.', NULL, '["데이터 암호화", "사용자 인증", "전송 오류 검출", "데이터 압축"]', 'MULTIPLE_CHOICE', '보안 - CRC의 주된 목적', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 17, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (246, '2026-07-17 00:08:55.667898', 1, 'N', '2026-07-17 00:08:55.667898', 1, 'Y', '비싱, 테일게이팅, 숄더 서핑, 스미싱, 프리텍스팅', NULL, '각 사례에 해당하는 사회공학 공격 유형을 보기에서 골라 순서대로 쓰시오.
① 공격자가 금융기관 직원을 사칭한 전화를 걸어 인증번호를 요구하였다.
② 출입 권한이 있는 직원 뒤를 따라 보안 출입문을 통과하였다.
③ 사용자가 키보드로 비밀번호를 입력하는 모습을 뒤에서 관찰하였다.
④ 택배 회사를 사칭한 문자 메시지에 악성 링크를 포함하였다.
⑤ 공격자가 인사팀 직원이라는 거짓 신분과 상황을 만들어 개인정보를 요구하였다.
[보기] 피싱 / 스미싱 / 비싱 / 테일게이팅 / 숄더 서핑 / 프리텍스팅', NULL, NULL, '①전화 사칭=비싱 ②뒤따라 출입=테일게이팅 ③어깨너머 관찰=숄더 서핑 ④사칭 문자 링크=스미싱 ⑤거짓 신분·상황=프리텍스팅.', NULL, '["피싱", "스미싱", "비싱", "테일게이팅", "숄더 서핑", "프리텍스팅"]', 'SHORT_ANSWER', '보안 - 사회공학 공격 유형 연결', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 18, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (247, '2026-07-17 00:08:55.677898', 1, 'N', '2026-07-17 00:08:55.677898', 1, 'Y', '사람의 심리 || 인간의 심리 || 인간의 심리적 취약점 || 심리적 취약점 || 사람의 신뢰 || 인간의 신뢰 || 심리', NULL, '사회공학 공격이 기술적 취약점보다 주로 무엇을 악용하는지 쓰시오.', NULL, NULL, '사회공학은 기술이 아닌 사람의 심리(신뢰·권위·긴급성 등)를 악용한다.', NULL, NULL, 'SHORT_ANSWER', '보안 - 사회공학 공격이 악용하는 대상', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 19, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (160, '2026-07-13 23:12:51.952842', 1, 'N', '2026-07-13 23:12:51.952842', 1, 'Y', '1', NULL, '프로그램이 특정 파일의 존재 여부나 권한을 확인한 시점과, 실제로 해당 파일을 사용하는 시점 사이의 시간 차이를 공격자가 악용한다.
공격자는 검사 이후 실제 사용 이전에 대상 파일을 다른 파일이나 링크 파일로 교체하여, 프로그램이 의도하지 않은 파일에 접근하도록 한다.
이와 같은 유형의 공격을 무엇이라고 하는가?', NULL, NULL, '레이스 컨디션(Race Condition) 공격, 그중에서도 검사 시점(Time-Of-Check)과 사용 시점(Time-Of-Use)의 차이를 노리는 TOCTOU 공격이다. 예: 프로그램이 access()로 권한을 확인한 뒤 open()으로 여는 사이에, 공격자가 대상 파일을 심볼릭 링크로 바꿔 /etc/passwd 같은 민감한 파일을 가리키게 한다. 대응: 검사와 사용을 원자적으로 수행(open 후 fstat), 임시 파일은 mkstemp 사용, 심볼릭 링크 추적 제한(O_NOFOLLOW) 등.', NULL, '["레이스 컨디션(TOCTOU)", "버퍼 오버플로우", "포맷 스트링 공격", "디렉터리 트래버설", "권한 상승"]', 'SHORT_ANSWER', '보안 취약점 — 레이스 컨디션(TOCTOU)', 1, 9, NULL, NULL, NULL, NULL, NULL, '다음은 리눅스에서 발생할 수 있는 보안 취약점에 관한 설명이다. 가장 적절한 용어를 보기에서 골라 쓰시오. (번호 또는 보기 텍스트로 답하시오)', 9, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (161, '2026-07-13 23:12:51.993182', 1, 'N', '2026-07-13 23:12:51.993182', 1, 'Y', '1', NULL, '파일을 실행한 사용자의 권한이 아니라, 해당 파일 소유자의 권한으로 프로그램이 실행되도록 하는 특수 권한이다.
일반적으로 실행 파일에 설정되며, ls -l 명령으로 확인했을 때 소유자의 실행 권한 위치에 s가 표시될 수 있다.', NULL, NULL, 'SetUID(Set User ID)는 실행 시 프로세스의 유효 사용자 ID(EUID)가 실행자 대신 파일 소유자로 되는 특수 권한이다(8진수 4000, chmod 4755). ls -l에서 소유자 실행 권한 자리에 s로 표시된다(예: -rwsr-xr-x, passwd 명령이 대표 사례). 비교: SetGID(2000)는 소유 그룹 권한으로 실행(그룹 실행 자리에 s), Sticky Bit(1000)는 디렉터리에서 소유자만 자기 파일을 삭제할 수 있게 함(/tmp, 기타 실행 자리에 t), Umask는 파일 생성 시 기본 권한 마스크, ACL은 사용자·그룹별 세부 접근 제어 목록이다. SetUID 실행 파일은 권한 상승 공격의 표적이 되므로 최소화해야 한다.', NULL, '["SetUID", "SetGID", "Sticky Bit", "Umask", "ACL"]', 'SHORT_ANSWER', '리눅스 특수 권한 — SetUID', 1, 9, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 리눅스 특수 권한을 보기에서 골라 쓰시오. (번호 또는 보기 텍스트로 답하시오)', 10, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (162, '2026-07-13 23:17:24.258666', 1, 'N', '2026-07-13 23:17:24.258666', 1, 'Y', '[1, 2, 3, 4]
[1, 3, 6, 10]
13 || [1,2,3,4]
[1,3,6,10]
13', 'def func(data):
    result = data[:]
    for i in range(1, len(result)):
        result[i] += result[i - 1]
    return result
a = [1, 2, 3, 4]
b = func(a)
print(a)
print(b)
print(sum(b[1::2]))', '코드를 읽고 실행 결과를 정확히 예측하여 쓰시오.', NULL, NULL, 'func는 data[:]로 리스트를 복사한 뒤 누적합을 만들므로 원본 a는 [1, 2, 3, 4] 그대로다. b는 누적합 [1, 3, 6, 10]이 된다. b[1::2]는 인덱스 1부터 2칸씩 → [3, 10]이므로 합은 13이다. 핵심: 슬라이싱 복사(얕은 복사)로 원본 보호, 확장 슬라이스 b[start::step]. 실행 결과:
[1, 2, 3, 4]
[1, 3, 6, 10]
13', 'python', NULL, 'CODE', 'Python 실행 결과 — 리스트 복사와 누적합 슬라이싱', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Python 프로그램의 실행 결과를 쓰시오. (print가 출력하는 내용을 줄 단위로 그대로 입력)', 6, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (163, '2026-07-13 23:17:24.306825', 1, 'N', '2026-07-13 23:17:24.306825', 1, 'Y', '[[1, 2, 5], [3, 4]]
[[1, 2, 5], [3, 4, 6]] || [[1,2,5],[3,4]]
[[1,2,5],[3,4,6]]', 'a = [[1, 2], [3, 4]]
b = a[:]
b[0].append(5)
b[1] = b[1] + [6]
print(a)
print(b)', '코드를 읽고 실행 결과를 정확히 예측하여 쓰시오.', NULL, NULL, 'b = a[:]는 얕은 복사라서 바깥 리스트만 새로 만들고 내부 리스트 객체는 a와 공유한다. b[0].append(5)는 공유된 내부 리스트를 직접 수정하므로 a[0]도 [1, 2, 5]가 된다. 반면 b[1] = b[1] + [6]은 덧셈으로 ''새 리스트''를 만들어 b[1]에 재할당하는 것이라 a[1]은 [3, 4] 그대로다. 핵심: 얕은 복사에서 ''내부 객체 수정''과 ''재할당''의 차이. 실행 결과:
[[1, 2, 5], [3, 4]]
[[1, 2, 5], [3, 4, 6]]', 'python', NULL, 'CODE', 'Python 실행 결과 — 리스트 얕은 복사와 내부 리스트 공유', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Python 프로그램의 실행 결과를 쓰시오. (print가 출력하는 내용을 줄 단위로 그대로 입력)', 7, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (164, '2026-07-13 23:17:24.350504', 1, 'N', '2026-07-13 23:17:24.350504', 1, 'Y', '6
9
3', 'def calc(x, result=[]):
    result.append(x)
    if x % 2 == 0:
        result.append(x // 2)
    return sum(result)
print(calc(4))
print(calc(3))
print(calc(2, []))', '코드를 읽고 실행 결과를 정확히 예측하여 쓰시오.', NULL, NULL, '기본 인자 result=[]는 함수 정의 시 ''한 번만'' 생성되어 호출 간에 공유된다. calc(4): 기본 리스트에 4, 2 추가 → 합 6. calc(3): 같은 기본 리스트가 [4, 2] 상태에서 3 추가 → [4, 2, 3] → 합 9. calc(2, []): 새 리스트를 명시적으로 전달했으므로 [2, 1] → 합 3. 핵심: 가변 객체를 기본 인자로 쓰면 상태가 누적되는 파이썬의 대표적 함정. 실행 결과:
6
9
3', 'python', NULL, 'CODE', 'Python 실행 결과 — 가변 기본 인자의 함정', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Python 프로그램의 실행 결과를 쓰시오. (print가 출력하는 내용을 줄 단위로 그대로 입력)', 8, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (165, '2026-07-13 23:17:24.389128', 1, 'N', '2026-07-13 23:17:24.389128', 1, 'Y', '[27, 5, 5, 27]
[5, 27] || [27,5,5,27]
[5,27]', 'data = [3, 1, 4, 1, 5, 9]
result = [
    x * y
    for x, y in zip(data, data[::-1])
    if (x + y) % 2 == 0
]
print(result)
print(result[-2::-2])', '코드를 읽고 실행 결과를 정확히 예측하여 쓰시오.', NULL, NULL, 'data[::-1]은 [9, 5, 1, 4, 1, 3]이고 zip 쌍은 (3,9) (1,5) (4,1) (1,4) (5,1) (9,3)이다. 합이 짝수인 쌍은 (3,9)=12, (1,5)=6, (5,1)=6, (9,3)=12이므로 곱은 [27, 5, 5, 27]. result[-2::-2]는 뒤에서 두 번째(인덱스 2, 값 5)부터 왼쪽으로 2칸씩 → 인덱스 2, 0 → [5, 27]. 핵심: zip과 역순 슬라이스, 음수 인덱스에서 시작하는 확장 슬라이스. 실행 결과:
[27, 5, 5, 27]
[5, 27]', 'python', NULL, 'CODE', 'Python 실행 결과 — zip·역슬라이스 리스트 컴프리헨션', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Python 프로그램의 실행 결과를 쓰시오. (print가 출력하는 내용을 줄 단위로 그대로 입력)', 9, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (166, '2026-07-13 23:17:24.429596', 1, 'N', '2026-07-13 23:17:24.429596', 1, 'Y', '{2: 1, 4: 3, 5: 5}
20 || {2:1,4:3,5:5}
20', 'def f(n):
    if n <= 1:
        return n
    return f(n - 1) + f(n - 2)
result = {
    i: f(i)
    for i in range(2, 7)
    if f(i) % 2 == 1
}
print(result)
print(sum(result.keys()) + sum(result.values()))', '코드를 읽고 실행 결과를 정확히 예측하여 쓰시오.', NULL, NULL, 'f는 피보나치 함수다: f(2)=1, f(3)=2, f(4)=3, f(5)=5, f(6)=8. 조건 f(i) % 2 == 1(홀수)을 만족하는 것은 f(2)=1, f(4)=3, f(5)=5이므로 result = {2: 1, 4: 3, 5: 5}. 키 합 2+4+5=11, 값 합 1+3+5=9이므로 11+9=20. 핵심: 재귀 정의 해석과 조건부 딕셔너리 컴프리헨션. 실행 결과:
{2: 1, 4: 3, 5: 5}
20', 'python', NULL, 'CODE', 'Python 실행 결과 — 재귀 피보나치와 딕셔너리 컴프리헨션', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Python 프로그램의 실행 결과를 쓰시오. (print가 출력하는 내용을 줄 단위로 그대로 입력)', 10, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (132, '2026-07-13 16:34:17.648628', 1, 'N', '2026-07-14 02:01:57.041964', 1, 'Y', '192.168.50.0/26, 192.168.50.64/26, 아니오', NULL, '<p>호스트 A의 IP 주소: 192.168.50.62 </p><p>호스트 B의 IP 주소: 192.168.50.65 </p><p>서브넷 마스크: 255.255.255.192 </p><p><br></p><p>① 호스트 A가 속한 네트워크 주소를 CIDR 표기법으로 쓰시오. </p><p>② 호스트 B가 속한 네트워크 주소를 CIDR 표기법으로 쓰시오. </p><p>③ 두 호스트가 동일한 네트워크에 속하는지 여부를 예 또는 아니오로 쓰시오.</p>', NULL, NULL, '서브넷 마스크 255.255.255.192는 /26이며 마지막 옥텟의 블록 크기는 256-192=64이다. 서브넷 경계는 0, 64, 128, 192이다. ① 호스트 A(62)는 0~63 구간에 속하므로 네트워크 주소는 192.168.50.0/26. ② 호스트 B(65)는 64~127 구간에 속하므로 192.168.50.64/26. ③ 두 호스트의 네트워크 주소가 서로 다르므로 동일한 네트워크에 속하지 않는다(아니오). 62와 65는 숫자로는 3밖에 차이나지 않지만 서브넷 경계(64)를 사이에 두고 있어 라우터를 거쳐야 통신할 수 있다.', 'javascript', NULL, 'SHORT_ANSWER', '두 호스트의 네트워크 주소와 동일 네트워크 여부 판정', 4, 7, NULL, NULL, NULL, NULL, NULL, '다음은 두 호스트의 IP 주소와 서브넷 마스크에 관한 문제이다. 물음에 대한 답을 순서대로 콤마로 구분하여 쓰시오. (①·② CIDR 표기법, ③ 예/아니오)', 5, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (167, '2026-07-14 08:40:21.461959', 1, 'N', '2026-07-14 08:40:21.461959', 1, 'Y', '2 10 14 8 10
22', '#include <stdio.h>
int main(void) {
    int a[] = {2, 4, 6, 8, 10};
    int *p = a + 1;
    int *q = a + 4;
    *p += *(q - 2);
    *(++p) = *p + *(--q);
    printf("%d %d %d %d %d\n",
           a[0], a[1], a[2], a[3], a[4]);
    printf("%d\n", *p + *q);
    return 0;
}', '코드를 읽고 실행 결과를 정확히 예측하여 쓰시오.', NULL, NULL, 'p=a+1, q=a+4에서 시작한다. ① *p += *(q-2): q-2는 a+2(값 6)이므로 a[1] = 4+6 = 10. ② *(++p) = *p + *(--q): ++p로 p는 a+2, --q로 q는 a+3이 되고, 새 위치 기준으로 *p(=a[2]=6) + *q(=a[3]=8) = 14가 a[2]에 대입된다. 배열은 {2, 10, 14, 8, 10}. 마지막 줄은 *p + *q = a[2] + a[3] = 14 + 8 = 22.', 'c', NULL, 'CODE', 'C 실행 결과 — 포인터 연산과 배열', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C언어 프로그램의 실행 결과를 쓰시오. (printf가 출력하는 내용을 줄 단위로 그대로 입력)', 11, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (168, '2026-07-14 08:40:21.510271', 1, 'N', '2026-07-14 08:40:21.510271', 1, 'Y', '8 14 14', '#include <stdio.h>
void change(int **p, int *q) {
    **p += 3;
    *p = q;
    **p *= 2;
}
int main(void) {
    int a = 5;
    int b = 7;
    int *p = &a;
    change(&p, &b);
    printf("%d %d %d\n", a, b, *p);
    return 0;
}', '코드를 읽고 실행 결과를 정확히 예측하여 쓰시오.', NULL, NULL, 'change에는 main의 포인터 p의 주소(&p)와 b의 주소가 전달된다. ① **p += 3: p가 가리키는 a가 5+3 = 8. ② *p = q: main의 p 자체가 b를 가리키도록 변경된다(이중 포인터라 가능). ③ **p *= 2: 이제 p가 가리키는 b가 7×2 = 14. 따라서 a=8, b=14, *p는 b의 값인 14 → "8 14 14".', 'c', NULL, 'CODE', 'C 실행 결과 — 이중 포인터', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C언어 프로그램의 실행 결과를 쓰시오. (printf가 출력하는 내용을 줄 단위로 그대로 입력)', 12, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (169, '2026-07-14 08:40:21.567649', 1, 'N', '2026-07-14 08:40:21.567649', 1, 'Y', 'NTMRFN
M 6', '#include <stdio.h>
#include <string.h>
int main(void) {
    char str[] = "INFORMATION";
    char result[20] = {0};
    int j = 0;
    for (int i = strlen(str) - 1; i >= 0; i--) {
        if (strchr("AEIOU", str[i]) == NULL) {
            result[j++] = str[i];
        }
    }
    result[j] = ''\0'';
    printf("%s\n", result);
    printf("%c %d\n", result[2], j);
    return 0;
}', '코드를 읽고 실행 결과를 정확히 예측하여 쓰시오.', NULL, NULL, '"INFORMATION"을 뒤에서부터 순회하며 모음(AEIOU)이 아닌 문자만 result에 담는다. 역순은 N-O-I-T-A-M-R-O-F-N-I이고 자음만 남기면 N, T, M, R, F, N → "NTMRFN" (j=6). strchr는 문자가 문자열에 없으면 NULL을 반환하므로 NULL 비교가 ''모음이 아니다'' 판정이 된다. result[2]는 ''M'', j는 6이므로 둘째 줄은 "M 6".', 'c', NULL, 'CODE', 'C 실행 결과 — 문자열 역순 자음 필터', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C언어 프로그램의 실행 결과를 쓰시오. (printf가 출력하는 내용을 줄 단위로 그대로 입력)', 13, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (170, '2026-07-14 08:40:21.599898', 1, 'N', '2026-07-14 08:40:21.599898', 1, 'Y', '27
24', '#include <stdio.h>
int func(int n) {
    static int x = 1;
    if (n <= 1) {
        return x;
    }
    x += n;
    return func(n - 2) + x;
}
int main(void) {
    printf("%d\n", func(5));
    printf("%d\n", func(3));
    return 0;
}', '코드를 읽고 실행 결과를 정확히 예측하여 쓰시오.', NULL, NULL, 'static int x는 프로그램 전체에서 하나만 존재하며 호출 간 값이 유지된다. func(5): x=1+5=6 → func(3) 호출: x=6+3=9 → func(1)은 x(9) 반환 → func(3) = 9+9 = 18 → func(5) = 18+9 = 27 (재귀 호출이 먼저 평가된 뒤 x를 읽으므로 x는 9). 두 번째 func(3): x가 9로 유지된 상태에서 x=9+3=12 → func(1)은 12 반환 → 12+12 = 24. 출력: 27, 24.', 'c', NULL, 'CODE', 'C 실행 결과 — static 변수와 재귀', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C언어 프로그램의 실행 결과를 쓰시오. (printf가 출력하는 내용을 줄 단위로 그대로 입력)', 14, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (171, '2026-07-14 08:40:21.630586', 1, 'N', '2026-07-14 08:40:21.630586', 1, 'Y', '5
5', '#include <stdio.h>
typedef struct {
    unsigned int value;
    unsigned int mask;
} Data;
int main(void) {
    Data d[] = {
        {12, 10},
        {7, 5},
        {9, 3}
    };
    unsigned int result = 0;
    for (int i = 0; i < 3; i++) {
        result ^= (d[i].value & d[i].mask) << i;
        result |= (d[i].value ^ d[i].mask) >> 1;
    }
    printf("%u\n", result);
    printf("%u\n", result & 15);
    return 0;
}', '코드를 읽고 실행 결과를 정확히 예측하여 쓰시오.', NULL, NULL, 'i=0: 12&10=8(1100&1010=1000), 8<<0=8 → result=0^8=8. 12^10=6(0110), 6>>1=3 → result=8|3=11(1011). i=1: 7&5=5(0101), 5<<1=10(1010) → result=11^10=1(0001). 7^5=2, 2>>1=1 → result=1|1=1. i=2: 9&3=1, 1<<2=4 → result=1^4=5(0101). 9^3=10(1010), 10>>1=5(0101) → result=5|5=5. 최종 result=5이고 5&15=5이므로 두 줄 모두 5를 출력한다.', 'c', NULL, 'CODE', 'C 실행 결과 — 구조체 배열과 비트 연산', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 C언어 프로그램의 실행 결과를 쓰시오. (printf가 출력하는 내용을 줄 단위로 그대로 입력)', 15, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (172, '2026-07-14 08:43:38.338192', 1, 'N', '2026-07-14 08:43:38.338192', 1, 'Y', '15
50
35', 'class Parent {
    int value = 10;
    Parent() {
        value += 5;
    }
    int getValue() {
        return value;
    }
}
class Child extends Parent {
    int value = 20;
    Child() {
        value += super.value;
    }
    @Override
    int getValue() {
        return value + super.getValue();
    }
}
public class Main {
    public static void main(String[] args) {
        Parent p = new Child();
        Child c = (Child) p;
        System.out.println(p.value);
        System.out.println(p.getValue());
        System.out.println(c.value);
    }
}', '코드를 읽고 실행 결과를 정확히 예측하여 쓰시오.', NULL, NULL, '필드는 정적 바인딩, 메서드는 동적 바인딩이 핵심이다. Parent 생성자에서 Parent.value = 10+5 = 15가 되고, Child 생성자에서 Child.value = 20+15 = 35가 된다(필드 은닉 — 두 value가 별도로 존재). p.value는 참조 변수의 ''선언 타입''(Parent) 기준이므로 15. p.getValue()는 실제 객체 타입(Child) 기준으로 동적 디스패치되어 Child.getValue = 35 + super.getValue()(Parent.value인 15) = 50. c.value는 Child 타입 기준이므로 35. 실행 결과:
15
50
35', 'java', NULL, 'CODE', 'Java 실행 결과 — 필드 은닉과 오버라이딩', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Java 프로그램의 실행 결과를 쓰시오. (출력 내용을 줄 단위로 그대로 입력)', 16, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (173, '2026-07-14 08:43:39.129465', 1, 'N', '2026-07-14 08:43:39.129465', 1, 'Y', '9
12
9', 'class Counter {
    static int count = 1;
    int value;
    Counter(int value) {
        this.value = value;
        count += value;
    }
    int calc(int n) {
        count += n;
        value += count;
        return value;
    }
}
public class Main {
    public static void main(String[] args) {
        Counter a = new Counter(2);
        Counter b = new Counter(3);
        System.out.println(a.calc(1));
        System.out.println(b.calc(2));
        System.out.println(Counter.count);
    }
}', '코드를 읽고 실행 결과를 정확히 예측하여 쓰시오.', NULL, NULL, 'static 변수 count는 모든 인스턴스가 공유하고, value는 인스턴스별로 존재한다. new Counter(2): a.value=2, count=1+2=3. new Counter(3): b.value=3, count=3+3=6. a.calc(1): count=6+1=7, a.value=2+7=9 → 9 출력. b.calc(2): count=7+2=9, b.value=3+9=12 → 12 출력. 최종 count는 9. 실행 결과:
9
12
9', 'java', NULL, 'CODE', 'Java 실행 결과 — static 변수 공유', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Java 프로그램의 실행 결과를 쓰시오. (출력 내용을 줄 단위로 그대로 입력)', 17, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (174, '2026-07-14 08:43:39.848297', 1, 'N', '2026-07-14 08:43:39.848297', 1, 'Y', '14 15 
17', 'public class Main {
    static int process(int value) {
        try {
            if (value % 2 == 0) {
                throw new ArithmeticException();
            }
            return value * 2;
        } catch (ArithmeticException e) {
            return value + 3;
        } finally {
            value += 10;
            System.out.print(value + " ");
        }
    }
    public static void main(String[] args) {
        int a = process(4);
        int b = process(5);
        System.out.println();
        System.out.println(a + b);
    }
}', '코드를 읽고 실행 결과를 정확히 예측하여 쓰시오.', NULL, NULL, 'process(4): 짝수라 예외 발생 → catch에서 return 4+3=7이 ''확정''된 뒤 finally가 실행된다. finally에서 value=14로 바꿔 "14 "를 출력하지만 이미 확정된 반환값 7은 바뀌지 않는다(지역 변수 수정은 반환값에 영향 없음). process(5): 홀수라 return 5*2=10 확정 후 finally에서 "15 " 출력. 첫 줄은 "14 15", a+b = 7+10 = 17. 실행 결과:
14 15 
17', 'java', NULL, 'CODE', 'Java 실행 결과 — 예외 처리와 finally', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Java 프로그램의 실행 결과를 쓰시오. (출력 내용을 줄 단위로 그대로 입력)', 18, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (175, '2026-07-14 08:43:40.58086', 1, 'N', '2026-07-14 08:43:40.58086', 1, 'Y', '[2, 3, 5]
10 || [2,3,5]
10', 'import java.util.ArrayList;
import java.util.List;
public class Main {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            list.add(i);
        }
        for (int i = 0; i < list.size(); i++) {
            if (list.get(i) % 2 == 0) {
                list.remove(i);
            } else {
                list.set(i, list.get(i) * 2);
            }
        }
        int sum = 0;
        for (int value : list) {
            sum += value;
        }
        System.out.println(list);
        System.out.println(sum);
    }
}', '코드를 읽고 실행 결과를 정확히 예측하여 쓰시오.', NULL, NULL, 'list = [1, 2, 3, 4, 5]에서 시작한다. i=0: 1은 홀수 → 2배 → [2, 2, 3, 4, 5] (0번이 짝수 2가 됐지만 i는 이미 지나감). i=1: 2는 짝수 → remove(1) → [2, 3, 4, 5] (뒤 요소가 당겨짐). i=2: 4는 짝수 → remove(2) → [2, 3, 5]. i=3: size가 3이라 루프 종료. 최종 리스트 [2, 3, 5], 합 10. 핵심: 인덱스 루프 중 remove하면 요소가 앞으로 당겨져 다음 요소를 건너뛰는 효과가 생기고, 이미 지나간 인덱스는 재검사되지 않는다. 실행 결과:
[2, 3, 5]
10', 'java', NULL, 'CODE', 'Java 실행 결과 — 리스트 순회 중 삭제', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Java 프로그램의 실행 결과를 쓰시오. (출력 내용을 줄 단위로 그대로 입력)', 19, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (176, '2026-07-14 08:43:41.240054', 1, 'N', '2026-07-14 08:43:41.240054', 1, 'Y', 'false
true
7', 'class Test {
    static int func(String str, int index) {
        if (index >= str.length()) {
            return 0;
        }
        int value = str.charAt(index) - ''0'';
        if (index % 2 == 0) {
            return value + func(str, index + 1);
        }
        return value * func(str, index + 1);
    }
}
public class Main {
    public static void main(String[] args) {
        String a = "3142";
        String b = new String("3142");
        System.out.println(a == b);
        System.out.println(a.equals(b));
        System.out.println(Test.func(a, 0));
    }
}', '코드를 읽고 실행 결과를 정확히 예측하여 쓰시오.', NULL, NULL, 'a는 문자열 리터럴(상수 풀), b는 new로 만든 별도 객체라 == (참조 비교)는 false, equals(내용 비교)는 true다. func("3142", 0)은 짝수 인덱스면 덧셈, 홀수 인덱스면 곱셈으로 재귀한다: f(3)=2×f(4)=2×0=0, f(2)=4+0=4, f(1)=1×4=4, f(0)=3+4=7. 핵심: 홀수 인덱스의 ''곱셈''이 마지막 단계에서 0(기저값)과 곱해져 뒷부분이 소거되는 흐름을 놓치지 않아야 한다. 실행 결과:
false
true
7', 'java', NULL, 'CODE', 'Java 실행 결과 — 문자열 비교와 재귀', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 Java 프로그램의 실행 결과를 쓰시오. (출력 내용을 줄 단위로 그대로 입력)', 20, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (201, '2026-07-15 00:01:05.655455', 1, 'N', '2026-07-15 00:01:05.655455', 1, 'Y', 'SYN / SYN / ACK / ACK / FIN / ACK', NULL, '<p><br></p><p><strong>연결 설정</strong></p><ul><li>클라이언트 → 서버 : ( ① )</li><li>서버 → 클라이언트 : ( ② ) + ( ③ )</li><li>클라이언트 → 서버 : ( ④ )</li></ul><p><strong>연결 종료</strong></p><p>일반적인 TCP 연결 종료에서는 네 번의 메시지 교환이 발생할 수 있으며, 이때 주로 사용되는 제어 플래그는 ( ⑤ )와 ( ⑥ )이다.</p>', NULL, NULL, '3-way handshake: ① SYN → ②+③ SYN+ACK → ④ ACK. 연결 종료(4-way handshake)에서는 ⑤ FIN과 ⑥ ACK 플래그가 주로 사용된다.', NULL, '["SYN", "ACK", "FIN", "RST"]', 'SHORT_ANSWER', '네트워크 — TCP 연결 설정과 종료 플래그', 4, 7, NULL, NULL, NULL, NULL, NULL, '괄호 ①~⑥에 들어갈 TCP 제어 플래그를 <보기>에서 골라 순서대로 쓰시오.', 13, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (179, '2026-07-14 10:13:36.449215', 1, 'N', '2026-07-14 10:13:36.449215', 1, 'Y', 'AVG(X.SALARY), E.DEPT_ID', NULL, 'SELECT E.EMP_NAME, E.SALARY
FROM EMPLOYEE E
WHERE E.SALARY > (
    SELECT ( ① )
    FROM EMPLOYEE X
    WHERE X.DEPT_ID = ( ② )
);', NULL, NULL, '① 부서별 ''평균'' 급여와 비교해야 하므로 AVG(X.SALARY). ② 서브쿼리가 외부 행의 부서를 참조해야 하므로 E.DEPT_ID — 외부 쿼리의 별칭 E를 참조하는 상관 서브쿼리(correlated subquery)다. 실행 결과: D1 평균 4500 → 이서연(5000), D2 평균 4500 → 정하늘(5500)이 조회된다. ②에 X.DEPT_ID를 쓰면 자기 자신과 비교하는 무의미한 조건이 되는 점에 주의.', NULL, NULL, 'SQL', '상관 서브쿼리 — 부서별 평균 급여 초과 사원', 2, 7, NULL, NULL, NULL, NULL, NULL, '다음 테이블을 참고하여 부서별 평균 급여보다 높은 급여를 받는 사원의 이름과 급여를 조회하는 SQL문의 빈칸 ①, ②에 들어갈 내용을 순서대로 콤마로 구분해 쓰시오.', 1, '{"tables": [{"name": "EMPLOYEE", "rows": [["1", "김민수", "D1", "4000"], ["2", "이서연", "D1", "5000"], ["3", "박준호", "D2", "3500"], ["4", "최유진", "D2", "4500"], ["5", "정하늘", "D2", "5500"]], "columns": [{"name": "EMP_ID", "dataType": "INT", "primaryKey": true}, {"name": "EMP_NAME", "dataType": "VARCHAR(20)", "primaryKey": false}, {"name": "DEPT_ID", "dataType": "CHAR(2)", "primaryKey": false}, {"name": "SALARY", "dataType": "INT", "primaryKey": false}]}], "expectedResult": null}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (181, '2026-07-14 10:13:36.578853', 1, 'N', '2026-07-14 16:27:50.288435', 1, 'Y', '3, 3', NULL, '<p>페이지 참조 순서: 1, 2, 3, 2, 4, 1, 5, 2, 4, 5 </p><p>단, 초기 페이지 프레임은 비어 있으며, 페이지 적재 자체도 페이지 부재로 계산한다. </p><p>답안 작성 형식: FIFO 부재 횟수, LRU 부재 횟수</p>', NULL, NULL, 'FIFO: 1F 2F 3F | 2 히트 | 4F(1 교체) 1F(2 교체) 5F(3 교체) 2F(4 교체) 4F(1 교체) | 5 히트 → 부재 8회. LRU: 1F 2F 3F | 2 히트 | 4F(최저사용 1 교체) 1F(3 교체) 5F(2 교체) 2F(4 교체) 4F(1 교체) | 5 히트 → 부재 8회. 이 참조열에서는 두 알고리즘 모두 8회로 같다(교체 ''대상''은 다르지만 부재 횟수가 우연히 일치 — 5번째 참조 이후 FIFO는 들어온 순서, LRU는 사용 시점 기준으로 교체함을 각 단계에서 구분할 것).', 'javascript', '["6", "7", "8", "9", "10"]', 'SHORT_ANSWER', 'FIFO·LRU 페이지 부재 횟수', 1, 7, NULL, NULL, NULL, NULL, NULL, '다음 페이지 참조 순서에 대해 페이지 프레임의 수가 3개일 때 FIFO와 LRU 페이지 교체 알고리즘의 페이지 부재 횟수를 보기에서 골라 FIFO, LRU 순서로 쓰시오. (콤마로 구분, 보기 번호 또는 횟수로 답하시오)', 12, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (180, '2026-07-14 10:13:36.50236', 1, 'N', '2026-07-14 23:30:57.789336', 1, 'Y', '1, 3, 4, 5, 6, 4 || 1, 3, 4, 6, 5, 4 || 1, 3, 5, 4, 6, 4 || 1, 3, 5, 6, 4, 4 || 1, 3, 6, 4, 5, 4 || 1, 3, 6, 5, 4, 4 || 1, 4, 3, 5, 6, 4 || 1, 4, 3, 6, 5, 4 || 1, 4, 5, 3, 6, 4 || 1, 4, 5, 6, 3, 4 || 1, 4, 6, 3, 5, 4 || 1, 4, 6, 5, 3, 4 || 1, 5, 3, 4, 6, 4 || 1, 5, 3, 6, 4, 4 || 1, 5, 4, 3, 6, 4 || 1, 5, 4, 6, 3, 4 || 1, 5, 6, 3, 4, 4 || 1, 5, 6, 4, 3, 4 || 1, 6, 3, 4, 5, 4 || 1, 6, 3, 5, 4, 4 || 1, 6, 4, 3, 5, 4 || 1, 6, 4, 5, 3, 4 || 1, 6, 5, 3, 4, 4 || 1, 6, 5, 4, 3, 4', NULL, '<p>P1은 R1을 점유하고 R2를 요청한다. P2는 R2를 점유하고 R3을 요청한다. P3는 R3을 점유하고 R1을 요청한다.</p>', NULL, NULL, '① P1→R2→P2→R3→P3→R1→P1로 자원 요청이 원형 고리를 이루어 모두가 영원히 대기하는 교착상태(Deadlock)다. ② 교착상태의 4가지 필요조건: 상호 배제(Mutual Exclusion — 자원을 한 번에 한 프로세스만 사용), 점유와 대기(Hold and Wait — 자원을 쥔 채 다른 자원을 대기), 비선점(Non-preemption — 자원을 강제로 빼앗을 수 없음), 환형 대기(Circular Wait — 요청 관계가 원형). 네 조건이 모두 성립해야 교착상태가 발생한다. ③ 실행 전에 필요한 모든 자원을 한꺼번에 요구하게 하면 ''자원을 쥔 채 대기''하는 상황이 없어지므로 점유와 대기 조건의 제거다.', 'javascript', '["교착상태(Deadlock)", "기아상태(Starvation)", "상호 배제", "점유와 대기", "비선점", "환형 대기"]', 'SHORT_ANSWER', '교착상태의 필요조건과 예방', 1, 7, NULL, NULL, NULL, NULL, NULL, '다음 프로세스-자원 상태를 보고 
① 발생한 문제의 명칭(1개) 
② 네 가지 필요조건(4개, 순서 무관) 
③ ''필요한 모든 자원을 한꺼번에 요구''하는 방식이 제거하는 조건(1개)을
보기에서 골라 총 6개를 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 11, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (184, '2026-07-14 10:13:36.713966', 1, 'N', '2026-07-14 10:13:36.713966', 1, 'Y', '1, 3, 5', NULL, '어떤 소프트웨어의 규모가 40 KLOC이며, 기본 COCOMO 모델에서 해당 프로젝트 유형이 중간형에 해당한다.
노력 = 3.0 × (KLOC)^1.12
개발 기간 = 2.5 × (노력)^0.35', NULL, NULL, '① COCOMO의 노력(Effort) 단위는 Man-Month(인월, MM) — 한 사람이 한 달 동안 수행하는 작업량. ② 개발 기간(TDEV)의 단위는 개월(월). ③ 단순형(organic)·중간형(semi-detached)·임베디드형(embedded)의 구분은 소프트웨어의 규모와 제약 조건(요구사항·환경 제약의 엄격함, 팀의 경험 등)을 기준으로 한다. 참고 계산: 노력 = 3.0 × 40^1.12 ≈ 186.8 MM, 개발 기간 = 2.5 × 186.8^0.35 ≈ 15.6개월.', NULL, '["Man-Month(인월)", "인시(Man-Hour)", "개월(월)", "년(Year)", "소프트웨어의 규모와 제약 조건", "개발 언어의 종류"]', 'SHORT_ANSWER', 'COCOMO 모델 — 단위와 유형 판단', 30, 7, NULL, NULL, NULL, NULL, NULL, '기본 COCOMO 모델에 대해 ① 개발 노력의 단위 ② 개발 기간의 단위 ③ 프로젝트 유형(단순형/중간형/임베디드형) 판단 시 고려하는 대표 요소를 보기에서 골라 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 27, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (186, '2026-07-14 10:13:36.813975', 1, 'N', '2026-07-14 10:13:36.813975', 1, 'Y', '1, 3, 5, 7', NULL, 'A = [7, 3, 5, 1, 4]
for i = 1 to 4
    key = A[i]
    j = i - 1
    while j >= 0 and A[j] > key
        A[j + 1] = A[j]
        j = j - 1
    A[j + 1] = key', NULL, NULL, '① key를 정렬된 앞부분에 끼워 넣는 전형적인 삽입 정렬(Insertion Sort)이다. ② 최악(역순 입력)에는 매 단계 앞 요소 전부를 이동시키므로 O(n²). ③ 과정: i=1 → [3,7,5,1,4], i=2 → [3,5,7,1,4], i=3(key=1) → [1,3,5,7,4]. ④ 같은 값의 상대 순서가 유지되므로(A[j] > key 조건이 ''초과''라 같은 값은 건너뛰지 않음) 안정 정렬이다. 참고로 i=4까지 마치면 [1,3,4,5,7]로 정렬이 완료된다.', NULL, '["삽입 정렬", "선택 정렬", "O(n^2)", "O(n log n)", "1 3 5 7 4", "3 5 7 1 4", "안정 정렬", "불안정 정렬"]', 'SHORT_ANSWER', '정렬 의사 코드 분석 — 삽입 정렬', 3, 7, NULL, NULL, NULL, NULL, NULL, '다음 의사 코드를 보고 ① 정렬 알고리즘의 명칭 ② 최악의 경우 시간 복잡도 ③ i = 3 반복이 종료된 직후 배열의 상태 ④ 안정 정렬 여부를 보기에서 골라 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답하는 것을 권장합니다)', 21, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (190, '2026-07-14 13:50:28.349157', 1, 'Y', '2026-07-14 15:00:41.295985', 1, 'Y', 'AVG(X.SALARY), E.DEPT_ID', 'SELECT E.EMP_NAME,
       E.DEPT_ID,
       E.SALARY
FROM EMPLOYEE E
WHERE E.SALARY > (
    SELECT ( 1 )
    FROM EMPLOYEE X
    WHERE X.DEPT_ID = ( 2 )
);', 'EMPLOYEE(EMP_ID, EMP_NAME, DEPT_ID, SALARY)', NULL, NULL, '① AVG(X.SALARY) — 부서별 평균 급여. ② E.DEPT_ID — 외부 쿼리의 각 사원(E)이 속한 부서를 서브쿼리에 전달하는 상관 서브쿼리(correlated subquery). ②에 X.DEPT_ID를 쓰면 서브쿼리 내부끼리 비교하는 무의미한 조건이 된다. 외부 행마다 서브쿼리가 재평가되어 ''자기 부서 평균''과 비교된다.', 'sql', NULL, 'SHORT_ANSWER', '상관 서브쿼리 — 부서 평균 급여 초과', 2, 7, NULL, NULL, NULL, NULL, NULL, '다음 SELECT 문의 괄호 ①②에 들어갈 내용을 순서대로 콤마로 구분해 쓰시오. (각 사원이 속한 부서의 평균 급여보다 높은 급여를 받는 사원 조회)', 5, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (195, '2026-07-14 13:50:28.578316', 1, 'N', '2026-07-14 23:13:10.975713', 1, 'Y', 'OR REPLACE, 10, CHECK', 'CREATE ( 1 ) VIEW DEV_EMP_VIEW
AS
SELECT EMP_ID,
       EMP_NAME,
       SALARY,
       DEPT_ID
FROM EMPLOYEE
WHERE DEPT_ID = ( 2 )
WITH ( 3 ) OPTION;', '<h3>조건</h3><ul><li>EMPLOYEE 테이블에서 개발 부서에 속한 사원만 조회하는 뷰를 생성한다.</li><li>뷰 이름은 DEV_EMP_VIEW이다.</li><li>조회 칼럼은 EMP_ID, EMP_NAME, SALARY이다.</li><li>개발 부서의 DEPT_ID는 10이다.</li><li>뷰를 통해 데이터를 삽입하거나 수정할 때 DEPT_ID = 10 조건을 벗어나는 변경을 허용하지 않는다.</li><li>뷰 생성 시 기존 뷰가 있으면 대체한다.</li></ul>', NULL, NULL, '① OR REPLACE — 같은 이름의 뷰가 있으면 대체(CREATE OR REPLACE VIEW). ② 10 — 개발 부서 DEPT_ID 조건. ③ CHECK — WITH CHECK OPTION은 뷰를 통한 INSERT/UPDATE가 뷰의 WHERE 조건(DEPT_ID=10)을 위반하지 못하게 막는다. 이 옵션이 없으면 뷰로 DEPT_ID=20인 행을 넣는 등 조건을 벗어난 변경이 가능해진다.', 'sql', NULL, 'SHORT_ANSWER', 'VIEW 생성과 WITH CHECK OPTION', 2, 7, NULL, NULL, NULL, NULL, NULL, '다음 SQL문의 빈칸에 들어갈 내용을 번호 순서대로 콤마로 구분해 쓰시오. (대소문자 무시, 한 줄로 입력해도 됩니다)', 10, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (193, '2026-07-14 13:50:28.47792', 1, 'N', '2026-07-14 21:29:46.407731', 1, 'Y', '*, MIN, E.DEPT_ID', 'UPDATE EMPLOYEE E
WHERE E.SALARY = (
    SELECT ( 2 )(X.SALARY)
    FROM EMPLOYEE X
    WHERE X.DEPT_ID = ( 3 )
);', '<h3>조건</h3><ul><li>각 부서에서 급여가 가장 낮은 사원의 급여를 10% 인상한다.</li><li>동일한 최저 급여를 받는 사원이 여러 명이면 모두 인상한다.</li><li>변경된 급여는 기존 급여에 1.1을 곱하여 계산한다.</li></ul>', NULL, NULL, '① * — 기존 급여에 1.1을 ''곱해'' 10% 인상(E.SALARY * 1.1). ② MIN(X.SALARY) — 부서 내 최저 급여. ③ E.DEPT_ID — 외부 행 사원의 부서와 같은 부서에서 최저 급여를 구하는 상관 서브쿼리. 급여가 ''최저 급여와 같은'' 모든 사원이 갱신되므로 동일 최저 급여자 여러 명도 함께 인상된다.', 'sql', NULL, 'SHORT_ANSWER', 'UPDATE와 서브쿼리 — 부서 최저 급여자 인상', 2, 7, NULL, NULL, NULL, NULL, NULL, '다음 SQL문의 빈칸에 들어갈 내용을 번호 순서대로 콤마로 구분해 쓰시오. (대소문자 무시, 한 줄로 입력해도 됩니다)', 8, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (192, '2026-07-14 13:50:28.436968', 1, 'N', '2026-07-14 21:29:46.386995', 1, 'Y', '''MIDDLE'', ''LOW'', 1, 0 || MIDDLE, LOW, 1, 0', 'SELECT EMP_NAME, SALARY,
       CASE
           WHEN SALARY >= 5000 THEN ''HIGH''
           WHEN SALARY >= 3000 THEN ( 1 )
           ELSE ( 2 )
       END AS SALARY_GRADE
FROM EMPLOYEE;
// 다음 SQL문은 부서별로 급여가 5,000 이상인 사원의 수를 조회한다.
SELECT DEPT_ID,
       SUM(
           CASE
               WHEN SALARY >= 5000 THEN ( 3 )
               ELSE ( 4 )
           END
       ) AS HIGH_SALARY_COUNT
FROM EMPLOYEE
GROUP BY DEPT_ID;', '<p>괄호 안에 들어갈 내용을 쓰시오.</p><h3>급여 등급 조건</h3><ul><li>급여가 5,000 이상이면 HIGH</li><li>급여가 3,000 이상 5,000 미만이면 MIDDLE</li><li>그 외에는 LOW</li></ul>', NULL, NULL, '① ''MIDDLE'' ② ''LOW'' — CASE는 위에서부터 처음 참인 조건을 택하므로 5000 미만 3000 이상이 MIDDLE, 나머지가 LOW. ③ 1 ④ 0 — SUM(CASE WHEN 조건 THEN 1 ELSE 0 END)은 조건을 만족하는 행 수를 세는 조건부 집계 기법이다(COUNT 대신 SUM으로 개수 계산).', 'sql', NULL, 'SHORT_ANSWER', 'CASE 표현식과 조건부 집계', 2, 7, NULL, NULL, NULL, NULL, NULL, '다음 SQL문의 빈칸에 들어갈 내용을 번호 순서대로 콤마로 구분해 쓰시오. (대소문자 무시, 한 줄로 입력해도 됩니다)', 7, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (191, '2026-07-14 13:50:28.388337', 1, 'N', '2026-07-14 22:00:02.509455', 1, 'Y', 'SUM, COUNT, CUSTOMER_ID, COUNT, SUM, DESC', 'SELECT CUSTOMER_ID,
       ( 1 )(ORDER_AMOUNT) AS TOTAL_AMOUNT,
       ( 2 )(*) AS ORDER_COUNT
FROM ORDERS
GROUP BY ( 3 )
HAVING ( 4 )(*) >= 3
   AND ( 5 )(ORDER_AMOUNT) >= 500000
ORDER BY TOTAL_AMOUNT ( 6 );', '<h3>조건</h3><ul><li>주문 테이블에서 고객별 총 주문 금액과 주문 건수를 조회한다.</li><li>주문 건수가 3건 이상이고 총 주문 금액이 500,000원 이상인 고객만 조회한다.</li><li>총 주문 금액이 큰 순서대로 정렬한다.</li></ul><p><br></p><p>ORDERS(ORDER_ID, CUSTOMER_ID, ORDER_DATE, ORDER_AMOUNT)</p>', NULL, NULL, '① SUM(ORDER_AMOUNT) — 총 주문 금액. ② COUNT(*) — 주문 건수. ③ CUSTOMER_ID — 고객별 그룹화. ④ COUNT(*) >= 3, ⑤ SUM(ORDER_AMOUNT) >= 500000 — 그룹에 대한 조건이므로 WHERE가 아니라 HAVING에 집계함수로 작성. ⑥ DESC — 총액 내림차순. WHERE는 그룹화 전 행 필터, HAVING은 그룹화 후 집계 결과 필터라는 점이 핵심.', 'sql', NULL, 'SHORT_ANSWER', 'GROUP BY와 HAVING', 2, 7, NULL, NULL, NULL, NULL, NULL, '다음 SQL문의 빈칸에 들어갈 내용을 번호 순서대로 콤마로 구분해 쓰시오. (대소문자 무시, 한 줄로 입력해도 됩니다)', 6, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (194, '2026-07-14 13:50:28.541316', 1, 'N', '2026-07-14 21:29:46.427534', 1, 'Y', 'NOT EXISTS, C.CUSTOMER_ID', 'DELETE FROM CUSTOMER C
WHERE ( 1 ) (
    SELECT 1
    FROM ORDERS O
    WHERE O.CUSTOMER_ID = ( 2 )
);', '<h3>조건</h3><ul><li>한 번도 주문한 적이 없는 고객을 CUSTOMER 테이블에서 삭제한다.</li><li>ORDERS 테이블의 CUSTOMER_ID는 고객 번호를 의미한다.</li><li>NOT EXISTS를 사용한다.</li></ul><p><br></p>', NULL, NULL, '① NOT EXISTS — 서브쿼리 결과가 ''존재하지 않을 때'' 참. ② C.CUSTOMER_ID — 외부의 각 고객(C)에 대해 주문이 하나라도 있는지 확인하는 상관 서브쿼리. 주문이 하나도 없으면(NOT EXISTS 참) 그 고객이 삭제된다. EXISTS는 행 존재 여부만 보므로 SELECT 절에 무엇을 쓰든(여기선 1) 무관하다.', 'sql', NULL, 'SHORT_ANSWER', 'DELETE와 NOT EXISTS', 2, 7, NULL, NULL, NULL, NULL, NULL, '다음 SQL문의 빈칸에 들어갈 내용을 번호 순서대로 콤마로 구분해 쓰시오. (대소문자 무시, 한 줄로 입력해도 됩니다)', 9, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (178, '2026-07-14 10:13:36.361173', 1, 'N', '2026-07-14 16:05:38.734076', 1, 'Y', '2, 7, 3', NULL, '<p>① 발생한 현상 ② 이를 방지하는 최소 격리 수준 ③ 격리 수준</p><p><br></p><p>*초기 잔액: 100 T1: 잔액 조회 → 100 T2: 잔액을 150으로 수정 T2: COMMIT T1: 동일한 잔액 재조회 → 150</p>', NULL, NULL, '① 한 트랜잭션 안에서 같은 데이터를 두 번 읽었는데 다른 트랜잭션의 COMMIT된 수정 때문에 값이 달라졌으므로 Non-Repeatable Read(반복 불가능 읽기)다. T2가 COMMIT한 값을 읽었으므로 Dirty Read(미커밋 읽기)가 아니라는 점에 주의. ② 이를 방지하는 최소 격리 수준은 REPEATABLE READ(읽은 행에 공유 잠금 유지). ③ REPEATABLE READ에서도 ''조건에 맞는 행의 집합''이 달라지는 Phantom Read는 여전히 발생할 수 있다(방지는 SERIALIZABLE). 격리 수준별 허용 이상 현상: READ UNCOMMITTED(Dirty·NRR·Phantom) → READ COMMITTED(NRR·Phantom) → REPEATABLE READ(Phantom) → SERIALIZABLE(없음).', 'javascript', '["Dirty Read", "Non-Repeatable Read", "Phantom Read", "Lost Update", "READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE"]', 'SHORT_ANSWER', '트랜잭션 격리 수준 — Non-Repeatable Read', 31, 7, NULL, NULL, NULL, NULL, NULL, '다음 두 트랜잭션의 실행 과정을 보고,  발생할 수 있는 현상을 보기에서 골라 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 7, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (206, '2026-07-16 10:57:38.5955', 1, 'N', '2026-07-16 10:57:38.5955', 1, 'Y', 'HTTP: 응용 계층, TCP: 전송 계층, IP: 네트워크 계층, Ethernet: 데이터 링크 계층, SMTP: 응용 계층', NULL, '다음 프로토콜을 해당하는 OSI 7계층과 연결하여 쓰시오.
[보기] HTTP / TCP / IP / Ethernet / SMTP
[답안 작성 형식]
HTTP:
TCP:
IP:
Ethernet:
SMTP:
단, 계층명은 다음 중 하나로 쓰시오 — 응용 계층 / 전송 계층 / 네트워크 계층 / 데이터 링크 계층 / 물리 계층 / 세션 계층 / 표현 계층', NULL, NULL, 'HTTP·SMTP=응용 계층, TCP=전송 계층, IP=네트워크 계층, Ethernet=데이터 링크 계층.', NULL, NULL, 'SHORT_ANSWER', 'OSI 7계층 - 프로토콜과 계층 연결', 4, 7, NULL, NULL, NULL, NULL, NULL, NULL, 16, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (177, '2026-07-14 10:13:36.231831', 1, 'N', '2026-07-14 21:29:05.437575', 1, 'Y', '학번, 과목코드', NULL, '<p>수강(학번, 학생명, 학과코드, 학과명, 과목코드, 과목명, 담당교수, 성적) </p><p><br></p><p>함수적 종속성: </p><p>학번 → 학생명, 학과코드 </p><p>학과코드 → 학과명 </p><p>과목코드 → 과목명, 담당교수 </p><p>학번, 과목코드 → 성적 </p><p><br></p><p>(1) 위 릴레이션의 기본키를 쓰시오. </p><p>(2) 위 릴레이션이 제2정규형을 위반하는 이유를 쓰시오. (채점 제외 — 해설 참고) </p><p>(3) 위 릴레이션을 제3정규형까지 분해한 결과를 릴레이션 형태로 쓰시오. (채점 제외 — 해설 참고)</p>', NULL, NULL, '(1) 성적이 (학번, 과목코드)에 종속되고 모든 속성이 이 둘로부터 결정되므로 기본키는 (학번, 과목코드) 복합키다. (2) 제2정규형은 부분 함수 종속 제거를 요구하는데, 학생명·학과코드는 기본키의 일부인 ''학번''에만, 과목명·담당교수는 ''과목코드''에만 종속(부분 함수 종속)되므로 위반이다. (3) 3NF 분해: 부분 종속 제거(2NF) 후 이행 종속(학번→학과코드→학과명)까지 제거하면 — 학생(학번, 학생명, 학과코드) / 학과(학과코드, 학과명) / 과목(과목코드, 과목명, 담당교수) / 수강(학번, 과목코드, 성적) 4개 릴레이션이 된다.', 'javascript', NULL, 'SHORT_ANSWER', '정규화 — 부분 함수 종속과 3NF 분해', 31, 7, NULL, NULL, NULL, NULL, NULL, '다음 릴레이션과 함수적 종속성을 보고 물음에 답하시오. 채점 답안은 (1)의 기본키 속성들을 콤마로 구분해 쓰시오. ((2)·(3)은 채점에 포함되지 않으니 스스로 답해본 뒤 해설과 비교하세요.)', 6, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (196, '2026-07-14 13:50:28.616314', 1, 'N', '2026-07-14 22:49:31.390576', 1, 'Y', 'INTO, MATCHED, NOT MATCHED', 'MERGE ( 1 ) EMPLOYEE E
USING NEW_EMPLOYEE N
ON (E.EMP_ID = N.EMP_ID)
WHEN ( 2 ) THEN
    UPDATE SET
        E.EMP_NAME = N.EMP_NAME,
        E.SALARY = N.SALARY
WHEN ( 3 ) THEN
    INSERT (
        EMP_ID, EMP_NAME, DEPT_ID, SALARY
    )
    VALUES (
        N.EMP_ID, N.EMP_NAME, N.DEPT_ID, N.SALARY
    );', '<h3>조건</h3><ul><li>두 테이블의 EMP_ID가 같으면 기존 사원의 이름과 급여를 수정한다.</li><li>같은 EMP_ID가 없으면 새로운 사원 정보를 삽입한다.</li><li>Oracle의 MERGE문을 사용한다.</li></ul>', NULL, NULL, '① INTO — MERGE INTO 대상 테이블. ② MATCHED — ON 조건(EMP_ID 일치)이 맞는 행은 WHEN MATCHED THEN UPDATE로 수정. ③ NOT MATCHED — 일치하는 행이 없으면 WHEN NOT MATCHED THEN INSERT로 삽입. MERGE는 하나의 문으로 조건에 따라 UPDATE와 INSERT를 함께 수행하는 UPSERT 구문이다.', 'sql', NULL, 'SHORT_ANSWER', 'MERGE문 (UPSERT)', 2, 7, NULL, NULL, NULL, NULL, NULL, '다음 SQL문의 빈칸에 들어갈 내용을 번호 순서대로 콤마로 구분해 쓰시오. (대소문자 무시, 한 줄로 입력해도 됩니다)', 11, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (205, '2026-07-16 10:57:38.515616', 1, 'N', '2026-07-16 10:57:38.515616', 1, 'Y', '표현 계층', NULL, '다음 설명에 해당하는 OSI 7계층의 명칭을 쓰시오.
데이터의 표현 형식을 변환하고, 문자 코드 변환, 데이터 압축, 암호화 및 복호화 기능을 수행하는 계층이다.', NULL, NULL, '표현 계층(Presentation Layer)은 데이터 표현 형식 변환, 문자 코드 변환(ASCII↔EBCDIC 등), 데이터 압축, 암호화/복호화를 담당한다.', NULL, '["응용 계층", "표현 계층", "세션 계층", "전송 계층", "네트워크 계층", "데이터 링크 계층", "물리 계층"]', 'MULTIPLE_CHOICE', 'OSI 7계층 기능 설명 - 계층 식별', 4, 7, NULL, NULL, NULL, NULL, NULL, NULL, 15, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (208, '2026-07-16 10:57:38.658339', 1, 'N', '2026-07-16 10:57:38.658339', 1, 'Y', '전송 계층, 네트워크 계층, 데이터 링크 계층, 세션 계층, 물리 계층', NULL, '다음 각 설명에 해당하는 OSI 계층을 순서대로 쓰시오.
① 종단 간 신뢰성 있는 데이터 전송, 흐름 제어, 오류 제어를 담당한다.
② 논리 주소를 사용하여 목적지까지 최적의 경로를 선택한다.
③ 물리 주소를 이용하여 인접한 장치 간 프레임을 전달한다.
④ 응용 프로그램 간의 연결 설정, 유지, 종료를 담당한다.
⑤ 케이블, 전압, 커넥터, 신호 전송 방식 등을 정의한다.', NULL, NULL, '①전송 ②네트워크 ③데이터 링크 ④세션 ⑤물리 계층.', NULL, '["응용 계층", "표현 계층", "세션 계층", "전송 계층", "네트워크 계층", "데이터 링크 계층", "물리 계층"]', 'SHORT_ANSWER', 'OSI 7계층 - 기능 설명과 계층 매칭', 4, 7, NULL, NULL, NULL, NULL, NULL, NULL, 18, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (187, '2026-07-14 13:50:28.205984', 1, 'N', '2026-07-14 21:29:46.296414', 1, 'Y', 'CONSTRAINT, FOREIGN KEY, REFERENCES, ON DELETE SET NULL', 'CREATE TABLE EMPLOYEE (
    EMP_ID NUMBER(5) NOT NULL,
    EMP_NAME VARCHAR2(30) NOT NULL,
    DEPT_ID NUMBER(3),
    SALARY NUMBER(8),
    CONSTRAINT EMP_PK
        PRIMARY KEY (EMP_ID),
    ( 1 ) EMP_DEPT_FK
        ( 2 ) (DEPT_ID)
        ( 3 ) DEPARTMENT (DEPT_ID)
        ( 4 )
);', '<p>Oracle 기준 외래키 제약조건을 정의한다.</p><p><br></p><h3>조건</h3><ul><li>외래키 제약조건의 이름은 EMP_DEPT_FK로 지정한다.</li><li>EMPLOYEE 테이블의 DEPT_ID 칼럼이 외래키 역할을 한다.</li><li>DEPARTMENT 테이블의 DEPT_ID 칼럼을 참조한다.</li><li>참조되는 부서가 삭제되면 해당 부서에 속한 사원의 DEPT_ID를 NULL로 변경한다.</li></ul>', NULL, NULL, '① CONSTRAINT — 제약조건 이름(EMP_DEPT_FK)을 명시적으로 부여. ② FOREIGN KEY (DEPT_ID) — 외래키가 될 칼럼 지정. ③ REFERENCES DEPARTMENT (DEPT_ID) — 참조 대상 테이블·칼럼. ④ ON DELETE SET NULL — 참조되는 부서가 삭제되면 해당 사원의 DEPT_ID를 NULL로 변경(참조 무결성 옵션). 참고: ON DELETE CASCADE는 자식 행까지 삭제, 옵션 생략 시 참조 중인 부모 행 삭제가 거부(RESTRICT)된다.', 'sql', NULL, 'SHORT_ANSWER', '외래키 제약조건 — ON DELETE SET NULL', 2, 7, NULL, NULL, NULL, NULL, NULL, '다음 SQL문의 빈칸에 들어갈 내용을 번호 순서대로 콤마로 구분해 쓰시오. (대소문자 무시, 한 줄로 입력해도 됩니다)', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (144, '2026-07-13 22:44:10.268646', 1, 'N', '2026-07-14 22:24:47.455483', 1, 'Y', '1, 2, 5, 6, 7', NULL, '<p>(1) 모듈 내부의 모든 기능이 하나의 명확한 목적을 수행하기 위해 구성된 경우이다. </p><p>(2) 한 활동의 출력값이 다음 활동의 입력값으로 사용되는 경우이다. </p><p>(3) 초기화, 종료 처리와 같이 특정 시점에 함께 수행되는 기능들이 하나의 모듈로 구성된 경우이다. </p><p>(4) 서로 유사한 성격의 기능들을 하나의 모듈로 묶고, 매개변수에 따라 특정 기능을 선택하여 수행하는 경우이다. </p><p>(5) 모듈 내부의 기능들이 특별한 관련성 없이 임의로 모여 있는 경우이다.</p>', NULL, NULL, '(1) 기능적(Functional) 응집도 — 모든 요소가 단일 목적 수행에 기여, 가장 높은(좋은) 응집도. (2) 순차적(Sequential) 응집도 — 한 활동의 출력이 다음 활동의 입력이 됨. (3) 시간적(Temporal) 응집도 — 초기화·종료처럼 같은 시점에 수행되는 기능들의 묶음. (4) 논리적(Logical) 응집도 — 유사한 성격의 기능을 묶고 매개변수(플래그)로 선택 수행. (5) 우연적(Coincidental) 응집도 — 아무 관련 없는 기능의 임의 묶음, 가장 낮은(나쁜) 응집도. 응집도는 높은(좋은) 것부터 기능적 → 순차적 → 교환적(통신적) → 절차적 → 시간적 → 논리적 → 우연적 순이다. 미사용 보기: 교환적(통신적, Communicational)은 같은 입출력 데이터를 사용하는 기능들의 묶음, 절차적(Procedural)은 정해진 순서대로 수행되지만 데이터 연결은 없는 경우다.', 'javascript', '["기능적 응집도", "순차적 응집도", "교환적 응집도", "절차적 응집도", "시간적 응집도", "논리적 응집도", "우연적 응집도"]', 'SHORT_ANSWER', '응집도 종류 보기 매칭', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 각 설명에 해당하는 응집도의 종류를 보기에서 골라 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 18, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (148, '2026-07-13 22:51:55.808004', 1, 'N', '2026-07-14 22:47:26.264164', 1, 'Y', 'ㄱ, ㄷ, ㅂ, ㄴ, ㄹ, ㅁ || ㄱ, ㄷ, ㅂ, ㄴ, ㅁ, ㄹ || ㄱ, ㄷ, ㅂ, ㄹ, ㄴ, ㅁ || ㄱ, ㄷ, ㅂ, ㄹ, ㅁ, ㄴ || ㄱ, ㄷ, ㅂ, ㅁ, ㄴ, ㄹ || ㄱ, ㄷ, ㅂ, ㅁ, ㄹ, ㄴ || ㄱ, ㅂ, ㄷ, ㄴ, ㄹ, ㅁ || ㄱ, ㅂ, ㄷ, ㄴ, ㅁ, ㄹ || ㄱ, ㅂ, ㄷ, ㄹ, ㄴ, ㅁ || ㄱ, ㅂ, ㄷ, ㄹ, ㅁ, ㄴ || ㄱ, ㅂ, ㄷ, ㅁ, ㄴ, ㄹ || ㄱ, ㅂ, ㄷ, ㅁ, ㄹ, ㄴ || ㄷ, ㄱ, ㅂ, ㄴ, ㄹ, ㅁ || ㄷ, ㄱ, ㅂ, ㄴ, ㅁ, ㄹ || ㄷ, ㄱ, ㅂ, ㄹ, ㄴ, ㅁ || ㄷ, ㄱ, ㅂ, ㄹ, ㅁ, ㄴ || ㄷ, ㄱ, ㅂ, ㅁ, ㄴ, ㄹ || ㄷ, ㄱ, ㅂ, ㅁ, ㄹ, ㄴ || ㄷ, ㅂ, ㄱ, ㄴ, ㄹ, ㅁ || ㄷ, ㅂ, ㄱ, ㄴ, ㅁ, ㄹ || ㄷ, ㅂ, ㄱ, ㄹ, ㄴ, ㅁ || ㄷ, ㅂ, ㄱ, ㄹ, ㅁ, ㄴ || ㄷ, ㅂ, ㄱ, ㅁ, ㄴ, ㄹ || ㄷ, ㅂ, ㄱ, ㅁ, ㄹ, ㄴ || ㅂ, ㄱ, ㄷ, ㄴ, ㄹ, ㅁ || ㅂ, ㄱ, ㄷ, ㄴ, ㅁ, ㄹ || ㅂ, ㄱ, ㄷ, ㄹ, ㄴ, ㅁ || ㅂ, ㄱ, ㄷ, ㄹ, ㅁ, ㄴ || ㅂ, ㄱ, ㄷ, ㅁ, ㄴ, ㄹ || ㅂ, ㄱ, ㄷ, ㅁ, ㄹ, ㄴ || ㅂ, ㄷ, ㄱ, ㄴ, ㄹ, ㅁ || ㅂ, ㄷ, ㄱ, ㄴ, ㅁ, ㄹ || ㅂ, ㄷ, ㄱ, ㄹ, ㄴ, ㅁ || ㅂ, ㄷ, ㄱ, ㄹ, ㅁ, ㄴ || ㅂ, ㄷ, ㄱ, ㅁ, ㄴ, ㄹ || ㅂ, ㄷ, ㄱ, ㅁ, ㄹ, ㄴ', NULL, '<p>보기: </p><p>ㄱ. 사용자는 아이디와 비밀번호를 입력하여 로그인할 수 있어야 한다. </p><p>ㄴ. 시스템은 동시에 1,000명 이상의 사용자가 접속할 수 있어야 한다. </p><p>ㄷ. 관리자는 회원 정보를 조회하고 수정할 수 있어야 한다. </p><p>ㄹ. 모든 개인정보는 암호화하여 저장해야 한다. </p><p>ㅁ. 결제 요청 후 3초 이내에 처리 결과를 표시해야 한다. </p><p>ㅂ. 사용자는 주문 내역을 취소할 수 있어야 한다. </p><p><br></p><p>답안 예시: 기능적이 ㄱ·ㄴ·ㄷ, 비기능적이 ㄹ·ㅁ·ㅂ이라면 → ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ</p>', NULL, NULL, '기능적 요구사항(시스템이 ''무엇을'' 해야 하는가): ㄱ 로그인 기능, ㄷ 회원 정보 조회·수정 기능, ㅂ 주문 취소 기능. 비기능적 요구사항(시스템이 ''어떠해야'' 하는가 — 품질·제약): ㄴ 동시 접속 1,000명(성능·용량), ㄹ 개인정보 암호화 저장(보안), ㅁ 3초 이내 응답(성능). 구분 요령: 사용자·관리자가 수행하는 ''동작·서비스''를 서술하면 기능적, 수치 조건·품질 속성(성능·보안·가용성 등)을 서술하면 비기능적이다.', 'javascript', '["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ"]', 'SHORT_ANSWER', '기능적·비기능적 요구사항 구분', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 보기의 요구사항을 기능적 요구사항과 비기능적 요구사항으로 구분하여, 기능적 요구사항 3개 → 비기능적 요구사항 3개 순서로 기호(ㄱ~ㅂ)를 콤마로 구분해 쓰시오. (같은 분류 안에서의 순서는 무관)', 22, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (197, '2026-07-15 00:01:05.605881', 1, 'N', '2026-07-15 00:01:05.605881', 1, 'Y', '세션 하이재킹', NULL, '<p><br></p><p>공격자가 정상적인 사용자의 세션 식별자나 인증 정보를 탈취한 뒤, 해당 사용자인 것처럼 서버와 통신한다. 이미 인증된 세션을 가로채기 때문에 별도의 로그인 과정을 거치지 않고 권한을 획득할 수 있다.</p>', NULL, NULL, '세션 하이재킹(Session Hijacking)은 이미 인증이 완료된 사용자의 세션 식별자(세션 ID)나 토큰을 탈취하여, 재인증 없이 정상 사용자로 위장해 서버와 통신하는 공격이다. 스니핑은 트래픽 도청, 스푸핑은 출발지 위조, 스미싱은 문자메시지 기반 피싱을 의미한다.', NULL, '["세션 하이재킹", "스니핑", "스푸핑", "스미싱"]', 'SHORT_ANSWER', '정보보안 — 인증된 세션을 가로채는 공격', 5, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 공격 기법을 <보기>에서 골라 쓰시오.', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (185, '2026-07-14 10:13:36.770261', 1, 'N', '2026-07-15 00:33:32.401825', 1, 'Y', 'ARP / RARP / ICMP / DHCP / NAT', NULL, '<p>(1) IP 주소를 이용하여 해당 장치의 물리 주소를 알아내는 프로토콜이다. </p><p>(2) 물리 주소를 이용하여 IP 주소를 알아내는 프로토콜이다. </p><p>(3) 네트워크 오류 보고와 진단 메시지 전달에 사용된다. </p><p>(4) 클라이언트에게 IP 주소, 서브넷 마스크, 게이트웨이 등의 정보를 자동으로 할당한다. </p><p>(5) 사설 IP 주소와 공인 IP 주소를 변환하여 제한된 공인 주소를 여러 장치가 공유할 수 있게 한다.</p>', NULL, NULL, '(1) ARP — IP 주소 → MAC(물리) 주소 변환. (2) RARP — MAC 주소 → IP 주소 역변환(디스크 없는 워크스테이션 등). (3) ICMP — 오류 보고·진단(ping의 Echo Request/Reply, Destination Unreachable 등). (4) DHCP — IP·서브넷 마스크·게이트웨이·DNS를 자동 할당(임대 방식). (5) NAT — 사설 IP↔공인 IP 변환으로 공인 주소를 절약하고 내부 구조를 숨긴다.', 'javascript', '["ICMP", "RARP", "ARP", "DHCP", "NAT"]', 'SHORT_ANSWER', '주소 변환·관리 프로토콜 보기 매칭', 4, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 프로토콜 또는 기술을 보기에서 골라 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 11, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (183, '2026-07-14 10:13:36.672852', 1, 'N', '2026-07-15 00:33:32.419824', 1, 'Y', '애자일 / 스크럼 / 지속적 통합 / 지속적 전달 / DevOps', NULL, '<p>(1) 짧은 개발 주기를 반복하며, 사용자 요구사항 변화에 유연하게 대응한다. </p><p>(2) 제품 백로그, 스프린트 백로그, 데일리 스크럼 등의 개념을 사용한다. </p><p>(3) 개발자가 새로운 코드를 저장소에 자주 통합하고, 자동화된 빌드와 테스트를 수행한다. </p><p>(4) 실제 운영 환경과 유사한 환경에 변경 사항을 자동 배포하여 품질을 검증한다. </p><p>(5) 소프트웨어 개발과 운영 조직 간의 협업 및 자동화를 강조한다.</p>', NULL, NULL, '(1) 애자일(Agile) — 반복(iteration) 중심으로 변화에 유연하게 대응하는 개발 철학·방법론군. (2) 스크럼(Scrum) — 애자일을 구현하는 대표 프레임워크로 제품 백로그·스프린트·데일리 스크럼을 사용. (3) 지속적 통합(CI) — 잦은 커밋·자동 빌드·자동 테스트로 통합 문제를 조기 발견. (4) 지속적 전달(CD, Continuous Delivery) — 스테이징 등 운영 유사 환경까지 자동 배포해 항상 릴리스 가능한 상태 유지. (5) DevOps — 개발(Dev)과 운영(Ops)의 협업 문화와 자동화 도구 체계.', 'javascript', '["스크럼", "지속적 전달", "애자일", "지속적 통합", "DevOps"]', 'SHORT_ANSWER', '개발 방법론·DevOps 용어 보기 매칭', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 용어를 보기에서 골라 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 26, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (199, '2026-07-15 00:01:05.63394', 1, 'N', '2026-07-15 00:33:32.437824', 1, 'Y', 'DAC / MAC / RBAC / ABAC', NULL, '<p><br></p><ol><li>자원의 소유자가 다른 사용자에게 접근 권한을 부여하거나 회수할 수 있다.</li><li>주체와 객체에 부여된 보안 등급을 기준으로 중앙 관리자가 접근을 통제한다.</li><li>사용자의 직무나 역할에 따라 권한을 부여한다.</li><li>사용자, 자원, 환경 등의 속성과 정책을 종합적으로 평가하여 접근을 허용한다.</li></ol>', NULL, NULL, 'DAC(임의적 접근통제)는 자원 소유자가 권한을 부여·회수한다. MAC(강제적 접근통제)는 보안 등급 기반으로 중앙에서 강제한다. RBAC(역할 기반)는 직무·역할에 권한을 매핑한다. ABAC(속성 기반)는 주체·자원·환경 속성과 정책을 종합 평가한다.', NULL, '["DAC", "RBAC", "MAC", "ABAC"]', 'SHORT_ANSWER', '정보보안 — 접근 통제 모델(DAC·MAC·RBAC·ABAC)', 5, 7, NULL, NULL, NULL, NULL, NULL, '각 설명에 해당하는 접근 통제 모델을 <보기>에서 골라 빈칸 순서대로 쓰시오.', 4, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (200, '2026-07-15 00:01:05.645455', 1, 'N', '2026-07-15 00:33:32.457825', 1, 'Y', '리피터 / 브리지 / 라우터 / 게이트웨이', NULL, '<p><br></p><ol><li>물리 계층에서 전기적 신호를 증폭하고 재생하여 전송 거리를 연장한다.</li><li>데이터 링크 계층에서 MAC 주소를 기준으로 프레임을 전달한다.</li><li>네트워크 계층에서 IP 주소와 라우팅 테이블을 이용하여 패킷의 경로를 결정한다.</li><li>서로 다른 프로토콜이나 데이터 형식을 사용하는 네트워크 간 변환 기능을 수행한다.</li></ol>', NULL, NULL, '리피터는 물리 계층에서 신호를 증폭·재생한다. 브리지(L2 스위치)는 데이터 링크 계층에서 MAC 주소로 프레임을 전달한다. 라우터는 네트워크 계층에서 IP·라우팅 테이블로 경로를 결정한다. 게이트웨이는 서로 다른 프로토콜·형식 간 변환을 담당한다. (②는 L2 스위치도 동일한 역할)', NULL, '["라우터", "게이트웨이", "리피터", "브리지"]', 'SHORT_ANSWER', '네트워크 — 계층별 네트워크 장비', 4, 7, NULL, NULL, NULL, NULL, NULL, '각 설명에 해당하는 네트워크 장비를 <보기>에서 골라 빈칸 순서대로 쓰시오.', 12, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (158, '2026-07-13 23:12:51.845791', 1, 'N', '2026-07-15 00:33:32.382825', 1, 'Y', 'rwx / r-x / r--', NULL, '<p>다음 명령을 실행하였다. </p><p>chmod 754 test.sh </p><p><br></p><p>이때 test.sh 파일의 권한은 다음과 같다. </p><p>소유자 권한: ( ① ) 그룹 권한: ( ② ) 기타 사용자 권한: ( ③ )</p>', NULL, NULL, 'chmod의 8진수 표기는 r=4, w=2, x=1의 합이다. 7 = 4+2+1 = rwx(소유자), 5 = 4+1 = r-x(그룹), 4 = r--(기타 사용자). 따라서 test.sh의 권한은 rwxr-xr--이며, ls -l로 보면 -rwxr-xr--로 표시된다.', 'javascript', '["-wx", "rw-", "r--", "rwx", "r-x"]', 'SHORT_ANSWER', 'chmod 754 권한 해석', 1, 9, NULL, NULL, NULL, NULL, NULL, '다음은 리눅스 파일 권한에 관한 설명이다. 괄호 안에 들어갈 권한을 보기에서 골라 ①~③ 순서대로 쓰시오. (콤마로 구분, 보기 번호 또는 rwx 기호로 답하시오)', 7, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (202, '2026-07-15 00:01:05.666453', 1, 'N', '2026-07-15 00:33:32.477825', 1, 'Y', 'RIP / OSPF / BGP / EIGRP', NULL, '<p><br></p><ol><li>거리 벡터 방식이며 홉 수를 경로 선택 기준으로 사용하고 최대 홉 수가 제한된다.</li><li>링크 상태 방식이며 다익스트라 알고리즘을 이용해 최단 경로를 계산한다.</li><li>자율 시스템 간 경로 정보를 교환하는 외부 게이트웨이 프로토콜이다.</li><li>거리 벡터와 링크 상태 방식의 특성을 함께 가지며 복합 메트릭을 사용할 수 있다.</li></ol>', NULL, NULL, 'RIP은 거리 벡터·홉 수 기준(최대 15홉)이다. OSPF는 링크 상태·다익스트라 기반 최단 경로 프로토콜이다. BGP는 AS 간 경로를 교환하는 외부 게이트웨이 프로토콜(EGP)이다. EIGRP는 거리 벡터와 링크 상태 특성을 결합한 하이브리드로 복합 메트릭을 사용한다.', NULL, '["BGP", "OSPF", "EIGRP", "RIP"]', 'SHORT_ANSWER', '네트워크 — 라우팅 프로토콜(RIP·OSPF·BGP·EIGRP)', 4, 7, NULL, NULL, NULL, NULL, NULL, '각 설명에 해당하는 라우팅 프로토콜을 <보기>에서 골라 빈칸 순서대로 쓰시오.', 14, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (203, '2026-07-15 00:01:05.678515', 1, 'N', '2026-07-15 00:33:32.497824', 1, 'Y', '패킷 필터링 방화벽 / 상태 기반 검사 방화벽 / 프록시 방화벽 / IDS / IPS', NULL, '<p><br></p><ol><li>출발지와 목적지 IP 주소, 포트 번호, 프로토콜 등의 헤더 정보를 기준으로 패킷을 허용하거나 차단한다.</li><li>현재 연결 상태와 세션 정보를 추적하여 패킷의 정상 여부를 판단한다.</li><li>클라이언트와 서버 사이에서 중계 역할을 수행하며 응용 계층 데이터를 검사한다.</li><li>네트워크 공격이나 이상 행위를 탐지하고 관리자에게 경고하지만 직접 차단하지는 않는다.</li><li>공격을 탐지한 후 해당 트래픽을 실시간으로 차단하거나 제거한다.</li></ol>', NULL, NULL, '패킷 필터링 방화벽은 헤더(IP·포트·프로토콜) 기반으로 허용/차단한다. 상태 기반 검사(Stateful) 방화벽은 연결·세션 상태를 추적한다. 프록시 방화벽은 중계하며 응용 계층 데이터를 검사한다. IDS는 탐지·경고만, IPS는 탐지 후 실시간 차단까지 수행한다.', NULL, '["IPS", "IDS", "상태 기반 검사 방화벽", "프록시 방화벽", "패킷 필터링 방화벽"]', 'SHORT_ANSWER', '정보보안 — 방화벽과 침입 탐지/차단', 5, 7, NULL, NULL, NULL, NULL, NULL, '각 설명에 해당하는 보안 장비 또는 기술을 <보기>에서 골라 빈칸 순서대로 쓰시오.', 5, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (204, '2026-07-15 00:01:05.691153', 1, 'N', '2026-07-15 00:33:32.513826', 1, 'Y', 'SQL Injection / XSS / CSRF / Directory Traversal / Command Injection', NULL, '<p><br></p><ol><li>입력값에 SQL 구문을 삽입하여 데이터베이스 질의를 비정상적으로 조작하는 공격이다.</li><li>웹 페이지에 악성 스크립트를 삽입하여 다른 사용자의 브라우저에서 실행되게 하는 공격이다.</li><li>인증된 사용자가 의도하지 않은 요청을 특정 서버로 전송하도록 유도하는 공격이다.</li><li>../ 등의 문자열을 이용하여 허용된 디렉터리 밖의 파일에 접근하는 공격이다.</li><li>사용자 입력값에 운영체제 명령어를 삽입하여 서버에서 실행되도록 하는 공격이다.</li></ol>', NULL, NULL, 'SQL Injection은 입력값에 SQL을 삽입해 DB 질의를 조작한다. XSS는 악성 스크립트를 삽입해 타 사용자 브라우저에서 실행시킨다. CSRF는 인증된 사용자가 의도치 않은 요청을 보내도록 유도한다. Directory Traversal은 ../ 등으로 허용 경로 밖 파일에 접근한다. Command Injection은 입력값에 OS 명령을 삽입해 서버에서 실행시킨다.', NULL, '["XSS", "Command Injection", "CSRF", "Directory Traversal", "SQL Injection"]', 'SHORT_ANSWER', '정보보안 — 웹 애플리케이션 공격 기법', 5, 7, NULL, NULL, NULL, NULL, NULL, '각 설명에 해당하는 웹 공격 기법을 <보기>에서 골라 빈칸 순서대로 쓰시오.', 6, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (198, '2026-07-15 00:01:05.621881', 1, 'N', '2026-07-15 00:33:32.529823', 1, 'Y', '개인키 / 공개키 / 무결성 / 인증 || 개인키 / 공개키 / 인증 / 무결성', NULL, '<p><br></p><p>다음은 전자서명 생성 및 검증 과정이다.</p><ul><li>송신자는 원문 메시지에 해시 함수를 적용하여 메시지 다이제스트를 생성한 후, 이를 송신자의 ( ① )로 암호화하여 전자서명을 생성한다.</li><li>수신자는 전자서명을 송신자의 ( ② )로 복호화한 값과, 수신한 원문에 동일한 해시 함수를 적용한 결과를 비교한다.</li><li>이 과정을 통해 확인할 수 있는 대표적인 보안 속성 두 가지는 ( ③ )과 ( ④ )이다.</li></ul>', NULL, NULL, '송신자는 자신의 개인키(①)로 다이제스트를 암호화해 서명하고, 수신자는 송신자의 공개키(②)로 복호화한다. 서명이 검증되면 원문이 위·변조되지 않았다는 무결성(③)과 서명자가 본인임을 보장하는 인증(④, 부인방지 포함)을 확인할 수 있다. ③·④는 순서가 바뀌어도 정답으로 인정된다.', NULL, '["기밀성", "공개키", "가용성", "무결성", "개인키", "인증"]', 'SHORT_ANSWER', '정보보안 — 전자서명 생성·검증 과정', 5, 7, NULL, NULL, NULL, NULL, NULL, '괄호 ①~④에 들어갈 내용을 <보기>에서 골라 순서대로 쓰시오. (①②는 키의 종류, ③④는 보안 속성)', 3, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (182, '2026-07-14 10:13:36.632853', 1, 'N', '2026-07-15 21:13:43.113089', 1, 'Y', 'AES / RSA / SHA-256 / Diffie-Hellman / ECC', NULL, '<p>(1) 동일한 키를 사용하여 암호화와 복호화를 수행하며, 블록 단위로 데이터를 처리한다. </p><p>(2) 큰 수의 소인수분해 어려움을 이용하는 공개키 암호화 알고리즘이다. </p><p>(3) 메시지를 고정 길이의 값으로 변환하며, 원문 복원이 불가능한 단방향 함수이다. </p><p>(4) 안전하지 않은 통신 환경에서 비밀키를 직접 전송하지 않고 공유하기 위한 키 교환 방식이다. </p><p>(5) 타원곡선 이산대수 문제를 기반으로 하며, 비교적 짧은 키 길이로 높은 보안성을 제공한다.</p>', NULL, NULL, '(1) AES — 128비트 블록 단위 대칭키(비밀키) 블록 암호. (2) RSA — 소인수분해의 어려움에 기반한 대표적 공개키 암호. (3) SHA-256 — 256비트 고정 길이 해시를 만드는 단방향 해시 함수(복호화 개념 없음). (4) Diffie-Hellman — 이산대수 문제 기반으로 키 자체를 전송하지 않고 공통 비밀키를 합의하는 키 교환 프로토콜. (5) ECC — 타원곡선 이산대수 문제 기반 공개키 방식으로 RSA보다 짧은 키로 동등한 보안 강도를 제공(모바일·IoT에 적합).', 'javascript', '["RSA", "SHA-256", "Diffie-Hellman", "ECC", "AES"]', 'SHORT_ANSWER', '암호화 방식·알고리즘 보기 매칭', 5, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 암호화 방식 또는 알고리즘을 보기에서 골라 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (189, '2026-07-14 13:50:28.306346', 1, 'N', '2026-07-15 21:49:52.886092', 1, 'Y', 'JOIN, ON, JOIN, ON, JOIN, ON, ASC, ASC || INNER JOIN, ON, INNER JOIN, ON, INNER JOIN, ON, ASC, ASC', 'SELECT D.DEPT_NAME,
       E.EMP_NAME,
       P.PROJECT_NAME
FROM EMPLOYEE E
( 1 ) DEPARTMENT D
    ( 2 ) E.DEPT_ID = D.DEPT_ID
( 3 ) PROJECT_MEMBER PM
    ( 4 ) E.EMP_ID = PM.EMP_ID
( 5 ) PROJECT P
    ( 6 ) PM.PROJECT_ID = P.PROJECT_ID
ORDER BY D.DEPT_NAME ( 7 ),
         P.PROJECT_NAME ( 8 );', '<p>[EMPLOYEE] EMP_ID(사원번호), EMP_NAME(사원명), DEPT_ID(부서번호) </p><p>[DEPARTMENT] DEPT_ID(부서번호), DEPT_NAME(부서명) </p><p>[PROJECT_MEMBER] PROJECT_ID(프로젝트번호), EMP_ID(참여 사원번호) </p><p>[PROJECT] PROJECT_ID(프로젝트번호), PROJECT_NAME(프로젝트명)</p><p><br></p><h3>조건</h3><ul><li>프로젝트에 참여한 사원만 조회한다.</li><li>부서명 오름차순, 프로젝트명 오름차순으로 정렬한다.</li><li>ANSI JOIN 문법을 사용한다.</li></ul><p><br></p>', NULL, NULL, '''프로젝트에 참여한 사원만'' → 교집합만 남기는 내부 조인(INNER JOIN, 줄여서 JOIN)이다. ①③⑤ JOIN(=INNER JOIN), ②④⑥ ON(조인 조건), ⑦⑧ ASC(오름차순, 생략 시 기본값이지만 명시). PROJECT_MEMBER를 매개로 EMPLOYEE와 PROJECT를 연결하는 다대다 관계 조인이며, LEFT JOIN을 쓰면 참여하지 않은 사원까지 나오므로 조건에 맞지 않는다.', 'sql', NULL, 'SHORT_ANSWER', '다중 테이블 ANSI JOIN', 2, 7, NULL, NULL, NULL, NULL, NULL, '다음 SQL문의 빈칸에 들어갈 내용을 번호 순서대로 콤마로 구분해 쓰시오. (대소문자 무시, 한 줄로 입력해도 됩니다)', 4, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (151, '2026-07-13 23:03:32.195471', 1, 'N', '2026-07-15 22:01:23.409847', 1, 'Y', '1, 1, 2, 2, 2', NULL, '<p>1. 사용자는 공연 날짜와 좌석을 선택하여 예매할 수 있어야 한다. </p><p>2. 예매 완료 후 사용자에게 예매 번호를 발급해야 한다. </p><p>3. 좌석 조회 결과는 2초 이내에 화면에 표시되어야 한다. </p><p>4. 결제 정보는 외부에 노출되지 않도록 암호화해야 한다. </p><p>5. 서비스는 하루 24시간 중 최소 23시간 50분 이상 정상 운영되어야 한다.</p>', NULL, NULL, '1. 날짜·좌석 선택 예매 — 시스템이 제공할 기능이므로 기능적. 2. 예매 번호 발급 — 처리 결과 출력이라는 동작이므로 기능적. 3. 2초 이내 표시 — 응답 시간이라는 수치 품질 조건이므로 비기능적(성능). 4. 결제 정보 암호화 — 데이터 보호 제약이므로 비기능적(보안). 5. 하루 23시간 50분 이상 운영 — 가동 시간 조건이므로 비기능적(가용성). 판별 요령: 사용자·시스템의 동작과 처리 결과를 서술하면 기능적, 시간·비율·보호 수준 같은 품질 조건이면 비기능적이다.', 'javascript', '["기능적", "비기능적"]', 'SHORT_ANSWER', '예매 시스템 요구사항 기능/비기능 구분', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음은 온라인 예매 시스템의 요구사항이다. 각 요구사항이 기능적 요구사항인지 비기능적 요구사항인지 보기에서 골라 1번~5번 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 되며 같은 보기를 여러 번 쓸 수 있습니다)', 25, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (152, '2026-07-13 23:08:30.964979', 1, 'N', '2026-07-15 22:02:10.963716', 1, 'Y', '1', NULL, '<p>비트 지향 동기식 데이터 링크 제어 프로토콜로, 점대점 및 다중점 통신을 지원하며, 프레임의 시작과 끝을 나타내기 위해 플래그 필드 01111110을 사용한다.</p>', NULL, NULL, 'HDLC(High-level Data Link Control)는 비트 지향(bit-oriented) 동기식 데이터 링크 제어 프로토콜로, 점대점·다중점 링크를 모두 지원하고 프레임 경계를 플래그(01111110)로 구분한다. 데이터 투명성을 위해 비트 스터핑(5개 연속 1 뒤에 0 삽입)을 사용한다. 비교: BSC는 문자 지향 프로토콜, SDLC는 IBM이 만든 HDLC의 전신, PPP는 HDLC 프레임 구조를 차용한 인터넷 접속용 프로토콜이다.', 'javascript', '["HDLC", "BSC", "PPP", "SDLC"]', 'SHORT_ANSWER', '데이터 링크 제어 프로토콜 — HDLC', 4, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 데이터 링크 제어 프로토콜을 보기에서 골라 쓰시오. (번호 또는 보기 텍스트로 답하시오)', 6, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (140, '2026-07-13 22:31:45.592618', 1, 'N', '2026-07-15 22:16:15.519466', 1, 'Y', '1, 4, 5, 6, 3', NULL, '<p>(1) 호환되지 않는 인터페이스를 가진 클래스들이 함께 동작할 수 있도록 인터페이스를 변환하는 패턴이다. </p><p>(2) 객체에 동적으로 새로운 기능을 추가할 수 있도록 객체를 감싸는 패턴이다. </p><p>(3) 복잡한 서브시스템에 대해 단순하고 통합된 인터페이스를 제공하는 패턴이다. </p><p>(4) 실제 객체에 대한 접근을 제어하기 위해 대리 객체를 사용하는 패턴이다. </p><p>(5) 개별 객체와 복합 객체를 동일한 방식으로 다룰 수 있도록 트리 구조로 구성하는 패턴이다.</p>', NULL, NULL, '(1) Adapter — 호환되지 않는 인터페이스를 변환해 클래스들을 함께 동작시킨다. (2) Decorator — 객체를 감싸(wrapping) 동적으로 기능을 추가한다. (3) Facade — 복잡한 서브시스템에 단순·통합된 창구 인터페이스를 제공한다. (4) Proxy — 실제 객체에 대한 접근을 대리 객체로 제어한다(지연 로딩, 접근 제어, 캐싱 등). (5) Composite — 개별 객체(Leaf)와 복합 객체(Composite)를 동일한 인터페이스로 다루는 트리 구조를 구성한다. 남은 보기 Bridge는 추상화와 구현을 분리해 각각 독립적으로 확장할 수 있게 하는 패턴이다. 모두 구조(Structural) 패턴에 속한다.', 'javascript', '["Adapter", "Bridge", "Composite", "Decorator", "Facade", "Proxy"]', 'SHORT_ANSWER', '구조 디자인 패턴 보기 매칭', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 설명에 해당하는 디자인 패턴을 보기에서 골라 순서대로 쓰시오. (콤마로 구분, 보기 번호로 답해도 됩니다)', 14, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (146, '2026-07-13 22:48:24.796011', 1, 'N', '2026-07-15 23:02:42.954126', 1, 'Y', '1, 5, 6', NULL, '<p>회원 관리 모듈에 다음 기능이 모두 포함되어 있다. </p><p>- 회원 가입 처리 - 회원 탈퇴 처리 - 로그 파일 삭제 - 시스템 날짜 출력 - 데이터베이스 연결 종료 </p><p><br></p><p>(1) 위 모듈의 응집도가 낮다고 판단할 수 있는 이유를 간단히 쓰시오. (채점 제외 — 해설 참고) </p><p>(2) 위 모듈에 가장 가까운 응집도의 종류를 쓰시오. </p><p>(3) 일반적으로 좋은 모듈 설계를 위해서는 결합도는 ( ① )게 하고, 응집도는 ( ② )게 해야 한다. </p><p>괄호 안에 들어갈 말을 쓰시오.</p>', NULL, NULL, '(1) 회원 가입·탈퇴는 회원 관리라는 목적에 부합하지만, 로그 파일 삭제·시스템 날짜 출력·DB 연결 종료는 회원 관리와 기능적 관련성이 없다. 서로 무관한 기능들이 한 모듈에 임의로 모여 있으므로 응집도가 낮다. (2) 우연적(Coincidental) 응집도 — 구성 요소들이 특별한 관련성 없이 모여 있는, 가장 낮은 응집도이다. (3) 좋은 모듈 설계의 원칙은 결합도는 ① 낮게(모듈 간 의존 최소화), 응집도는 ② 높게(모듈 내 요소들이 단일 목적에 집중)이다. 개선 방향: 회원 가입·탈퇴만 회원 관리 모듈에 남기고, 로그 관리·시스템 유틸리티·DB 연결 관리는 각각 별도 모듈로 분리한다.', 'javascript', '["우연적 응집도", "논리적 응집도", "시간적 응집도", "절차적 응집도", "낮", "높"]', 'SHORT_ANSWER', '낮은 응집도 사례 분석과 모듈 설계 원칙', 30, 7, NULL, NULL, NULL, NULL, NULL, '다음 사례를 읽고 물음에 답하시오. 답안은 (2)의 응집도 종류, (3)의 ①, ② 순서로 3개를 콤마로 구분해 쓰시오. (보기 번호로 답해도 됩니다. (1)은 채점에 포함되지 않으니 스스로 답해본 뒤 해설과 비교하세요.)', 20, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (209, '2026-07-16 10:57:38.679825', 1, 'N', '2026-07-16 10:57:38.679825', 1, 'Y', '물리 계층, 데이터 링크 계층, 네트워크 계층, 응용 계층, 표현 계층', NULL, '다음 네트워크 장애 상황을 읽고, 문제가 발생한 OSI 계층을 순서대로 쓰시오.
① 랜 케이블이 끊어져 신호 자체가 전달되지 않는다.
② 스위치의 MAC 주소 테이블 오류로 프레임이 잘못 전달된다.
③ 라우터의 라우팅 테이블 오류로 목적지 네트워크에 도달하지 못한다.
④ TCP 연결은 정상적으로 수립되지만 웹 서버가 HTTP 요청에 응답하지 않는다.
⑤ 송수신 시스템 간 문자 인코딩 방식이 달라 데이터가 깨져 보인다.', NULL, NULL, '①물리 ②데이터 링크 ③네트워크 ④응용 ⑤표현 계층.', NULL, '["응용 계층", "표현 계층", "세션 계층", "전송 계층", "네트워크 계층", "데이터 링크 계층", "물리 계층"]', 'SHORT_ANSWER', 'OSI 7계층 - 네트워크 장애 원인 계층 분석', 4, 7, NULL, NULL, NULL, NULL, NULL, NULL, 19, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (207, '2026-07-16 10:57:38.640493', 1, 'N', '2026-07-16 11:13:23.147443', 1, 'Y', '세그먼트, 패킷, 프레임, 비트', NULL, '다음은 OSI 7계층에서 사용하는 데이터 전송 단위(PDU)에 관한 설명이다. 괄호 안에 들어갈 알맞은 용어를 순서대로 쓰시오.
전송 계층의 데이터 단위: ( ① )
네트워크 계층의 데이터 단위: ( ② )
데이터 링크 계층의 데이터 단위: ( ③ )
물리 계층의 데이터 단위: ( ④ )
[보기] 비트 / 프레임 / 패킷 / 세그먼트 / 메시지', NULL, NULL, '전송=세그먼트, 네트워크=패킷, 데이터 링크=프레임, 물리=비트.', NULL, '["비트", "프레임", "패킷", "세그먼트", "메시지"]', 'SHORT_ANSWER', 'OSI 7계층 - 데이터 전송 단위(PDU) 구분', 4, 7, NULL, NULL, NULL, NULL, NULL, NULL, 20, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (210, '2026-07-16 16:56:40.108514', 1, 'N', '2026-07-16 16:56:40.108514', 1, 'Y', '(x=1, y=5), (x=-1, y=15) || (x=1, y=15), (x=-1, y=5)', NULL, '다음 프로그램의 조건식은 두 개의 개별 조건으로 구성되어 있다.
if (x > 0 && y < 10) {
    result = 1;
} else {
    result = 0;
}
조건 커버리지를 만족시키려면 개별 조건 x > 0과 y < 10이 각각 참과 거짓을 최소 한 번 이상 가져야 한다.
조건 커버리지를 만족하는 최소 테스트 데이터 조합을 고르시오.', NULL, NULL, '조건 커버리지는 개별 조건 x>0, y<10이 각각 참·거짓을 모두 가져야 한다. (x=1,y=5)+(x=-1,y=15) 또는 (x=1,y=15)+(x=-1,y=5) 모두 이를 만족하므로 둘 다 정답.', NULL, '["(x=1, y=5), (x=2, y=7)", "(x=-1, y=15), (x=-2, y=20)", "(x=1, y=5), (x=-1, y=15)", "(x=1, y=15), (x=-1, y=5)"]', 'MULTIPLE_CHOICE', '소프트웨어 테스트 - 조건 커버리지 테스트 데이터 선택', 30, 7, NULL, NULL, NULL, NULL, NULL, NULL, 28, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (213, '2026-07-16 16:56:40.156867', 1, 'N', '2026-07-16 16:56:40.156867', 1, 'Y', '스텁, 드라이버, 하향식 통합 테스트, 스텁', NULL, '다음 설명에서 괄호 안에 들어갈 알맞은 용어를 보기에서 골라 순서대로(①②③④) 쓰시오.
1) 하향식 통합 테스트에서는 아직 개발되지 않은 하위 모듈의 기능을 대신 수행하는 임시 모듈인 ( ① )을 사용한다.
2) 상향식 통합 테스트에서는 아직 개발되지 않은 상위 모듈을 대신하여 하위 모듈을 호출하고 결과를 확인하는 ( ② )를 사용한다.
다음 상황에서 사용하는 통합 테스트 방식( ③ )과 임시 모듈( ④ )을 쓰시오.
- 메인 제어 모듈은 완성되어 있으나, 하위의 결제 모듈과 배송 모듈은 아직 개발되지 않았다.
- 메인 제어 모듈부터 아래 방향으로 통합 테스트를 수행한다.', NULL, NULL, '① 하향식에서 하위 모듈 대역=스텁, ② 상향식에서 상위 모듈 대역=드라이버, ③ 메인부터 아래로=하향식 통합 테스트, ④ 미개발 하위 모듈 대역=스텁.', NULL, '["드라이버", "상향식 통합 테스트", "스텁", "하향식 통합 테스트"]', 'SHORT_ANSWER', '소프트웨어 통합 테스트 - 스텁과 드라이버', 30, 7, NULL, NULL, NULL, NULL, NULL, NULL, 31, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (211, '2026-07-16 16:56:40.128786', 1, 'N', '2026-07-16 23:47:10.647791', 1, 'Y', '(a=10, b=5), (a=5, b=1)', NULL, '다음 프로그램에 대해 결정 커버리지를 만족시키는 최소 테스트 데이터 조합을 고르시오. 각 항목은 (a, b) 값이다.
public class Main {
    static int check(int a, int b) {
        if (a >= 10 || b == 0) {
            return 1;
        }
        return 0;
    }
}
[조건] 전체 결정식 (a >= 10 || b == 0)의 결과가 참과 거짓을 각각 최소 한 번 이상 가져야 한다.', NULL, NULL, '결정 커버리지는 전체 결정식이 참·거짓을 모두 가져야 한다. (a=10,b=5)→a>=10 참→결정 참, (a=5,b=1)→둘 다 거짓→결정 거짓. 나머지 조합은 결정식이 참 또는 거짓 한쪽만 나온다.', NULL, '["(a=10, b=5), (a=12, b=0)", "(a=5, b=1), (a=5, b=3)", "(a=10, b=5), (a=5, b=1)", "(a=5, b=0), (a=8, b=0)"]', 'MULTIPLE_CHOICE', '소프트웨어 테스트 - 결정 커버리지 테스트 데이터', 30, 7, NULL, NULL, NULL, NULL, NULL, NULL, 34, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (225, '2026-07-16 23:59:34.273479', 1, 'N', '2026-07-16 23:59:34.273479', 1, 'Y', '4 5 9
13', '#include <stdio.h>
int main(void) {
    int data[3][3] = {
        {1, 2, 3},
        {4, 5, 6},
        {7, 8, 9}
    };
    int (*p)[3] = data;
    *(*(p + 1) + 2) += *(*(p + 2) + 0);
    *(*(p + 2) + 1) = *(*(p + 1) + 1) + *(*(p + 0) + 2);
    *(*(p + 0) + 0) = *(*(p + 2) + 1) - *(*(p + 1) + 0);
    for (int i = 0; i < 3; i++) {
        printf("%d ", data[i][i]);
    }
    printf("\n%d\n", *(*(p + 1) + 2));
    return 0;
}', '다음 프로그램의 실행 결과를 정확히 쓰시오.', NULL, NULL, '포인터 연산으로 data[1][2]=6+7=13, data[2][1]=5+3=8, data[0][0]=8-4=4로 변경. 대각선 data[i][i]=4,5,9. 마지막 data[1][2]=13.', 'c', NULL, 'CODE', '소스코드 실행결과 - C 2차원 배열과 포인터 연산', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 22, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (226, '2026-07-16 23:59:34.28689', 1, 'N', '2026-07-16 23:59:34.28689', 1, 'Y', 'CDDE
DATA
TEET
TEET', '#include <stdio.h>
#include <string.h>
int main(void) {
    char a[] = "CODE";
    char b[] = "DATA";
    char c[] = "TEST";
    char *word[] = {a, b, c};
    char **p = word;
    p[0][1] = p[1][0];
    *(p + 1) = c;
    p[2][2] = p[0][3];
    printf("%s\n", a);
    printf("%s\n", b);
    printf("%s\n", c);
    printf("%s\n", p[1]);
    return 0;
}', '다음 프로그램의 실행 결과를 정확히 쓰시오.', NULL, NULL, 'a[1]=b[0]=''D''→a="CDDE". word[1]=c(포인터만 변경, b 배열은 "DATA" 유지). c[2]=a[3]=''E''→c="TEET". p[1]은 이제 c를 가리켜 "TEET".', 'c', NULL, 'CODE', '소스코드 실행결과 - C 포인터 배열과 문자열 변경', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 23, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (227, '2026-07-16 23:59:34.300138', 1, 'N', '2026-07-16 23:59:34.300138', 1, 'Y', '39
56', '#include <stdio.h>
int main(void) {
    unsigned int x = 0x5A;
    unsigned int mask = 0x0F;
    unsigned int result;
    result = ((x & mask) << 2)
           ^ ((x >> 4) | 3);
    result &= ~(1u << 3);
    result |= (result & 1u) << 5;
    printf("%u\n", result);
    printf("%u\n", result ^ 0x1F);
    return 0;
}', '다음 프로그램의 실행 결과를 정확히 쓰시오.', NULL, NULL, '(0x5A&0x0F)<<2=40, (0x5A>>4)|3=7, 40^7=47. 비트3 클리어→39, |=(39&1)<<5=32(이미 세팅)→39. 39^0x1F=56.', 'c', NULL, 'CODE', '소스코드 실행결과 - C 비트 마스크와 조건 연산', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 24, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (228, '2026-07-16 23:59:34.311029', 1, 'N', '2026-07-16 23:59:34.311029', 1, 'Y', '22 4', '#include <stdio.h>
int trace(int n, int *value) {
    if (n == 0) {
        return *value;
    }
    *value += n;
    int result = trace(n - 1, value);
    *value -= 1;
    return result + *value;
}
int main(void) {
    int value = 1;
    int result = trace(3, &value);
    printf("%d %d\n", result, value);
    return 0;
}', '다음 프로그램의 실행 결과를 정확히 쓰시오.', NULL, NULL, 'value(공유): 1→4→6→7, trace(0)=7 반환. 되돌아오며 value 6·5·4로 감소, 반환값 7+6=13, 13+5=18, 18+4=22. 최종 result=22, value=4.', 'c', NULL, 'CODE', '소스코드 실행결과 - C 재귀 호출과 호출 후 연산', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 25, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (212, '2026-07-16 16:56:40.143357', 1, 'N', '2026-07-16 16:57:44.368498', 1, 'Y', '(age=25, hasLicense=1), (age=15, hasLicense=0)', NULL, '다음 조건식에 대해 조건·결정 커버리지를 만족시키는 최소 테스트 데이터 조합을 고르시오. 각 항목은 (age, hasLicense) 값이다.
if (age >= 20 && hasLicense == 1) {
    printf("PASS");
} else {
    printf("FAIL");
}
[조건]
- 개별 조건 age >= 20과 hasLicense == 1이 각각 참·거짓을 최소 한 번 이상 가져야 한다.
- 전체 결정식의 결과도 참·거짓을 최소 한 번 이상 가져야 한다.', NULL, NULL, '(age=25, hasLicense=1)→age>=20 참·hasLicense 참→결정 참, (age=15, hasLicense=0)→둘 다 거짓→결정 거짓. 개별 조건·전체 결정식 모두 참·거짓을 최소 테스트로 만족한다.', NULL, '["(age=25, hasLicense=0), (age=15, hasLicense=1)", "(age=25, hasLicense=1), (age=25, hasLicense=0)", "(age=25, hasLicense=1), (age=15, hasLicense=0)", "(age=15, hasLicense=1), (age=15, hasLicense=0)"]', 'MULTIPLE_CHOICE', '소프트웨어 테스트 - 조건·결정 커버리지 데이터 선택', 30, 7, NULL, NULL, NULL, NULL, NULL, NULL, 33, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (214, '2026-07-16 16:56:40.172949', 1, 'N', '2026-07-16 23:47:10.670496', 1, 'Y', '참 오라클, 샘플링 오라클, 휴리스틱 오라클, 일관성 검사 오라클', NULL, '다음 각 설명에 해당하는 테스트 오라클의 종류를 보기에서 골라 순서대로(①②③④) 쓰시오.
① 모든 입력값에 대해 기대되는 정확한 결과를 미리 알고 비교하는 방식이다.
② 일부 입력값에 대해서만 정확한 결과를 확인하고, 나머지는 별도의 방법으로 판단하는 방식이다.
③ 이전 버전이나 유사한 시스템의 결과를 이용하여 새로운 결과가 타당한지 판단하는 방식이다.
④ 애플리케이션을 변경한 전후의 결과가 서로 일관성을 유지하는지 검사하는 방식이다.', NULL, NULL, '① 모든 입력 정확 비교=참 오라클, ② 일부만 확인=샘플링 오라클, ③ 이전/유사 시스템 결과로 타당성 판단=휴리스틱 오라클, ④ 변경 전후 일관성=일관성 검사 오라클.', NULL, '["휴리스틱 오라클", "참 오라클", "일관성 검사 오라클", "샘플링 오라클"]', 'SHORT_ANSWER', '소프트웨어 테스트 - 테스트 오라클 종류', 30, 7, NULL, NULL, NULL, NULL, NULL, NULL, 35, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (215, '2026-07-16 23:52:47.99337', 1, 'N', '2026-07-16 23:52:47.99337', 1, 'Y', 'C1 | C2 | C3
5 | 4 | 3', NULL, '다음 SELECT문의 실행 결과를 쓰시오.
SELECT COUNT(*) AS C1,
       COUNT(DEPT_ID) AS C2,
       COUNT(BONUS) AS C3
FROM EMPLOYEE;', NULL, NULL, 'COUNT(*)=전체 행 수=5. COUNT(DEPT_ID)=NULL 제외=4. COUNT(BONUS)=NULL 제외=3.', NULL, NULL, 'SQL', 'SQL 실행결과 - COUNT(*)와 COUNT(칼럼)', 2, 7, NULL, NULL, NULL, NULL, NULL, NULL, 12, '{"tables": [{"name": "EMPLOYEE", "rows": [["1", "김민수", "D1", "500"], ["2", "이서연", "D1", "NULL"], ["3", "박준호", "D2", "300"], ["4", "최유진", "NULL", "NULL"], ["5", "정하늘", "D2", "200"]], "columns": [{"name": "EMP_ID", "dataType": "INT", "primaryKey": true}, {"name": "EMP_NAME", "dataType": "VARCHAR(20)", "primaryKey": false}, {"name": "DEPT_ID", "dataType": "CHAR(2)", "primaryKey": false}, {"name": "BONUS", "dataType": "INT", "primaryKey": false}]}], "expectedResult": {"rows": [["5", "4", "3"]], "columns": ["C1", "C2", "C3"], "orderedRows": false}}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (216, '2026-07-16 23:52:48.011608', 1, 'N', '2026-07-16 23:52:48.011608', 1, 'Y', 'PRODUCT_ID | FINAL_PRICE
P3 | 1300', NULL, '다음 SELECT문의 실행 결과로 출력되는 모든 행을 쓰시오.
SELECT PRODUCT_ID,
       PRICE - DISCOUNT AS FINAL_PRICE
FROM PRODUCT
WHERE PRICE - DISCOUNT >= 1300
ORDER BY PRODUCT_ID;', NULL, NULL, 'NULL과의 산술 연산 결과는 NULL이므로 P2·P4는 조건에서 제외(UNKNOWN). P1=900<1300 제외. P3=1300>=1300 → 출력.', NULL, NULL, 'SQL', 'SQL 실행결과 - NULL과 산술 연산', 2, 7, NULL, NULL, NULL, NULL, NULL, NULL, 13, '{"tables": [{"name": "PRODUCT", "rows": [["P1", "1000", "100"], ["P2", "2000", "NULL"], ["P3", "1500", "200"], ["P4", "3000", "NULL"]], "columns": [{"name": "PRODUCT_ID", "dataType": "CHAR(2)", "primaryKey": true}, {"name": "PRICE", "dataType": "INT", "primaryKey": false}, {"name": "DISCOUNT", "dataType": "INT", "primaryKey": false}]}], "expectedResult": {"rows": [["P3", "1300"]], "columns": ["PRODUCT_ID", "FINAL_PRICE"], "orderedRows": false}}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (217, '2026-07-16 23:52:48.028906', 1, 'N', '2026-07-16 23:52:48.028906', 1, 'Y', '없음 || 결과 없음 || 0행 || 아무 행도 출력되지 않음 || 빈 결과', NULL, '다음 SELECT문의 실행 결과를 쓰시오. (결과가 없으면 ''없음''이라고 쓰시오.)
SELECT MEMBER_NAME
FROM MEMBER
WHERE EMAIL = NULL
ORDER BY MEMBER_ID;', NULL, NULL, '''= NULL''은 항상 UNKNOWN이라 어떤 행도 참이 되지 않는다(NULL 비교는 IS NULL을 써야 함). 따라서 출력 결과가 없다.', NULL, NULL, 'SQL', 'SQL 실행결과 - NULL 비교 조건 (= NULL)', 2, 7, NULL, NULL, NULL, NULL, NULL, NULL, 14, '{"tables": [{"name": "MEMBER", "rows": [["1", "김하나", "hana@test.com"], ["2", "이둘", "NULL"], ["3", "박셋", "set@test.com"], ["4", "최넷", "NULL"]], "columns": [{"name": "MEMBER_ID", "dataType": "INT", "primaryKey": true}, {"name": "MEMBER_NAME", "dataType": "VARCHAR(20)", "primaryKey": false}, {"name": "EMAIL", "dataType": "VARCHAR(50)", "primaryKey": false}]}], "expectedResult": null}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (218, '2026-07-16 23:52:48.04144', 1, 'N', '2026-07-16 23:52:48.04144', 1, 'Y', 'COLOR_NAME | SIZE_NAME
BLUE | L
BLUE | M
BLUE | S
RED | L
RED | M
RED | S', NULL, '다음 SELECT문의 실행 결과 행을 모두 쓰시오. (행 개수: 6)
SELECT C.COLOR_NAME,
       S.SIZE_NAME
FROM COLOR C
CROSS JOIN SIZE_INFO S
ORDER BY C.COLOR_NAME, S.SIZE_NAME;', NULL, NULL, 'CROSS JOIN은 두 테이블의 곱집합 → 2×3=6행. ORDER BY로 COLOR_NAME(BLUE<RED), SIZE_NAME(L<M<S) 정렬.', NULL, NULL, 'SQL', 'SQL 실행결과 - CROSS JOIN', 2, 7, NULL, NULL, NULL, NULL, NULL, NULL, 15, '{"tables": [{"name": "COLOR", "rows": [["RED"], ["BLUE"]], "columns": [{"name": "COLOR_NAME", "dataType": "VARCHAR(10)", "primaryKey": true}]}, {"name": "SIZE_INFO", "rows": [["S"], ["M"], ["L"]], "columns": [{"name": "SIZE_NAME", "dataType": "VARCHAR(10)", "primaryKey": true}]}], "expectedResult": {"rows": [["BLUE", "L"], ["BLUE", "M"], ["BLUE", "S"], ["RED", "L"], ["RED", "M"], ["RED", "S"]], "columns": ["COLOR_NAME", "SIZE_NAME"], "orderedRows": true}}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (219, '2026-07-16 23:52:48.057694', 1, 'N', '2026-07-16 23:52:48.057694', 1, 'Y', 'STUDENT_NAME
김민수
김민수
이서연
이서연', NULL, '다음 SELECT문의 실행 결과로 출력되는 값을 순서대로 모두 쓰시오.
SELECT S.STUDENT_NAME
FROM STUDENT S
JOIN ENROLLMENT E
  ON S.STUDENT_ID = E.STUDENT_ID
ORDER BY S.STUDENT_NAME;', NULL, NULL, 'INNER JOIN이라 수강 이력 없는 박준호는 제외. 김민수(C1,C2)·이서연(C1,C3) 각 2행씩 → 중복 포함 4행.', NULL, NULL, 'SQL', 'SQL 실행결과 - INNER JOIN과 중복 행', 2, 7, NULL, NULL, NULL, NULL, NULL, NULL, 16, '{"tables": [{"name": "STUDENT", "rows": [["1", "김민수"], ["2", "이서연"], ["3", "박준호"]], "columns": [{"name": "STUDENT_ID", "dataType": "INT", "primaryKey": true}, {"name": "STUDENT_NAME", "dataType": "VARCHAR(20)", "primaryKey": false}]}, {"name": "ENROLLMENT", "rows": [["1", "C1"], ["1", "C2"], ["2", "C1"], ["2", "C3"]], "columns": [{"name": "STUDENT_ID", "dataType": "INT", "primaryKey": true}, {"name": "COURSE_ID", "dataType": "CHAR(2)", "primaryKey": true}]}], "expectedResult": {"rows": [["김민수"], ["김민수"], ["이서연"], ["이서연"]], "columns": ["STUDENT_NAME"], "orderedRows": true}}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (220, '2026-07-16 23:52:48.070503', 1, 'N', '2026-07-16 23:52:48.070503', 1, 'Y', 'DEPT_NAME | CNT
개발 | 2
영업 | 1
인사 | 1', NULL, '다음 SELECT문의 결과 릴레이션을 작성하시오.
SELECT D.DEPT_NAME,
       COUNT(*) AS CNT
FROM EMPLOYEE E
JOIN DEPARTMENT D ON E.DEPT_ID = D.DEPT_ID
JOIN PROJECT_MEMBER P ON E.EMP_ID = P.EMP_ID
GROUP BY D.DEPT_NAME
ORDER BY D.DEPT_NAME;', NULL, NULL, 'PROJECT_MEMBER와 조인되는 사원만 집계. EMP1(개발)이 P1·P2 2건 → 개발 2, EMP3(인사) 1, EMP4(영업) 1. EMP2는 프로젝트 없어 제외. ORDER BY로 개발<영업<인사.', NULL, NULL, 'SQL', 'SQL 실행결과 - 다중 테이블 조인과 GROUP BY', 2, 7, NULL, NULL, NULL, NULL, NULL, NULL, 17, '{"tables": [{"name": "EMPLOYEE", "rows": [["1", "김민수", "D1"], ["2", "이서연", "D1"], ["3", "박준호", "D2"], ["4", "최유진", "D3"]], "columns": [{"name": "EMP_ID", "dataType": "INT", "primaryKey": true}, {"name": "EMP_NAME", "dataType": "VARCHAR(20)", "primaryKey": false}, {"name": "DEPT_ID", "dataType": "CHAR(2)", "primaryKey": false}]}, {"name": "DEPARTMENT", "rows": [["D1", "개발"], ["D2", "인사"], ["D3", "영업"]], "columns": [{"name": "DEPT_ID", "dataType": "CHAR(2)", "primaryKey": true}, {"name": "DEPT_NAME", "dataType": "VARCHAR(20)", "primaryKey": false}]}, {"name": "PROJECT_MEMBER", "rows": [["1", "P1"], ["1", "P2"], ["3", "P1"], ["4", "P3"]], "columns": [{"name": "EMP_ID", "dataType": "INT", "primaryKey": true}, {"name": "PROJECT_ID", "dataType": "CHAR(2)", "primaryKey": true}]}], "expectedResult": {"rows": [["개발", "2"], ["영업", "1"], ["인사", "1"]], "columns": ["DEPT_NAME", "CNT"], "orderedRows": true}}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (221, '2026-07-16 23:52:48.084126', 1, 'N', '2026-07-16 23:52:48.084126', 1, 'Y', 'CUSTOMER_NAME | ORDER_COUNT
김고객 | 2
박고객 | 0
이고객 | 1
최객 | 2', NULL, '다음 SELECT문의 결과 릴레이션을 작성하시오.
SELECT C.CUSTOMER_NAME,
       COUNT(O.ORDER_ID) AS ORDER_COUNT
FROM CUSTOMER C
LEFT JOIN ORDERS O ON C.CUSTOMER_ID = O.CUSTOMER_ID
GROUP BY C.CUSTOMER_NAME
ORDER BY C.CUSTOMER_NAME;', NULL, NULL, 'LEFT JOIN이라 주문 없는 박고객도 포함되며 COUNT(O.ORDER_ID)는 NULL을 세지 않아 0. 김고객2·이고객1·최객2. ORDER BY로 김<박<이<최.', NULL, NULL, 'SQL', 'SQL 실행결과 - LEFT OUTER JOIN과 COUNT', 2, 7, NULL, NULL, NULL, NULL, NULL, NULL, 18, '{"tables": [{"name": "CUSTOMER", "rows": [["1", "김고객"], ["2", "이고객"], ["3", "박고객"], ["4", "최객"]], "columns": [{"name": "CUSTOMER_ID", "dataType": "INT", "primaryKey": true}, {"name": "CUSTOMER_NAME", "dataType": "VARCHAR(20)", "primaryKey": false}]}, {"name": "ORDERS", "rows": [["101", "1"], ["102", "1"], ["103", "2"], ["104", "4"], ["105", "4"]], "columns": [{"name": "ORDER_ID", "dataType": "INT", "primaryKey": true}, {"name": "CUSTOMER_ID", "dataType": "INT", "primaryKey": false}]}], "expectedResult": {"rows": [["김고객", "2"], ["박고객", "0"], ["이고객", "1"], ["최객", "2"]], "columns": ["CUSTOMER_NAME", "ORDER_COUNT"], "orderedRows": true}}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (222, '2026-07-16 23:52:48.096173', 1, 'N', '2026-07-16 23:52:48.096173', 1, 'Y', 'EMP_NAME | SALARY
이서연 | 6000
정하늘 | 4500', NULL, '다음 SELECT문의 실행 결과로 출력되는 모든 행을 쓰시오.
SELECT E.EMP_NAME, E.SALARY
FROM EMPLOYEE E
WHERE E.SALARY > (
    SELECT AVG(X.SALARY)
    FROM EMPLOYEE X
    WHERE X.DEPT_ID = E.DEPT_ID
)
ORDER BY E.EMP_ID;', NULL, NULL, '부서 평균: D1=5000, D2=3750, D3=7000. 평균 초과: 이서연(6000>5000), 정하늘(4500>3750). 나머지는 평균 이하.', NULL, NULL, 'SQL', 'SQL 실행결과 - 상관 서브쿼리(부서 평균 초과)', 2, 7, NULL, NULL, NULL, NULL, NULL, NULL, 19, '{"tables": [{"name": "EMPLOYEE", "rows": [["1", "김민수", "D1", "4000"], ["2", "이서연", "D1", "6000"], ["3", "박준호", "D1", "5000"], ["4", "최유진", "D2", "3000"], ["5", "정하늘", "D2", "4500"], ["6", "한바다", "D3", "7000"]], "columns": [{"name": "EMP_ID", "dataType": "INT", "primaryKey": true}, {"name": "EMP_NAME", "dataType": "VARCHAR(20)", "primaryKey": false}, {"name": "DEPT_ID", "dataType": "CHAR(2)", "primaryKey": false}, {"name": "SALARY", "dataType": "INT", "primaryKey": false}]}], "expectedResult": {"rows": [["이서연", "6000"], ["정하늘", "4500"]], "columns": ["EMP_NAME", "SALARY"], "orderedRows": true}}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (223, '2026-07-16 23:52:48.108278', 1, 'N', '2026-07-16 23:52:48.108278', 1, 'Y', 'CUSTOMER_ID | CNT | TOTAL
C1 | 3 | 600
C2 | 2 | 600
C3 | 2 | 800', NULL, '다음 SELECT문의 결과 릴레이션을 작성하시오.
SELECT CUSTOMER_ID,
       COUNT(*) AS CNT,
       SUM(ORDER_AMOUNT) AS TOTAL
FROM ORDERS
GROUP BY CUSTOMER_ID
HAVING COUNT(*) >= 2 AND SUM(ORDER_AMOUNT) >= 600
ORDER BY CUSTOMER_ID;', NULL, NULL, 'C1(3건,600)·C2(2건,600)·C3(2건,800)은 조건 충족. C4는 1건이라 COUNT>=2 불만족으로 제외.', NULL, NULL, 'SQL', 'SQL 실행결과 - GROUP BY와 HAVING', 2, 7, NULL, NULL, NULL, NULL, NULL, NULL, 20, '{"tables": [{"name": "ORDERS", "rows": [["1", "C1", "100"], ["2", "C1", "200"], ["3", "C1", "300"], ["4", "C2", "500"], ["5", "C2", "100"], ["6", "C3", "400"], ["7", "C3", "400"], ["8", "C4", "1000"]], "columns": [{"name": "ORDER_ID", "dataType": "INT", "primaryKey": true}, {"name": "CUSTOMER_ID", "dataType": "CHAR(2)", "primaryKey": false}, {"name": "ORDER_AMOUNT", "dataType": "INT", "primaryKey": false}]}], "expectedResult": {"rows": [["C1", "3", "600"], ["C2", "2", "600"], ["C3", "2", "800"]], "columns": ["CUSTOMER_ID", "CNT", "TOTAL"], "orderedRows": true}}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (224, '2026-07-16 23:52:48.123471', 1, 'N', '2026-07-16 23:52:48.123471', 1, 'Y', 'DEPT_ID | EMP_COUNT | BONUS_COUNT | HIGH_COUNT
D1 | 3 | 2 | 1
D2 | 3 | 1 | 2', NULL, '다음 SELECT문의 결과 릴레이션을 작성하시오.
SELECT DEPT_ID,
       COUNT(*) AS EMP_COUNT,
       COUNT(BONUS) AS BONUS_COUNT,
       SUM(CASE WHEN SALARY >= 5000 THEN 1 ELSE 0 END) AS HIGH_COUNT
FROM EMPLOYEE
GROUP BY DEPT_ID
HAVING COUNT(*) >= 2
ORDER BY DEPT_ID;', NULL, NULL, 'D1: 3명, BONUS 비NULL 2, SALARY>=5000 1명. D2: 3명, BONUS 비NULL 1, SALARY>=5000 2명. D3는 1명이라 HAVING COUNT>=2 제외.', NULL, NULL, 'SQL', 'SQL 실행결과 - 조건부 집계(CASE)와 NULL', 2, 7, NULL, NULL, NULL, NULL, NULL, NULL, 21, '{"tables": [{"name": "EMPLOYEE", "rows": [["1", "D1", "5000", "500"], ["2", "D1", "4000", "NULL"], ["3", "D1", "3000", "300"], ["4", "D2", "6000", "NULL"], ["5", "D2", "5500", "700"], ["6", "D2", "2000", "NULL"], ["7", "D3", "4500", "400"]], "columns": [{"name": "EMP_ID", "dataType": "INT", "primaryKey": true}, {"name": "DEPT_ID", "dataType": "CHAR(2)", "primaryKey": false}, {"name": "SALARY", "dataType": "INT", "primaryKey": false}, {"name": "BONUS", "dataType": "INT", "primaryKey": false}]}], "expectedResult": {"rows": [["D1", "3", "2", "1"], ["D2", "3", "1", "2"]], "columns": ["DEPT_ID", "EMP_COUNT", "BONUS_COUNT", "HIGH_COUNT"], "orderedRows": true}}') ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (229, '2026-07-16 23:59:34.322595', 1, 'N', '2026-07-16 23:59:34.322595', 1, 'Y', '10 38
23
15', 'class Parent {
    int value = 10;
    Parent() {
        System.out.print(getValue() + " ");
        value += 5;
    }
    int getValue() {
        return value;
    }
}
class Child extends Parent {
    int value = 20;
    Child() {
        value += 3;
        System.out.print(getValue() + " ");
    }
    @Override
    int getValue() {
        return value + super.value;
    }
}
public class Main {
    public static void main(String[] args) {
        Child child = new Child();
        System.out.println();
        System.out.println(child.value);
        System.out.println(((Parent) child).value);
    }
}', '다음 프로그램의 실행 결과를 정확히 쓰시오.', NULL, NULL, 'Parent 생성자 중 getValue()는 Child 오버라이드 호출: Child.value(아직 0)+super.value(10)=10. Parent.value+=5→15. Child.value=20+3=23, getValue()=23+15=38. child.value=23, ((Parent)child).value=15.', 'java', NULL, 'CODE', '소스코드 실행결과 - Java 생성자에서 오버라이딩 메서드 호출', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 26, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (230, '2026-07-16 23:59:34.334712', 1, 'N', '2026-07-16 23:59:34.334712', 1, 'Y', 'C-Object P-String C-Object C-Integer', 'class Parent {
    void print(Object value) {
        System.out.print("P-Object ");
    }
    void print(String value) {
        System.out.print("P-String ");
    }
}
class Child extends Parent {
    @Override
    void print(Object value) {
        System.out.print("C-Object ");
    }
    void print(Integer value) {
        System.out.print("C-Integer ");
    }
}
public class Main {
    public static void main(String[] args) {
        Parent p = new Child();
        Child c = new Child();
        Object a = "ABC";
        String b = "ABC";
        Integer n = 10;
        p.print(a);
        p.print(b);
        c.print(a);
        c.print(n);
    }
}', '다음 프로그램의 실행 결과를 정확히 쓰시오.', NULL, NULL, '오버로딩은 정적 타입 기준: p.print(Object a)→오버라이드 C-Object, p.print(String b)→Parent print(String) P-String, c.print(Object a)→C-Object, c.print(Integer n)→가장 구체적 print(Integer) C-Integer.', 'java', NULL, 'CODE', '소스코드 실행결과 - Java 오버로딩과 오버라이딩의 혼합', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 27, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (231, '2026-07-16 23:59:34.345783', 1, 'N', '2026-07-16 23:59:34.345783', 1, 'Y', 'true
false
true
true
true', 'public class Main {
    static String change(String value) {
        value += "B";
        return value.intern();
    }
    public static void main(String[] args) {
        String a = "AB";
        String b = "A" + "B";
        String c = new String("AB");
        String d = change("A");
        System.out.println(a == b);
        System.out.println(a == c);
        System.out.println(a.equals(c));
        System.out.println(a == d);
        System.out.println(c.intern() == d);
    }
}', '다음 프로그램의 실행 결과를 정확히 쓰시오.', NULL, NULL, 'a와 b("A"+"B" 컴파일 상수)는 풀 동일→true. c=new String이라 a==c false, equals true. d=intern()→풀 "AB"→a==d true. c.intern()==d도 풀 동일 true.', 'java', NULL, 'CODE', '소스코드 실행결과 - Java 문자열 풀과 메서드 호출', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 28, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (232, '2026-07-16 23:59:34.357052', 1, 'N', '2026-07-16 23:59:34.357052', 1, 'Y', '{''a'': [9, 2, 5], ''b'': [3, 4]}
{''a'': [9, 2, 5], ''b'': [3, 4, 6]}
True
False', 'original = {
    ''a'': [1, 2],
    ''b'': [3, 4]
}
copied = original.copy()
copied[''a''].append(5)
copied[''b''] = copied[''b''] + [6]
original[''a''][0] = 9
print(original)
print(copied)
print(original[''a''] is copied[''a''])
print(original[''b''] is copied[''b''])', '다음 프로그램의 실행 결과를 정확히 쓰시오.', NULL, NULL, 'copy()는 얕은 복사라 ''a'' 리스트 공유(append·[0]=9 반영→[9,2,5]). copied[''b'']는 새 리스트로 재바인딩→original[''b'']는 [3,4] 유지. ''a'' is True, ''b'' is False.', 'python', NULL, 'CODE', '소스코드 실행결과 - Python 얕은 복사와 딕셔너리 내부 객체 공유', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 29, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (233, '2026-07-16 23:59:34.37207', 1, 'N', '2026-07-16 23:59:34.37207', 1, 'Y', '[4, 2, 3, 5, 1]
[2, 3, 5]
8', 'def process(data):
    if len(data) <= 1:
        return data
    left = process(data[::2])
    right = process(data[1::2])
    return right + left
values = [1, 2, 3, 4, 5]
result = process(values)
print(result)
print(result[1:-1])
print(sum(result[::2]))', '다음 프로그램의 실행 결과를 정확히 쓰시오.', NULL, NULL, 'process는 짝수/홀수 인덱스로 분할 후 right+left로 결합. 결과 [4,2,3,5,1]. result[1:-1]=[2,3,5], sum(result[::2])=4+3+1=8.', 'python', NULL, 'CODE', '소스코드 실행결과 - Python 재귀 함수와 리스트 슬라이싱', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 30, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (234, '2026-07-16 23:59:34.384072', 1, 'N', '2026-07-16 23:59:34.384072', 1, 'Y', '11
12
14
14', 'def make_funcs():
    funcs = []
    data = [1]
    for i in range(3):
        def func(x, i=i):
            data[0] += i
            return x + data[0]
        funcs.append(func)
    return funcs
f1, f2, f3 = make_funcs()
print(f1(10))
print(f2(10))
print(f3(10))
print(f1(10))', '다음 프로그램의 실행 결과를 정확히 쓰시오.', NULL, NULL, 'i는 기본값으로 캡처(0,1,2), data는 공유 리스트. f1:data=1→11, f2:data=2→12, f3:data=4→14, f1 다시:data=4→14.', 'python', NULL, 'CODE', '소스코드 실행결과 - Python 클로저와 가변 객체', 3, 7, NULL, NULL, NULL, NULL, NULL, NULL, 31, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (235, '2026-07-17 00:08:55.525343', 1, 'N', '2026-07-17 00:08:55.525343', 1, 'Y', 'OAuth || OAuth 2.0 || OAuth2 || 오아스 || 오어스', NULL, '사용자가 별도의 회원가입 없이 외부 서비스 계정을 이용해 애플리케이션에 접근 권한을 부여(위임)하는 과정에 사용되는 권한 위임 표준의 명칭을 쓰시오.', NULL, NULL, 'OAuth는 비밀번호를 직접 넘기지 않고 접근 토큰으로 자원 접근 권한을 위임하는 표준이다.', NULL, NULL, 'SHORT_ANSWER', '보안 - OAuth 권한 위임 표준 명칭', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 7, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (236, '2026-07-17 00:08:55.539979', 1, 'N', '2026-07-17 00:08:55.539979', 1, 'Y', '자원에 대한 접근 권한을 가진 사용자이다., 사용자를 대신하여 자원 접근을 요청하는 애플리케이션이다., 사용자 인증과 권한 동의를 처리하고 토큰을 발급한다., 보호된 데이터나 API를 제공한다.', NULL, 'OAuth 구성요소의 역할을 보기에서 골라 순서대로 쓰시오.
순서: ① 자원 소유자  ② 클라이언트  ③ 권한 부여 서버  ④ 자원 서버
[역할 보기]
ㄱ. 보호된 데이터나 API를 제공한다.
ㄴ. 자원에 대한 접근 권한을 가진 사용자이다.
ㄷ. 사용자를 대신하여 자원 접근을 요청하는 애플리케이션이다.
ㄹ. 사용자 인증과 권한 동의를 처리하고 토큰을 발급한다.', NULL, NULL, '자원 소유자=사용자(ㄴ), 클라이언트=대신 요청하는 앱(ㄷ), 권한 부여 서버=인증·동의·토큰 발급(ㄹ), 자원 서버=보호된 데이터/API 제공(ㄱ).', NULL, '["보호된 데이터나 API를 제공한다.", "자원에 대한 접근 권한을 가진 사용자이다.", "사용자를 대신하여 자원 접근을 요청하는 애플리케이션이다.", "사용자 인증과 권한 동의를 처리하고 토큰을 발급한다."]', 'SHORT_ANSWER', '보안 - OAuth 구성요소와 역할 연결', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 8, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (248, '2026-07-17 00:08:55.688898', 1, 'N', '2026-07-17 00:08:55.688898', 1, 'Y', '공급망 공격 || Supply Chain Attack || 소프트웨어 공급망 공격 || 서플라이 체인 공격 || 공급망 공격(Supply Chain Attack)', NULL, '공격자가 개발사의 빌드 서버 또는 외부 라이브러리 저장소를 침해해 악성 코드를 삽입하고, 정상 배포 경로와 디지털 서명을 통해 변조된 프로그램이 고객에게 설치되었다. 이 공격의 명칭을 쓰시오.', NULL, NULL, '신뢰된 배포 경로·서명을 악용해 다수 고객을 감염시키는 공급망 공격(Supply Chain Attack)이다.', NULL, NULL, 'SHORT_ANSWER', '보안 - 빌드 서버/라이브러리 침해 공격 명칭', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 20, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (249, '2026-07-17 00:08:55.702922', 1, 'N', '2026-07-17 00:08:55.702922', 1, 'Y', 'ㄱ, ㄴ, ㄷ, ㅁ', NULL, '공급망 공격 대응책으로 적절한 것을 모두 고르시오. (기호로 답)
ㄱ. 외부 라이브러리와 의존성의 무결성을 검증한다.
ㄴ. 빌드 서버 접근 권한을 최소화한다.
ㄷ. 배포 파일의 서명과 해시값을 검증한다.
ㄹ. 개발 도구는 업데이트하지 않는다.
ㅁ. 소프트웨어 구성요소 명세서를 관리한다.
ㅂ. 신뢰하는 공급업체의 파일은 무조건 검사에서 제외한다.', NULL, NULL, 'ㄱ·ㄴ·ㄷ·ㅁ은 적절. ㄹ(도구 미업데이트)·ㅂ(무조건 검사 제외)은 오히려 위험을 키우는 부적절 대응이다.', NULL, NULL, 'SHORT_ANSWER', '보안 - 공급망 공격 대응책 (모두 고르기)', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 21, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (250, '2026-07-17 00:08:55.712924', 1, 'N', '2026-07-17 00:08:55.712924', 1, 'Y', 'SBOM || Software Bill of Materials || 에스밤 || 소프트웨어 자재 명세서 || 소프트웨어 부품 명세서', NULL, '소프트웨어를 구성하는 라이브러리·패키지·버전 등의 목록을 체계적으로 관리하는 문서를 영문 약어로 쓰시오.', NULL, NULL, '소프트웨어 구성요소 목록 문서는 SBOM(Software Bill of Materials)이다.', NULL, NULL, 'SHORT_ANSWER', '보안 - 소프트웨어 구성요소 명세 문서 약어', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 22, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (251, '2026-07-17 00:15:05.618222', 1, 'N', '2026-07-17 00:15:05.618222', 1, 'Y', '워터링 홀 공격, 세션 하이재킹, TOCTOU 공격', NULL, '다음 세 시나리오에 해당하는 공격을 보기에서 골라 순서대로(A, B, C) 쓰시오.
[시나리오 A] 임직원이 자주 방문하는 협회 웹사이트의 광고 스크립트를 변조해, 접속한 임직원의 취약한 브라우저로 악성 프로그램이 설치되었다.
[시나리오 B] 정상 로그인 과정에서 생성된 인증 쿠키를 탈취한 뒤, 동일 쿠키를 자신의 요청에 포함해 사용자 계정으로 접근하였다.
[시나리오 C] 관리자 프로그램이 파일 권한을 확인한 직후, 실제 파일을 열기 전에 대상 경로를 다른 파일로 변경하였다.
[보기] 워터링 홀 공격 / 세션 하이재킹 / TOCTOU 공격 / 공급망 공격 / CSRF', NULL, NULL, 'A=자주 방문하는 사이트 감염(워터링 홀), B=인증 쿠키 탈취·재사용(세션 하이재킹), C=검사 후 사용 전 대상 교체(TOCTOU).', NULL, '["워터링 홀 공격", "세션 하이재킹", "TOCTOU 공격", "공급망 공격", "CSRF"]', 'SHORT_ANSWER', '보안 - 공격 시나리오 유형 연결', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 23, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (252, '2026-07-17 00:15:05.636697', 1, 'N', '2026-07-17 00:15:05.636697', 1, 'Y', 'C || 시나리오 C', NULL, '다음 세 공격 중 시간 차이를 직접적으로 악용하는 공격의 기호(A/B/C)를 쓰시오.
[시나리오 A] 임직원이 자주 방문하는 협회 웹사이트의 광고 스크립트를 변조해, 접속한 임직원의 취약한 브라우저로 악성 프로그램이 설치되었다.
[시나리오 B] 정상 로그인 과정에서 생성된 인증 쿠키를 탈취한 뒤, 동일 쿠키를 자신의 요청에 포함해 사용자 계정으로 접근하였다.
[시나리오 C] 관리자 프로그램이 파일 권한을 확인한 직후, 실제 파일을 열기 전에 대상 경로를 다른 파일로 변경하였다.', NULL, NULL, 'C(TOCTOU)는 검사 시점과 사용 시점의 시간 차이를 악용한다.', NULL, NULL, 'SHORT_ANSWER', '보안 - 시간 차이를 악용하는 공격 식별', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 24, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (253, '2026-07-17 00:15:05.6505', 1, 'N', '2026-07-17 00:15:05.6505', 1, 'Y', '세션 고정 공격 || 세션 고정 || Session Fixation || 세션 고정(Session Fixation) || 세션 픽세이션', NULL, '웹 서비스에서 로그인 전과 로그인 후의 세션 ID가 동일하다. 이처럼 로그인 전후 동일한 세션 ID를 사용할 때 발생 가능성이 높은 공격을 쓰시오.', NULL, NULL, '로그인 후 세션 ID를 재발급하지 않으면 공격자가 미리 심어둔 세션 ID로 계정을 탈취하는 세션 고정(Session Fixation) 공격이 가능하다.', NULL, NULL, 'SHORT_ANSWER', '보안 - 세션 ID 미변경 시 발생 공격', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 25, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (254, '2026-07-17 00:15:05.663766', 1, 'N', '2026-07-17 00:15:05.663766', 1, 'Y', 'HttpOnly || HttpOnly 속성 || 하이온리 || http only', NULL, '악성 스크립트(자바스크립트)가 쿠키를 읽는 것을 어렵게 하는 쿠키 속성을 쓰시오.', NULL, NULL, 'HttpOnly 속성이 설정된 쿠키는 document.cookie 등 스크립트로 접근할 수 없다.', NULL, NULL, 'SHORT_ANSWER', '보안 - 스크립트의 쿠키 접근을 막는 속성', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 26, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (255, '2026-07-17 00:15:05.682538', 1, 'N', '2026-07-17 00:15:05.682538', 1, 'Y', 'Secure || Secure 속성 || 시큐어', NULL, 'HTTPS 연결에서만 쿠키가 전송되도록 하는 쿠키 속성을 쓰시오.', NULL, NULL, 'Secure 속성이 설정된 쿠키는 HTTPS(암호화 연결)에서만 전송된다.', NULL, NULL, 'SHORT_ANSWER', '보안 - HTTPS에서만 쿠키를 전송하는 속성', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 27, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (256, '2026-07-17 00:15:05.693901', 1, 'N', '2026-07-17 00:15:05.693901', 1, 'Y', 'ㄱ, ㄴ, ㄷ', NULL, '세션 ID가 URL 파라미터에 포함될 경우 노출될 수 있는 경로를 모두 고르시오. (기호로 답)
ㄱ. 브라우저 방문 기록
ㄴ. 웹 서버 접근 로그
ㄷ. Referer 헤더
ㄹ. CPU 레지스터
ㅁ. 화면 캡처', NULL, NULL, 'URL에 포함된 세션 ID는 브라우저 방문 기록·웹 서버 접근 로그·Referer 헤더로 노출될 수 있다. CPU 레지스터는 무관하다.', NULL, NULL, 'SHORT_ANSWER', '보안 - 세션 ID의 URL 노출 경로 (모두 고르기)', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 28, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (257, '2026-07-17 00:15:05.708783', 1, 'N', '2026-07-17 00:15:05.708783', 1, 'Y', '세션 무효화 || 세션 삭제 || 서버 세션 파기 || 세션 파기 || 세션 종료 || 서버 세션 삭제 || 서버 측 세션 무효화 || 세션 무효화(삭제)', NULL, '로그아웃 처리 시 서버 측에서 수행해야 할 가장 중요한 조치를 쓰시오.', NULL, NULL, '로그아웃 시 서버에 저장된 세션을 즉시 무효화(삭제)해야 재사용을 막을 수 있다.', NULL, NULL, 'SHORT_ANSWER', '보안 - 로그아웃 시 서버의 핵심 조치', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 29, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (258, '2026-07-17 00:15:05.718821', 1, 'N', '2026-07-17 00:15:05.718821', 1, 'Y', 'A || 코드 A', NULL, '다음 두 코드 중 TOCTOU 취약점이 발생하기 쉬운 코드를 쓰시오.
[코드 A]
if (!exists(path)) {
    file = open(path, WRITE);
    write(file, data);
}
[코드 B]
file = open(path, CREATE_NEW | NO_FOLLOW | WRITE);
if (file != ERROR) {
    write(file, data);
}', NULL, NULL, '코드 A는 exists() 검사와 open() 사용이 분리되어 그 사이 파일이 교체될 수 있는 TOCTOU 취약점이 있다.', NULL, NULL, 'SHORT_ANSWER', '보안 - TOCTOU 취약 코드 식별', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 30, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (259, '2026-07-17 00:15:05.731601', 1, 'N', '2026-07-17 00:15:05.731601', 1, 'Y', '경쟁 조건 || race condition || 레이스 컨디션 || 경쟁 상태 || 레이스 컨디션(race condition) || TOCTOU', NULL, '파일을 검사(확인)하는 시점과 실제로 사용하는 시점이 분리되어 있기 때문에 발생하는 문제를 간단히(핵심 용어로) 쓰시오.', NULL, NULL, '검사와 사용 사이 시간 틈에 대상이 바뀔 수 있는 경쟁 조건(race condition)이 발생한다.', NULL, NULL, 'SHORT_ANSWER', '보안 - 검사와 사용 분리로 발생하는 문제', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 31, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (260, '2026-07-17 00:15:05.743598', 1, 'N', '2026-07-17 00:15:05.743598', 1, 'Y', '심볼릭 링크 || symbolic link || 심링크 || soft link || 소프트 링크 || symlink || 심볼릭 링크(소프트 링크)', NULL, '파일을 열 때 NO_FOLLOW(심볼릭 링크 미추적) 옵션이 차단하려는 파일 유형을 쓰시오.', NULL, NULL, 'NO_FOLLOW는 심볼릭 링크를 따라가지 않게 하여 링크를 악용한 파일 조작을 차단한다.', NULL, NULL, 'SHORT_ANSWER', '보안 - NO_FOLLOW가 차단하는 파일 유형', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 32, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (261, '2026-07-17 00:15:05.755111', 1, 'N', '2026-07-17 00:15:05.755111', 1, 'Y', 'ㄴ, ㄷ, ㅁ', NULL, '안전한 임시 파일 처리 방법으로 적절한 것을 모두 고르시오. (기호로 답)
ㄱ. 임시 파일 이름을 순차적인 숫자로 생성한다.
ㄴ. 파일 생성과 존재 여부 확인을 하나의 원자적 연산으로 처리한다.
ㄷ. 파일 생성 권한을 필요한 사용자에게만 부여한다.
ㄹ. 임시 디렉터리를 모든 사용자에게 쓰기 가능하게만 설정한다.
ㅁ. 생성된 파일의 소유자와 유형을 검증한다.', NULL, NULL, 'ㄴ(원자적 생성)·ㄷ(최소 권한)·ㅁ(소유자·유형 검증)은 적절. ㄱ(예측 가능한 순차 이름)·ㄹ(모두 쓰기 가능)은 오히려 취약하다.', NULL, NULL, 'SHORT_ANSWER', '보안 - 안전한 임시 파일 처리 (모두 고르기)', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 33, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (262, '2026-07-17 00:15:05.771761', 1, 'N', '2026-07-17 00:15:05.771761', 1, 'Y', '하드 링크', NULL, '리눅스에서 원본 파일 /data/report.txt와 동일한 inode 번호를 가지는 ''파일 A''의 링크 종류를 고르시오.', NULL, NULL, '같은 inode를 공유하면 하드 링크이다.', NULL, '["하드 링크", "심볼릭 링크", "마운트 포인트", "바로가기"]', 'MULTIPLE_CHOICE', '보안 - 동일 inode 파일의 링크 종류', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 34, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (263, '2026-07-17 00:15:05.78304', 1, 'N', '2026-07-17 00:15:05.78304', 1, 'Y', '심볼릭 링크', NULL, '''/data/report.txt''라는 경로 문자열을 저장하는 ''파일 B''의 링크 종류를 고르시오.', NULL, NULL, '경로 문자열을 저장해 대상을 가리키면 심볼릭(소프트) 링크이다.', NULL, '["하드 링크", "심볼릭 링크", "마운트 포인트", "바로가기"]', 'MULTIPLE_CHOICE', '보안 - 경로 문자열을 저장하는 링크 종류', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 35, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (264, '2026-07-17 00:15:05.795039', 1, 'N', '2026-07-17 00:15:05.795039', 1, 'Y', '파일 A', NULL, '파일 A는 원본과 동일 inode, 파일 B는 원본 경로 문자열을 저장한다. 원본 /data/report.txt가 삭제된 이후에도 파일 내용에 접근 가능한 파일을 고르시오.', NULL, NULL, '하드 링크(파일 A)는 inode를 공유해 원본 경로 삭제 후에도 접근 가능하다. 심볼릭 링크(파일 B)는 대상이 사라지면 깨진다.', NULL, '["파일 A", "파일 B", "둘 다 접근 가능", "둘 다 접근 불가"]', 'MULTIPLE_CHOICE', '보안 - 원본 삭제 후 접근 가능한 파일', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 36, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (265, '2026-07-17 00:15:05.810039', 1, 'N', '2026-07-17 00:15:05.810039', 1, 'Y', '심볼릭 링크', NULL, '서로 다른 파일 시스템 사이에 생성 가능한 링크를 고르시오.', NULL, NULL, '하드 링크는 같은 파일 시스템 내에서만 가능하고, 심볼릭 링크는 파일 시스템을 넘어 생성할 수 있다.', NULL, '["하드 링크", "심볼릭 링크", "둘 다 가능", "둘 다 불가능"]', 'MULTIPLE_CHOICE', '보안 - 다른 파일 시스템 간 생성 가능한 링크', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 37, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.question_bank (id, create_dt, create_uno, del_yn, modified_dt, modified_uno, use_yn, answer, code, content, exam_round, exam_year, explanation, language, options, question_type, title, category_id, exam_type_id, ai_difficulty, ai_domains, ai_keywords, ai_summary, scheduling_data, instruction, question_no, sql_data) VALUES (266, '2026-07-17 00:15:05.82004', 1, 'N', '2026-07-17 00:15:05.82004', 1, 'Y', '심볼릭 링크 공격', NULL, '파일 B(심볼릭 링크)가 시스템 중요 파일을 가리키도록 조작된 상태에서, 높은 권한의 프로그램이 파일 B를 따라가 내용을 덮어썼다. 이때 악용된 공격 기법을 고르시오.', NULL, NULL, '심볼릭 링크가 가리키는 대상을 바꿔 권한 높은 프로그램이 엉뚱한 파일을 덮어쓰게 하는 심볼릭 링크(Symlink) 공격이다.', NULL, '["버퍼 오버플로 공격", "심볼릭 링크 공격", "SQL 인젝션", "세션 하이재킹"]', 'MULTIPLE_CHOICE', '보안 - 링크 조작을 이용한 공격 기법', 5, 7, NULL, NULL, NULL, NULL, NULL, NULL, 38, NULL) ON CONFLICT DO NOTHING;

-- ============ exam_info ============
INSERT INTO public.exam_info (id, application_period, created_at, description, display_order, exam_schedule, exam_type, is_active, official_url, result_date, title, updated_at, application_url) VALUES (1, '2026-03-23 ~ 2026-03-26', '2026-06-12 13:40:17.893416', 'Q-Net 기준 정보처리기사 실기 시험정보입니다.
실기 과목: 정보처리 실무
검정방법: 필답형(2시간 30분)
합격기준: 100점 만점 60점 이상
수수료: 실기 22,600원
출제경향: 요구사항 확인, 데이터 입출력 구현, 통합 구현, 서버프로그램 구현, 인터페이스 구현, 화면설계, 애플리케이션 테스트, SQL 응용, 소프트웨어 개발 보안, 프로그래밍 언어 활용, 응용 SW 기초 기술 활용, 제품 소프트웨어 패키징을 중심으로 평가합니다.
출처: Q-Net 국가자격 종목별 상세정보(정보처리기사, 2026년 일정)
빈자리접수: 2026-04-12 ~ 2026-04-13', 20, '2026-04-18 ~ 2026-05-06', '정보처리기사 실기', true, 'https://www.q-net.or.kr/crf005.do?id=crf00503&jmCd=1320', '2026-06-12', '정보처리기사 실기 2026년 정기 기사 1회', '2026-06-12 13:40:17.893416', 'https://www.q-net.or.kr/man001.do?gSite=Q') ON CONFLICT DO NOTHING;
INSERT INTO public.exam_info (id, application_period, created_at, description, display_order, exam_schedule, exam_type, is_active, official_url, result_date, title, updated_at, application_url) VALUES (2, '2026-06-22 ~ 2026-06-25', '2026-06-12 13:40:17.901414', 'Q-Net 기준 정보처리기사 실기 시험정보입니다.
실기 과목: 정보처리 실무
검정방법: 필답형(2시간 30분)
합격기준: 100점 만점 60점 이상
수수료: 실기 22,600원
출제경향: 요구사항 확인, 데이터 입출력 구현, 통합 구현, 서버프로그램 구현, 인터페이스 구현, 화면설계, 애플리케이션 테스트, SQL 응용, 소프트웨어 개발 보안, 프로그래밍 언어 활용, 응용 SW 기초 기술 활용, 제품 소프트웨어 패키징을 중심으로 평가합니다.
출처: Q-Net 국가자격 종목별 상세정보(정보처리기사, 2026년 일정)
빈자리접수: 2026-07-12 ~ 2026-07-13', 21, '2026-07-18 ~ 2026-08-05', '정보처리기사 실기', true, 'https://www.q-net.or.kr/crf005.do?id=crf00503&jmCd=1320', '2026-09-11', '정보처리기사 실기 2026년 정기 기사 2회', '2026-06-12 13:40:17.901414', 'https://www.q-net.or.kr/man001.do?gSite=Q') ON CONFLICT DO NOTHING;
INSERT INTO public.exam_info (id, application_period, created_at, description, display_order, exam_schedule, exam_type, is_active, official_url, result_date, title, updated_at, application_url) VALUES (3, '2026-09-21 ~ 2026-09-28', '2026-06-12 13:40:17.906413', 'Q-Net 기준 정보처리기사 실기 시험정보입니다.
실기 과목: 정보처리 실무
검정방법: 필답형(2시간 30분)
합격기준: 100점 만점 60점 이상
수수료: 실기 22,600원
출제경향: 요구사항 확인, 데이터 입출력 구현, 통합 구현, 서버프로그램 구현, 인터페이스 구현, 화면설계, 애플리케이션 테스트, SQL 응용, 소프트웨어 개발 보안, 프로그래밍 언어 활용, 응용 SW 기초 기술 활용, 제품 소프트웨어 패키징을 중심으로 평가합니다.
출처: Q-Net 국가자격 종목별 상세정보(정보처리기사, 2026년 일정)
', 22, '2026-10-24 ~ 2026-11-13', '정보처리기사 실기', true, 'https://www.q-net.or.kr/crf005.do?id=crf00503&jmCd=1320', '2026-12-18', '정보처리기사 실기 2026년 정기 기사 3회', '2026-06-12 13:40:17.906413', 'https://www.q-net.or.kr/man001.do?gSite=Q') ON CONFLICT DO NOTHING;

-- ============ dialect_conversion_rules ============
INSERT INTO public.dialect_conversion_rules (id, admin_label, complex, dialect, display_order, enabled, rule_key, user_label) VALUES (2, '데이터 타입·문법 자동 변환', false, 'mysql', 2, true, 'mysql_datatypes', 'DATETIME, TINYINT, UNSIGNED, CHARACTER SET 등 자동 변환') ON CONFLICT DO NOTHING;
INSERT INTO public.dialect_conversion_rules (id, admin_label, complex, dialect, display_order, enabled, rule_key, user_label) VALUES (3, 'DELIMITER // 처리', false, 'mysql', 3, true, 'mysql_delimiter', 'DELIMITER // ... END // DELIMITER ; (MySQL 모드 전용)') ON CONFLICT DO NOTHING;
INSERT INTO public.dialect_conversion_rules (id, admin_label, complex, dialect, display_order, enabled, rule_key, user_label) VALUES (4, 'BEGIN...END 프로시저 → PostgreSQL 변환', true, 'mysql', 4, true, 'mysql_procedure', 'BEGIN...END 프로시저 → LANGUAGE plpgsql AS $$...$$') ON CONFLICT DO NOTHING;
INSERT INTO public.dialect_conversion_rules (id, admin_label, complex, dialect, display_order, enabled, rule_key, user_label) VALUES (5, 'BEGIN...END 인라인 트리거 → 함수+트리거 분리', true, 'mysql', 5, true, 'mysql_trigger', 'BEGIN...END 인라인 트리거 → 함수+트리거로 분리') ON CONFLICT DO NOTHING;
INSERT INTO public.dialect_conversion_rules (id, admin_label, complex, dialect, display_order, enabled, rule_key, user_label) VALUES (6, '데이터 타입·함수 자동 변환', false, 'oracle', 1, true, 'oracle_datatypes', 'NUMBER, VARCHAR2, CLOB, BLOB, NCHAR, SYSDATE, NVL 자동 변환') ON CONFLICT DO NOTHING;
INSERT INTO public.dialect_conversion_rules (id, admin_label, complex, dialect, display_order, enabled, rule_key, user_label) VALUES (7, 'FROM DUAL 변환', false, 'oracle', 2, true, 'oracle_dual', 'FROM DUAL → FROM (SELECT 1) AS dual') ON CONFLICT DO NOTHING;
INSERT INTO public.dialect_conversion_rules (id, admin_label, complex, dialect, display_order, enabled, rule_key, user_label) VALUES (8, 'MODIFY 구문 변환', false, 'oracle', 3, true, 'oracle_modify', 'MODIFY(col ...) → ALTER COLUMN 변환, IDENTITY 컬럼 타입 자동 보정') ON CONFLICT DO NOTHING;
INSERT INTO public.dialect_conversion_rules (id, admin_label, complex, dialect, display_order, enabled, rule_key, user_label) VALUES (9, 'IS/AS BEGIN...END 프로시저 → PostgreSQL 변환', true, 'oracle', 4, true, 'oracle_procedure', 'IS/AS BEGIN...END 프로시저 → LANGUAGE plpgsql AS $$...$$') ON CONFLICT DO NOTHING;
INSERT INTO public.dialect_conversion_rules (id, admin_label, complex, dialect, display_order, enabled, rule_key, user_label) VALUES (10, 'BEGIN...END 인라인 트리거 → 함수+트리거 + :NEW/:OLD 변환', true, 'oracle', 5, true, 'oracle_trigger', 'BEGIN...END 인라인 트리거 → 함수+트리거로 분리, :NEW.col / :OLD.col → NEW.col / OLD.col') ON CONFLICT DO NOTHING;
INSERT INTO public.dialect_conversion_rules (id, admin_label, complex, dialect, display_order, enabled, rule_key, user_label) VALUES (1, 'AUTO_INCREMENT → IDENTITY 변환', false, 'mysql', 1, true, 'mysql_auto_increment', 'AUTO_INCREMENT → GENERATED ALWAYS AS IDENTITY') ON CONFLICT DO NOTHING;

-- ============ prac_departments ============
INSERT INTO public.prac_departments (id, name, location, budget) VALUES (1, '개발팀', '서울 강남구', 50000000.00) ON CONFLICT DO NOTHING;
INSERT INTO public.prac_departments (id, name, location, budget) VALUES (2, '마케팅팀', '서울 마포구', 30000000.00) ON CONFLICT DO NOTHING;
INSERT INTO public.prac_departments (id, name, location, budget) VALUES (3, '인사팀', '서울 영등포구', 20000000.00) ON CONFLICT DO NOTHING;
INSERT INTO public.prac_departments (id, name, location, budget) VALUES (4, '영업팀', '부산 해운대구', 40000000.00) ON CONFLICT DO NOTHING;
INSERT INTO public.prac_departments (id, name, location, budget) VALUES (5, '기획팀', '서울 강남구', 25000000.00) ON CONFLICT DO NOTHING;

-- ============ prac_products ============
INSERT INTO public.prac_products (id, name, category, price, stock) VALUES (1, 'Java 완전 정복', '도서', 35000.00, 150) ON CONFLICT DO NOTHING;
INSERT INTO public.prac_products (id, name, category, price, stock) VALUES (2, 'Python 데이터 분석', '도서', 28000.00, 200) ON CONFLICT DO NOTHING;
INSERT INTO public.prac_products (id, name, category, price, stock) VALUES (3, 'AWS 자격증 패키지', '강의', 150000.00, 50) ON CONFLICT DO NOTHING;
INSERT INTO public.prac_products (id, name, category, price, stock) VALUES (4, '리눅스 마스터 강의', '강의', 80000.00, 30) ON CONFLICT DO NOTHING;
INSERT INTO public.prac_products (id, name, category, price, stock) VALUES (5, '정보처리기사 핵심 요약', '도서', 22000.00, 300) ON CONFLICT DO NOTHING;
INSERT INTO public.prac_products (id, name, category, price, stock) VALUES (6, 'SQL 기초부터 실전까지', '도서', 32000.00, 180) ON CONFLICT DO NOTHING;
INSERT INTO public.prac_products (id, name, category, price, stock) VALUES (7, '클라우드 아키텍처 설계', '강의', 200000.00, 20) ON CONFLICT DO NOTHING;
INSERT INTO public.prac_products (id, name, category, price, stock) VALUES (8, '네트워크 보안 실습', '강의', 120000.00, 40) ON CONFLICT DO NOTHING;

-- ============ prac_employees ============
INSERT INTO public.prac_employees (id, name, department_id, salary, hire_date, email, job_title) VALUES (1, '김민준', 1, 5000000.00, '2023-03-15', 'kim.mj@tpmp.com', '백엔드 개발자') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_employees (id, name, department_id, salary, hire_date, email, job_title) VALUES (2, '이서연', 1, 4500000.00, '2022-07-01', 'lee.sy@tpmp.com', '프론트엔드 개발자') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_employees (id, name, department_id, salary, hire_date, email, job_title) VALUES (3, '박지훈', 2, 4000000.00, '2021-11-20', 'park.jh@tpmp.com', '마케팅 매니저') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_employees (id, name, department_id, salary, hire_date, email, job_title) VALUES (4, '최수아', 3, 3800000.00, '2024-01-10', 'choi.sa@tpmp.com', 'HR 전문가') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_employees (id, name, department_id, salary, hire_date, email, job_title) VALUES (5, '정유진', 4, 4200000.00, '2022-05-17', 'jung.yj@tpmp.com', '영업 매니저') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_employees (id, name, department_id, salary, hire_date, email, job_title) VALUES (6, '강도현', 1, 5500000.00, '2020-08-30', 'kang.dh@tpmp.com', '시니어 개발자') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_employees (id, name, department_id, salary, hire_date, email, job_title) VALUES (7, '윤하은', 5, 3900000.00, '2023-09-05', 'yoon.he@tpmp.com', '기획자') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_employees (id, name, department_id, salary, hire_date, email, job_title) VALUES (8, '임재현', 2, 3700000.00, '2024-03-22', 'lim.jh@tpmp.com', '마케팅 담당자') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_employees (id, name, department_id, salary, hire_date, email, job_title) VALUES (9, '오지수', 4, 4800000.00, '2021-06-14', 'oh.js@tpmp.com', '영업부장') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_employees (id, name, department_id, salary, hire_date, email, job_title) VALUES (10, '신예린', 1, 4300000.00, '2023-11-08', 'shin.yr@tpmp.com', '풀스택 개발자') ON CONFLICT DO NOTHING;

-- ============ prac_orders ============
INSERT INTO public.prac_orders (id, customer_name, product_id, quantity, total_amount, order_date) VALUES (1, '홍길동', 1, 2, 70000.00, '2026-01-15') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_orders (id, customer_name, product_id, quantity, total_amount, order_date) VALUES (2, '이몽룡', 3, 1, 150000.00, '2026-01-20') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_orders (id, customer_name, product_id, quantity, total_amount, order_date) VALUES (3, '성춘향', 6, 3, 96000.00, '2026-02-03') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_orders (id, customer_name, product_id, quantity, total_amount, order_date) VALUES (4, '변학도', 5, 5, 110000.00, '2026-02-14') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_orders (id, customer_name, product_id, quantity, total_amount, order_date) VALUES (5, '홍길동', 2, 2, 56000.00, '2026-02-28') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_orders (id, customer_name, product_id, quantity, total_amount, order_date) VALUES (6, '김선달', 7, 1, 200000.00, '2026-03-05') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_orders (id, customer_name, product_id, quantity, total_amount, order_date) VALUES (7, '이몽룡', 4, 2, 160000.00, '2026-03-12') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_orders (id, customer_name, product_id, quantity, total_amount, order_date) VALUES (8, '박세리', 1, 1, 35000.00, '2026-03-20') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_orders (id, customer_name, product_id, quantity, total_amount, order_date) VALUES (9, '최지우', 8, 3, 360000.00, '2026-04-01') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_orders (id, customer_name, product_id, quantity, total_amount, order_date) VALUES (10, '강호동', 5, 2, 44000.00, '2026-04-10') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_orders (id, customer_name, product_id, quantity, total_amount, order_date) VALUES (11, '유재석', 6, 1, 32000.00, '2026-04-15') ON CONFLICT DO NOTHING;
INSERT INTO public.prac_orders (id, customer_name, product_id, quantity, total_amount, order_date) VALUES (12, '이효리', 3, 2, 300000.00, '2026-04-30') ON CONFLICT DO NOTHING;

-- ============ concept_notes ============
INSERT INTO public.concept_notes (id, content, created_at, is_public, title, updated_at, question_id, question_bank_id, user_id, notion_page_id) VALUES (1, '[재동기화 검증] HAVING count(*) < 2 로 1건뿐인 project를 찾고, 그 name으로 조인하면 count=1. (본문 재동기화 E2E 테스트)', '2026-06-15 00:40:27.938037', false, '아래 employee 테이블과 project 테이블을 참고하여, 보기의', '2026-06-21 21:39:12.274788', NULL, 83, 2, '380bc735-b1d8-81b8-990a-f4b4354cdd7c') ON CONFLICT DO NOTHING;

-- ============ 시퀀스 보정 ============
SELECT setval('public.domain_master_id_seq', (SELECT COALESCE(MAX(id),1) FROM domain_master), true);
SELECT setval('public.domain_slave_id_seq', (SELECT COALESCE(MAX(id),1) FROM domain_slave), true);
SELECT setval('public.exams_id_seq', (SELECT COALESCE(MAX(id),1) FROM exams), true);
SELECT setval('public.examinations_id_seq', (SELECT COALESCE(MAX(id),1) FROM examinations), true);
SELECT setval('public.questions_id_seq', (SELECT COALESCE(MAX(id),1) FROM questions), true);
SELECT setval('public.question_bank_id_seq', (SELECT COALESCE(MAX(id),1) FROM question_bank), true);
SELECT setval('public.exam_info_id_seq', (SELECT COALESCE(MAX(id),1) FROM exam_info), true);
SELECT setval('public.dialect_conversion_rules_id_seq', (SELECT COALESCE(MAX(id),1) FROM dialect_conversion_rules), true);
SELECT setval('public.prac_departments_id_seq', (SELECT COALESCE(MAX(id),1) FROM prac_departments), true);
SELECT setval('public.prac_products_id_seq', (SELECT COALESCE(MAX(id),1) FROM prac_products), true);
SELECT setval('public.prac_employees_id_seq', (SELECT COALESCE(MAX(id),1) FROM prac_employees), true);
SELECT setval('public.prac_orders_id_seq', (SELECT COALESCE(MAX(id),1) FROM prac_orders), true);
SELECT setval('public.concept_notes_id_seq', (SELECT COALESCE(MAX(id),1) FROM concept_notes), true);

COMMIT;
