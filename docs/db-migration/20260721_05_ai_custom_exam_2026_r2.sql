-- 목적: "2026년 2회 정보처리기사 실기 (AI 커스텀)" 시험을 신규 생성한다.
-- 배경: 2026년 2회 실기는 공식 기출이 공개되지 않는 시험이라 원문 확보 자체가 저작권 문제를
--       안고 있다. 외부 블로그에서 얻을 수 있었던 것은 "어떤 개념을 테스트하는 문항인지"에 대한
--       요약뿐이었고(원문 지문·코드는 얻지 않음), 이 개념 목록만을 참고해 지문·코드·데이터·정답을
--       전부 새로 설계했다. "기존 그대로" 버전은 제3자 저작물 복제 문제로 만들지 않는다.
-- 방식: CODE·SQL·계산 문항은 원본 코드를 전혀 사용하지 않고 새 코드/데이터로 같은 개념을 검증하며,
--       모든 정답은 실제 실행(Java/Python)·시뮬레이션(C)·sqlite3 실행·수식 계산으로 직접 검증했다.
-- 대상: exams 1행 + questions 20행 + examinations 1행. 기존 데이터는 손대지 않는다.
-- 재실행 안전: 동일 제목 시험/문항/응시가 있으면 재삽입하지 않는다. id는 IDENTITY 자동.

BEGIN;

INSERT INTO exams (created_at, del_yn, order_no, question_mode, title, created_by)
SELECT now(), 'N', (SELECT COALESCE(MAX(order_no), 0) + 1 FROM exams), 'SEQUENTIAL',
       '2026년 2회 정보처리기사 실기 (AI 커스텀)', 1
WHERE NOT EXISTS (
    SELECT 1 FROM exams WHERE title = '2026년 2회 정보처리기사 실기 (AI 커스텀)' AND del_yn = 'N'
);

