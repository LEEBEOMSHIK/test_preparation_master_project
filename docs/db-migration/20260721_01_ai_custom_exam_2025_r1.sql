-- 목적: "2025년 1회 정보처리기사 실기 (AI 커스텀)" 시험을 신규 생성한다.
-- 배경: 저작권 문제로 활용이 어려운 2025년 1회 기출 20문항을, 동일 개념·동일 난이도만 유지하고
--       코드 로직·문제 구성·값을 모두 새로 설계한 AI 커스텀 20문항으로 재구성한다.
--       CODE는 원본 코드 골격을 재사용하지 않고 다른 코드로 같은 개념을 검증하며,
--       용어 선택형 단답(1·2·4·8·12·14)은 구조화 보기(options)를 제공한다.
--       원본 2·14번은 이미지 의존 문항이므로 텍스트만으로 성립하도록 재설계했다.
--       원본 7번(SQL)은 결과 테이블 정답(sql_data.expectedResult)로 그리드 채점 방식을 유지한다.
--       CODE 실행 결과·서브넷·SQL 조인 정답은 직접 계산·검증했다(Java/Python 실행, C는 포인터·
--       메모리 의미를 그대로 모사한 시뮬레이션).
-- 대상: exams 1행 + questions 20행 + examinations 1행. 기존 데이터는 손대지 않는다.
-- 재실행 안전: 동일 제목 시험/문항/응시가 있으면 재삽입하지 않는다. id는 IDENTITY 자동.

BEGIN;

INSERT INTO exams (created_at, del_yn, order_no, question_mode, title, created_by)
SELECT now(), 'N', (SELECT COALESCE(MAX(order_no), 0) + 1 FROM exams), 'SEQUENTIAL',
       '2025년 1회 정보처리기사 실기 (AI 커스텀)', 1
WHERE NOT EXISTS (
    SELECT 1 FROM exams WHERE title = '2025년 1회 정보처리기사 실기 (AI 커스텀)' AND del_yn = 'N'
);

