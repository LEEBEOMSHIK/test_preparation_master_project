## HIST-20260426-003

- **날짜**: 2026-04-26
- **수정 범위**: 관리자 프론트엔드 / 도메인 관리
- **수정 개요**: 도메인 관리 화면에 마스터 이름·서브도메인 이름 검색 기능 추가, 항상 노출되던 "새 마스터 추가" 폼을 "도메인 추가" 버튼 클릭 시 토글로 변경

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `frontend/src/app/admin/tables/domains/page.tsx` | 수정 | 검색 상태·useMemo 필터 추가, showAddMaster 토글 상태 추가, 상단 UI를 검색 입력 + 도메인 추가 버튼 행으로 재구성 |

### 수정 상세

#### `app/admin/tables/domains/page.tsx`
- **변경 전**: 항상 보이는 "새 마스터 추가" 인라인 폼, 검색 기능 없음, `masters` 배열 직접 렌더링
  ```typescript
  // 상태 없음: showAddMaster, searchQuery
  // import useMemo 없음

  // 헤더 바로 아래 항상 표시되는 폼:
  <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5">
    <p className="text-sm font-semibold text-gray-700 mb-3">새 마스터 추가</p>
    <div className="flex gap-2">
      <input
        type="text"
        value={newMasterName}
        onChange={(e) => setNewMasterName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAddMaster()}
        placeholder="마스터 이름 (예: 자격증 유형)"
        maxLength={100}
        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm ..."
      />
      <button onClick={handleAddMaster} disabled={addingMaster || !newMasterName.trim()}>
        {addingMaster ? '추가 중...' : '추가'}
      </button>
    </div>
  </div>

  // 마스터 목록: masters.map(...) 직접 사용
  {masters.length === 0 ? (
    <div>등록된 도메인이 없습니다.</div>
  ) : (
    masters.map((master) => (...))
  )}
  ```
- **변경 후**: 검색 상태 + useMemo 필터, 토글 버튼 방식으로 전환
  ```typescript
  // 추가된 상태:
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMaster, setShowAddMaster] = useState(false);

  // 추가된 useMemo:
  const filteredMasters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return masters;
    return masters
      .map((master) => {
        const masterMatch = master.name.toLowerCase().includes(q);
        const matchedSlaves = master.slaves.filter((s) => s.name.toLowerCase().includes(q));
        if (masterMatch) return master;
        if (matchedSlaves.length > 0) return { ...master, slaves: matchedSlaves };
        return null;
      })
      .filter(Boolean) as DomainMaster[];
  }, [masters, searchQuery]);

  // 상단 UI: 검색 입력 + "도메인 추가" 버튼 행
  <div className="flex gap-2">
    <div className="relative flex-1">
      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="마스터 이름 또는 서브도메인 이름으로 검색" ... />
    </div>
    <button onClick={() => { setShowAddMaster((v) => !v); setNewMasterName(''); }}>
      도메인 추가
    </button>
  </div>

  // 폼은 showAddMaster 시에만 렌더:
  {showAddMaster && (
    <div className="bg-white rounded-2xl border border-indigo-100 ...">
      ...새 마스터 추가 폼...
    </div>
  )}

  // 마스터 목록: filteredMasters.map(...) 사용, 검색 결과 없음 메시지 추가
  ```
- **이유**: 폼 항시 노출 대신 버튼 클릭으로 토글하여 화면 노이즈 감소, 검색 기능으로 도메인 수 증가에 대비

### 복원 방법

HIST-20260426-003 복원 시:
- `domains/page.tsx`에서 다음 항목 제거:
  - `searchQuery` state + `filteredMasters` useMemo + 검색 입력 UI + "도메인 추가" 토글 버튼
  - `showAddMaster` state + 폼 조건부 렌더링
  - `import` 목록에서 `useMemo` 제거
- 항상 표시되는 "새 마스터 추가" 폼 복원 (위의 "변경 전" 코드)
- 마스터 목록 렌더링: `filteredMasters.map` → `masters.map`으로 복원, 검색 결과 없음 메시지 제거

---

## HIST-20260420-006

- **날짜**: 2026-04-20
- **수정 범위**: 관리자 프론트엔드 / 도메인 테이블 관리
- **수정 개요**: "테이블 관리 > 도메인 관리" 메뉴 추가, 도메인 마스터/슬레이브 CRUD 화면 구현

### 수정 파일 목록

| 파일 경로 | 수정 유형 | 설명 |
|-----------|-----------|------|
| `src/components/layout/AdminLayoutShell.tsx` | 수정 | "테이블 관리" nav 항목 추가 (서브메뉴: 도메인 관리) |
| `src/services/domainService.ts` | 수정 | getDomains 외 createMaster/updateMaster/deleteMaster/createSlave/updateSlave/deleteSlave 추가 |
| `src/types/index.ts` | 수정 | `DomainSlave`에 `displayOrder?: number` 필드 추가 |
| `src/app/admin/tables/domains/page.tsx` | 추가 | 도메인 마스터·슬레이브 관리 화면 |

### 수정 상세

#### `AdminLayoutShell.tsx`
- 변경 전: 시험 관리, 개념노트 관리, 1:1 문의 관리
- 변경 후: 상기 3개 + "테이블 관리" (서브: 도메인 관리 `/admin/tables/domains`)

#### `src/app/admin/tables/domains/page.tsx`
- 변경 전: 없음
- 변경 후:
  - 마스터 목록 표시 (이름, 슬레이브 수, 수정/삭제 버튼)
  - 마스터 인라인 수정 (Enter 저장, Escape 취소)
  - 슬레이브 목록: displayOrder, 이름, 수정/삭제
  - 슬레이브 추가: 인라인 input + Enter 지원

### 복원 방법

HIST-20260420-006 복원 시:
- `AdminLayoutShell.tsx`에서 "테이블 관리" 항목 제거
- `domainService.ts`를 getDomains 전용으로 되돌림
- `types/index.ts`에서 `DomainSlave.displayOrder` 제거
- `src/app/admin/tables/` 디렉토리 삭제
