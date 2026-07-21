-- 목적: "2026년 2회 정보처리기사 실기" 원본(기존 그대로) 시험을 신규 생성한다.
-- 배경: 사용자가 직접 원문 텍스트를 붙여넣고 표/코드 스크린샷(references/images/img.png 등 8장)을
--       제공하여, 외부 블로그 스크래핑이 아닌 사용자 제공 자료를 근거로 등록한다.
-- 방식: 20문항 전부 텍스트/HTML 표로 변환(이미지로만 표현해야 하는 문항 없음). 정답은 추측하지
--       않고 CODE는 실제 실행(Java/Python), 시뮬레이션(C), SQL은 sqlite3 실제 실행, 계산형은
--       직접 계산으로 검증했다. 10번(서브네팅)은 사용자 지시로 자유 입력 대신 보기(ㄱ~ㅂ) 중
--       유효한 것을 고르는 형식으로 설계(정답 3개는 ipaddress 모듈로 서브넷 소속 검증).
--       20번(정규형)은 사용자가 표만으로 풀이 가능함을 확인해 원문 표·정답을 그대로 반영했다.
-- 대상: exams 1행 + questions 20행 + examinations 1행. 기존 데이터는 손대지 않는다.
-- 재실행 안전: 동일 제목 시험/문항/응시가 있으면 재삽입하지 않는다. id는 IDENTITY 자동.

BEGIN;

INSERT INTO exams (created_at, del_yn, order_no, question_mode, title, created_by)
SELECT now(), 'N', (SELECT COALESCE(MAX(order_no), 0) + 1 FROM exams), 'SEQUENTIAL',
       '2026년 2회 정보처리기사 실기', 1
WHERE NOT EXISTS (
    SELECT 1 FROM exams WHERE title = '2026년 2회 정보처리기사 실기' AND del_yn = 'N'
);

