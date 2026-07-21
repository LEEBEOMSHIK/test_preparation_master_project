-- 목적: "2025년 2회 정보처리기사 실기 (AI 커스텀)" 시험을 신규 생성한다.
-- 배경: 저작권 문제로 활용이 어려운 2025년 2회 기출 20문항을, 동일 개념·동일 난이도만 유지하고
--       코드 로직·문제 구성·값을 모두 새로 설계한 AI 커스텀 20문항으로 재구성한다.
--       CODE는 원본 코드 골격을 재사용하지 않고 다른 코드로 같은 개념을 검증하며,
--       용어 선택형 단답(1·2·4·7·19)은 구조화 보기(options)를 제공한다.
--       원본 11·20번은 이미지 의존 문항이므로 텍스트만으로 성립하도록 재설계했다.
--       CODE 실행 결과·서브넷·스케줄링 평균 대기시간 정답은 직접 계산·검증했다.
-- 대상: exams 1행 + questions 20행 + examinations 1행. 기존 데이터는 손대지 않는다.
-- 재실행 안전: 동일 제목 시험/문항/응시가 있으면 재삽입하지 않는다. id는 IDENTITY 자동.

BEGIN;

INSERT INTO exams (created_at, del_yn, order_no, question_mode, title, created_by)
SELECT now(), 'N', (SELECT COALESCE(MAX(order_no), 0) + 1 FROM exams), 'SEQUENTIAL',
       '2025년 2회 정보처리기사 실기 (AI 커스텀)', 1
WHERE NOT EXISTS (
    SELECT 1 FROM exams WHERE title = '2025년 2회 정보처리기사 실기 (AI 커스텀)' AND del_yn = 'N'
);