INSERT INTO questions (exam_id, seq, question_type, instruction, content, code, language, answer, explanation, options, sql_data)
SELECT e.id, v.seq, v.qt, v.instr, v.content, v.code, v.lang, v.answer, v.expl, v.opts::jsonb, v.sqld::jsonb
FROM (SELECT id FROM exams WHERE title = '2025년 1회 정보처리기사 실기 (AI 커스텀)' AND del_yn = 'N') e,
LATERAL (VALUES
(1, 'SHORT_ANSWER',
 $q$다음은 네트워크 보안 공격에 관한 설명이다. 설명에 해당하는 공격 기법을 보기에서 골라 쓰시오.$q$,
 $q$<p>TCP 3-way 핸드셰이크가 완료되어 정상적으로 연결이 수립된 후, 공격자가 통신 중인 두 호스트 사이의 세션 정보(시퀀스 번호 등)를 가로채 정당한 인증 절차 없이 그 세션을 그대로 탈취하는 공격이다.</p><p>&nbsp;</p><p>공격자는 마치 원래의 클라이언트인 것처럼 서버와 통신을 이어가며, 세션 소유자는 자신의 연결이 도용된 사실을 인지하기 어렵다.</p>$q$,
 NULL, NULL,
 $q$세션 하이재킹$q$,
 $q$수립된 세션의 시퀀스 번호 등을 가로채 인증 없이 통신을 탈취 → 세션 하이재킹(Session Hijacking).$q$,
 $q$["세션 하이재킹", "IP 스푸핑", "ARP 스푸핑", "DNS 스푸핑", "스니핑", "피싱"]$q$,
 NULL),

(2, 'SHORT_ANSWER',
 $q$데이터베이스 무결성 제약조건에 관한 다음 설명을 읽고 괄호에 알맞은 용어를 보기에서 골라 쓰시오.$q$,
 $q$<p>( ① ) 무결성은 릴레이션의 튜플이 특정 속성에서 가질 수 있는 값이 그 속성에 정의된 값의 범위(도메인) 내에 있어야 한다는 제약이다.</p><p>&nbsp;</p><p>( ② ) 무결성은 기본키를 구성하는 속성은 NULL 값이나 중복된 값을 가질 수 없다는 제약이다.</p><p>&nbsp;</p><p>( ③ ) 무결성은 외래키 값은 참조하는 릴레이션의 기본키 값과 같거나 NULL이어야 한다는 제약이다.</p>$q$,
 NULL, NULL,
 $q$① 도메인 / ② 개체 / ③ 참조$q$,
 $q$값의 범위 제약 → 도메인 무결성. 기본키 유일·NULL 불가 → 개체 무결성. 외래키-기본키 일치 → 참조 무결성.$q$,
 $q$["도메인", "개체", "참조", "키", "속성", "튜플"]$q$,
 NULL),

(3, 'SHORT_ANSWER',
 $q$아래의 내용에서 설명 글의 괄호안의 용어를 영문 약자로 작성하시오.$q$,
 $q$<p>( ) 은/는 3글자의 영어 약자로 이루어진 오류 검출 기법으로, 데이터를 전송하거나 저장할 때 오류를 감지하는 데 사용된다.</p><p><br></p><p>송신 측은 정해진 다항식(예: x⁴ + x + 1)을 기준으로 데이터를 2진수 나눗셈하여 얻은 나머지를 데이터 뒤에 붙여 전송하고, 수신 측은 동일한 다항식으로 다시 나누어 나머지가 0이면 오류가 없는 것으로 판단한다.</p><p><br></p><p>( )은/는 단일 비트 오류뿐 아니라 연속된 다중 비트 오류(버스트 오류)도 높은 확률로 검출할 수 있어 네트워크 프레임 검사에 널리 사용된다.</p>$q$,
 NULL, NULL,
 $q$CRC$q$,
 $q$다항식 나눗셈의 나머지로 오류를 검출하는 기법 → CRC(Cyclic Redundancy Check).$q$,
 NULL,
 NULL),

(4, 'SHORT_ANSWER',
 $q$다음 설명에 해당하는 악성 소프트웨어의 명칭을 보기에서 골라 쓰시오.$q$,
 $q$<p>사용자가 원치 않는 소프트웨어를 구매하도록 유도하기 위해 사회공학 기법을 사용하여 충격·불안·위협에 대한 인식을 유발하는 악성 소프트웨어의 한 형태이다.</p><p>&nbsp;</p><p>'겁을 주다(scare)'라는 단어에서 유래했으며, 공포심을 이용해 피해자를 속여 대가를 지불하거나 특정 행동을 하도록 유도한다.</p><p>&nbsp;</p><p>가짜 바이러스 경고나 시스템 문제 메시지를 표시해 사용자가 불필요한 결제를 하거나 악성 소프트웨어를 직접 설치하도록 속이는 방식으로 작동한다.</p>$q$,
 NULL, NULL,
 $q$스캐어웨어$q$,
 $q$공포심을 유발해 결제·설치를 유도하는 악성 소프트웨어 → 스캐어웨어(Scareware).$q$,
 $q$["애드웨어", "스파이웨어", "랜섬웨어", "스캐어웨어", "트로이목마", "웜", "혹스", "그레이웨어"]$q$,
 NULL),

(5, 'CODE',
 $q$다음 Java 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$public class Main {
  public static void main(String[] args) {
    int[] arr = {1, 2, 3};
    try {
      System.out.print(arr[5] / 0);
    } catch (ArrayIndexOutOfBoundsException e) {
      System.out.print("A");
    } catch (ArithmeticException e) {
      System.out.print("B");
    } catch (NullPointerException e) {
      System.out.print("C");
    } catch (Exception e) {
      System.out.print("D");
    } finally {
      System.out.print("E");
    }
  }
}$q$,
 'java',
 $q$AE$q$,
 $q$arr[5]에 접근하는 순간 배열 범위를 벗어나 ArrayIndexOutOfBoundsException이 먼저 발생한다(나눗셈까지 도달하지 않음). 첫 번째 catch 블록이 이를 잡아 "A"를 출력하고, finally에서 "E"가 항상 실행되어 결과는 "AE".$q$,
 NULL,
 NULL),

(6, 'SHORT_ANSWER',
 $q$아래는 주소 변환 프로토콜에 대한 설명이다. 각 설명에 해당하는 프로토콜을 쓰시오.$q$,
 $q$<p>( 1 )은/는 네트워크상에서 IP 주소를 MAC 주소로 변환하는 프로토콜이다.</p><p>&nbsp;</p><p>( 2 )은/는 반대로 MAC 주소를 IP 주소로 변환하는 프로토콜이다.</p><p>&nbsp;</p><p>두 프로토콜 모두 데이터링크 계층의 물리 주소와 네트워크 계층의 논리 주소를 매핑하는 역할을 한다.</p>$q$,
 NULL, NULL,
 $q$(1) ARP / (2) RARP$q$,
 $q$IP→MAC 변환은 ARP, MAC→IP 변환은 RARP.$q$,
 NULL,
 NULL),

(7, 'SQL',
 $q$다음은 SQL 문제이다. 아래 두 테이블을 참고하여 쿼리 실행 결과를 결과 테이블 형식으로 작성하시오.$q$,
 $q$<p>SELECT name, amount FROM emp, bonus WHERE emp.id = bonus.id AND amount &gt;= 300</p>$q$,
 NULL, NULL,
 $q$name | amount
변학도 | 350
방자 | 900$q$,
 $q$emp·bonus를 id로 조인한 뒤 amount &gt;= 300 조건을 만족하는 행은 id 2005(변학도, 350)와 id 2007(방자, 900)이다. id 2010(bonus)은 emp에 없어 조인되지 않고, id 2002(성춘향, 200)는 조건을 만족하지 않는다.$q$,
 NULL,
 $q${"tables": [{"name": "emp", "columns": [{"name": "id", "dataType": "INT", "primaryKey": true}, {"name": "name", "dataType": "VARCHAR", "primaryKey": false}], "rows": [["2001", "이몽룡"], ["2002", "성춘향"], ["2005", "변학도"], ["2007", "방자"]]}, {"name": "bonus", "columns": [{"name": "id", "dataType": "INT", "primaryKey": false}, {"name": "amount", "dataType": "INT", "primaryKey": false}], "rows": [["2002", "200"], ["2005", "350"], ["2007", "900"], ["2010", "400"]]}], "expectedResult": {"columns": ["name", "amount"], "rows": [["변학도", "350"], ["방자", "900"]], "orderedRows": false}}$q$),

(8, 'SHORT_ANSWER',
 $q$아래는 관계형 데이터베이스 용어에 관한 설명이다. 알맞은 용어를 보기에서 골라 괄호에 쓰시오.$q$,
 $q$<ul><li>1. 릴레이션에 존재하는 튜플(행)의 개수를 의미: ( 1 )</li><li>2. 후보키 중 기본키로 선택되지 않은 나머지 키를 의미: ( 2 )</li><li>3. 한 릴레이션의 속성이 다른 릴레이션의 기본키를 참조할 때 그 속성을 의미: ( 3 )</li><li>4. 특정 속성이 가질 수 있는 값의 범위를 의미하며 무결성 판단의 기준이 되는 것: ( 4 )</li></ul>$q$,
 NULL, NULL,
 $q$(1) cardinality / (2) alternate / (3) foreign / (4) domain$q$,
 $q$튜플 개수는 cardinality, 선택되지 않은 후보키는 alternate key, 기본키 참조 속성은 foreign key, 값의 범위는 domain.$q$,
 $q$["degree", "cardinality", "alternate", "foreign", "domain", "candidate"]$q$,
 NULL),

(9, 'SHORT_ANSWER',
 $q$IP 주소가 172.16.50.10, 서브넷 마스크가 255.255.252.0인 PC에서 브로드캐스트로 정보를 전달할 때, 같은 네트워크에 속해 수신할 수 있는 IP를 보기에서 모두 고르시오.$q$,
 $q$<p>[보기]</p><p>ㄱ. 172.16.47.250</p><p>ㄴ. 172.16.49.5</p><p>ㄷ. 172.16.51.200</p><p>ㄹ. 172.16.52.1</p><p>ㅁ. 172.16.50.99</p>$q$,
 NULL, NULL,
 $q$ㄴ, ㄷ, ㅁ$q$,
 $q$255.255.252.0(/22)은 세 번째 옥텟 블록 크기가 4다. 50 ÷ 4 = 12.5 → 네트워크는 172.16.48.0 ~ 172.16.51.255. 이 범위에 속하는 것은 ㄴ(49.5)·ㄷ(51.200)·ㅁ(50.99)이며, ㄱ(47.250)은 범위 아래, ㄹ(52.1)은 범위 위라 다른 네트워크에 속한다.$q$,
 NULL,
 NULL),

(10, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>
int arr[6] = {40, 10, 25, 60, 5};
int val = 30;

int main(){
    int i;
    printf("%d\n", arr[3]-arr[1]);
    for(i=0;i<6;++i){
        if(arr[i]>val)
            break;
    }
    int temp = arr[i];
    arr[i] = val;
    i++;
    for(;i<6;++i){
        int temp2 = arr[i];
        arr[i] = temp;
        temp = temp2;
    }
    for(i=0;i<6;i++){
        printf("%d ", arr[i]);
    }
    return 0;
}$q$,
 'c',
 $q$50
30 40 10 25 60 5 $q$,
 $q$arr[6] = {40,10,25,60,5,0}(마지막은 초기값 0). arr[3]-arr[1] = 60-10 = 50. val(30)보다 큰 첫 원소는 arr[0]=40이라 i=0에서 즉시 break. temp=40, arr[0]=30으로 교체 후 i=1부터 나머지 원소를 한 칸씩 뒤로 밀어 삽입 정렬처럼 동작 → 최종 배열은 30 40 10 25 60 5.$q$,
 NULL,
 NULL),

(11, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>
#include <stdlib.h>

void fill(int** arr, int* data, int rows, int cols) {
    for (int i = 0; i < rows * cols; ++i) {
        arr[(i + 2) % rows][(i + 1) % cols] = data[i];
    }
}

int main() {
    int rows = 3, cols = 3, total = 0;
    int data[] = {2, 4, 6, 1, 3, 5, 9, 8, 7};
    int** arr = (int**) malloc(sizeof(int*) * rows);
    for (int i = 0; i < rows; i++) {
        arr[i] = (int*) malloc(sizeof(int) * cols);
        for (int j = 0; j < cols; j++) arr[i][j] = 0;
    }
    fill(arr, data, rows, cols);
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            total += arr[i][j] * ((i + j) % 2 == 0 ? 1 : -1);
        }
    }
    for (int i = 0; i < rows; i++) free(arr[i]);
    free(arr);
    printf("%d", total);
}$q$,
 'c',
 $q$-8$q$,
 $q$data[i]는 arr[(i+2)%3][(i+1)%3]에 순서대로 대입되며 같은 칸이 여러 번 덮어써진다. 최종 배열은 [[0,0,8],[7,0,0],[0,9,0]]이 되고, (행+열)이 짝수인 칸은 +, 홀수인 칸은 -로 합산하면 8 - 7 - 9 = -8.$q$,
 NULL,
 NULL),

