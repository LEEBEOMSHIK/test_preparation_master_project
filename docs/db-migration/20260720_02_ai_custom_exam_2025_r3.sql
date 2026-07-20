-- 목적: "2025년 3회 정보처리기사 실기 (AI 커스텀)" 시험을 신규 생성한다.
-- 배경: 저작권 문제로 활용이 어려운 2025년 3회 기출 20문항을, 동일 개념만 유지하고
--       코드 로직·문제 구성·값을 모두 새로 설계한 AI 커스텀 20문항으로 재구성한다.
--       CODE는 원본 코드 골격을 재사용하지 않고 다른 코드로 같은 개념을 검증하며,
--       용어 선택형 단답(1·2·3·4·16·18·19)은 구조화 보기(options)를 제공한다.
--       CODE 실행 결과 정답은 직접 계산·검증했다.
-- 대상: exams 1행 + questions 20행 + examinations 1행. 기존 데이터는 손대지 않는다.
-- 재실행 안전: 동일 제목 시험/문항/응시가 있으면 재삽입하지 않는다. id는 IDENTITY 자동.

BEGIN;

INSERT INTO exams (created_at, del_yn, order_no, question_mode, title, created_by)
SELECT now(), 'N', (SELECT COALESCE(MAX(order_no), 0) + 1 FROM exams), 'SEQUENTIAL',
       '2025년 3회 정보처리기사 실기 (AI 커스텀)', 1
WHERE NOT EXISTS (
    SELECT 1 FROM exams WHERE title = '2025년 3회 정보처리기사 실기 (AI 커스텀)' AND del_yn = 'N'
);

