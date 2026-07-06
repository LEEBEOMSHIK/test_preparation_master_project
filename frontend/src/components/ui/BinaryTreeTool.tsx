'use client';

/**
 * 이진트리 시각화 도구 — 레벨오더 배열 표기(예: `[1, 2, 3, null, 4, 5]`)를 입력하면
 * LeetCode 표준 직렬화 규칙으로 트리를 역직렬화해 SVG로 자동 렌더한다.
 * 순수 시각화 도구이며 채점·코드 실행은 하지 않는다.
 * eval / new Function / dangerouslySetInnerHTML 어느 것도 사용하지 않는다.
 *
 * 데이터는 부모(ScratchPadPanel)가 소유하며(value/onChange), 저장은 패널의
 * 기존 debounce 저장 경로에 편입된다. 이 파일은 입력 문자열 외 상태를 자체 보관하지 않는다.
 */

import { useMemo } from 'react';

/** 이진트리 노드 — value는 항상 문자열(파싱 원본 토큰 그대로, 숫자 변환 없음) */
export interface TreeNode {
  value: string;
  left: TreeNode | null;
  right: TreeNode | null;
}

/** 과도한 렌더를 막기 위한 노드 수 상한 */
export const MAX_TREE_NODES = 200;

/** 토큰이 "빈 자식"을 뜻하는 null 표기인지 판별(대소문자 무관) */
function isNullToken(token: string): boolean {
  return token.trim().toLowerCase() === 'null';
}

/**
 * 레벨오더 배열 표기 문자열을 토큰으로 분해한다.
 * 대괄호 유무 모두 허용하고, 공백/콤마(혼용 포함) 구분자를 지원한다.
 */