(12, 'SHORT_ANSWER',
 $q$다음은 결합도(Coupling)에 관한 설명이다. 보기에서 알맞은 답을 골라 작성하시오.$q$,
 $q$<p>(1) 한 모듈이 다른 모듈 내부에 있는 변수나 로직을 직접 참조하거나 변경하는 경우의 결합도</p><p>&nbsp;</p><p>(2) 모듈 간의 인터페이스로 배열, 오브젝트, 구조체 등의 자료구조 자체가 전달되는 경우의 결합도</p><p>&nbsp;</p><p>(3) 파라미터가 아닌 모듈 밖에 선언된 전역 변수를 여러 모듈이 함께 참조하고 갱신하는 경우의 결합도</p>$q$,
 NULL, NULL,
 $q$(1) 내용 / (2) 스탬프 / (3) 공통$q$,
 $q$내부 변수·로직 직접 참조는 내용 결합도, 자료구조 자체 전달은 스탬프 결합도, 전역 변수 공유는 공통 결합도.$q$,
 $q$["자료", "스탬프", "제어", "공통", "외부", "내용"]$q$,
 NULL),

(13, 'CODE',
 $q$다음 Java 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$public class Main {
    public static void main(String[] args) {
        new Sub();
        System.out.println(Base.count);
    }
}

class Base {
    static int count = 1;
    int x = 2;
    public Base() {
        count += (x++);
        report();
    }
    public void report() {
        count += count;
    }
}

class Sub extends Base {
    int x = 5;
    public Sub() {
        x += 3;
        count += x++;
        report();
    }
    @Override
    public void report() {
        count += count * 3;
    }
}$q$,
 'java',
 $q$80$q$,
 $q$Sub 생성자는 Base 생성자를 먼저 호출한다. Base()에서 count += (x++)로 count = 1+2 = 3(x는 3이 됨), report()는 Sub에서 오버라이드되어 동적 바인딩되므로 count += count*3 실행 → count = 3+9 = 12. 이어서 Sub() 본체가 실행되어 x += 3 (Sub의 x는 5+3=8), count += x++ → count = 12+8 = 20(x는 9가 됨), report() 다시 호출 → count += count*3 = 20+60 = 80.$q$,
 NULL,
 NULL),