INSERT INTO questions (exam_id, seq, question_type, instruction, content, code, language, answer, explanation, options)
SELECT e.id, v.seq, v.qt, v.instr, v.content, v.code, v.lang, v.answer, v.expl, v.opts::jsonb
FROM (SELECT id FROM exams WHERE title = '2025년 3회 정보처리기사 실기 (AI 커스텀)' AND del_yn = 'N') e,
LATERAL (VALUES
(1, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 UML 다이어그램의 명칭을 보기에서 골라 쓰시오.$q$,
 $q$<p>( ) 다이어그램은 시스템을 실행 파일·라이브러리·모듈 등 물리적 구성 요소 단위로 나누고, 각 구성 요소가 제공하거나 요구하는 인터페이스와 그 의존 관계를 표현하는 UML 구조 다이어그램이다. 코드의 배포·물리 구조를 시각화할 때 사용된다.</p>$q$,
 NULL, NULL,
 $q$컴포넌트$q$,
 $q$물리적 구성 요소·인터페이스·의존 관계 표현 → 컴포넌트 다이어그램.$q$,
 $q$["활동", "상태", "클래스", "객체", "순서", "패키지", "컴포넌트"]$q$),

(2, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 화이트박스 테스트 커버리지 기법을 보기에서 고르시오.$q$,
 $q$<p>프로그램 내 각 결정문(분기)이 참(True)과 거짓(False)의 결과를 각각 최소 한 번씩 실행하도록 테스트 케이스를 설계하는 커버리지이다. 문장 커버리지보다 강하지만, 결정문 안의 개별 조건까지 따지지는 않는다.</p>$q$,
 NULL, NULL,
 $q$분기$q$,
 $q$결정문의 True/False 결과를 모두 실행 → 분기(결정) 커버리지.$q$,
 $q$["문장", "분기", "조건", "다중 조건", "조건 결정", "경로", "변경 조건 결정"]$q$),

(3, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 유닉스/리눅스 명령어를 보기에서 골라 순서대로 쓰시오.$q$,
 $q$<p>1. 파일이나 디렉터리의 접근 권한을 변경한다.</p><p>2. 현재 실행 중인 프로세스 목록을 확인한다.</p><p>3. 파일의 내용을 화면에 출력한다.</p><p>4. 파일이나 디렉터리를 삭제한다.</p>$q$,
 NULL, NULL,
 $q$chmod / ps / cat / rm$q$,
 $q$권한 변경 chmod, 프로세스 ps, 내용 출력 cat, 삭제 rm.$q$,
 $q$["ls", "cat", "rm", "ps", "chmod", "mv", "grep"]$q$),

(4, 'SHORT_ANSWER',
 $q$다음은 오류 검출 및 정정 방식에 관한 설명이다. 괄호에 알맞은 용어를 보기에서 골라 쓰시오.$q$,
 $q$<p>( ① ) 코드는 데이터 비트에 여러 개의 패리티 비트를 추가하여 오류를 검출·정정하는 자기 정정 코드이다.</p><p>( ② )는 수신 측이 스스로 오류를 정정하는 전진 오류 수정 방식이다.</p><p>( ③ )는 오류 검출 시 송신 측에 재전송을 요청하는 후진 오류 수정 방식이다.</p><p>( ④ ) 검사는 1의 개수가 짝수(또는 홀수)가 되도록 1비트를 추가해 오류를 검출한다.</p><p>( ⑤ )는 다항식 나눗셈의 나머지를 이용해 오류를 검출한다.</p>$q$,
 NULL, NULL,
 $q$Hamming / FEC / BEC / Parity / CRC$q$,
 $q$자기정정 Hamming, 전진 FEC, 후진 BEC, 패리티 Parity, 다항식 CRC.$q$,
 $q$["Hamming", "FEC", "BEC", "Parity", "CRC", "NAK", "BCD", "MD5"]$q$),

(5, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>

struct Item {
    int code;
    const char *name;
};

int main() {
    struct Item items[] = {{10, "ALPHA"}, {20, "BETA"}, {30, "GAMMA"}};
    struct Item *p = items + 2;
    printf("%c", *(p->name + (p->code / 10)));
    return 0;
}$q$,
 'c', $q$M$q$,
 $q$p는 items[2]={30,"GAMMA"}. code/10=3이므로 "GAMMA"[3] = 'M'.$q$,
 NULL),

(6, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>

int main(void) {
    char s[] = "ALGORITHM";
    int n = 0;
    while (s[n] != '\0') n++;
    for (int i = n - 1; i >= n - 3; i--)
        putchar(s[i]);
    return 0;
}$q$,
 'c', $q$MHT$q$,
 $q$"ALGORITHM"의 길이 9. 마지막 3글자를 역순 출력: s[8]s[7]s[6] = M,H,T → "MHT".$q$,
 NULL),

(7, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>

struct Node {
    struct Node* next;
    unsigned int v;
};

int main() {
    struct Node n1 = {0, 3u};
    struct Node n2 = {0, 6u};
    struct Node n3 = {0, 9u};
    n1.next = &n2;
    n2.next = &n3;
    struct Node* cur = &n1;
    unsigned int acc = 1;
    while (cur) {
        acc = acc * 2 + cur->v;
        cur = cur->next;
    }
    acc = (acc | 16u) + 5u;
    printf("%u", acc);
}$q$,
 'c', $q$62$q$,
 $q$n1→n2→n3 순회로 acc: 1→5→16→41. (41 | 16)=57, +5=62.$q$,
 NULL),

(8, 'SHORT_ANSWER',
 $q$다음 Java 코드에서 인터페이스를 구현할 때 빈칸 ①에 들어갈 키워드를 쓰시오.$q$,
 $q$<p>interface Movable {<br>&nbsp;&nbsp;&nbsp;&nbsp;void move();<br>}<br><br>class Car ( ① ) Movable {<br>&nbsp;&nbsp;&nbsp;&nbsp;public void move() {<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;System.out.println("drive");<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>}</p>$q$,
 NULL, NULL,
 $q$implements$q$,
 $q$클래스가 인터페이스를 구현할 때는 implements 키워드를 사용한다.$q$,
 NULL),

(9, 'CODE',
 $q$다음 Python 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$words = ["apple", "kiwi", "banana", "fig"]
result = {}
for i, w in enumerate(words):
    result[w] = (len(w), w[0].upper())
print(result)$q$,
 'python', $q${'apple': (5, 'A'), 'kiwi': (4, 'K'), 'banana': (6, 'B'), 'fig': (3, 'F')}$q$,
 $q$각 단어를 키로, (길이, 첫 글자 대문자) 튜플을 값으로 저장한다.$q$,
 NULL),

(10, 'SHORT_ANSWER',
 $q$다음 데이터와 SQL을 참고하여 실행 결과로 조회되는 행의 수를 쓰시오.$q$,
 $q$<p>A 테이블 (col1, col2): (1, 10), (2, 20), (3, NULL), (4, 20), (5, 10)</p><p>SELECT col1 FROM A WHERE col2 IS NOT NULL;</p>$q$,
 NULL, NULL,
 $q$4$q$,
 $q$col2가 NULL인 3번 행을 제외한 4개 행이 조회된다.$q$,
 NULL),

(11, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 인증 기술의 영문 약자를 쓰시오.$q$,
 $q$<p>매 인증마다 시간 또는 카운터를 기반으로 새로운 일회용 값을 생성하며, 한 번 사용하면 즉시 폐기되어 재사용이 불가능하다. 재전송 공격을 방지하면서 사용자 편의성을 제공해 은행 등 고보안 인증에 널리 쓰인다.</p>$q$,
 NULL, NULL,
 $q$OTP$q$,
 $q$One-Time Password — 일회용 비밀번호.$q$,
 NULL),

(12, 'CODE',
 $q$다음 Java 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$class Animal {
    int legs;
    Animal(int legs) { this.legs = legs; }
}

class Spider extends Animal {
    Spider() { super(8); }
    int totalLegs(int count) { return legs * count; }
}

public class Main {
    public static void main(String[] args) {
        Spider s = new Spider();
        System.out.println(s.totalLegs(3));
    }
}$q$,
 'java', $q$24$q$,
 $q$Spider()가 super(8)로 legs=8을 설정, totalLegs(3)=8*3=24.$q$,
 NULL),

(13, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 인가 프로토콜의 명칭을 쓰시오.$q$,
 $q$<p>사용자의 비밀번호를 제3자 애플리케이션에 노출하지 않고, 사용자가 승인한 범위에 대해서만 접근 권한을 위임하는 개방형 인가(Authorization) 표준이다. 서비스 제공자가 Access Token을 발급하며, 소셜 로그인에 널리 사용된다.</p>$q$,
 NULL, NULL,
 $q$OAuth$q$,
 $q$비밀번호 노출 없이 접근 권한을 위임하는 개방형 인가 표준.$q$,
 NULL),

(14, 'SHORT_ANSWER',
 $q$다음 주문 내역에서 상품 A·B·C를 모두 주문한 고객을 쓰시오(관계 대수의 나눗셈 ÷).$q$,
 $q$<p>ORDERS (고객, 상품) = (김, A), (김, B), (이, A), (박, A), (박, B), (박, C)</p><p>구매 상품 집합이 {A, B, C}를 포함하는 고객은?</p>$q$,
 NULL, NULL,
 $q$박$q$,
 $q$A·B·C를 모두 주문한 고객은 박 한 명이다(김은 C 미주문, 이는 A만).$q$,
 NULL),

(15, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>

int main() {
    int a = 6, b = 5, c;
    c = a % 4 > 1 ? 3 : 0;
    c = c | c << 1;
    c = b > 4 && c >= 8 ? c - b : c + b;
    printf("%d", c);
    return 0;
}$q$,
 'c', $q$12$q$,
 $q$a%4=2>1 → c=3. c | (c<<1) = 3|6 = 7. b>4는 참이나 7>=8은 거짓 → c+b = 7+5 = 12.$q$,
 NULL),

(16, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 관계형 데이터베이스 용어를 보기에서 골라 쓰시오.$q$,
 $q$<p>( ㄱ ): 릴레이션의 열(Column)에 해당하며, 데이터의 항목·특성을 나타낸다.</p><p>( ㄴ ): 한 릴레이션에서 속성(열)의 개수를 나타낸다.</p><p>( ㄷ ): 릴레이션의 구조(속성·도메인·제약조건)를 정의한 것이다.</p>$q$,
 NULL, NULL,
 $q$속성 / 차수 / 스키마$q$,
 $q$열=속성, 열의 개수=차수, 구조 정의=스키마.$q$,
 $q$["속성", "튜플", "차수", "카디널리티", "스키마", "인스턴스", "도메인"]$q$),

(17, 'CODE',
 $q$다음 Java 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$enum Color {
    RED(1), GREEN(2), BLUE(3);
    private int n;
    Color(int n) { this.n = n; }
    public int num() { return n; }
}

public class Main {
    public static void main(String[] args) {
        Color c = Color.values()[Color.GREEN.ordinal() + 1];
        System.out.print(c + ":" + c.num());
    }
}$q$,
 'java', $q$BLUE:3$q$,
 $q$GREEN.ordinal()=1, +1=2, values()[2]=BLUE. BLUE의 n은 3 → "BLUE:3".$q$,
 NULL),

(18, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 접근통제 모델의 명칭을 보기에서 골라 쓰시오.$q$,
 $q$<p>( ㄱ ): 주체와 객체에 부여된 보안 등급(라벨)을 비교해 접근을 결정하며, 시스템이 강제로 통제하는 모델이다.</p><p>( ㄴ ): 사용자에게 직접 권한을 주지 않고 역할(Role)을 매개로 권한을 부여하는 모델이다.</p><p>( ㄷ ): 객체의 소유자가 다른 사용자에게 접근 권한을 자율적으로 부여·회수하는 모델이다.</p>$q$,
 NULL, NULL,
 $q$MAC / RBAC / DAC$q$,
 $q$강제(등급 비교)=MAC, 역할 기반=RBAC, 소유자 임의=DAC.$q$,
 $q$["DAC", "MAC", "RBAC", "MLS", "ABAC"]$q$),

(19, 'SHORT_ANSWER',
 $q$테스트 케이스의 주요 구성 요소이다. 각 설명에 해당하는 용어를 보기에서 골라 쓰시오.$q$,
 $q$<p>1. 테스트를 수행하기 위한 사전 조건·입력 환경</p><p>2. 테스트 실행 시 입력하는 실제 값</p><p>3. 입력에 대해 기대되는 정상 출력</p>$q$,
 NULL, NULL,
 $q$테스트 조건 / 테스트 데이터 / 예상 결과$q$,
 $q$사전 조건=테스트 조건, 입력 값=테스트 데이터, 기대 출력=예상 결과.$q$,
 $q$["테스트 조건", "테스트 데이터", "예상 결과", "수행 단계", "테스트 환경", "성공 기준", "테스트 유형"]$q$),

(20, 'SHORT_ANSWER',
 $q$다음 데이터와 SQL을 참고하여 실행 결과를 쓰시오.$q$,
 $q$<p>A 테이블 (col1, col2): (1, 5), (2, NULL), (3, 7), (4, 5), (5, 9)</p><p>SELECT COUNT(col2) FROM A WHERE col1 &gt;= 3 OR col2 = 5;</p>$q$,
 NULL, NULL,
 $q$4$q$,
 $q$조건을 만족하는 행은 1·3·4·5. 그중 col2가 NULL이 아닌 값의 개수는 4.$q$,
 NULL)
) AS v(seq, qt, instr, content, code, lang, answer, expl, opts)
WHERE NOT EXISTS (SELECT 1 FROM questions q WHERE q.exam_id = e.id);

INSERT INTO examinations (created_at, time_limit, title, category_id, created_by, exam_paper_id)
SELECT now(), 150, '2025년 3회 정보처리기사 실기 (AI 커스텀)', 7, 1,
       (SELECT id FROM exams WHERE title = '2025년 3회 정보처리기사 실기 (AI 커스텀)' AND del_yn = 'N')
WHERE NOT EXISTS (
    SELECT 1 FROM examinations WHERE title = '2025년 3회 정보처리기사 실기 (AI 커스텀)'
);

COMMIT;

-- 검증
SELECT seq, question_type, (options IS NOT NULL) has_opt, left(answer, 45) answer FROM questions
WHERE exam_id = (SELECT id FROM exams WHERE title = '2025년 3회 정보처리기사 실기 (AI 커스텀)' AND del_yn='N')
ORDER BY seq;