function tokenize(input: string): string[] {
  const trimmed = input.trim();
  if (trimmed.length === 0) return [];
  const withoutBrackets = trimmed.replace(/^\[/, '').replace(/\]$/, '');
  return withoutBrackets
    .split(/[\s,]+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

/**
 * 레벨오더 배열 표기를 이진트리로 역직렬화한다(LeetCode 표준 규칙, BFS 큐 기반).
 * root=tokens[0]을 큐에 넣고, 큐에서 꺼낸 non-null 노드마다 다음 토큰 2개를 left/right로 배정한다
 * (null이면 자식 없음·큐에 push 안 함). throw 없이 이상 입력은 빈 트리 + 에러 메시지로 안전 반환한다.
 */
export function parseLevelOrderTree(input: string): { root: TreeNode | null; error: string | null } {
  const tokens = tokenize(input);
  if (tokens.length === 0) return { root: null, error: null };

  const nonNullCount = tokens.filter(t => !isNullToken(t)).length;
  if (nonNullCount > MAX_TREE_NODES) {
    return { root: null, error: `노드 수가 너무 많습니다(최대 ${MAX_TREE_NODES}개).` };
  }

  if (isNullToken(tokens[0])) {
    return { root: null, error: null };
  }

  const root: TreeNode = { value: tokens[0], left: null, right: null };
  const queue: TreeNode[] = [root];
  let i = 1;

  while (queue.length > 0 && i < tokens.length) {
    const current = queue.shift() as TreeNode;

    if (i < tokens.length) {
      const leftToken = tokens[i++];
      if (!isNullToken(leftToken)) {
        const leftNode: TreeNode = { value: leftToken, left: null, right: null };
        current.left = leftNode;
        queue.push(leftNode);
      }
    }

    if (i < tokens.length) {
      const rightToken = tokens[i++];
      if (!isNullToken(rightToken)) {
        const rightNode: TreeNode = { value: rightToken, left: null, right: null };
        current.right = rightNode;
        queue.push(rightNode);
      }
    }
  }

  return { root, error: null };
}

interface LayoutNode {
  key: number;
  value: string;
  x: number;
  y: number;
}

interface LayoutEdge {
  key: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface TreeLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

const NODE_RADIUS = 16;
const X_SPACING = 44;
const Y_SPACING = 64;
const SIDE_MARGIN = 24;
const TOP_MARGIN = 24;
const BOTTOM_MARGIN = 24;

/**
 * in-order 순회로 x 인덱스(순차 증가), 깊이로 y를 배정해 겹침 없는 좌표를 계산한다.
 * 간선은 별도 순회로 부모→자식 좌표를 연결한다. 순수 함수(렌더 시마다 재계산, 부수효과 없음).
 */
function computeLayout(root: TreeNode | null): TreeLayout {
  if (!root) return { nodes: [], edges: [], width: 0, height: 0 };

  const positions = new Map<TreeNode, { x: number; y: number }>();
  const nodes: LayoutNode[] = [];
  let xCounter = 0;
  let nodeKey = 0;

  function inOrder(node: TreeNode | null, depth: number): void {
    if (!node) return;
    inOrder(node.left, depth + 1);
    const x = SIDE_MARGIN + xCounter * X_SPACING;
    const y = TOP_MARGIN + depth * Y_SPACING;
    xCounter += 1;
    positions.set(node, { x, y });
    nodes.push({ key: nodeKey++, value: node.value, x, y });
    inOrder(node.right, depth + 1);
  }
  inOrder(root, 0);

  const edges: LayoutEdge[] = [];
  let edgeKey = 0;

  function collectEdges(node: TreeNode | null): void {
    if (!node) return;
    const pos = positions.get(node);
    if (!pos) return;
    if (node.left) {
      const childPos = positions.get(node.left);
      if (childPos) edges.push({ key: edgeKey++, x1: pos.x, y1: pos.y, x2: childPos.x, y2: childPos.y });
      collectEdges(node.left);
    }
    if (node.right) {
      const childPos = positions.get(node.right);
      if (childPos) edges.push({ key: edgeKey++, x1: pos.x, y1: pos.y, x2: childPos.x, y2: childPos.y });
      collectEdges(node.right);
    }
  }
  collectEdges(root);

  const maxY = nodes.reduce((max, n) => Math.max(max, n.y), 0);
  const width = SIDE_MARGIN * 2 + Math.max(0, xCounter - 1) * X_SPACING;
  const height = maxY + NODE_RADIUS + BOTTOM_MARGIN;

  return { nodes, edges, width, height };
}

interface BinaryTreeToolProps {
  value: string;
  onChange: (next: string) => void;
}

/**
 * 이진트리 시각화 도구 컴포넌트.
 * 레벨오더 배열 표기 입력란 하나만 받아 파싱→레이아웃→SVG 렌더를 즉시 수행한다.
 * 빈 입력이나 파싱 불가(노드 초과 등) 시 힌트/에러 텍스트만 보여주고 throw하지 않는다.
 */
export function BinaryTreeTool({ value, onChange }: BinaryTreeToolProps) {
  const { root, error } = useMemo(() => parseLevelOrderTree(value), [value]);
  const layout = useMemo(() => computeLayout(root), [root]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
        레벨오더 배열 표기를 입력하면 이진트리가 자동으로 그려집니다 — <span className="font-mono">null</span>은
        빈 자식을 뜻합니다. 대괄호는 있어도 없어도 됩니다.
      </p>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400 dark:text-gray-500">레벨오더 배열</label>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="예: [1, 2, 3, null, 4, 5]"
          spellCheck={false}
          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

      {!error && !root && (
        <p className="text-xs text-gray-300 dark:text-gray-600">
          예: [1, 2, 3, null, 4, 5] 를 입력하면 트리가 그려집니다.
        </p>
      )}

      {root && layout.nodes.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 p-2">
          <svg width={layout.width} height={layout.height} role="img" aria-label="이진트리 시각화">
            {layout.edges.map(edge => (
              <line
                key={edge.key}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                className="stroke-gray-300 dark:stroke-gray-600"
                strokeWidth={1.5}
              />
            ))}
            {layout.nodes.map(node => (
              <g key={node.key}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS}
                  className="fill-white dark:fill-gray-900 stroke-indigo-400 dark:stroke-indigo-500"
                  strokeWidth={1.5}
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-gray-700 dark:fill-gray-100 text-[10px] font-mono select-none"
                >
                  {node.value}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}