(14, 'SHORT_ANSWER',
 $q$아래는 디자인 패턴에 대한 설명이다. 설명에 해당하는 패턴명을 보기에서 골라 작성하시오.$q$,
 $q$<p>서로 다른 인터페이스를 가진 두 클래스를 그대로는 함께 사용할 수 없을 때, 기존 클래스(Adaptee)의 인터페이스를 클라이언트가 기대하는 인터페이스(Target)로 감싸 변환해주는 구조적 디자인 패턴이다.</p><p>&nbsp;</p><p>기존 코드를 수정하지 않고도 호환되지 않는 인터페이스를 연결할 수 있어, 레거시 코드를 재사용하거나 외부 라이브러리를 통합할 때 자주 사용된다.</p>$q$,
 NULL, NULL,
 $q$Adapter$q$,
 $q$기존 클래스의 인터페이스를 원하는 인터페이스로 감싸 변환 → Adapter 패턴.$q$,
 $q$["Adapter", "Bridge", "Decorator", "Facade", "Proxy", "Composite"]$q$,
 NULL),

(15, 'SHORT_ANSWER',
 $q$문장(Statement) 커버리지 테스트를 수행하려고 한다. 아래 코드를 제어 흐름도 빈칸에 연결되도록 작성하고, 문장 커버리지 순서대로 작성하시오.$q$,
 $q$<p>int Check(int arr[], int n, int limit) {</p><p>&nbsp;&nbsp;&nbsp;&nbsp;int i = 0;</p><p>&nbsp;&nbsp;&nbsp;&nbsp;while (i &lt; n &amp;&amp; arr[i] &lt;= limit) {</p><p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (arr[i] % 2 == 0)</p><p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;arr[i] = arr[i] / 2;</p><p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;i++;</p><p>&nbsp;&nbsp;&nbsp;&nbsp;}</p><p>&nbsp;&nbsp;&nbsp;&nbsp;return i;</p><p>}</p><p><br></p><p>1.( ① ) 2.( ② ) 3.( ③ ) 4.( ④ ) 5.( ⑤ ) 6.( ⑥ )</p><p>문장 커버리지 순서: 1 → 2 → ( ⑦ )</p>$q$,
 NULL, NULL,
 $q$① int i = 0 / ② i < n && arr[i] <= limit / ③ arr[i] % 2 == 0 / ④ arr[i] = arr[i] / 2; / ⑤ i++; / ⑥ return i; / ⑦ ③ → ④ → ⑤ → ② → ⑥$q$,
 $q$모든 문장을 최소 한 번씩 실행하려면 if의 참 분기(④)를 반드시 거쳐야 하고, 이후 반복문을 벗어나 return까지 도달해야 한다. 따라서 ①→②로 진입한 뒤 ③→④→⑤로 조건문 내부를 실행하고, 다시 ②로 돌아가 조건이 거짓이 되어 ⑥으로 종료한다.$q$,
 NULL,
 NULL),

