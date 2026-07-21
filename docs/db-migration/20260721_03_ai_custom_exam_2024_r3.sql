-- 목적: "2024년 3회 정보처리기사 실기 (AI 커스텀)" 시험을 신규 생성한다.
-- 배경: 저작권 문제로 활용이 어려운 2024년 3회 기출 20문항을, 동일 개념·동일 난이도만 유지하고
--       코드 로직·문제 구성·값을 모두 새로 설계한 AI 커스텀 20문항으로 재구성한다.
--       CODE는 원본 코드 골격을 재사용하지 않고 다른 코드로 같은 개념을 검증한다.
-- 대상: exams 1행 + questions 20행 + examinations 1행. 기존 데이터는 손대지 않는다.
-- 재실행 안전: 동일 제목 시험/문항/응시가 있으면 재삽입하지 않는다. id는 IDENTITY 자동.

BEGIN;

INSERT INTO exams (created_at, del_yn, order_no, question_mode, title, created_by)
SELECT now(), 'N', (SELECT COALESCE(MAX(order_no), 0) + 1 FROM exams), 'SEQUENTIAL',
       '2024년 3회 정보처리기사 실기 (AI 커스텀)', 1
WHERE NOT EXISTS (
    SELECT 1 FROM exams WHERE title = '2024년 3회 정보처리기사 실기 (AI 커스텀)' AND del_yn = 'N'
);