INSERT INTO questions (exam_id, seq, question_type, instruction, content, code, language, answer, explanation, options, scheduling_data)
SELECT e.id, v.seq, v.qt, v.instr, v.content, v.code, v.lang, v.answer, v.expl, v.opts::jsonb, v.sched::jsonb
FROM (SELECT id FROM exams WHERE title = '2025년 2회 정보처리기사 실기 (AI 커스텀)' AND del_yn = 'N') e,
LATERAL (VALUES
(1, 'SHORT_ANSWER',
 $q$다음은 파일 접근 방법에 관한 설명이다. 괄호에 들어갈 알맞은 용어를 보기에서 골라 쓰시오.$q$,
 $q$<p>레코드에 접근하는 방법에는 순차 접근, 인덱스 접근, ( ) 접근 등이 있다.</p><p>&nbsp;</p><p>이 중 ( ) 접근은 레코드의 키 값에 특정 함수를 적용하여 레코드가 저장된 물리적 주소를 직접 계산해 내는 방식이다.</p><p>&nbsp;</p><p>별도의 색인 구조를 거치지 않고 한 번의 계산으로 주소를 얻으므로 평균 검색 시간이 매우 짧지만, 서로 다른 키 값이 같은 주소로 계산되는 충돌(Collision)이 발생할 수 있어 이를 해결하기 위한 오버플로 처리 기법이 필요하다.</p>$q$,
 NULL, NULL,
 $q$해싱$q$,
 $q$키 값에 함수를 적용해 물리 주소를 직접 계산하고 충돌 처리가 필요한 방식 → 해싱(Hashing).$q$,
 $q$["순차", "인덱스", "해싱", "B-트리", "다중 리스트", "역파일"]$q$,
 NULL),

(2, 'SHORT_ANSWER',
 $q$다음 보기의 용어 중 아래 설명에 해당하는 것을 고르시오.$q$,
 $q$<p>릴레이션(Relation)을 구성하는 속성(Attribute), 즉 열(Column)의 개수를 의미하는 용어이다.</p><p>예를 들어 "학생(학번, 이름, 학과, 학년)" 릴레이션은 속성이 4개이므로 이 값이 4가 된다.</p><p>이 값은 릴레이션에 저장된 데이터의 양과 무관하게 릴레이션 스키마가 정의되는 시점에 결정되며, 튜플이 추가되거나 삭제되어도 변하지 않는다.</p><p>참고로 릴레이션에 포함된 튜플(행)의 개수를 의미하는 용어는 이와 구별된다.</p>$q$,
 NULL, NULL,
 $q$Degree$q$,
 $q$속성(열)의 개수 → 차수(Degree). 튜플(행)의 개수는 카디널리티(Cardinality)이다.$q$,
 $q$["Cardinality", "Degree", "Domain", "Attribute", "Tuple", "Schema", "Instance"]$q$,
 NULL),

(3, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 보안 프로토콜의 영문 약자를 쓰시오.$q$,
 $q$<p>응용 계층과 전송 계층 사이에서 동작하며 네트워크 통신 구간의 기밀성과 무결성을 보장하는 보안 프로토콜이다.</p><p>&nbsp;</p><p>공개키 인증서를 이용해 서버를 인증한 뒤, 핸드셰이크 과정에서 합의한 대칭키로 이후의 데이터를 암호화한다.</p><p>&nbsp;</p><p>HTTP와 결합하여 HTTPS를 구성하며 기본 포트 번호는 443번이다. 기존 SSL의 취약점을 보완한 후속 표준이다.</p>$q$,
 NULL, NULL,
 $q$TLS || SSL$q$,
 $q$인증서 기반 서버 인증 + 대칭키 암호화, HTTPS(443)의 기반 → TLS(SSL).$q$,
 NULL,
 NULL),

(4, 'SHORT_ANSWER',
 $q$스케줄링 알고리즘에 관한 다음 설명을 읽고 (1)과 (2)에 알맞은 스케줄링 알고리즘의 명칭을 보기에서 골라 각각 쓰시오.$q$,
 $q$<p>(1) 대기 시간과 서비스 시간을 함께 고려하여 우선순위를 계산하는 비선점형 스케줄링 방식이다. 우선순위는 (대기 시간 + 서비스 시간) / 서비스 시간 으로 구하며, 실행 시간이 긴 프로세스라도 오래 대기하면 우선순위가 높아져 기아 현상을 완화한다.</p><p>&nbsp;</p><p>(2) 각 프로세스에 동일한 크기의 시간 할당량(타임 퀀텀)을 부여하고, 할당량을 모두 사용한 프로세스는 준비 큐의 맨 뒤로 보내는 선점형 스케줄링 방식이다. 시분할 시스템에서 널리 사용된다.</p>$q$,
 NULL, NULL,
 $q$1. HRN / 2. RR$q$,
 $q$(대기+서비스)/서비스 우선순위 공식 → HRN. 동일 타임 퀀텀 순환 선점 → RR(Round Robin).$q$,
 $q$["FCFS", "SJF", "SRT", "HRN", "RR", "MLQ", "MLFQ"]$q$,
 NULL),

(5, 'CODE',
 $q$다음 Java 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$public class Main {
    public static void swap(int[] nums, int v) {
        int t = nums[0];
        nums[0] = nums[1];
        nums[1] = t;
        v = v * 10;
    }
    public static void main(String[] args) {
        int[] nums = { 4, 9 };
        int v = 5;
        swap(nums, v);
        System.out.print(nums[0] + "" + nums[1] + v);
    }
}$q$,
 'java',
 $q$945$q$,
 $q$배열은 참조가 전달되어 swap 결과가 반영됨(nums = {9, 4}). 기본형 v는 값 복사라 호출부의 5가 유지된다. 출력은 문자열 결합이므로 "9" + "4" + "5" = 945.$q$,
 NULL,
 NULL),

(6, 'SHORT_ANSWER',
 $q$다음은 IP 주소와 서브넷 마스크에 관한 문제이다. 주어진 정보를 참고하여 괄호 안에 들어갈 알맞은 값을 쓰시오.$q$,
 $q$<p>호스트의 IP 주소가 192.168.77.200이고 서브넷 마스크가 255.255.255.224일 때 다음 물음에 답하시오.</p><p>&nbsp;</p><p>이 호스트가 속한 네트워크 주소는 192.168.77.( ① )이다.</p><p>&nbsp;</p><p>이 네트워크에서 사용 가능한 호스트 수는 ( ② )개이다.</p><ol><li>(단, 네트워크 주소와 브로드캐스트 주소는 제외한다.)</li></ol>$q$,
 NULL, NULL,
 $q$① 192 / ② 30$q$,
 $q$255.255.255.224는 /27이므로 블록 크기 32. 200 ÷ 32 = 6, 6 × 32 = 192 → 네트워크 주소 192.168.77.192. 사용 가능 호스트는 32 - 2 = 30개.$q$,
 NULL,
 NULL),

(7, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 디자인 패턴의 이름을 보기에서 골라 쓰시오.$q$,
 $q$<p>한 객체의 상태가 변경되면 그 객체에 의존하는 다른 객체들에게 변경 사실이 자동으로 통보되고 각자 갱신이 이루어지도록 하는 행위(Behavioral) 패턴이다.</p><p>&nbsp;</p><p>주체(Subject)와 이를 구독하는 대상들 사이에 일대다(1:N) 의존 관계를 정의하며, 주체는 구독자의 구체적인 타입을 알 필요가 없어 결합도가 낮아진다.</p><p>&nbsp;</p><p>발행-구독(Publish-Subscribe) 구조나 이벤트 리스너 구현에 널리 사용된다.</p>$q$,
 NULL, NULL,
 $q$Observer$q$,
 $q$상태 변경 시 의존 객체에 자동 통보하는 1:N 관계, 발행-구독 → Observer 패턴.$q$,
 $q$["Adapter", "Observer", "Decorator", "Facade", "Singleton", "Strategy", "Proxy"]$q$,
 NULL),

(8, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 웹 아키텍처 스타일의 영문 약자를 쓰시오.$q$,
 $q$<p>( )은/는 자원(Resource)을 URI로 식별하고, HTTP 메서드(GET, POST, PUT, DELETE)로 해당 자원에 대한 행위를 표현하는 웹 아키텍처 스타일이다.</p><p>&nbsp;</p><p>서버가 클라이언트의 상태를 보관하지 않는 무상태성(Stateless)을 지키며, 자원의 표현(Representation)을 JSON이나 XML 형태로 주고받는다.</p><p>&nbsp;</p><p>이 스타일을 따르는 API를 흔히 ( )ful API라고 부른다.</p>$q$,
 NULL, NULL,
 $q$REST$q$,
 $q$URI로 자원 식별 + HTTP 메서드로 행위 표현 + 무상태성 → REST(Representational State Transfer).$q$,
 NULL,
 NULL),

(9, 'CODE',
 $q$다음 Java 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$public class Main {
    interface Calc {
        int run(int a, int b) throws Exception;
    }
    static int safe(Calc c, int a, int b) {
        try {
            return c.run(a, b);
        } catch (Exception e) {
            return -1;
        }
    }
    public static void main(String[] args) {
        Calc div = (a, b) -> {
            if (b == 0) {
                throw new Exception();
            }
            return a / b;
        };
        Calc mul = (a, b) -> a * b;
        System.out.print(safe(div, 10, 0) + safe(div, 9, 2) + safe(mul, 3, 4));
    }
}$q$,
 'java',
 $q$15$q$,
 $q$safe(div,10,0)은 b가 0이라 예외 발생 → -1. safe(div,9,2)는 정수 나눗셈 9/2 = 4. safe(mul,3,4)는 12. 세 값 모두 int이므로 -1 + 4 + 12 = 15.$q$,
 NULL,
 NULL),

(10, 'CODE',
 $q$다음 Java 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$public class Main {
    public static class Base {
        public int calc(int n) { return n * 2; }
        public static String tag() { return "B"; }
    }
    public static class Derived extends Base {
        public int calc(int n) { return n * 3; }
        public int calc(int n, int m) { return n + m; }
        public static String tag() { return "D"; }
    }
    public static void main(String[] args) {
        Base ref = new Derived();
        System.out.println(ref.calc(4) + ref.tag());
    }
}$q$,
 'java',
 $q$12B$q$,
 $q$인스턴스 메서드 calc는 동적 바인딩되어 실제 객체 타입 Derived의 것이 호출된다(4 * 3 = 12). 반면 static 메서드 tag는 정적 바인딩되어 참조 변수의 선언 타입 Base의 것이 호출되므로 "B". 결과는 "12B".$q$,
 NULL,
 NULL),

(11, 'SHORT_ANSWER',
 $q$다음 제어 흐름 그래프가 분기(Branch) 커버리지를 만족하기 위해 필요한 최소한의 테스트 경로를 모두 쓰시오.$q$,
 $q$<p>다음과 같은 제어 흐름 그래프가 있다.</p><p>&nbsp;</p><p>· 노드 1은 시작 노드이며 무조건 노드 2로 이동한다.</p><p>· 노드 2는 조건문으로, 참이면 노드 3으로, 거짓이면 노드 5로 이동한다.</p><p>· 노드 3은 조건문으로, 참이면 노드 4로, 거짓이면 노드 5로 이동한다.</p><p>· 노드 4는 무조건 노드 5로 이동한다.</p><p>· 노드 5는 무조건 노드 6으로 이동하며, 노드 6은 종료 노드이다.</p><p>&nbsp;</p><p>각 경로는 "1-2-3-4-5-6"과 같이 노드 번호를 하이픈으로 연결하여 표기하고, 여러 경로는 쉼표로 구분하여 쓰시오.</p>$q$,
 NULL, NULL,
 $q$1-2-3-4-5-6, 1-2-3-5-6, 1-2-5-6$q$,
 $q$분기는 2→3, 2→5, 3→4, 3→5의 4개다. 1-2-3-4-5-6이 2→3·3→4를, 1-2-3-5-6이 3→5를, 1-2-5-6이 2→5를 각각 담당한다. 2→5를 타면 노드 3을 거치지 않으므로 3의 거짓 분기를 같은 경로로 덮을 수 없어 최소 3개의 경로가 필요하다.$q$,
 NULL,
 NULL),

(12, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>
#define N 4

typedef struct {
    int buf[N];
    int head;
    int tail;
} Ring;

void push(Ring* r, int v) {
    r->buf[r->tail] = v;
    r->tail = (r->tail + 1) % N;
}

int pop(Ring* r) {
    int v = r->buf[r->head];
    r->head = (r->head + 1) % N;
    return v;
}

int main() {
    Ring r = {{0}, 0, 0};
    push(&r, 5);
    push(&r, 6);
    push(&r, 7);
    pop(&r);
    push(&r, 8);
    push(&r, 9);
    int a = pop(&r);
    int b = pop(&r);
    int c = pop(&r);
    printf("%d-%d-%d", a, b, c);
    return 0;
}$q$,
 'c',
 $q$6-7-8$q$,
 $q$push 5·6·7로 buf = [5,6,7,_], tail = 3. pop으로 5를 꺼내 head = 1. push 8은 buf[3], tail은 (3+1)%4 = 0으로 순환. push 9는 buf[0]에 덮어써 buf = [9,6,7,8]. 이후 pop 3회는 head 1·2·3 위치의 6, 7, 8을 차례로 반환한다.$q$,
 NULL,
 NULL),

(13, 'SCHEDULING',
 $q$다음 4개의 프로세스에 대해 라운드로빈 스케줄링을 적용할 때 평균 대기시간을 구하시오.$q$,
 $q$<p>운영체제에서 라운드로빈(Round Robin, RR) 스케줄링은 각 프로세스에 동일한 시간 할당량(타임 퀀텀)을 순차적으로 부여하며 CPU를 할당하는 방식이다.</p><p>&nbsp;</p><p>다음은 4개의 프로세스가 서로 다른 시간에 도착하며 각기 다른 실행 시간을 가지는 상황이다. 이때 시간 할당량은 3ms이고 컨텍스트 스위칭 시간은 무시한다고 가정한다.</p><p>&nbsp;</p><p>또한 타임 퀀텀이 소진되는 시점에 새로 도착한 프로세스가 있다면, 그 프로세스를 준비 큐에 먼저 넣은 뒤 할당량을 모두 사용한 프로세스를 뒤에 넣는다.</p><p>&nbsp;</p><p>아래 정보를 바탕으로 라운드로빈(RR) 방식으로 CPU 스케줄링을 수행할 경우 모든 프로세스의 평균 대기시간(Average Waiting Time)은 얼마인가?</p>$q$,
 NULL, NULL,
 $q$8.5$q$,
 $q$실행 순서는 P1(0~3) → P2(3~6, 종료) → P3(6~9) → P4(9~12) → P1(12~15, 종료) → P3(15~18) → P4(18~19, 종료) → P3(19~20, 종료)이다. 대기시간은 P1 = 9, P2 = 2, P3 = 11, P4 = 12이며 합 34를 4로 나누어 평균 8.5가 된다.$q$,
 NULL,
 $q${"algorithm": "RR", "timeQuantum": 3, "processes": [{"pid": "P1", "priority": null, "burstTime": 6, "arrivalTime": 0}, {"pid": "P2", "priority": null, "burstTime": 3, "arrivalTime": 1}, {"pid": "P3", "priority": null, "burstTime": 7, "arrivalTime": 2}, {"pid": "P4", "priority": null, "burstTime": 4, "arrivalTime": 3}]}$q$),

(14, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>

struct pt {
    int x;
    int y;
};

int main() {
    struct pt arr[] = {{2, 3}, {4, 5}, {6, 7}};
    struct pt* p = arr;
    struct pt** pp = &p;
    (*pp)[0] = (*pp)[2];
    (*pp)++;
    (*pp)->y = 9;
    printf("%d %d %d", arr[0].x, arr[1].y, p->x);
    return 0;
}$q$,
 'c',
 $q$6 9 4$q$,
 $q$(*pp)는 p와 같으므로 (*pp)[0] = (*pp)[2]는 arr[0]에 arr[2]의 값 {6,7}을 복사한다. (*pp)++로 p가 arr[1]을 가리키게 되고, (*pp)->y = 9로 arr[1] = {4, 9}가 된다. 따라서 arr[0].x = 6, arr[1].y = 9, p->x = arr[1].x = 4.$q$,
 NULL,
 NULL),

(15, 'CODE',
 $q$다음 Java 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$public class Main {
    public static class Box {
        public int n;
        public Box(int n) { this.n = n; }
    }
    public static void main(String[] args) {
        Box p = new Box(10);
        Box q = new Box(20);
        Box r = new Box(30);
        Box[] arr = { p, q, r };
        Box tmp = arr[1];
        arr[1] = arr[0];
        arr[0] = tmp;
        arr[2].n = arr[1].n + 5;
        System.out.println(p.n + "-" + q.n + "-" + r.n);
    }
}$q$,
 'java',
 $q$10-20-15$q$,
 $q$배열 원소를 교환해도 p·q·r가 가리키는 객체 자체는 바뀌지 않는다. 교환 후 arr = [q, p, r]이므로 arr[1]은 p(n = 10), arr[2]는 r이다. arr[2].n = 10 + 5 = 15로 r만 변경되어 출력은 10-20-15.$q$,
 NULL,
 NULL),

(16, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>

struct node {
    int v;
    struct node* next;
};

int main() {
    struct node a = {10, NULL};
    struct node b = {20, NULL};
    struct node c = {30, NULL};
    struct node d = {40, NULL};
    a.next = &b; b.next = &c; c.next = &d;
    b.next = &d; d.next = &c; c.next = NULL;
    struct node* h = &a;
    printf("%d %d %d %d", h->v, h->next->v, h->next->next->v, h->next->next->next->v);
    return 0;
}$q$,
 'c',
 $q$10 20 40 30$q$,
 $q$두 번째 연결 구문이 앞의 연결을 덮어써 최종 링크는 a → b → d → c → NULL이 된다. h는 a를 가리키므로 순서대로 10, 20, 40, 30이 출력된다.$q$,
 NULL,
 NULL),

(17, 'CODE',
 $q$다음 Python 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$nums = [2, 3, 4]
d = {n: n ** 2 for n in nums}
s = set(d.values())
d[5] = 9
d[2] = 100
s.add(100)
print(len(s & set(d.values())))$q$,
 'python',
 $q$3$q$,
 $q$d는 {2:4, 3:9, 4:16}으로 만들어지고 s = {4, 9, 16}이 된다. d[5] = 9를 추가하고 d[2] = 100으로 덮어쓰면 d의 값은 {100, 9, 16}이다. s에 100을 더하면 s = {4, 9, 16, 100}이고 교집합은 {9, 16, 100}이므로 길이는 3.$q$,
 NULL,
 NULL),

(18, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>
#include <stdlib.h>

struct node {
    char c;
    struct node* next;
};

struct node* build(const char* s) {
    struct node* head = NULL;
    struct node* tail = NULL;
    while (*s) {
        struct node* n = malloc(sizeof(struct node));
        n->c = *s++;
        n->next = NULL;
        if (head == NULL) {
            head = n;
            tail = n;
        } else {
            tail->next = n;
            tail = n;
        }
    }
    return head;
}

int main() {
    struct node* n = build("CODE");
    while (n) {
        if (n->next != NULL) {
            putchar(n->c);
        }
        struct node* t = n;
        n = n->next;
        free(t);
    }
    return 0;
}$q$,
 'c',
 $q$COD$q$,
 $q$build는 tail 삽입 방식이라 입력 순서를 유지한 C → O → D → E 리스트를 만든다. 출력 루프는 next가 NULL이 아닌 노드만 출력하므로 마지막 노드 E가 빠져 COD가 출력된다.$q$,
 NULL,
 NULL),

(19, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 네트워크 보안 공격의 명칭을 보기에서 골라 쓰시오.$q$,
 $q$<p>공격자가 출발지 IP 주소를 공격 대상(피해자)의 IP 주소로 위조한 ICMP Echo Request 패킷을 네트워크의 브로드캐스트 주소로 전송한다.</p><p>&nbsp;</p><p>해당 네트워크에 속한 다수의 호스트가 이 요청에 응답하면, 그 ICMP Echo Reply가 모두 위조된 출발지인 피해자에게 집중된다.</p><p>&nbsp;</p><p>공격자가 보낸 패킷 하나가 네트워크 호스트 수만큼 증폭되어 피해자에게 전달되므로, 적은 트래픽으로 큰 대역폭 고갈을 유발하는 증폭형 서비스 거부(DoS) 공격이다.</p>$q$,
 NULL, NULL,
 $q$Smurf$q$,
 $q$출발지 IP를 피해자로 위조한 ICMP 요청을 브로드캐스트로 보내 응답을 증폭시키는 공격 → Smurf Attack.$q$,
 $q$["Smurf", "SYN Flooding", "Teardrop", "Land", "Ping of Death", "Session Hijacking", "ARP Spoofing"]$q$,
 NULL),

(20, 'SHORT_ANSWER',
 $q$다음 사원 테이블에 대해 투영(Projection) 연산 π부서(사원)을 수행한 결과를 쓰시오.$q$,
 $q$<p>사원 테이블은 다음과 같다.</p><p>&nbsp;</p><p>| 사번 | 이름 | 부서 | 직급 |</p><p>| 1001 | 김철수 | 영업 | 대리 |</p><p>| 1002 | 이영희 | 개발 | 과장 |</p><p>| 1003 | 박민수 | 영업 | 사원 |</p><p>| 1004 | 최지훈 | 개발 | 대리 |</p><p>| 1005 | 정수연 | 인사 | 과장 |</p><p>&nbsp;</p><p>결과에 포함되는 값들을 쉼표로 구분하여 모두 쓰시오.</p>$q$,
 NULL, NULL,
 $q$영업, 개발, 인사$q$,
 $q$투영 연산은 지정한 속성만 남기고 중복 튜플을 제거한다. 부서 값 영업·개발·영업·개발·인사에서 중복을 제거하면 영업, 개발, 인사 3개가 남는다.$q$,
 NULL,
 NULL)
) AS v(seq, qt, instr, content, code, lang, answer, expl, opts, sched)
WHERE NOT EXISTS (SELECT 1 FROM questions q WHERE q.exam_id = e.id);

INSERT INTO examinations (created_at, time_limit, title, category_id, created_by, exam_paper_id)
SELECT now(), 150, '2025년 2회 정보처리기사 실기 (AI 커스텀)', 7, 1,
       (SELECT id FROM exams WHERE title = '2025년 2회 정보처리기사 실기 (AI 커스텀)' AND del_yn = 'N')
WHERE NOT EXISTS (
    SELECT 1 FROM examinations WHERE title = '2025년 2회 정보처리기사 실기 (AI 커스텀)'
);

COMMIT;

-- 검증
SELECT seq, question_type, (options IS NOT NULL) has_opt, (scheduling_data IS NOT NULL) has_sched,
       left(answer, 45) answer
FROM questions
WHERE exam_id = (SELECT id FROM exams WHERE title = '2025년 2회 정보처리기사 실기 (AI 커스텀)' AND del_yn='N')
ORDER BY seq;