(16, 'CODE',
 $q$다음 Java 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$public class Main {
    public static void main(String[] args) {
        int[] data = {4, 9, 2, 15, 7, 20, 3};
        System.out.println(func(data, 0, data.length - 1));
    }
    static int func(int[] a, int lo, int hi) {
        if (lo > hi) return 0;
        if (lo == hi) return a[lo];
        int mid = (lo + hi) / 2;
        return a[mid] + Math.max(func(a, lo, mid - 1), func(a, mid + 1, hi));
    }
}$q$,
 'java',
 $q$42$q$,
 $q$func(0,6)은 mid=3(값 15) + max(func(0,2), func(4,6))이다. func(0,2)는 mid=1(값 9) + max(func(0,0)=4, func(2,2)=2) = 13. func(4,6)은 mid=5(값 20) + max(func(4,4)=7, func(6,6)=3) = 27. 따라서 15 + max(13, 27) = 15 + 27 = 42.$q$,
 NULL,
 NULL),

(17, 'CODE',
 $q$다음 Python 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$class Node:
    def __init__(self, value):
        self.value = value
        self.children = []

def build(values):
    nodes = [Node(v) for v in values]
    for i in range(1, len(values)):
        nodes[(i - 1) // 2].children.append(nodes[i])
    return nodes[0]

def total(node, depth=0):
    if node is None:
        return 0
    own = node.value if depth % 2 == 0 else 0
    return own + sum(total(c, depth + 1) for c in node.children)

values = [4, 6, 9, 11, 14, 16, 19]
root = build(values)
print(total(root))$q$,
 'python',
 $q$64$q$,
 $q$힙 구조로 트리를 구성하면 깊이 0에 4, 깊이 1에 6·9, 깊이 2에 11·14·16·19가 배치된다. 짝수 깊이(0, 2)의 값만 더하면 4 + (11+14+16+19) = 4 + 60 = 64.$q$,
 NULL,
 NULL),

(18, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int val;
    struct Node *next;
} Node;

Node* push(Node* head, int val) {
    Node* n = (Node*)malloc(sizeof(Node));
    n->val = val;
    n->next = head;
    return n;
}

Node* moveToFront(Node* head, int val) {
    if (head == NULL || head->val == val) return head;
    Node *prev = NULL, *curr = head;
    while (curr != NULL && curr->val != val) {
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
    Node *head = NULL;
    for (int i = 1; i <= 6; i++)
        head = push(head, i);
    head = moveToFront(head, 4);
    for (Node* c = head; c != NULL; c = c->next)
        printf("%d", c->val);
    return 0;
}$q$,
 'c',
 $q$465321$q$,
 $q$push를 6번 반복하면 매번 맨 앞에 삽입되어 리스트는 6→5→4→3→2→1이 된다. moveToFront(4)는 4를 찾아 이전 노드(5)의 next를 4의 next(3)로 잇고, 4의 next를 기존 head(6)로 연결한 뒤 head를 4로 바꾼다. 결과 리스트는 4→6→5→3→2→1이 되어 출력은 465321.$q$,
 NULL,
 NULL),

(19, 'CODE',
 $q$다음 C 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$#include <stdio.h>

typedef struct Person {
    char* name;
    int score[3];
} Person;

int mask(int v) {
    return v & 0x5A;
}

int total(Person* p) {
    return mask(p->score[0]) + mask(p->score[1]) + mask(p->score[2]);
}

int main() {
    Person s[2] = { "Kim", {0x5F, 0x3C, 0x99}, "Lee", {0x7A, 0x66, 0xE1} };
    Person* p = s;
    int sum = 0;
    for (int i = 0; i < 2; i++) {
        sum += total(&s[i]);
    }
    printf("%d", sum);
    return 0;
}$q$,
 'c',
 $q$358$q$,
 $q$각 점수를 0x5A(01011010)와 비트 AND 연산한다. Kim: 0x5F&0x5A=0x5A(90), 0x3C&0x5A=0x18(24), 0x99&0x5A=0x18(24) → 138. Lee: 0x7A&0x5A=0x5A(90), 0x66&0x5A=0x42(66), 0xE1&0x5A=0x40(64) → 220. 총합은 138+220=358.$q$,
 NULL,
 NULL),

(20, 'CODE',
 $q$다음 Java 코드의 실행 결과를 쓰시오.$q$,
 $q$<p><br></p>$q$,
 $q$public class Main {
  public static void main(String[] args) {
    System.out.println(solve("6"));
  }
  static int solve(int n) {
    if (n <= 1) return n;
    return solve(n - 1) + solve(n - 2);
  }
  static int solve(String s) {
    int n = Integer.parseInt(s);
    if (n <= 1) return n;
    return solve(n - 2) + solve(n - 3);
  }
}$q$,
 'java',
 $q$5$q$,
 $q$solve("6")은 String 오버로드가 호출되어 n=6에서 solve(4)+solve(3)을 계산하는데, 이때 인자가 int이므로 이후 재귀는 모두 int 오버로드(피보나치 점화식)로 진행된다. int 오버로드는 solve(n)=solve(n-1)+solve(n-2), 즉 표준 피보나치이므로 solve(4)=3, solve(3)=2이다. 따라서 결과는 3+2=5.$q$,
 NULL,
 NULL)
) AS v(seq, qt, instr, content, code, lang, answer, expl, opts, sqld)
WHERE NOT EXISTS (SELECT 1 FROM questions q WHERE q.exam_id = e.id);

INSERT INTO examinations (created_at, time_limit, title, category_id, created_by, exam_paper_id)
SELECT now(), 150, '2025년 1회 정보처리기사 실기 (AI 커스텀)', 7, 1,
       (SELECT id FROM exams WHERE title = '2025년 1회 정보처리기사 실기 (AI 커스텀)' AND del_yn = 'N')
WHERE NOT EXISTS (
    SELECT 1 FROM examinations WHERE title = '2025년 1회 정보처리기사 실기 (AI 커스텀)'
);

COMMIT;

-- 검증
SELECT seq, question_type, (options IS NOT NULL) has_opt, (sql_data IS NOT NULL) has_sql,
       left(answer, 45) answer
FROM questions
WHERE exam_id = (SELECT id FROM exams WHERE title = '2025년 1회 정보처리기사 실기 (AI 커스텀)' AND del_yn='N')
ORDER BY seq;