INSERT INTO questions (exam_id, seq, question_type, instruction, content, code, language, answer, explanation, options)
SELECT e.id, v.seq, v.qt, v.instr, v.content, v.code, v.lang, v.answer, v.expl, v.opts::jsonb
FROM (SELECT id FROM exams WHERE title = '2024년 3회 정보처리기사 실기 (AI 커스텀)' AND del_yn = 'N') e,
LATERAL (VALUES

(1, 'CODE',
 $q$다음 Java 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$public class Main {
  static String[] w = new String[4];

  static void check(String[] w, int size) {
    for (int i = 1; i < size; i++) {
      if (w[i - 1].equals(w[i])) {
        System.out.print("Y");
      } else {
        System.out.print("N");
      }
    }
    for (String m : w) {
      System.out.print(m);
    }
  }

  public static void main(String[] args) {
    w[0] = "B";
    w[1] = new String("B");
    w[2] = "C";
    w[3] = "C";
    check(w, 4);
  }
}$q$,
 'java',
 $q$YNYBBCC$q$,
 $q$equals()는 참조가 달라도 문자열 내용이 같으면 true다. w[0]("B")와 w[1](new String("B"))은 내용이 같아 Y, w[1]과 w[2]("C")는 달라 N, w[2]와 w[3]("C")은 같아 Y. 이어서 배열 전체를 순서대로 출력하면 BBCC가 붙어 결과는 YNYBBCC.$q$,
 NULL),

(2, 'CODE',
 $q$다음 Python 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$def func(lst):
    for i in range(len(lst) // 2):
        lst[i], lst[-i-1] = lst[-i-1], lst[i]

lst = [2, 4, 6, 8, 10, 12, 14]
func(lst)
print(sum(lst[1::2]) - sum(lst[::2]))$q$,
 'python',
 $q$-8$q$,
 $q$len(lst)=7이라 range(3)만큼 좌우를 맞바꿔 사실상 전체가 뒤집혀 lst = [14, 12, 10, 8, 6, 4, 2]가 된다(가운데 인덱스 3은 그대로). 홀수 인덱스 합(12+8+4=24)에서 짝수 인덱스 합(14+10+6+2=32)을 빼면 24-32=-8.$q$,
 NULL),

(3, 'SHORT_ANSWER',
 $q$아래 customer 테이블과 branch 테이블을 참고하여, 보기의 SQL 명령어 실행 결과를 작성하시오.$q$,
 $q$<p><strong>[customer]</strong></p><table border="1"><thead><tr><th>no</th><th>name</th><th>branch_id</th></tr></thead><tbody><tr><td>1</td><td>Kim</td><td>100</td></tr><tr><td>2</td><td>Lee</td><td>200</td></tr><tr><td>3</td><td>Park</td><td>100</td></tr><tr><td>4</td><td>Choi</td><td>300</td></tr></tbody></table><p><strong>[branch]</strong></p><table border="1"><thead><tr><th>branch_id</th><th>name</th></tr></thead><tbody><tr><td>100</td><td>Seoul</td></tr><tr><td>200</td><td>Busan</td></tr><tr><td>100</td><td>Incheon</td></tr></tbody></table><pre><code>SELECT count(*)
FROM customer AS c JOIN branch AS b ON c.branch_id = b.branch_id
WHERE b.name IN (
    SELECT name FROM branch b WHERE b.branch_id IN (
        SELECT branch_id FROM customer GROUP BY branch_id HAVING count(*) &lt; 2
    )
);</code></pre>$q$,
 NULL, NULL,
 $q$1$q$,
 $q$customer를 branch_id로 그룹핑하면 100은 2명(Kim·Park), 200과 300은 각 1명이라 HAVING count(*)&lt;2는 200·300을 고른다. branch 테이블에서 branch_id가 200·300인 name은 300이 branch에 없어 'Busan' 하나만 남는다. 이제 customer·branch를 branch_id로 조인하면 branch_id=100은 branch에 두 행(Seoul·Incheon)이 있어 Kim·Park이 각 2행씩(총 4행), branch_id=200은 Lee-Busan 1행, branch_id=300(Choi)은 branch에 없어 조인되지 않는다. 이 중 branch.name이 'Busan'인 행은 Lee-Busan 1건뿐이므로 count(*)는 1.$q$,
 NULL),

(4, 'SHORT_ANSWER',
 $q$다음 페이지 참조 순서를 참고하여, 할당된 프레임 수가 3개일 때 LRU 알고리즘의 페이지 부재(Page Fault) 횟수를 작성하시오.$q$,
 $q$<p>페이지 참조 순서: 1 2 3 4 1 2 5 1 2 3 4 5</p>$q$,
 NULL, NULL,
 $q$10$q$,
 $q$프레임 3개로 LRU를 적용하면 1,2,3(부재 3회)→4 참조 시 1 교체(부재 4회)→1 참조 시 2 교체(부재 5회)→2는 히트→5 참조 시 3 교체(부재 6회)→1 참조 시 4 교체(부재 7회)→2는 히트→3 참조 시 1 교체(부재 8회)→4 참조 시 2 교체(부재 9회)→5 참조 시 3 교체(부재 10회)로 총 10회의 페이지 부재가 발생한다.$q$,
 NULL),

(5, 'SHORT_ANSWER',
 $q$다음은 네트워크 취약점에 대한 문제이다. 아래 설명에 해당하는 용어를 작성하시오.$q$,
 $q$<ul><li>출발지 IP를 공격 대상의 주소로 위조한 ICMP Echo Request를 특정 네트워크의 브로드캐스트 주소로 전송하는 공격 기법이다.</li><li>해당 네트워크에 속한 다수의 호스트가 일제히 위조된 출발지, 즉 공격 대상에게 ICMP Echo Reply를 보내면서 응답 트래픽이 크게 증폭된다.</li><li>공격 대상은 폭주하는 응답 트래픽으로 인해 정상적인 서비스를 제공할 수 없는 서비스 거부(DoS) 상태에 빠진다.</li></ul>$q$,
 NULL, NULL,
 $q$스머프(Smurf) 또는 스머핑(Smurfing)$q$,
 $q$출발지 위조 ICMP 브로드캐스트로 응답을 증폭시켜 대상을 마비시키는 공격 → 스머프(Smurf) 공격.$q$,
 NULL),

(6, 'SHORT_ANSWER',
 $q$다음은 GoF 디자인 패턴과 관련된 문제이다. 괄호 안에 알맞은 용어를 작성하시오.$q$,
 $q$<ul><li>( ) 패턴은 객체 사이의 상호작용 방식과 책임을 어떻게 분배할 것인지에 초점을 맞춘 패턴이다.</li><li>( ) 패턴은 알고리즘을 캡슐화하거나 객체 간 통신 절차를 정의하여 객체들의 결합도를 낮추는 역할을 한다.</li><li>이 범주에는 Strategy, State, Iterator, Observer 패턴 등이 포함된다.</li></ul>$q$,
 NULL, NULL,
 $q$행위(Behavioral)$q$,
 $q$객체 간 상호작용·책임 분배·알고리즘 캡슐화에 초점을 맞춘 GoF 패턴 범주 → 행위(Behavioral) 패턴.$q$,
 NULL),

(7, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>

int func() {
    static int x = 0;
    x += 3;
    return x;
}

int main() {
    int x = 2;
    int sum = 0;
    for (int i = 0; i < 5; i++) {
        x++;
        sum += func();
    }
    printf("%d", sum);
    return 0;
}$q$,
 'c',
 $q$45$q$,
 $q$func 내부의 static int x는 함수 호출 사이에 값이 유지되며 main의 지역 변수 x와는 별개다. 호출마다 3씩 증가하므로 반환값은 3, 6, 9, 12, 15이고 이를 모두 더하면 sum = 3+6+9+12+15 = 45.$q$,
 NULL),

(8, 'SHORT_ANSWER',
 $q$다음은 무결성 제약조건에 대한 문제이다. 아래 표(OrderID가 기본키)에서 위반한 ( ) 무결성의 종류를 작성하시오.$q$,
 $q$<table border="1"><thead><tr><th>OrderID (PK)</th><th>Customer</th><th>Qty</th><th>Item</th></tr></thead><tbody><tr><td>501</td><td>Kim</td><td>2</td><td>Keyboard</td></tr><tr><td>502</td><td>Lee</td><td>1</td><td>Mouse</td></tr><tr><td>501</td><td>Park</td><td>3</td><td>Monitor</td></tr><tr><td>NULL</td><td>Choi</td><td>1</td><td>Webcam</td></tr></tbody></table>$q$,
 NULL, NULL,
 $q$개체(Entity) 무결성$q$,
 $q$기본키 OrderID가 501로 중복되고 마지막 행은 NULL이다. 기본키는 유일해야 하고 NULL을 허용하지 않으므로 이는 개체(Entity) 무결성 위반이다.$q$,
 NULL),

(9, 'SHORT_ANSWER',
 $q$다음은 URL 구조에 관한 문제이다. 아래 URL의 (1)~(5) 영역에 대해, 보기의 용어 순서대로 해당하는 번호를 작성하시오.$q$,
 $q$<pre><code>https://api.example.com:443/v2/users?id=77#profile
(1) https   (2) api.example.com:443   (3) /v2/users   (4) id=77   (5) profile</code></pre><p>[보기]<br/>query : 서버에 전달할 추가 데이터<br/>path : 서버 내의 특정 자원을 가리키는 경로<br/>scheme : 리소스에 접근하는 방법이나 프로토콜<br/>authority : 사용자 정보, 호스트명, 포트 번호<br/>fragment : 특정 문서 내의 위치</p>$q$,
 NULL, NULL,
 $q$43125$q$,
 $q$URL 구조는 scheme://authority/path?query#fragment 순서를 갖는다. query는 (4), path는 (3), scheme는 (1), authority는 (2), fragment는 (5)이므로 보기 순서(query, path, scheme, authority, fragment)대로 번호를 나열하면 43125.$q$,
 NULL),

(10, 'CODE',
 $q$다음 Python 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$def func(value):
    if type(value) == type(100):
        return 200
    elif type(value) == type(""):
        return len(value)
    else:
        return 30

a = 'hello world'
b = 250
c = [1, 2, 3]

print(func(a) + func(b) + func(c))$q$,
 'python',
 $q$241$q$,
 $q$a는 문자열이라 len('hello world')=11을 반환한다. b는 int이므로 200을 반환한다. c는 리스트라 else 분기로 30을 반환한다. 11+200+30=241.$q$,
 NULL),

(11, 'CODE',
 $q$다음 Java 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$public class Main {
  public static void main(String[] args) {
    Base a = new Derivate();
    Derivate b = new Derivate();
    System.out.print(a.getY() + a.y + b.getY() + b.y);
  }
}

class Base {
  int y = 4;
  int getY() {
    return y * 2;
  }
}

class Derivate extends Base {
  int y = 9;
  int getY() {
    return y * 3;
  }
}$q$,
 'java',
 $q$67$q$,
 $q$메서드(getY)는 동적 바인딩되어 실제 객체 타입인 Derivate의 것이 호출되므로 a.getY()와 b.getY() 모두 9*3=27이다. 반면 필드(y)는 정적 바인딩되어 참조 변수의 선언 타입을 따르므로 a.y는 Base의 4, b.y는 Derivate의 9다. 따라서 (27+4)+(27+9) = 31+36 = 67.$q$,
 NULL),

(12, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>

struct Node {
  int value;
  struct Node* next;
};

void func(struct Node* node) {
  while (node != NULL && node->next != NULL) {
    int t = node->value;
    node->value = node->next->value;
    node->next->value = t;
    node = node->next->next;
  }
}

int main() {
  struct Node n1 = {4, NULL};
  struct Node n2 = {7, NULL};
  struct Node n3 = {9, NULL};
  struct Node n4 = {2, NULL};

  n1.next = &n4;
  n4.next = &n2;
  n2.next = &n3;

  func(&n1);

  struct Node* current = &n1;
  while (current != NULL) {
    printf("%d", current->value);
    current = current->next;
  }

  return 0;
}$q$,
 'c',
 $q$2497$q$,
 $q$연결 순서는 n1→n4→n2→n3이다. 첫 번째 반복에서 (n1,n4) 쌍의 값을 교환해 n1=2, n4=4가 되고 node는 n4->next->next인 n2로 이동한다. 두 번째 반복에서 (n2,n3) 쌍을 교환해 n2=9, n3=7이 되고 node는 n3->next(NULL)로 이동해 반복이 끝난다. 최종 연결 순서대로 출력하면 n1(2)→n4(4)→n2(9)→n3(7)이 되어 결과는 2497.$q$,
 NULL),

(13, 'SHORT_ANSWER',
 $q$다음은 테스트 커버리지에 대한 문제이다. 아래 설명에 알맞은 답을 보기에서 골라 작성하시오.$q$,
 $q$<ul><li>1. 프로그램 내의 모든 실행 가능한 문장을 최소 한 번씩 수행했는지를 측정하는 커버리지</li><li>2. 프로그램 내 모든 분기(조건문)의 참·거짓 결과를 각각 최소 한 번씩 실행했는지를 측정하는 커버리지</li><li>3. 복합 조건문을 구성하는 개별 조건 하나하나가 참과 거짓 값을 모두 갖도록 테스트했는지를 측정하는 커버리지</li></ul><p>[보기] ㄱ. 조건 ㄴ. 경로 ㄷ. 결정 ㄹ. 분기 ㅁ. 함수 ㅂ. 문장 ㅅ. 루프</p>$q$,
 NULL, NULL,
 $q$1. 문장 / 2. 분기 / 3. 조건$q$,
 $q$모든 문장 1회 이상 → 문장 커버리지. 모든 분기의 참/거짓 → 분기(결정) 커버리지. 개별 조건의 참/거짓 → 조건 커버리지.$q$,
 NULL),

(14, 'SHORT_ANSWER',
 $q$아래는 UML 클래스의 관계에 관한 문제이다. 보기를 보고 (1)~(3)에 알맞은 관계를 골라 작성하시오.$q$,
 $q$<ul><li>(1) '집'과 '방·문·창문'이 실선으로 연결된 관계</li><li>(2) '고양이·강아지'가 속이 빈 삼각형 화살표(▷)로 '동물'을 가리키는 관계</li><li>(3) '프린터'가 점선 화살표(⇢)로 '드라이버'를 가리키는 관계</li></ul><p>[보기] ㄱ. 의존 ㄴ. 연관 ㄷ. 일반화</p>$q$,
 NULL, NULL,
 $q$(1) 연관 / (2) 일반화 / (3) 의존$q$,
 $q$실선으로 단순 연결된 관계는 연관, 속이 빈 삼각형으로 상위 개념을 가리키는 관계는 일반화, 점선 화살표로 일시적 사용 관계를 나타내는 것은 의존이다.$q$,
 NULL),

(15, 'SHORT_ANSWER',
 $q$다음은 데이터베이스 키에 관한 문제이다. 아래 설명에 알맞은 답을 보기에서 골라 작성하시오.$q$,
 $q$<ul><li>(1) 테이블에서 각 행을 유일하게 식별할 수 있는 속성들의 집합(반드시 최소성을 만족하지는 않음)</li><li>(2) 후보 키 중에서 기본 키로 선정되지 않은 나머지 후보 키</li><li>(3) 테이블에서 각 행을 유일하게 식별할 수 있는 최소한의 속성들의 집합</li><li>(4) 다른 테이블(릴레이션)의 기본 키를 참조하는 속성 또는 속성들의 집합</li></ul><p>[보기] ㄱ. 후보키 ㄴ. 대체키 ㄷ. 외래키 ㄹ. 슈퍼키</p>$q$,
 NULL, NULL,
 $q$(1) 슈퍼키 / (2) 대체키 / (3) 후보키 / (4) 외래키$q$,
 $q$최소성 없이 유일하게 식별 가능한 속성 집합은 슈퍼키, 기본키로 선정되지 않은 후보키는 대체키, 최소성을 만족하는 유일 식별 속성은 후보키, 다른 릴레이션의 기본키를 참조하는 속성은 외래키다.$q$,
 NULL),

(16, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>

void func(int** arr, int size) {
    for (int i = 0; i < size; i++) {
        *(*arr + i) = (*(*arr + i) + i) % size;
    }
}

int main() {
    int arr[] = {4, 2, 9, 1, 7};
    int* p = arr;
    int** pp = &p;
    int num = 6;

    func(pp, 5);
    num = arr[2];
    printf("%d", num);

    return 0;
}$q$,
 'c',
 $q$1$q$,
 $q$func은 이중 포인터를 통해 배열 각 원소에 인덱스를 더한 뒤 5로 나눈 나머지로 갱신한다. arr[2]는 (9+2)%5 = 11%5 = 1이 되어 num에 대입되는 값은 1.$q$,
 NULL),

(17, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 네트워크 보안 기술의 영문 약자를 작성하시오.$q$,
 $q$<ul><li>인터넷과 같은 공중망을 통해 마치 사설망에 접속한 것처럼 안전한 통신 경로를 구성하는 기술이다.</li><li>터널링과 암호화를 통해 사용자의 실제 IP 주소와 통신 내용을 외부로부터 숨긴다.</li><li>구현 방식으로 IPsec, SSL, L2TP 등이 사용된다.</li></ul>$q$,
 NULL, NULL,
 $q$VPN$q$,
 $q$공중망을 통해 사설망처럼 암호화된 통신 경로를 제공하는 기술 → VPN(Virtual Private Network).$q$,
 NULL),

(18, 'CODE',
 $q$다음 Java 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$public class ExceptionHandling {
  public static void main(String[] args) {
    int total = 0;
    try {
      task();
    } catch (ArithmeticException e) {
      total = total + 2;
    } catch (Exception e) {
      total = total + 20;
    } finally {
      total = total + 200;
    }
    System.out.print(total);
  }

  static void task() throws Exception {
    throw new ArithmeticException();
  }
}$q$,
 'java',
 $q$202$q$,
 $q$task()가 실제로 던지는 예외는 ArithmeticException이므로 첫 번째 catch가 이를 잡아 total = 0+2 = 2가 된다. finally는 항상 실행되어 total = 2+200 = 202.$q$,
 NULL),

(19, 'CODE',
 $q$다음 Java 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$class Main {

  public static class Box<T> {
    T value;

    public Box(T t) {
      value = t;
    }

    public void show() {
      new Printer().show(value);
    }

    class Printer {
      void show(Integer a) {
        System.out.print("X" + a);
      }
      void show(Object a) {
        System.out.print("Y" + a);
      }
      void show(Number a) {
        System.out.print("Z" + a);
      }
    }
  }

  public static void main(String[] args) {
    new Box<>(0).show();
  }
}$q$,
 'java',
 $q$Y0$q$,
 $q$제네릭 타입 매개변수 T는 컴파일 시 소거(erasure)되어 필드 value의 선언 타입은 Object가 된다. 오버로드 결정은 실제 값이 아니라 컴파일 타임의 선언 타입을 기준으로 하므로 show(Object a)가 선택되어 결과는 "Y0"이다.$q$,
 NULL),

(20, 'SHORT_ANSWER',
 $q$다음은 네트워크에 대한 문제이다. 아래 설명을 보고 알맞은 용어를 보기에서 골라 작성하시오.$q$,
 $q$<ul><li>중앙 집중식 관리 장비나 고정된 기반 시설 없이 필요할 때 임시로 구성되는 네트워크이다.</li><li>참여하는 노드들이 무선으로 서로 직접 연결되어 데이터를 주고받는 자율 분산 구조를 갖는다.</li><li>재난 현장, 군사 작전, 임시 회의 등 인프라 구축이 어려운 환경에서 유용하게 활용된다.</li></ul><p>[보기] ㄱ. Mesh Network ㄴ. Infrastructure Network ㄷ. Sensor Network ㄹ. Peer-to-Peer Network ㅁ. Ad-hoc Network ㅂ. Virtual Private Network ㅅ. Firmware Network</p>$q$,
 NULL, NULL,
 $q$ㅁ. Ad-hoc Network$q$,
 $q$고정 인프라 없이 임시로 구성되고 노드끼리 직접 무선 연결되는 자율 분산 네트워크 → Ad-hoc Network.$q$,
 NULL)

) AS v(seq, qt, instr, content, code, lang, answer, expl, opts)
WHERE NOT EXISTS (SELECT 1 FROM questions q WHERE q.exam_id = e.id);

INSERT INTO examinations (created_at, time_limit, title, category_id, created_by, exam_paper_id)
SELECT now(), 150, '2024년 3회 정보처리기사 실기 (AI 커스텀)', 7, 1,
       (SELECT id FROM exams WHERE title = '2024년 3회 정보처리기사 실기 (AI 커스텀)' AND del_yn = 'N')
WHERE NOT EXISTS (
    SELECT 1 FROM examinations WHERE title = '2024년 3회 정보처리기사 실기 (AI 커스텀)'
);

COMMIT;

-- 검증
SELECT seq, question_type, (options IS NOT NULL) has_opt, left(answer, 45) answer
FROM questions
WHERE exam_id = (SELECT id FROM exams WHERE title = '2024년 3회 정보처리기사 실기 (AI 커스텀)' AND del_yn='N')
ORDER BY seq;
