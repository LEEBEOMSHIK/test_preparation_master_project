# Style Guidelines

## Design Principles

- **모바일 우선(Mobile First)**: 모든 화면은 320px 기준으로 설계 후 확장
- **반응형**: Tailwind CSS breakpoints (`sm:640px`, `md:768px`, `lg:1024px`)
- **React Native Web 호환**: 컴포넌트는 `View`, `Text`, `TouchableOpacity` 등 RN 기본 컴포넌트 사용

---

## Color Palette

```css
/* Primary */
--color-primary:       #4F46E5;   /* Indigo 600 */
--color-primary-light: #818CF8;   /* Indigo 400 */
--color-primary-dark:  #3730A3;   /* Indigo 800 */

/* Semantic */
--color-success: #10B981;  /* Emerald 500 */
--color-warning: #F59E0B;  /* Amber 500 */
--color-error:   #EF4444;  /* Red 500 */
--color-info:    #3B82F6;  /* Blue 500 */

/* Neutral */
--color-gray-50:  #F9FAFB;
--color-gray-100: #F3F4F6;
--color-gray-500: #6B7280;
--color-gray-900: #111827;
```

---

## Typography

- 폰트: `Noto Sans KR` (한국어 기본), `Inter` (영문/숫자)
- 기본 폰트 크기: 16px (1rem)

| 사용 | 크기 | 굵기 |
|---|---|---|
| 페이지 제목 | 24px (1.5rem) | 700 |
| 섹션 제목 | 20px (1.25rem) | 600 |
| 카드 제목 | 16px (1rem) | 600 |
| 본문 | 14px (0.875rem) | 400 |
| 캡션 | 12px (0.75rem) | 400 |

---

## Component Patterns

### 버튼
```tsx
// Primary
<TouchableOpacity className="bg-indigo-600 px-4 py-2 rounded-lg">
  <Text className="text-white font-semibold">확인</Text>
</TouchableOpacity>

// Secondary (outline)
<TouchableOpacity className="border border-indigo-600 px-4 py-2 rounded-lg">
  <Text className="text-indigo-600 font-semibold">취소</Text>
</TouchableOpacity>
```

### 카드
```tsx
<View className="bg-white rounded-xl shadow-sm p-4 mb-3">
  ...
</View>
```

### 폼 입력
```tsx
<TextInput
  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-indigo-500"
  placeholder="입력하세요"
/>
```

---

## Layout

### 페이지 구조
```
┌────────────────────────────────┐
│ Header (고정, z-50)            │
├────────────────────────────────┤
│ Sidebar (lg:표시, 모바일:숨김) │
│ ┌──────────────────────────┐   │
│ │ Main Content             │   │
│ │ max-w-4xl mx-auto px-4   │   │
│ └──────────────────────────┘   │
├────────────────────────────────┤
│ Footer                         │
└────────────────────────────────┘
```

### 모바일 네비게이션
- 모바일에서는 하단 탭 내비게이션 사용 (Bottom Tab Bar)
- 아이콘: `react-native-vector-icons` 또는 SVG 직접 사용

---

## Accessibility

- 모든 이미지에 `alt` 속성 필수
- 버튼/링크에 `accessibilityLabel` 추가
- 최소 터치 영역: 44×44px (모바일 접근성 가이드)
- 색상 대비: WCAG AA 기준 (4.5:1 이상)

---

## Admin vs User UI 구분

| | User | Admin |
|---|---|---|
| 사이드바 색상 | Indigo | Slate |
| 헤더 로고 텍스트 | TPMP | TPMP Admin |
| 접근 권한 배지 | 없음 | `ADMIN` 뱃지 표시 |