INSERT INTO questions (exam_id, seq, question_type, instruction, content, code, language, answer, explanation, options)
SELECT e.id, v.seq, v.qt, v.instr, v.content, v.code, v.lang, v.answer, v.expl, v.opts::jsonb
FROM (SELECT id FROM exams WHERE title = '2026년 2회 정보처리기사 실기' AND del_yn = 'N') e,
LATERAL (VALUES

(1, 'SHORT_ANSWER',
 $q$다음은 블랙박스 테스트 기법에 대한 설명이다. 괄호 ( ) 안에 들어갈 말을 보기에서 골라 쓰시오.$q$,
 $q$<p>( )은 프로그램의 입력 조건을 유효한 값과 유효하지 않은 값의 영역으로 나누고, 각 영역을 대표할 수 있는 값을 선정하여 테스트 케이스를 설계하는 명세 기반(블랙박스) 테스트 기법이다.</p><p>&nbsp;</p><table border="1"><caption>[표] 점수별 등급 기준</caption><thead><tr><th>점수</th><th>등급</th></tr></thead><tbody><tr><td>90 ~ 100</td><td>A</td></tr><tr><td>80 ~ 89</td><td>B</td></tr><tr><td>70 ~ 79</td><td>C</td></tr><tr><td>60 ~ 69</td><td>D</td></tr></tbody></table><p>&nbsp;</p><p>위 표에서 테스트 값으로 60을 입력하였을 때, 예상 결과와 실제 결과가 모두 등급 D로 일치하였다. 이는 ( ) 기법을 적용하여 각 등급 구간의 대표값을 테스트한 사례이다.</p>$q$,
 NULL, NULL,
 $q$동치분할 (Equivalence Partitioning)$q$,
 $q$입력 값을 유효/무효 영역(등급 구간)으로 나누고 대표값(60)만 테스트하는 명세 기반 기법 → 동치분할(Equivalence Partitioning).$q$,
 $q$["동치분할 (Equivalence Partitioning)", "경계값분석 (Boundary Value Analysis)", "결정테이블 테스트 (Decision Table Testing)", "상태전이 테스트 (State Transition Testing)"]$q$),

(2, 'CODE',
 $q$다음은 Java 코드에 대한 문제이다. 아래 코드를 확인하여 알맞는 출력값을 작성하시오.$q$,
 $q$<p><br></p>$q$,
 $q$class A {
    private int a;

    public A(int a) {
        this.a = a;
    }

    void print() {
        System.out.print(a + "a");
    }
}

class B extends A {
    private int b;

    B(int a, int b) {
        super(a);
        this.b = b;
    }

    void print() {
        super.print();
        System.out.print(b + "b");
    }
}

public class Main {
    public static void main(String[] args) {
        B obj = new B(10, 20);
        obj.print();
    }
}$q$,
 'java',
 $q$10a20b$q$,
 $q$B.print()는 super.print()로 A.print()를 먼저 실행해 "10a"를 출력하고, 이어서 자신의 필드 b로 "20b"를 출력해 결과는 "10a20b".$q$,
 NULL),

(3, 'SHORT_ANSWER',
 $q$다음은 소프트웨어 모듈 간의 결합도(Coupling)에 대한 설명이다. 괄호 안에 들어갈 말을 보기에서 골라 기호로 쓰시오.$q$,
 $q$<p>( )는 한 모듈이 다른 모듈 내부에 있는 변수나 기능을 직접 참조하거나 사용하는 경우에 발생하는 결합도로, 결합도 종류 중 결합 강도가 가장 높은 형태이다.</p>$q$,
 NULL, NULL,
 $q$내용결합도 (Content Coupling)$q$,
 $q$다른 모듈 내부 변수·기능을 직접 참조/사용 → 결합 강도가 가장 높은 내용결합도(Content Coupling).$q$,
 $q$["자료결합도 (Data Coupling)", "스탬프결합도 (Stamp Coupling)", "제어결합도 (Control Coupling)", "외부결합도 (External Coupling)", "내용결합도 (Content Coupling)", "공통결합도 (Common Coupling)"]$q$),

(4, 'SHORT_ANSWER',
 $q$다음은 라우팅 프로토콜에 대한 설명이다. 괄호 안에 들어갈 알맞은 용어를 쓰시오.$q$,
 $q$<p>( )는 링크 상태(Link State) 알고리즘을 사용하는 대표적인 내부 라우팅 프로토콜(IGP)이다. 다익스트라(Dijkstra) 알고리즘을 이용하여 최단 경로를 탐색하며, 대규모 네트워크에 적합하고 멀티캐스트를 지원한다.</p>$q$,
 NULL, NULL,
 $q$OSPF$q$,
 $q$링크 상태 알고리즘 + 다익스트라 최단 경로 탐색을 사용하는 IGP → OSPF(Open Shortest Path First).$q$,
 NULL),

(5, 'CODE',
 $q$다음은 파이썬 코드에 대한 문제이다. 아래 코드를 확인하여 알맞는 출력값을 작성하시오.$q$,
 $q$<p><br></p>$q$,
 $q$class LocationDict:
    locations = {
        "NYC": "New York",
        "LON": "London",
        "PAR": "Paris",
        "TKY": "Tokyo"
    }

tmpdict = LocationDict()
str01 = ""
for key, location in tmpdict.locations.items():
    keyk = key[-1]
    locationk = location[0]
    str01 += keyk + locationk

print(str01, end="")$q$,
 'python',
 $q$CNNLRPYT$q$,
 $q$딕셔너리 삽입 순서대로 순회한다. NYC→New York: 키 마지막 C, 값 첫 글자 N → "CN". LON→London: N, L → "NL". PAR→Paris: R, P → "RP". TKY→Tokyo: Y, T → "YT". 이어 붙이면 "CNNLRPYT".$q$,
 NULL),

(6, 'CODE',
 $q$다음은 파이썬 코드에 대한 문제이다. 아래 코드를 확인하여 알맞는 출력값을 작성하시오.$q$,
 $q$<p><br></p>$q$,
 $q$a = "_THIS_IS_KIM_SPEAKING"
b = a[:4]
c = a[6:8]
d = a[18:]
e = b + c + d
print(e)$q$,
 'python',
 $q$_THIISING$q$,
 $q$b=a[:4]="_THI", c=a[6:8]="IS", d=a[18:]="ING". 이어 붙이면 "_THI"+"IS"+"ING" = "_THIISING".$q$,
 NULL),

(7, 'CODE',
 $q$다음은 C언어 코드에 대한 문제이다. 아래 코드를 확인하여 알맞는 출력값을 작성하시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>

typedef struct N {
    int v;
    struct N* a;
    struct N* b;
} N;

int c = 0;
int ans = 0;

void pst(N *n) {
    if (!n) return;
    pst(n->a);
    pst(n->b);
    if (++c == 3) ans = n->v;
}

int main() {
    N ne = {35, 0, 0};
    N nd = {64, 0, 0};
    N nc = {53, 0, 0};
    N nb = {12, &ne, &nc};
    N na = {21, &nb, &nd};

    pst(&na);
    printf("%d\n", ans);
    return 0;
}$q$,
 'c',
 $q$12$q$,
 $q$후위순회(pst) 순서는 nb의 왼쪽(ne=35)→nb의 오른쪽(nc=53)→nb(12)→na의 오른쪽(nd=64)→na(21)이다. 방문 순서는 35(1번째)→53(2번째)→12(3번째)→64(4번째)→21(5번째)이며, 세 번째로 방문된 노드는 nb(12)이므로 ans=12.$q$,
 NULL),

(8, 'SHORT_ANSWER',
 $q$다음 프로세스들을 SRT(Shortest Remaining Time) 스케줄링 기법으로 처리할 때, 평균 대기시간을 구하시오. (단위: ms)$q$,
 $q$<table border="1"><thead><tr><th>프로세스</th><th>도착시간</th><th>버스트시간</th></tr></thead><tbody><tr><td>P1</td><td>0</td><td>8</td></tr><tr><td>P2</td><td>1</td><td>4</td></tr><tr><td>P3</td><td>2</td><td>9</td></tr><tr><td>P4</td><td>3</td><td>5</td></tr></tbody></table>$q$,
 NULL, NULL,
 $q$6.5$q$,
 $q$실행 순서는 P1(0~1)→P2 도착(남은시간3&lt;P1의 남은7, 선점) P2(1~5, 종료)→P4 도착(남은5&lt;P1의 남은7, 선점) P4(5~10, 종료)→P1(10~17, 종료)→P3(17~26, 종료)이다. 대기시간은 P1=17-0-8=9, P2=5-1-4=0, P3=26-2-9=15, P4=10-3-5=2이며 합 26을 4로 나누면 평균 6.5ms.$q$,
 NULL),

(9, 'CODE',
 $q$다음은 C언어 코드에 대한 문제이다. 아래 코드를 확인하여 알맞는 출력값을 작성하시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>

void fn1(int* i) { *i = 50; }
void fn2(int i) { i = 60; }

void fn34(int* p) {
    printf("3. %d\n", *p);
    printf("4. %d\n", *(p + 3));
}

int main() {
    int i = 30;
    int list[] = {2, 4, 6, 8, 10};

    fn1(&i);
    printf("1. %d\n", i);

    fn2(i);
    printf("2. %d\n", i);

    fn34(list);

    return 0;
}$q$,
 'c',
 $q$1. 50 / 2. 50 / 3. 2 / 4. 8$q$,
 $q$fn1은 포인터로 i를 직접 50으로 바꾼다(①). fn2는 값을 복사받아 지역적으로만 60이 되므로 i는 그대로 50이다(②). fn34(list)는 p=list이므로 *p=list[0]=2(③), *(p+3)=list[3]=8(④).$q$,
 NULL),

(10, 'SHORT_ANSWER',
 $q$다음은 네트워크 A, B, C에 속한 호스트의 IP 주소 목록이다. 아래 표의 (2), (4), (5)번 괄호에 들어갈 수 있는 IP 주소를 보기에서 각각 골라 쓰시오.$q$,
 $q$<table border="1"><thead><tr><th>번호</th><th>IP 주소 / 서브넷</th></tr></thead><tbody><tr><td>(1)</td><td>192.168.35.3/24</td></tr><tr><td>(2)</td><td>( )</td></tr><tr><td>(3)</td><td>129.200.10.72/22</td></tr><tr><td>(4)</td><td>( )</td></tr><tr><td>(5)</td><td>( )</td></tr><tr><td>(6)</td><td>192.168.36.16/24</td></tr></tbody></table><p>(1)·(2)는 네트워크 A, (3)·(4)는 네트워크 B, (5)·(6)은 네트워크 C에 속한 호스트다. 같은 네트워크에 속하려면 네트워크 주소·브로드캐스트 주소를 제외한 유효 호스트 범위 안에 있어야 한다.</p><p>[보기]</p><p>ㄱ. 192.168.35.72</p><p>ㄴ. 192.168.34.50</p><p>ㄷ. 129.200.8.249</p><p>ㄹ. 129.200.12.10</p><p>ㅁ. 192.168.36.249</p><p>ㅂ. 192.168.37.5</p>$q$,
 NULL, NULL,
 $q$(2) ㄱ / (4) ㄷ / (5) ㅁ$q$,
 $q$네트워크 A는 192.168.35.0/24(호스트 .1~.254)이므로 같은 대역인 ㄱ(192.168.35.72)만 해당하고 ㄴ(192.168.34.50)은 다른 대역이다. 네트워크 B는 129.200.10.72/22 → 블록 시작 129.200.8.0, 범위 129.200.8.0~11.255(호스트 129.200.8.1~11.254)이므로 ㄷ(129.200.8.249)만 해당하고 ㄹ(129.200.12.10)은 범위 밖이다. 네트워크 C는 192.168.36.0/24(호스트 .1~.254)이므로 ㅁ(192.168.36.249)만 해당하고 ㅂ(192.168.37.5)은 다른 대역이다.$q$,
 NULL),

(11, 'SHORT_ANSWER',
 $q$다음은 GoF(Gang of Four) 디자인 패턴에 대한 설명이다. 괄호 안에 들어갈 알맞은 용어를 쓰시오.$q$,
 $q$<p>( )는 서로 관련 있는 여러 객체(제품군)를 생성하기 위한 인터페이스를 제공하는 생성 패턴으로, Kit이라고도 불린다. 이 패턴을 사용하면 구체적인 클래스를 지정하지 않고도 연관된 제품군 전체를 한 번에 변경할 수 있다.</p>$q$,
 NULL, NULL,
 $q$추상 팩토리 (Abstract Factory)$q$,
 $q$관련 제품군을 구체 클래스 지정 없이 생성하는 인터페이스, Kit로도 불림 → 추상 팩토리(Abstract Factory) 패턴.$q$,
 NULL),

(12, 'SHORT_ANSWER',
 $q$다음 &lt;학생&gt; 테이블에서 성이 '이'씨인 학생의 정보를 조회하되, 학번을 기준으로 내림차순 정렬하여 출력하고자 한다. SQL문의 괄호 안에 들어갈 알맞은 내용을 각각 쓰시오.$q$,
 $q$<p><strong>[표] &lt;학생&gt;</strong></p><table border="1"><thead><tr><th>학번</th><th>성명</th><th>학과</th></tr></thead><tbody><tr><td>2020001</td><td>이몽룡</td><td>컴퓨터공학과</td></tr><tr><td>2020002</td><td>김철수</td><td>전자공학과</td></tr><tr><td>2020003</td><td>이순신</td><td>정보통신공학과</td></tr><tr><td>2020004</td><td>박영희</td><td>컴퓨터공학과</td></tr></tbody></table><p><strong>[SQL문]</strong></p><pre><code>SELECT * FROM 학생
WHERE 성명 LIKE '( 1 )'
ORDER BY 학번 ( 2 );</code></pre>$q$,
 NULL, NULL,
 $q$① 이% / ② DESC$q$,
 $q$성이 '이'로 시작하는 이름은 LIKE '이%'로 조회하고, 내림차순 정렬은 ORDER BY 절에 DESC를 붙인다.$q$,
 NULL),

(13, 'SHORT_ANSWER',
 $q$다음 &lt;A&gt;, &lt;B&gt; 테이블과 SQL문을 참고하여, SQL문을 실행했을 때 출력되는 RESULT 값을 구하시오.$q$,
 $q$<p><strong>[표] &lt;A&gt;</strong></p><table border="1"><thead><tr><th>id</th><th>x</th></tr></thead><tbody><tr><td>1</td><td>10</td></tr><tr><td>2</td><td>20</td></tr><tr><td>3</td><td>30</td></tr><tr><td>4</td><td>40</td></tr></tbody></table><p><strong>[표] &lt;B&gt;</strong></p><table border="1"><thead><tr><th>id</th><th>y</th></tr></thead><tbody><tr><td>1</td><td>5</td></tr><tr><td>1</td><td>15</td></tr><tr><td>2</td><td>20</td></tr><tr><td>3</td><td>35</td></tr><tr><td>5</td><td>50</td></tr></tbody></table><p><strong>[SQL문]</strong></p><pre><code>SELECT COUNT(*) AS RESULT
FROM A
WHERE x > (
   SELECT AVG(y)
   FROM B
   WHERE B.id IN (
      SELECT A2.id
      FROM A AS A2
      WHERE A2.x < A.x
   )
);</code></pre>$q$,
 NULL, NULL,
 $q$3$q$,
 $q$A의 각 행마다 자신보다 x가 작은 A 행들의 id 집합을 구해 B에서 해당 id의 y 평균과 비교한다. id=1(x=10)은 자신보다 작은 x가 없어 서브쿼리 결과가 빈 집합이 되고 AVG는 NULL이라 조건이 거짓이다. id=2(x=20)는 id=1의 y평균(5,15→10)과 비교해 20&gt;10 참. id=3(x=30)은 id=1,2의 y평균((5+15+20)/3≈13.3)과 비교해 30&gt;13.3 참. id=4(x=40)는 id=1,2,3의 y평균((5+15+20+35)/4=18.75)과 비교해 40&gt;18.75 참. 참인 행은 3개이므로 RESULT=3.$q$,
 NULL),

(14, 'SHORT_ANSWER',
 $q$다음 &lt;A&gt;, &lt;B&gt; 테이블과 SQL문을 참고하여, SQL문을 실행했을 때 출력되는 결과값을 구하시오.$q$,
 $q$<p><strong>[표] &lt;A&gt;</strong></p><table border="1"><thead><tr><th>id</th><th>v</th></tr></thead><tbody><tr><td>1</td><td>10</td></tr><tr><td>1</td><td>20</td></tr><tr><td>2</td><td>30</td></tr></tbody></table><p><strong>[표] &lt;B&gt;</strong></p><table border="1"><thead><tr><th>id</th><th>w</th></tr></thead><tbody><tr><td>1</td><td>100</td></tr><tr><td>2</td><td>200</td></tr><tr><td>3</td><td>300</td></tr><tr><td>4</td><td>400</td></tr></tbody></table><p><strong>[SQL문]</strong></p><pre><code>SELECT COUNT(*)
FROM A RIGHT OUTER JOIN B
   ON A.id = B.id
WHERE A.id IS NULL;</code></pre>$q$,
 NULL, NULL,
 $q$2$q$,
 $q$B를 기준으로 A와 RIGHT OUTER JOIN하면 B.id=1은 A에 두 행(10,20)이 매칭되고 B.id=2는 A에 한 행(30)이 매칭된다. B.id=3, 4는 A에 매칭되는 행이 없어 A.id가 NULL로 채워진다. WHERE A.id IS NULL을 만족하는 행은 B.id=3, 4 두 건이므로 결과는 2.$q$,
 NULL),

(15, 'CODE',
 $q$다음은 Java 코드에 대한 문제이다. 아래 코드를 확인하여 알맞는 출력값을 작성하시오.$q$,
 $q$<p><br></p>$q$,
 $q$class A {
    int a = 1;
    private int b = 5;
    protected int c = 3;

    int hap() { return a + b + c; }
}

class B extends A {
    int a = 10;
    int c = 50;

    public int hap() { return a * c; }
}

class Main {
    public static void main(String[] args) {
        A aaa = new A();
        B bbb = new B();
        System.out.printf("%d", aaa.hap() + bbb.hap());
    }
}$q$,
 'java',
 $q$509$q$,
 $q$aaa.hap()은 A의 hap()이 실행되어 a+b+c=1+5+3=9. bbb.hap()은 B에서 오버라이드된 hap()이 실행되어 자신의 필드 a(10)*c(50)=500. 합은 9+500=509.$q$,
 NULL),

(16, 'SHORT_ANSWER',
 $q$다음은 IP 주소 서브네팅(Subnetting)에 대한 설명이다. 물음에 답하시오.$q$,
 $q$<p>10.0.0.0/27 네트워크를 동일한 크기의 2개 서브넷으로 분할하였다.</p><p>&nbsp;</p><p>- 첫 번째 서브넷: 10.0.0.0 ~ 10.0.0.15</p><p>- 두 번째 서브넷: 10.0.0.16 ~ 10.0.0.31</p><p>&nbsp;</p><p>이때 10.0.0.1이 속한 서브넷의 프리픽스 길이(비트 수)를 구하시오.</p>$q$,
 NULL, NULL,
 $q$28$q$,
 $q$10.0.0.1은 첫 번째 서브넷(10.0.0.0~10.0.0.15, 16개 주소)에 속한다. 16개 주소는 2^4이므로 호스트 비트 4개, 프리픽스 길이는 32-4=28.$q$,
 NULL),

(17, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 보안 기술 용어를 쓰시오.$q$,
 $q$<p>입력값의 길이와 상관없이 항상 정해진 길이의 결과값을 만들어내는 암호 기술이 있다.</p><p>&nbsp;</p><p>이 기술은 단방향성을 가지고 있어 결과값만으로는 원래의 입력값을 알아낼 수 없으며, 서로 다른 두 입력값이 같은 결과값을 만들어내는 경우가 최대한 발생하지 않도록 설계되어야 한다.</p><p>&nbsp;</p><p>이러한 성질을 가진 암호 기술을 무엇이라 하는가?</p>$q$,
 NULL, NULL,
 $q$해시 (Hash)$q$,
 $q$고정 길이 출력·단방향성·충돌 최소화가 특징인 암호 기술 → 해시(Hash).$q$,
 NULL),

(18, 'CODE',
 $q$다음은 C언어 코드에 대한 문제이다. 아래 코드를 확인하여 알맞는 출력값을 작성하시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>

int c(int n) {
    if (n <= 1) return n;
    return c(n - 1) + c(n - 3);
}

int main() {
    printf("%d", c(5));
    return 0;
}$q$,
 'c',
 $q$1$q$,
 $q$c(5)=c(4)+c(2). c(4)=c(3)+c(1)=c(3)+1. c(3)=c(2)+c(0). c(2)=c(1)+c(-1)=1+(-1)=0(c(-1)은 n&lt;=1이라 n 그대로 반환하여 -1). 따라서 c(3)=0+0=0, c(4)=0+1=1, c(5)=c(4)+c(2)=1+0=1.$q$,
 NULL),

(19, 'SHORT_ANSWER',
 $q$다음은 SEASON이라는 도메인을 정의하면서, 입력 가능한 값을 봄/여름/가을/겨울로 제한하는 SQL문이다. 괄호 안에 들어갈 알맞은 키워드를 쓰시오.$q$,
 $q$<p>CREATE DOMAIN SEASON AS VARCHAR(6)</p><p>&nbsp;&nbsp;&nbsp;( ) (VALUE IN ('spring', 'summer', 'autumn', 'winter'));</p>$q$,
 NULL, NULL,
 $q$CHECK$q$,
 $q$도메인에 입력 가능한 값의 범위를 제한하는 제약조건 키워드는 CHECK다.$q$,
 NULL),

(20, 'SHORT_ANSWER',
 $q$아래 표에서 나타나고 있는 정규형을 작성하시오.$q$,
 $q$<table border="1"><thead><tr><th>고객아이디</th><th>강좌명</th><th>강사번호</th></tr></thead><tbody><tr><td>apple</td><td>영어회화</td><td>P001</td></tr><tr><td>banana</td><td>기초토익</td><td>P002</td></tr><tr><td>carrot</td><td>영어회화</td><td>P001</td></tr><tr><td>carrot</td><td>기초토익</td><td>P004</td></tr><tr><td>orange</td><td>영어회화</td><td>P003</td></tr><tr><td>orange</td><td>기초토익</td><td>P004</td></tr></tbody></table>$q$,
 NULL, NULL,
 $q$제 3정규형$q$,
 $q$기본키(고객아이디, 강좌명)에 강사번호가 함수적으로 종속되며, 이행적 종속이나 부분함수종속 없이 성립하는 관계로 제3정규형을 만족한다.$q$,
 NULL)

) AS v(seq, qt, instr, content, code, lang, answer, expl, opts)
WHERE NOT EXISTS (SELECT 1 FROM questions q WHERE q.exam_id = e.id);

INSERT INTO examinations (created_at, time_limit, title, category_id, created_by, exam_paper_id)
SELECT now(), 150, '2026년 2회 정보처리기사 실기', 7, 1,
       (SELECT id FROM exams WHERE title = '2026년 2회 정보처리기사 실기' AND del_yn = 'N')
WHERE NOT EXISTS (
    SELECT 1 FROM examinations WHERE title = '2026년 2회 정보처리기사 실기'
);

COMMIT;

-- 검증
SELECT seq, question_type, (options IS NOT NULL) has_opt, left(answer, 45) answer
FROM questions
WHERE exam_id = (SELECT id FROM exams WHERE title = '2026년 2회 정보처리기사 실기' AND del_yn='N')
ORDER BY seq;