INSERT INTO questions (exam_id, seq, question_type, instruction, content, code, language, answer, explanation, options)
SELECT e.id, v.seq, v.qt, v.instr, v.content, v.code, v.lang, v.answer, v.expl, v.opts::jsonb
FROM (SELECT id FROM exams WHERE title = '2026년 2회 정보처리기사 실기 (AI 커스텀)' AND del_yn = 'N') e,
LATERAL (VALUES

(1, 'SHORT_ANSWER',
 $q$다음은 블랙박스 테스트 기법에 관한 설명이다. 설명에 해당하는 기법을 보기에서 골라 쓰시오.$q$,
 $q$<p>입력 조건을 유효한 값의 범위와 유효하지 않은 값의 범위로 나누고, 각 범위(클래스)에서 대표값을 하나씩 선택하여 테스트 케이스를 설계하는 기법이다.</p><p>&nbsp;</p><p>하나의 클래스에 속한 임의의 값은 동일한 결과를 낸다고 가정하여, 모든 입력값을 테스트하지 않고도 테스트 케이스 수를 효율적으로 줄일 수 있다.</p>$q$,
 NULL, NULL,
 $q$동치분할$q$,
 $q$입력 값의 범위를 유효/무효 클래스로 나누고 대표값만 테스트하는 블랙박스 기법 → 동치분할(Equivalence Partitioning).$q$,
 $q$["동치분할", "경계값분석", "결정테이블 테스트", "상태전이 테스트", "유스케이스 테스트", "오류 예측"]$q$),

(2, 'CODE',
 $q$다음 Java 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$public class Main {
  public static void main(String[] args) {
    A obj = new B();
    obj.print();
  }
}
class A {
  int x = 10;
  void print() {
    System.out.print(x + "a");
  }
}
class B extends A {
  int y = 20;
  @Override
  void print() {
    super.print();
    System.out.print(y + "b");
  }
}$q$,
 'java',
 $q$10a20b$q$,
 $q$obj.print()는 동적 바인딩으로 B의 print()가 호출된다. B.print()는 super.print()로 A.print()를 먼저 실행해 "10a"를 출력하고, 이어서 자신의 필드 y로 "20b"를 출력해 결과는 "10a20b".$q$,
 NULL),

(3, 'SHORT_ANSWER',
 $q$다음은 결합도(Coupling)에 관한 설명이다. 설명에 해당하는 결합도를 보기에서 골라 쓰시오.$q$,
 $q$<p>한 모듈이 다른 모듈 내부에 있는 변수나 기능을 직접 참조하거나 수정하는 경우의 결합도이다.</p><p>&nbsp;</p><p>모듈 내부 구현에 직접 접근하므로 결합도 중 결합의 정도(강도)가 가장 높아, 한 모듈의 내부를 변경하면 다른 모듈에도 영향을 미쳐 모듈 간 독립성이 가장 낮다.</p>$q$,
 NULL, NULL,
 $q$내용결합도$q$,
 $q$다른 모듈 내부를 직접 참조·수정 → 결합도가 가장 높은 내용결합도(Content Coupling).$q$,
 $q$["자료결합도", "스탬프결합도", "제어결합도", "외부결합도", "내용결합도", "공통결합도"]$q$),

(4, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 라우팅 프로토콜의 영문 약자를 쓰시오.$q$,
 $q$<p>링크 상태(Link State) 알고리즘을 사용하며, 다익스트라(Dijkstra) 최단 경로 알고리즘을 기반으로 최적 경로를 계산하는 내부 게이트웨이 프로토콜(IGP)이다.</p><p>&nbsp;</p><p>대규모 네트워크에 적합하고 멀티캐스트 전송을 지원하며, 링크 상태 변경 시 해당 정보를 전체 라우터에 빠르게 전파(flooding)하여 라우팅 테이블을 갱신한다.</p>$q$,
 NULL, NULL,
 $q$OSPF$q$,
 $q$링크 상태 알고리즘 + 다익스트라 최단 경로 계산 → OSPF(Open Shortest Path First).$q$,
 NULL),

(5, 'CODE',
 $q$다음 Python 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$d = {"Cat": "Nap", "Rye": "Loaf", "Pen": "Tab"}
result = ""
for k, v in d.items():
    result += k[-1] + v[0]
print(result)$q$,
 'python',
 $q$tNeLnT$q$,
 $q$딕셔너리는 삽입 순서대로 순회한다. "Cat"→"Nap": 키의 마지막 글자 t, 값의 첫 글자 N → "tN". "Rye"→"Loaf": e, L → "eL". "Pen"→"Tab": n, T → "nT". 이어 붙이면 "tNeLnT".$q$,
 NULL),

(6, 'CODE',
 $q$다음 Python 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$a = "Programming Exists"
print(a[:4] + a[12:14] + a[15:])$q$,
 'python',
 $q$ProgExsts$q$,
 $q$a[:4]는 "Prog", a[12:14]는 "Ex"("Programming Exists"의 인덱스 12·13), a[15:]는 "sts"(인덱스 15부터 끝까지). 이어 붙이면 "Prog"+"Ex"+"sts" = "ProgExsts".$q$,
 NULL),

(7, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>

struct Node {
    int val;
    struct Node* left;
    struct Node* right;
};

int total = 0;

void visit(struct Node* n) {
    if (n == NULL) return;
    visit(n->left);
    visit(n->right);
    total += n->val;
}

int main() {
    struct Node n5 = {5, NULL, NULL};
    struct Node n3 = {3, NULL, NULL};
    struct Node n8 = {8, NULL, NULL};
    struct Node n1 = {1, &n5, &n3};
    struct Node n2 = {2, NULL, &n8};
    struct Node root = {10, &n1, &n2};

    visit(&root);
    printf("%d", total);
    return 0;
}$q$,
 'c',
 $q$29$q$,
 $q$visit은 후위순회(왼쪽→오른쪽→자신) 순서로 전역 변수 total에 각 노드 값을 누적한다. 순회 순서와 무관하게 트리의 모든 노드 값(5+3+8+1+2+10)이 한 번씩 더해지므로 결과는 29.$q$,
 NULL),

(8, 'SHORT_ANSWER',
 $q$다음 프로세스에 대해 SRT(Shortest Remaining Time) 스케줄링을 적용할 때, 모든 프로세스의 평균 대기시간(ms)을 구하시오.$q$,
 $q$<table border="1"><thead><tr><th>프로세스</th><th>도착시간</th><th>실행시간</th></tr></thead><tbody><tr><td>P1</td><td>0</td><td>7</td></tr><tr><td>P2</td><td>2</td><td>4</td></tr><tr><td>P3</td><td>4</td><td>1</td></tr><tr><td>P4</td><td>5</td><td>4</td></tr></tbody></table><p>SRT는 매 순간 남은 실행시간이 가장 짧은 프로세스를 선점하여 실행하는 스케줄링 기법이다(컨텍스트 스위칭 시간은 무시).</p>$q$,
 NULL, NULL,
 $q$3$q$,
 $q$실행 순서는 P1(0~2)→P2 도착(남은4&lt;P1의 남은5, 선점) P2(2~4)→P3 도착(남은1&lt;P2의 남은2, 선점) P3(4~5, 종료)→P2 재개(5~7, 종료)→P4(7~11, 종료)→P1 재개(11~16, 종료) 순이다. 완료시각은 P1=16, P2=7, P3=5, P4=11이며, 대기시간(완료-도착-실행)은 P1=16-0-7=9, P2=7-2-4=1, P3=5-4-1=0, P4=11-5-4=2이다. 합 12를 4로 나누면 평균 대기시간은 3ms.$q$,
 NULL),

(9, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오. (①~④ 각 줄의 출력값을 순서대로 쓰시오)$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>

void byValue(int a, int* count) {
    a = a * 2;
    (*count)++;
}

void byRef(int* a, int* count) {
    *a = *a * 2;
    (*count)++;
}

int main() {
    int arr[4] = {5, 10, 15, 20};
    int cnt = 0;
    int x = arr[1];

    byValue(x, &cnt);
    printf("1. %d\n", x);
    printf("2. %d\n", arr[1]);

    byRef(&arr[1], &cnt);
    printf("3. %d\n", cnt);
    printf("4. %d\n", arr[1]);

    return 0;
}$q$,
 'c',
 $q$1. 10 / 2. 10 / 3. 2 / 4. 20$q$,
 $q$x=arr[1]=10. byValue는 값(복사본)을 전달받아 지역적으로만 2배가 되므로 x·arr[1]은 그대로 10이다(①②). count는 포인터 매개변수라 함수 밖 cnt가 1 증가한다. byRef는 &arr[1]을 전달받아 실제 메모리를 2배로 바꾸므로 arr[1]=20이 되고(④), cnt는 다시 1 증가해 2가 된다(③).$q$,
 NULL),

(10, 'SHORT_ANSWER',
 $q$IP 주소가 192.168.35.64, 서브넷 마스크가 255.255.255.224(/27)인 네트워크가 있다. 다음 보기 중 이 네트워크에서 호스트에 할당 가능한(사용 가능한) IP 주소를 모두 고르시오.$q$,
 $q$<p>[보기]</p><p>ㄱ. 192.168.35.63</p><p>ㄴ. 192.168.35.72</p><p>ㄷ. 192.168.35.95</p><p>ㄹ. 192.168.35.96</p><p>ㅁ. 192.168.35.90</p>$q$,
 NULL, NULL,
 $q$ㄴ, ㅁ$q$,
 $q$/27은 블록 크기 32이므로 네트워크는 192.168.35.64 ~ .95이며, 네트워크 주소(.64)와 브로드캐스트 주소(.95)를 제외한 .65~.94가 사용 가능하다. ㄱ(.63)은 이전 블록, ㄹ(.96)은 다음 블록에 속하고, ㄷ(.95)은 브로드캐스트 주소라 제외된다. 범위 안에 드는 것은 ㄴ(.72)과 ㅁ(.90)뿐이다.$q$,
 NULL),

(11, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 디자인 패턴을 보기에서 골라 쓰시오.$q$,
 $q$<p>서로 관련되거나 의존적인 객체들의 집합(제품군)을, 구체적인 클래스를 지정하지 않고도 생성할 수 있는 인터페이스를 제공하는 생성(Creational) 패턴이다.</p><p>&nbsp;</p><p>관련된 여러 객체를 일관성 있게 생성해 주는 '공장들의 집합(Kit)'으로 불리기도 하며, 제품군 전체를 교체하기 쉽다는 장점이 있다.</p>$q$,
 NULL, NULL,
 $q$추상 팩토리$q$,
 $q$관련 객체군을 구체 클래스 지정 없이 생성하는 인터페이스, 'Kit'로도 불림 → 추상 팩토리(Abstract Factory) 패턴.$q$,
 $q$["팩토리 메서드", "추상 팩토리", "빌더", "싱글턴", "프로토타입", "어댑터"]$q$),

(12, 'SHORT_ANSWER',
 $q$student 테이블에서 성이 '이'씨인 학생을 조회하되, 학번(id)을 기준으로 내림차순 정렬하려고 한다. 다음 SQL의 괄호 안에 들어갈 내용을 각각 작성하시오.$q$,
 $q$<p>SELECT * FROM student WHERE name LIKE '( ① )' ORDER BY id ( ② );</p>$q$,
 NULL, NULL,
 $q$① 이% / ② DESC$q$,
 $q$성이 '이'로 시작하는 이름은 LIKE '이%'로 조회하고, 내림차순 정렬은 ORDER BY 절에 DESC를 붙인다.$q$,
 NULL),

(13, 'SHORT_ANSWER',
 $q$다음 A, B 두 테이블을 조인하여 아래 쿼리를 실행했을 때의 결과값을 쓰시오.$q$,
 $q$<p><strong>[A]</strong></p><table border="1"><thead><tr><th>id</th><th>qty</th></tr></thead><tbody><tr><td>1</td><td>10</td></tr><tr><td>2</td><td>20</td></tr><tr><td>3</td><td>15</td></tr></tbody></table><p><strong>[B]</strong></p><table border="1"><thead><tr><th>id</th><th>price</th></tr></thead><tbody><tr><td>1</td><td>5</td></tr><tr><td>2</td><td>3</td></tr><tr><td>3</td><td>4</td></tr></tbody></table><pre><code>SELECT SUM(A.qty * B.price) AS RESULT
FROM A JOIN B ON A.id = B.id
WHERE A.qty &gt;= 15;</code></pre>$q$,
 NULL, NULL,
 $q$120$q$,
 $q$A.qty &gt;= 15 조건을 만족하는 행은 id=2(20)와 id=3(15)이다. id=2는 20×3=60, id=3은 15×4=60이며 합은 60+60=120.$q$,
 NULL),

(14, 'SHORT_ANSWER',
 $q$다음 X, Y 두 테이블을 참고하여 아래 쿼리를 실행했을 때의 결과값을 쓰시오.$q$,
 $q$<p><strong>[X]</strong></p><table border="1"><thead><tr><th>id</th><th>grp</th></tr></thead><tbody><tr><td>1</td><td>10</td></tr><tr><td>2</td><td>10</td></tr><tr><td>3</td><td>20</td></tr><tr><td>4</td><td>30</td></tr><tr><td>5</td><td>20</td></tr></tbody></table><p><strong>[Y]</strong></p><table border="1"><thead><tr><th>grp</th><th>label</th></tr></thead><tbody><tr><td>10</td><td>A</td></tr><tr><td>20</td><td>B</td></tr></tbody></table><pre><code>SELECT COUNT(*)
FROM X
WHERE grp NOT IN (SELECT grp FROM Y);</code></pre>$q$,
 NULL, NULL,
 $q$1$q$,
 $q$Y 테이블에 존재하는 grp 값은 10, 20이다. X에서 grp가 10·20이 아닌 행은 id=4(grp=30) 하나뿐이므로 결과는 1.$q$,
 NULL),

(15, 'CODE',
 $q$다음 Java 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$public class Main {
  public static void main(String[] args) {
    Sub s = new Sub();
    System.out.print(s.total());
  }
}
class Super {
  protected int base = 100;
  protected int bonus() { return 5; }
  public int total() { return base + bonus(); }
}
class Sub extends Super {
  protected int base = 400;
  @Override
  protected int bonus() { return base / 100 + 4; }
}$q$,
 'java',
 $q$108$q$,
 $q$total()은 Super에 정의되어 있으며, 그 안의 필드 참조 base는 정적 바인딩되어 Super.base(100)를 가리킨다. 반면 bonus() 호출은 동적 바인딩되어 Sub.bonus()가 실행되고, 그 안의 base는 Sub 자신의 코드이므로 Sub.base(400)를 가리켜 400/100+4=8을 반환한다. 따라서 total() = 100 + 8 = 108.$q$,
 NULL),

(16, 'SHORT_ANSWER',
 $q$10.0.0.0/27 네트워크를 크기가 동일한 서브넷 2개로 나누었다. 이때 10.0.0.1이 속하는 서브넷의 프리픽스 길이(비트 수)를 쓰시오.$q$,
 $q$<p>원래 네트워크는 10.0.0.0/27(호스트 5비트, 32개 주소: 10.0.0.0 ~ 10.0.0.31)이다.</p>$q$,
 NULL, NULL,
 $q$28$q$,
 $q$/27을 동일 크기 2개로 나누면 각각 /28이 된다(10.0.0.0/28과 10.0.0.16/28). 10.0.0.1은 앞쪽 서브넷(10.0.0.0~10.0.0.15)에 속하므로 프리픽스 길이는 28.$q$,
 NULL),

(17, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 기술을 쓰시오.$q$,
 $q$<p>입력 데이터의 크기와 상관없이 고정된 길이의 출력값을 생성하는 함수를 이용하는 기술이다.</p><p>&nbsp;</p><p>단방향성을 가져 출력값으로부터 원래의 입력값을 역으로 복원할 수 없으며, 서로 다른 입력값이 동일한 출력값을 갖게 되는 충돌(Collision)이 최소화되도록 설계된다.</p><p>&nbsp;</p><p>비밀번호 저장이나 데이터 무결성 검증 등에 널리 사용된다.</p>$q$,
 NULL, NULL,
 $q$해시$q$,
 $q$고정 길이 출력·단방향성·충돌 최소화가 특징인 기술 → 해시(Hash) 함수.$q$,
 NULL),

(18, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>

int c(int n) {
    if (n <= 0) return 1;
    if (n == 1) return 2;
    return c(n - 1) + c(n - 3);
}

int main() {
    printf("%d", c(5));
    return 0;
}$q$,
 'c',
 $q$9$q$,
 $q$c(5)=c(4)+c(2), c(4)=c(3)+c(1)=c(3)+2, c(3)=c(2)+c(0)=c(2)+1, c(2)=c(1)+c(-1)=2+1=3. 따라서 c(3)=3+1=4, c(4)=4+2=6, c(5)=c(4)+c(2)=6+3=9.$q$,
 NULL),

(19, 'SHORT_ANSWER',
 $q$다음은 도메인 제약에 관한 SQL 문제이다. weather 테이블의 season 컬럼에 '봄', '여름', '가을', '겨울' 네 값만 입력되도록 제한하는 제약조건을 정의하려 한다. 괄호 안에 들어갈 예약어를 쓰시오.$q$,
 $q$<p>ALTER TABLE weather ADD CONSTRAINT chk_season ( ) (season IN ('봄', '여름', '가을', '겨울'));</p>$q$,
 NULL, NULL,
 $q$CHECK$q$,
 $q$특정 컬럼에 입력 가능한 값의 범위를 제한하는 무결성 제약조건 예약어는 CHECK다.$q$,
 NULL),

(20, 'SHORT_ANSWER',
 $q$다음 ENROLL 릴레이션과 함수적 종속 관계를 참고하여, 이 릴레이션이 만족하는 가장 높은 정규형을 쓰시오.$q$,
 $q$<p>ENROLL(학번, 과목번호, 과목명, 성적) — 기본키는 (학번, 과목번호)이다.</p><p>&nbsp;</p><p>함수적 종속: (학번, 과목번호) → 성적 (완전함수종속), 과목번호 → 과목명 (기본키의 일부인 과목번호에만 종속되는 부분함수종속)</p>$q$,
 NULL, NULL,
 $q$제1정규형$q$,
 $q$과목번호 → 과목명은 기본키 전체가 아닌 일부(과목번호)에만 종속되는 부분함수종속이므로 2NF를 위반한다. 부분함수종속이 존재하면 1NF까지만 만족한다.$q$,
 NULL)

) AS v(seq, qt, instr, content, code, lang, answer, expl, opts)
WHERE NOT EXISTS (SELECT 1 FROM questions q WHERE q.exam_id = e.id);

INSERT INTO examinations (created_at, time_limit, title, category_id, created_by, exam_paper_id)
SELECT now(), 150, '2026년 2회 정보처리기사 실기 (AI 커스텀)', 7, 1,
       (SELECT id FROM exams WHERE title = '2026년 2회 정보처리기사 실기 (AI 커스텀)' AND del_yn = 'N')
WHERE NOT EXISTS (
    SELECT 1 FROM examinations WHERE title = '2026년 2회 정보처리기사 실기 (AI 커스텀)'
);

COMMIT;

-- 검증
SELECT seq, question_type, (options IS NOT NULL) has_opt, left(answer, 45) answer
FROM questions
WHERE exam_id = (SELECT id FROM exams WHERE title = '2026년 2회 정보처리기사 실기 (AI 커스텀)' AND del_yn='N')
ORDER BY seq;
