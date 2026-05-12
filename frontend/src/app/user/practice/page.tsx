'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { practiceService } from '@/services/practiceService';
import type { SqlResult, PracticeRules } from '@/services/practiceService';

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = 'sql' | 'os' | 'guide';
type Dialect = 'postgresql' | 'mysql' | 'oracle';
type OsType = 'linux' | 'windows';

type TypoWarning = { pattern: string; suggestion: string; detail: string };
type TermLine = { kind: 'input' | 'output' | 'error'; text: string };
type FSEntry = { type: 'file' | 'dir'; content?: string; permissions: string; size: number };
type CommandResult = { lines: string[]; newPath?: string; newFs?: Map<string, FSEntry>; clear?: boolean };

// ── SQL Typo Detection ───────────────────────────────────────────────────────

const TYPO_RULES: Array<[RegExp, string | null, string]> = [
  [/\bCREATE\s+TALBE\b/i,      'CREATE TABLE',   'TALBE → TABLE'],
  [/\bCREAT\s+TABLE\b/i,       'CREATE TABLE',   'CREAT → CREATE'],
  [/\bSLECT\b/i,               'SELECT',         'SLECT → SELECT'],
  [/\bSELCT\b/i,               'SELECT',         'SELCT → SELECT'],
  [/\bSELECT\b[\s\S]*?\bFORM\b/i, 'FROM',        'SELECT … FORM → FROM'],
  [/\bINSERT\s+INOT\b/i,       'INSERT INTO',    'INOT → INTO'],
  [/\bINSERT\s+ITNO\b/i,       'INSERT INTO',    'ITNO → INTO'],
  [/\bUPDTAE\b/i,              'UPDATE',         'UPDTAE → UPDATE'],
  [/\bUPDTE\b/i,               'UPDATE',         'UPDTE → UPDATE'],
  [/\bDELETE\s+FORM\b/i,       'DELETE FROM',    'FORM → FROM'],
  [/\bDELTE\b/i,               'DELETE',         'DELTE → DELETE'],
  [/\bGRUOP\s+BY\b/i,          'GROUP BY',       'GRUOP → GROUP'],
  [/\bGROP\s+BY\b/i,           'GROUP BY',       'GROP → GROUP'],
  [/\bORDRER\s+BY\b/i,         'ORDER BY',       'ORDRER → ORDER'],
  [/\bORDER\s+YB\b/i,          'ORDER BY',       'YB → BY'],
  [/(?<!\w)WHER(?!E)\b/i,      'WHERE',          'WHER → WHERE (E 누락)'],
  [/\bWHRE\b/i,                'WHERE',          'WHRE → WHERE'],
  [/\bHAVING\b[\s\S]*?(?<!\w)WHER(?!E)\b/i, 'WHERE', 'HAVING 절 내 WHER → WHERE'],
  [/\bJION\b/i,                'JOIN',           'JION → JOIN'],
  [/\bHAVING\b/i,              null,             ''],
];

function getErrorContext(sqlText: string, position: number) {
  // \r\n → \n 정규화 (PostgreSQL position은 \n 기준으로 계산됨)
  const stripped = sqlText.replace(/\r\n/g, '\n').replace(/;\s*$/, '');
  const pos = Math.max(0, Math.min(position - 1, stripped.length));
  const before = stripped.substring(0, pos);
  const linesBefore = before.split('\n');
  const lineNum = linesBefore.length;
  const linePrefix = linesBefore[linesBefore.length - 1];
  const colNum = linePrefix.length;
  const lines = stripped.split('\n');
  const errorLine = lines[lineNum - 1] ?? '';
  // 탭 문자는 탭으로 보존, 나머지는 공백으로 치환 → 시각적 정렬 유지
  const caretPrefix = linePrefix.replace(/[^\t]/g, ' ');
  return { lineNum, colNum, errorLine, caretPrefix };
}

function detectTypos(sql: string): TypoWarning[] {
  const found: TypoWarning[] = [];
  for (const [re, suggestion, detail] of TYPO_RULES) {
    if (!suggestion) continue;
    if (re.test(sql)) {
      found.push({ pattern: re.source, suggestion, detail });
    }
  }
  return found;
}

// ── OS Virtual File System ────────────────────────────────────────────────────

const LINUX_INITIAL: [string, FSEntry][] = [
  ['/',                             { type: 'dir',  permissions: 'rwxr-xr-x', size: 4096 }],
  ['/home',                         { type: 'dir',  permissions: 'rwxr-xr-x', size: 4096 }],
  ['/home/user',                    { type: 'dir',  permissions: 'rwx------',  size: 4096 }],
  ['/home/user/documents',          { type: 'dir',  permissions: 'rwxr-xr-x', size: 4096 }],
  ['/home/user/documents/readme.txt',
    { type: 'file', permissions: 'rw-r--r--', size: 47,
      content: 'TPMP 연습장에 오신 것을 환영합니다!\n이 파일을 cat 명령어로 읽어보세요.' }],
  ['/home/user/documents/notes.md',
    { type: 'file', permissions: 'rw-r--r--', size: 35,
      content: '# 메모\n- 연습 파일입니다.\n- 자유롭게 편집하세요.' }],
  ['/home/user/downloads',          { type: 'dir',  permissions: 'rwxr-xr-x', size: 4096 }],
  ['/home/user/Desktop',            { type: 'dir',  permissions: 'rwxr-xr-x', size: 4096 }],
  ['/var',                          { type: 'dir',  permissions: 'rwxr-xr-x', size: 4096 }],
  ['/var/log',                      { type: 'dir',  permissions: 'rwxr-xr-x', size: 4096 }],
  ['/var/log/system.log',
    { type: 'file', permissions: 'rw-r-----', size: 78,
      content: '[2026-01-01 09:00:00] System started\n[2026-01-01 09:01:23] Service initialized\n[2026-01-01 09:05:15] User login: user' }],
  ['/etc',                          { type: 'dir',  permissions: 'rwxr-xr-x', size: 4096 }],
  ['/etc/hosts',
    { type: 'file', permissions: 'rw-r--r--', size: 46,
      content: '127.0.0.1\tlocalhost\n::1\t\tlocalhost ip6-localhost\n0.0.0.0\t0.0.0.0' }],
  ['/etc/passwd',
    { type: 'file', permissions: 'rw-r--r--', size: 72,
      content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:user:/home/user:/bin/bash' }],
];

const WIN_INITIAL: [string, FSEntry][] = [
  ['C:\\',                                { type: 'dir', permissions: '', size: 0 }],
  ['C:\\Users',                           { type: 'dir', permissions: '', size: 0 }],
  ['C:\\Users\\user',                     { type: 'dir', permissions: '', size: 0 }],
  ['C:\\Users\\user\\Documents',          { type: 'dir', permissions: '', size: 0 }],
  ['C:\\Users\\user\\Documents\\readme.txt',
    { type: 'file', permissions: '', size: 47,
      content: 'TPMP 연습장에 오신 것을 환영합니다!\r\ntype 명령어로 이 파일을 읽어보세요.' }],
  ['C:\\Users\\user\\Downloads',          { type: 'dir', permissions: '', size: 0 }],
  ['C:\\Users\\user\\Desktop',            { type: 'dir', permissions: '', size: 0 }],
  ['C:\\Windows',                         { type: 'dir', permissions: '', size: 0 }],
  ['C:\\Windows\\System32',               { type: 'dir', permissions: '', size: 0 }],
  ['C:\\Program Files',                   { type: 'dir', permissions: '', size: 0 }],
];

function makeFs(entries: [string, FSEntry][]): Map<string, FSEntry> {
  return new Map(entries);
}

// ── Path Utilities ────────────────────────────────────────────────────────────

function normalizePosix(path: string): string {
  const parts = path.split('/').filter(p => p !== '' && p !== '.');
  const result: string[] = [];
  for (const p of parts) {
    if (p === '..') result.pop(); else result.push(p);
  }
  return '/' + result.join('/');
}

function resolvePosix(cwd: string, target: string): string {
  if (!target) return cwd;
  if (target === '~' || target === '') return '/home/user';
  if (target.startsWith('~/')) return normalizePosix('/home/user/' + target.slice(2));
  if (target.startsWith('/')) return normalizePosix(target);
  return normalizePosix(cwd + '/' + target);
}

function normalizeWin(path: string): string {
  const sep = '\\';
  const parts = path.split(/[\\/]/).filter(Boolean);
  const result: string[] = [];
  for (const p of parts) {
    if (p === '..') result.pop(); else if (p !== '.') result.push(p);
  }
  const joined = result.join(sep);
  return joined.endsWith(':') ? joined + sep : joined;
}

function resolveWin(cwd: string, target: string): string {
  if (!target) return cwd;
  if (/^[A-Za-z]:/.test(target)) return normalizeWin(target);
  if (target === '..') return normalizeWin(cwd + '\\..');
  return normalizeWin(cwd + '\\' + target);
}

function childrenOf(fs: Map<string, FSEntry>, dir: string, sep: string): string[] {
  const isRoot = dir === '/' || dir.endsWith(':\\');
  const prefix = isRoot ? dir : dir + sep;
  return [...fs.keys()].filter(k => {
    if (!k.startsWith(prefix)) return false;
    const rest = k.slice(prefix.length);
    return rest.length > 0 && !rest.includes(sep);
  });
}

function formatDateShort(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

// ── Linux Command Executor ───────────────────────────────────────────────────

function parseLine(line: string): string[] {
  const parts: string[] = [];
  let cur = '';
  let inQ = false;
  let qChar = '';
  for (const ch of line) {
    if (inQ) {
      if (ch === qChar) inQ = false; else cur += ch;
    } else if (ch === '"' || ch === "'") {
      inQ = true; qChar = ch;
    } else if (ch === ' ') {
      if (cur) { parts.push(cur); cur = ''; }
    } else { cur += ch; }
  }
  if (cur) parts.push(cur);
  return parts;
}

function execLinux(
  raw: string, fs: Map<string, FSEntry>, cwd: string, history: string[]
): CommandResult {
  const parts = parseLine(raw.trim());
  if (!parts.length) return { lines: [] };
  const [cmd, ...args] = parts;
  const c = cmd.toLowerCase();

  switch (c) {
    case 'pwd': return { lines: [cwd] };

    case 'whoami': return { lines: ['user'] };
    case 'hostname': return { lines: ['tpmp-practice'] };
    case 'date': return { lines: [new Date().toString()] };
    case 'uname': return { lines: ['Linux tpmp-practice 5.15.0 #1 SMP x86_64 GNU/Linux'] };

    case 'clear': case 'cls': return { lines: [], clear: true };

    case 'history':
      return { lines: history.map((h, i) => `  ${String(i + 1).padStart(3)}  ${h}`) };

    case 'ps':
      return { lines: ['  PID TTY          TIME CMD', '    1 pts/0    00:00:00 bash', `   ${Math.floor(Math.random() * 900) + 100} pts/0    00:00:00 ps`] };

    case 'df':
      return { lines: ['Filesystem      Size  Used Avail Use% Mounted on', '/dev/sda1        20G  8.2G  11G   43% /', 'tmpfs           2.0G     0  2.0G    0% /dev/shm'] };

    case 'ls': {
      const flags = args.filter(a => a.startsWith('-')).join('');
      const target = args.find(a => !a.startsWith('-'));
      const dir = target ? resolvePosix(cwd, target) : cwd;
      const entry = fs.get(dir);
      if (!entry || entry.type !== 'dir') return { lines: [`ls: '${dir}': No such file or directory`] };
      const kids = childrenOf(fs, dir, '/');
      if (!kids.length) return { lines: [] };
      const showAll = flags.includes('a');
      const showLong = flags.includes('l');
      const names = kids
        .map(k => ({ path: k, name: k.split('/').pop()! }))
        .filter(({ name }) => showAll || !name.startsWith('.'));

      if (showLong) {
        const header = 'total ' + names.length * 4;
        const rows = names.map(({ path, name }) => {
          const e = fs.get(path)!;
          const prefix = e.type === 'dir' ? 'd' : '-';
          return `${prefix}${e.permissions}  1 user user ${String(e.size).padStart(5)} ${formatDateShort()} ${name}`;
        });
        return { lines: [header, ...rows] };
      }
      return { lines: [names.map(n => n.name).join('  ')] };
    }

    case 'cd': {
      const target = args[0] ?? '~';
      const dest = resolvePosix(cwd, target);
      const entry = fs.get(dest);
      if (!entry || entry.type !== 'dir') return { lines: [`bash: cd: ${args[0]}: No such file or directory`] };
      return { lines: [], newPath: dest };
    }

    case 'mkdir': {
      const mkP = args.includes('-p');
      const targets = args.filter(a => !a.startsWith('-'));
      if (!targets.length) return { lines: ['mkdir: missing operand'] };
      const newFs = new Map(fs);
      const out: string[] = [];
      for (const t of targets) {
        const dest = resolvePosix(cwd, t);
        if (newFs.has(dest)) { out.push(`mkdir: cannot create directory '${t}': File exists`); continue; }
        if (!mkP) {
          const parent = dest.substring(0, dest.lastIndexOf('/')) || '/';
          if (!newFs.has(parent)) { out.push(`mkdir: cannot create directory '${t}': No such file or directory`); continue; }
        } else {
          let acc = '';
          for (const seg of dest.split('/').filter(Boolean)) {
            acc += '/' + seg;
            if (!newFs.has(acc)) newFs.set(acc, { type: 'dir', permissions: 'rwxr-xr-x', size: 4096 });
          }
        }
        newFs.set(dest, { type: 'dir', permissions: 'rwxr-xr-x', size: 4096 });
      }
      return { lines: out, newFs };
    }

    case 'touch': {
      if (!args[0]) return { lines: ['touch: missing file operand'] };
      const newFs = new Map(fs);
      for (const t of args) {
        const p = resolvePosix(cwd, t);
        if (!newFs.has(p)) newFs.set(p, { type: 'file', permissions: 'rw-r--r--', size: 0, content: '' });
      }
      return { lines: [], newFs };
    }

    case 'cat': {
      if (!args[0]) return { lines: ['cat: missing operand'] };
      const p = resolvePosix(cwd, args[0]);
      const entry = fs.get(p);
      if (!entry) return { lines: [`cat: ${args[0]}: No such file or directory`] };
      if (entry.type === 'dir') return { lines: [`cat: ${args[0]}: Is a directory`] };
      return { lines: (entry.content ?? '').split('\n') };
    }

    case 'echo': {
      const redirIdx = args.indexOf('>');
      const appendIdx = args.indexOf('>>');
      if (redirIdx !== -1) {
        const text = args.slice(0, redirIdx).join(' ');
        const fname = args[redirIdx + 1];
        if (!fname) return { lines: ['echo: redirection target missing'] };
        const p = resolvePosix(cwd, fname);
        const newFs = new Map(fs);
        newFs.set(p, { type: 'file', permissions: 'rw-r--r--', size: text.length, content: text });
        return { lines: [], newFs };
      }
      if (appendIdx !== -1) {
        const text = args.slice(0, appendIdx).join(' ');
        const fname = args[appendIdx + 1];
        if (!fname) return { lines: ['echo: redirection target missing'] };
        const p = resolvePosix(cwd, fname);
        const newFs = new Map(fs);
        const existing = newFs.get(p);
        const newContent = existing?.content != null ? existing.content + '\n' + text : text;
        newFs.set(p, { type: 'file', permissions: 'rw-r--r--', size: newContent.length, content: newContent });
        return { lines: [], newFs };
      }
      return { lines: [args.join(' ')] };
    }

    case 'rm': {
      const recursive = args.some(a => a === '-r' || a === '-rf' || a === '-fr' || a === '-R');
      const targets = args.filter(a => !a.startsWith('-'));
      if (!targets.length) return { lines: ['rm: missing operand'] };
      const newFs = new Map(fs);
      const out: string[] = [];
      for (const t of targets) {
        const p = resolvePosix(cwd, t);
        const entry = newFs.get(p);
        if (!entry) { out.push(`rm: cannot remove '${t}': No such file or directory`); continue; }
        if (entry.type === 'dir' && !recursive) { out.push(`rm: cannot remove '${t}': Is a directory`); continue; }
        for (const k of [...newFs.keys()]) {
          if (k === p || k.startsWith(p + '/')) newFs.delete(k);
        }
      }
      return { lines: out, newFs };
    }

    case 'cp': case 'mv': {
      if (args.length < 2) return { lines: [`${c}: missing destination`] };
      const src = resolvePosix(cwd, args[args.length - 2]);
      const dst = resolvePosix(cwd, args[args.length - 1]);
      const entry = fs.get(src);
      if (!entry) return { lines: [`${c}: '${args[0]}': No such file or directory`] };
      const newFs = new Map(fs);
      const dstEntry = newFs.get(dst);
      const finalDst = dstEntry?.type === 'dir' ? dst + '/' + src.split('/').pop() : dst;
      newFs.set(finalDst, { ...entry });
      if (c === 'mv') for (const k of [...newFs.keys()]) { if (k === src || k.startsWith(src + '/')) newFs.delete(k); }
      return { lines: [], newFs };
    }

    case 'chmod': {
      if (args.length < 2) return { lines: ['chmod: missing operand'] };
      const [perms, target] = args;
      const p = resolvePosix(cwd, target);
      if (!fs.has(p)) return { lines: [`chmod: cannot access '${target}': No such file or directory`] };
      const newFs = new Map(fs);
      const e = { ...newFs.get(p)! };
      e.permissions = perms.length === 3 ? perms : e.permissions;
      newFs.set(p, e);
      return { lines: [], newFs };
    }

    case 'grep': {
      if (args.length < 2) return { lines: ['usage: grep PATTERN FILE'] };
      const [pattern, fname] = args;
      const p = resolvePosix(cwd, fname);
      const entry = fs.get(p);
      if (!entry || entry.type !== 'file') return { lines: [`grep: ${fname}: No such file or directory`] };
      const re = new RegExp(pattern, 'i');
      const matches = (entry.content ?? '').split('\n').filter(l => re.test(l));
      return { lines: matches.length ? matches : [] };
    }

    case 'find': {
      const pathArg = args[0] ?? '.';
      const nameIdx = args.indexOf('-name');
      const namePattern = nameIdx !== -1 ? args[nameIdx + 1] : null;
      const base = resolvePosix(cwd, pathArg);
      const re = namePattern ? new RegExp('^' + namePattern.replace(/\*/g, '.*') + '$', 'i') : null;
      const results: string[] = [];
      for (const k of fs.keys()) {
        if (!k.startsWith(base)) continue;
        const name = k.split('/').pop()!;
        if (!re || re.test(name)) results.push(k);
      }
      return { lines: results };
    }

    case 'man': {
      const topic = args[0];
      if (!topic) return { lines: ['What manual page do you want?'] };
      return { lines: [`No manual entry for ${topic}. help 명령어를 사용해 지원 목록을 확인하세요.`] };
    }

    case 'help':
      return {
        lines: [
          '── 지원 명령어 (Linux) ─────────────────',
          '파일/디렉토리: ls  pwd  cd  mkdir  touch  cat  rm  cp  mv  chmod',
          '텍스트:        echo  echo text > file  grep  find',
          '시스템:        whoami  hostname  date  uname  ps  df -h  history',
          '화면:          clear',
          '도움말:        help  man [command]',
          '──────────────────────────────────────',
        ],
      };

    default:
      return { lines: [`bash: ${cmd}: command not found\n'help'를 입력하면 지원 명령어 목록이 표시됩니다.`] };
  }
}

// ── Windows Command Executor ──────────────────────────────────────────────────

function execWindows(
  raw: string, fs: Map<string, FSEntry>, cwd: string, history: string[]
): CommandResult {
  const parts = parseLine(raw.trim());
  if (!parts.length) return { lines: [] };
  const [cmd, ...args] = parts;
  const c = cmd.toLowerCase();

  switch (c) {
    case 'cls': return { lines: [], clear: true };

    case 'ver': return { lines: ['Microsoft Windows [Version 10.0.19045]'] };
    case 'whoami': return { lines: [`${cwd.split('\\')[0]}\\user`] };
    case 'hostname': return { lines: ['TPMP-PC'] };
    case 'date': return { lines: [`현재 날짜: ${formatDateShort()}`] };

    case 'ipconfig':
      return { lines: ['Windows IP 구성', '', '이더넷 어댑터 Ethernet:', '   IPv4 주소 . . . . . : 192.168.1.100', '   서브넷 마스크 . . . : 255.255.255.0', '   기본 게이트웨이 . . : 192.168.1.1'] };

    case 'systeminfo':
      return { lines: ['호스트 이름:         TPMP-PC', 'OS 이름:             Microsoft Windows 10', '총 실제 메모리:      16,384 MB', '사용 가능한 실제 메모리: 8,192 MB'] };

    case 'tasklist':
      return { lines: ['이미지 이름            PID 세션 이름     세션#      메모리 사용', '======================== ====== ============', 'System Idle Process          0 Services           0         24 K', 'System                       4 Services           0      1,152 K', 'explorer.exe              2048 Console             1     72,304 K'] };

    case 'dir': {
      const showAll = args.some(a => a.toLowerCase() === '/a');
      const dir = args.find(a => !a.startsWith('/')) ?? cwd;
      const target = resolveWin(cwd, dir === cwd ? '.' : dir);
      const entry = fs.get(target);
      if (!entry || entry.type !== 'dir') return { lines: [`지정된 경로를 찾을 수 없습니다 - ${dir}`] };
      const kids = childrenOf(fs, target, '\\');
      const lines = [` ${target}의 디렉터리`, ''];
      for (const k of kids) {
        const e = fs.get(k)!;
        const name = k.split('\\').pop()!;
        if (!showAll && name.startsWith('.')) continue;
        const tag = e.type === 'dir' ? '<DIR>' : '     ';
        lines.push(`${formatDateShort()}  ${tag}   ${name}`);
      }
      lines.push('', `  ${kids.length}개 파일`);
      return { lines };
    }

    case 'cd': {
      if (!args[0]) return { lines: [cwd] };
      const dest = resolveWin(cwd, args[0]);
      const entry = fs.get(dest);
      if (!entry || entry.type !== 'dir') return { lines: [`지정된 경로를 찾을 수 없습니다 - ${args[0]}`] };
      return { lines: [], newPath: dest };
    }

    case 'mkdir': case 'md': {
      if (!args[0]) return { lines: ['구문이 올바르지 않습니다.'] };
      const newFs = new Map(fs);
      const out: string[] = [];
      for (const t of args) {
        const p = resolveWin(cwd, t);
        if (newFs.has(p)) { out.push(`하위 디렉터리 또는 파일 ${t}이(가) 이미 있습니다.`); continue; }
        newFs.set(p, { type: 'dir', permissions: '', size: 0 });
      }
      return { lines: out, newFs };
    }

    case 'type': {
      if (!args[0]) return { lines: ['파일 이름을 지정하지 않았습니다.'] };
      const p = resolveWin(cwd, args[0]);
      const entry = fs.get(p);
      if (!entry || entry.type !== 'file') return { lines: [`지정된 파일을 찾을 수 없습니다 - ${args[0]}`] };
      return { lines: (entry.content ?? '').split(/\r?\n/) };
    }

    case 'echo': {
      const redirIdx = args.indexOf('>');
      if (redirIdx !== -1) {
        const text = args.slice(0, redirIdx).join(' ');
        const fname = args[redirIdx + 1];
        if (!fname) return { lines: ['파일 이름이 필요합니다.'] };
        const p = resolveWin(cwd, fname);
        const newFs = new Map(fs);
        newFs.set(p, { type: 'file', permissions: '', size: text.length, content: text });
        return { lines: ['        1개 파일이 복사되었습니다.'], newFs };
      }
      return { lines: [args.join(' ')] };
    }

    case 'del': {
      if (!args[0]) return { lines: ['파일 이름을 지정하지 않았습니다.'] };
      const newFs = new Map(fs);
      for (const t of args) {
        const p = resolveWin(cwd, t);
        if (!newFs.has(p)) { return { lines: [`지정된 파일을 찾을 수 없습니다 - ${t}`] }; }
        newFs.delete(p);
      }
      return { lines: [], newFs };
    }

    case 'rmdir': case 'rd': {
      const force = args.some(a => a === '/s') || args.some(a => a === '/q');
      const target = args.find(a => !a.startsWith('/'));
      if (!target) return { lines: ['구문이 올바르지 않습니다.'] };
      const p = resolveWin(cwd, target);
      if (!fs.has(p)) return { lines: [`지정된 경로를 찾을 수 없습니다 - ${target}`] };
      const newFs = new Map(fs);
      for (const k of [...newFs.keys()]) { if (k === p || k.startsWith(p + '\\')) newFs.delete(k); }
      return { lines: [], newFs };
    }

    case 'copy': {
      if (args.length < 2) return { lines: ['구문이 올바르지 않습니다.'] };
      const src = resolveWin(cwd, args[0]);
      const dst = resolveWin(cwd, args[1]);
      const entry = fs.get(src);
      if (!entry) return { lines: [`지정된 파일을 찾을 수 없습니다 - ${args[0]}`] };
      const newFs = new Map(fs);
      newFs.set(dst, { ...entry });
      return { lines: ['        1개 파일이 복사되었습니다.'], newFs };
    }

    case 'move': {
      if (args.length < 2) return { lines: ['구문이 올바르지 않습니다.'] };
      const src = resolveWin(cwd, args[0]);
      const dst = resolveWin(cwd, args[1]);
      const entry = fs.get(src);
      if (!entry) return { lines: [`지정된 파일을 찾을 수 없습니다 - ${args[0]}`] };
      const newFs = new Map(fs);
      newFs.set(dst, { ...entry });
      newFs.delete(src);
      return { lines: ['        1개 파일이 이동되었습니다.'], newFs };
    }

    case 'help':
      return {
        lines: [
          '── 지원 명령어 (Windows) ───────────────',
          '탐색:     dir  cd  mkdir(md)',
          '파일:     type  echo  del  copy  move  rmdir(rd)',
          '시스템:   ver  whoami  hostname  ipconfig  systeminfo  tasklist',
          '화면:     cls',
          '────────────────────────────────────────',
        ],
      };

    default:
      return { lines: [`'${cmd}'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는 배치 파일이 아닙니다.`] };
  }
}

// ── Practice Tables Info (ERD) ───────────────────────────────────────────────

type ErdCol = { name: string; type: string; pk?: boolean; fk?: string };

const PRAC_TABLES: Array<{
  name: string; desc: string; rowCount: number;
  headerCls: string; sample: string; cols: ErdCol[];
}> = [
  {
    name: 'prac_departments',
    desc: '부서',
    rowCount: 5,
    headerCls: 'bg-violet-600',
    cols: [
      { name: 'id',       type: 'SERIAL',       pk: true },
      { name: 'name',     type: 'VARCHAR(50)'  },
      { name: 'location', type: 'VARCHAR(100)' },
      { name: 'budget',   type: 'BIGINT'       },
    ],
    sample: 'SELECT * FROM prac_departments;',
  },
  {
    name: 'prac_employees',
    desc: '직원',
    rowCount: 10,
    headerCls: 'bg-emerald-600',
    cols: [
      { name: 'id',            type: 'SERIAL',       pk: true },
      { name: 'name',          type: 'VARCHAR(50)'  },
      { name: 'department_id', type: 'INT',          fk: 'prac_departments' },
      { name: 'salary',        type: 'INT'           },
      { name: 'hire_date',     type: 'DATE'          },
      { name: 'email',         type: 'VARCHAR(100)' },
      { name: 'job_title',     type: 'VARCHAR(100)' },
    ],
    sample: 'SELECT e.name, d.name AS dept FROM prac_employees e JOIN prac_departments d ON e.department_id = d.id;',
  },
  {
    name: 'prac_products',
    desc: '상품',
    rowCount: 8,
    headerCls: 'bg-amber-500',
    cols: [
      { name: 'id',       type: 'SERIAL',       pk: true },
      { name: 'name',     type: 'VARCHAR(100)' },
      { name: 'category', type: 'VARCHAR(50)'  },
      { name: 'price',    type: 'INT'           },
      { name: 'stock',    type: 'INT'           },
    ],
    sample: 'SELECT category, COUNT(*) FROM prac_products GROUP BY category;',
  },
  {
    name: 'prac_orders',
    desc: '주문',
    rowCount: 12,
    headerCls: 'bg-rose-600',
    cols: [
      { name: 'id',            type: 'SERIAL',      pk: true },
      { name: 'customer_name', type: 'VARCHAR(50)' },
      { name: 'product_id',    type: 'INT',         fk: 'prac_products' },
      { name: 'quantity',      type: 'INT'          },
      { name: 'total_amount',  type: 'BIGINT'       },
      { name: 'order_date',    type: 'DATE'         },
    ],
    sample: 'SELECT customer_name, SUM(total_amount) FROM prac_orders GROUP BY customer_name ORDER BY 2 DESC;',
  },
];

// ── ERD Helper Components ────────────────────────────────────────────────────

function ErdCard({
  table,
  onSample,
}: {
  table: (typeof PRAC_TABLES)[number];
  onSample: (sql: string) => void;
}) {
  return (
    <div className="flex-1 min-w-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className={`px-3 py-2 ${table.headerCls}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold text-white truncate">{table.name}</p>
            <p className="text-[9px] text-white/60">{table.desc} · {table.rowCount}행</p>
          </div>
          <button
            onClick={() => onSample(table.sample)}
            className="shrink-0 text-[9px] text-white/80 hover:text-white border border-white/30 hover:border-white/60 px-1.5 py-0.5 rounded transition-colors"
          >
            예제 SQL
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {table.cols.map(col => (
          <div key={col.name} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
            {col.pk ? (
              <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 shrink-0 leading-none">PK</span>
            ) : col.fk ? (
              <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0 leading-none">FK</span>
            ) : (
              <span className="w-[18px] shrink-0" />
            )}
            <span className={`font-mono text-[11px] flex-1 min-w-0 truncate ${col.fk ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {col.name}
            </span>
            <span className="text-[9px] text-gray-400 dark:text-gray-600 shrink-0 font-mono">{col.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErdArrow() {
  return (
    <div className="hidden sm:flex flex-col items-center justify-center shrink-0 self-center px-2 gap-0.5">
      <svg width="40" height="14" viewBox="0 0 40 14" fill="none">
        <line x1="2" y1="7" x2="34" y2="7" stroke="#9CA3AF" strokeWidth="1.5" />
        <line x1="2" y1="3" x2="2" y2="11" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
        <polyline points="29,3 37,7 29,11" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[8px] text-gray-400 dark:text-gray-500 font-mono leading-none">1:N</span>
    </div>
  );
}

// ── File Tree Component ──────────────────────────────────────────────────────

function FileTree({
  fs,
  cwd,
  osType,
  expandedPaths,
  onToggle,
}: {
  fs: Map<string, FSEntry>;
  cwd: string;
  osType: OsType;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
}) {
  const sep = osType === 'linux' ? '/' : '\\';
  const root = osType === 'linux' ? '/' : 'C:\\';

  function renderChildren(dir: string, depth: number): React.ReactNode {
    const kids = childrenOf(fs, dir, sep);
    if (!kids.length) return null;
    return kids.map(path => {
      const entry = fs.get(path)!;
      const name = path.split(sep).filter(Boolean).pop() ?? path;
      const isDir = entry.type === 'dir';
      const isExpanded = expandedPaths.has(path);
      const isCurrent = path === cwd;
      return (
        <div key={path}>
          <button
            type="button"
            onClick={() => { if (isDir) onToggle(path); }}
            className={`w-full flex items-center gap-1 py-0.5 pr-2 text-left text-xs transition-colors
              ${isCurrent
                ? 'bg-indigo-900/40 text-indigo-300'
                : isDir
                ? 'text-gray-300 hover:bg-gray-800/60 cursor-pointer'
                : 'text-gray-500 cursor-default'}`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {isDir ? (
              <span className="text-gray-500 w-3 shrink-0 text-center text-[10px]">
                {isExpanded ? '▾' : '▸'}
              </span>
            ) : (
              <span className="w-3 shrink-0" />
            )}
            <span className={`font-mono truncate ${isDir ? 'text-yellow-400/90' : 'text-gray-500'}`}>
              {name}
            </span>
          </button>
          {isDir && isExpanded && renderChildren(path, depth + 1)}
        </div>
      );
    });
  }

  const isRootExpanded = expandedPaths.has(root);

  return (
    <div className="select-none text-xs">
      <button
        type="button"
        onClick={() => onToggle(root)}
        className="w-full flex items-center gap-1 py-0.5 px-2 text-left cursor-pointer text-gray-200 hover:bg-gray-800/60 transition-colors"
      >
        <span className="text-gray-500 w-3 text-center text-[10px]">{isRootExpanded ? '▾' : '▸'}</span>
        <span className="font-mono text-yellow-300">{root}</span>
      </button>
      {isRootExpanded && renderChildren(root, 1)}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function PracticePage() {
  // Tab
  const [tab, setTab] = useState<Tab>('sql');
  const [guideTab, setGuideTab] = useState<'sql' | 'os'>('sql');
  const [sqlDialectTab, setSqlDialectTab] = useState<'postgresql' | 'mysql' | 'oracle'>('postgresql');

  // SQL state
  const [dialect, setDialect] = useState<Dialect>('postgresql');
  const [sql, setSql] = useState('SELECT * FROM prac_departments;');
  const [sqlResult, setSqlResult] = useState<SqlResult | null>(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [typoWarnings, setTypoWarnings] = useState<TypoWarning[]>([]);
  const [showTypoModal, setShowTypoModal] = useState(false);
  const [pendingSql, setPendingSql] = useState('');
  const [showErd, setShowErd] = useState(true);

  // OS state
  const [osType, setOsType] = useState<OsType>('linux');
  const [linuxFs, setLinuxFs] = useState(() => makeFs(LINUX_INITIAL));
  const [winFs, setWinFs]     = useState(() => makeFs(WIN_INITIAL));
  const [linuxCwd, setLinuxCwd] = useState('/home/user');
  const [winCwd, setWinCwd]     = useState('C:\\Users\\user');
  const [termLines, setTermLines] = useState<TermLine[]>([
    { kind: 'output', text: '연습장 터미널 (Linux 시뮬레이터)' },
    { kind: 'output', text: "help 명령어로 사용 가능한 목록을 확인하세요." },
  ]);
  const [termInput, setTermInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  // 연습장 운영 규칙
  const [rules, setRules] = useState<PracticeRules | null>(null);

  const termEndRef = useRef<HTMLDivElement>(null);
  const termInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    practiceService.getRules()
      .then(res => { if (res.data.success && res.data.data) setRules(res.data.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    termEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [termLines]);

  // ── SQL Handlers ──────────────────────────────────────────────────────────

  const runSql = useCallback(async (sqlToRun: string) => {
    setSqlLoading(true);
    try {
      const res = await practiceService.executeSql(sqlToRun, dialect);
      if (res.data.success) setSqlResult(res.data.data!);
    } finally {
      setSqlLoading(false);
    }
  }, [dialect]);

  const handleExecute = useCallback(() => {
    const warnings = detectTypos(sql);
    if (warnings.length > 0) {
      setTypoWarnings(warnings);
      setPendingSql(sql);
      setShowTypoModal(true);
    } else {
      runSql(sql);
    }
  }, [sql, runSql]);

  const toggleExpanded = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }, []);

  const handleReset = useCallback(async () => {
    if (!confirm('연습 데이터를 초기 상태로 되돌리겠습니까?\n사용자가 생성한 prac_ 테이블도 삭제됩니다.')) return;
    setSqlLoading(true);
    try {
      await practiceService.resetData();
      setSqlResult({ type: 'INFO', columns: [], rows: [], rowCount: 0, message: '연습 데이터가 초기화되었습니다.', success: true });
    } finally {
      setSqlLoading(false);
    }
  }, []);

  // ── OS Handlers ───────────────────────────────────────────────────────────

  const fs  = osType === 'linux' ? linuxFs  : winFs;
  const cwd = osType === 'linux' ? linuxCwd : winCwd;
  const setFs  = osType === 'linux' ? setLinuxFs  : setWinFs;
  const setCwd = osType === 'linux' ? setLinuxCwd : setWinCwd;

  const prompt = osType === 'linux'
    ? `user@tpmp:${cwd.replace('/home/user', '~')}$ `
    : `${cwd}> `;

  const handleRunCmd = useCallback(() => {
    const input = termInput.trim();
    if (!input) return;
    const newHistory = [input, ...cmdHistory].slice(0, 100);
    setCmdHistory(newHistory);
    setHistIdx(-1);
    setTermInput('');

    const result = osType === 'linux'
      ? execLinux(input, fs, cwd, newHistory)
      : execWindows(input, fs, cwd, newHistory);

    setTermLines(prev => {
      const base: TermLine[] = result.clear ? [] : prev;
      return [
        ...base,
        { kind: 'input',  text: prompt + input },
        ...result.lines.map(l => ({ kind: 'output' as const, text: l })),
      ];
    });
    if (result.newPath) setCwd(result.newPath);
    if (result.newFs)   setFs(result.newFs);
  }, [termInput, cmdHistory, osType, fs, cwd, prompt, setCwd, setFs]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { handleRunCmd(); return; }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, cmdHistory.length - 1);
      setHistIdx(next);
      setTermInput(cmdHistory[next] ?? '');
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setTermInput(next === -1 ? '' : cmdHistory[next] ?? '');
    }
  }, [handleRunCmd, histIdx, cmdHistory]);

  const switchOs = (next: OsType) => {
    setOsType(next);
    setExpandedPaths(new Set());
    setTermLines([
      { kind: 'output', text: `연습장 터미널 (${next === 'linux' ? 'Linux' : 'Windows'} 시뮬레이터)` },
      { kind: 'output', text: 'help 명령어로 사용 가능한 목록을 확인하세요.' },
    ]);
  };

  const resetOs = () => {
    if (osType === 'linux') { setLinuxFs(makeFs(LINUX_INITIAL)); setLinuxCwd('/home/user'); }
    else { setWinFs(makeFs(WIN_INITIAL)); setWinCwd('C:\\Users\\user'); }
    setTermLines([
      { kind: 'output', text: '파일시스템이 초기화되었습니다.' },
    ]);
    setTermInput('');
    setCmdHistory([]);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const tabClass = (t: Tab) =>
    `px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
      tab === t
        ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 dark:border-indigo-400 bg-white dark:bg-gray-900'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
    }`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">연습장</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">SQL과 OS 명령어를 안전한 가상 환경에서 연습하세요.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button className={tabClass('sql')}  onClick={() => setTab('sql')}>SQL 연습</button>
        <button className={tabClass('os')}   onClick={() => setTab('os')}>OS 명령어</button>
        <button className={tabClass('guide')} onClick={() => setTab('guide')}>사용 가이드</button>
      </div>

      {/* ── SQL Tab ── */}
      {tab === 'sql' && (
        <div className="space-y-3">

          {/* ERD Panel */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowErd(!showErd)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0">연습 테이블 ERD</span>
              {!showErd && (
                <div className="flex gap-1.5 overflow-hidden">
                  {PRAC_TABLES.map(t => (
                    <span key={t.name} className="text-[10px] font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded shrink-0">{t.name}</span>
                  ))}
                </div>
              )}
              <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 text-gray-400 ml-auto transition-transform shrink-0 ${showErd ? 'rotate-180' : ''}`}>
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {showErd && (
              <div className="px-4 pb-4 pt-1">
                <div className="flex flex-col lg:flex-row gap-6">

                  {/* Group 1: departments → employees */}
                  <div className="flex-1 flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0">
                    <ErdCard table={PRAC_TABLES[0]} onSample={setSql} />
                    <ErdArrow />
                    <ErdCard table={PRAC_TABLES[1]} onSample={setSql} />
                  </div>

                  <div className="hidden lg:block w-px bg-gray-100 dark:bg-gray-800 self-stretch" />
                  <div className="lg:hidden h-px bg-gray-100 dark:bg-gray-800" />

                  {/* Group 2: products → orders */}
                  <div className="flex-1 flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0">
                    <ErdCard table={PRAC_TABLES[2]} onSample={setSql} />
                    <ErdArrow />
                    <ErdCard table={PRAC_TABLES[3]} onSample={setSql} />
                  </div>

                </div>
                {/* Legend */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5 text-[9px] text-gray-400 dark:text-gray-500">
                    <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">PK</span>
                    기본키 (Primary Key)
                  </span>
                  <span className="flex items-center gap-1.5 text-[9px] text-gray-400 dark:text-gray-500">
                    <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">FK</span>
                    외래키 (Foreign Key) — 화살표 방향이 참조 대상
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dialect + buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
              {(['postgresql', 'mysql', 'oracle'] as Dialect[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDialect(d)}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    dialect === d
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
            {dialect !== 'postgresql' && (
              <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                {dialect === 'mysql' ? 'MySQL' : 'Oracle'} 방언 → PostgreSQL 자동 변환
              </span>
            )}
            <div className="ml-auto flex gap-2">
              <button
                onClick={handleReset}
                disabled={sqlLoading}
                className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                데이터 초기화
              </button>
              <button
                onClick={handleExecute}
                disabled={sqlLoading || !sql.trim()}
                className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
              >
                {sqlLoading ? '실행 중...' : '▶ 실행'}
              </button>
            </div>
          </div>

          {/* SQL Editor */}
          <div className="relative">
            <textarea
              value={sql}
              onChange={e => setSql(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleExecute(); } }}
              rows={7}
              spellCheck={false}
              placeholder="SQL을 입력하세요... (Ctrl+Enter로 실행)"
              className="w-full font-mono text-sm px-4 py-3 bg-gray-950 text-green-300 border border-gray-700 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-600"
            />
            <p className="absolute bottom-2 right-3 text-[10px] text-gray-600">Ctrl+Enter 실행</p>
          </div>

          {/* Result */}
          {sqlResult && (
            <div className={`rounded-xl border overflow-hidden ${
              !sqlResult.success
                ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                : sqlResult.simulated
                ? 'border-blue-200 dark:border-blue-800'
                : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                !sqlResult.success
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : sqlResult.simulated
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  !sqlResult.success ? 'bg-red-500' : sqlResult.simulated ? 'bg-blue-500' : 'bg-green-500'
                }`} />
                {sqlResult.type} — {sqlResult.message.split('\n')[0]}
                <span className="ml-auto flex items-center gap-1.5 shrink-0">
                  {dialect !== 'postgresql' && sqlResult.success && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded font-semibold tracking-wide">
                      {dialect === 'mysql' ? 'MySQL' : 'Oracle'} 방언
                    </span>
                  )}
                  {sqlResult.simulated && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded font-semibold tracking-wide">
                      시뮬레이션
                    </span>
                  )}
                </span>
              </div>

              {sqlResult.success && sqlResult.simulated && (
                <div className="px-4 py-3">
                  <p className="text-sm text-blue-600 dark:text-blue-400 whitespace-pre-line">{sqlResult.message}</p>
                </div>
              )}

              {sqlResult.success && !sqlResult.simulated && sqlResult.columns.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        {sqlResult.columns.map(c => (
                          <th key={c} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sqlResult.rows.map((row, i) => (
                        <tr key={i} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          {row.map((cell, j) => (
                            <td key={j} className="px-4 py-2 text-gray-800 dark:text-gray-200 font-mono text-xs whitespace-nowrap">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!sqlResult.success && (
                <div className="px-4 py-3 space-y-3">
                  <pre className="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap font-mono">{sqlResult.message}</pre>
                  {sqlResult.errorPosition != null && sqlResult.errorPosition > 0 && (() => {
                    const { lineNum, colNum, errorLine, caretPrefix } = getErrorContext(sql, sqlResult.errorPosition!);
                    return (
                      <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                        <p className="text-[11px] text-gray-500 mb-2">
                          오류 위치: {lineNum}행 {colNum + 1}열
                        </p>
                        <pre className="text-xs font-mono text-green-400 whitespace-pre">{errorLine}</pre>
                        <pre className="text-xs font-mono text-red-400 whitespace-pre">{caretPrefix + '^'}</pre>
                      </div>
                    );
                  })()}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    오류가 반복되거나 예상치 못한 문제가 발생했나요?{' '}
                    <a href="/user/inquiries/new" className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300">
                      1:1 문의
                    </a>
                    로 알려주세요.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── OS Tab ── */}
      {tab === 'os' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
              <button
                onClick={() => switchOs('linux')}
                className={`px-4 py-1.5 font-medium transition-colors ${osType === 'linux' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                Linux / Mac
              </button>
              <button
                onClick={() => switchOs('windows')}
                className={`px-4 py-1.5 font-medium transition-colors ${osType === 'windows' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                Windows
              </button>
            </div>
            <button
              onClick={resetOs}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              파일시스템 초기화
            </button>
            <span className="text-xs text-gray-400 dark:text-gray-500">실제 OS에 영향 없음 — 가상 시뮬레이션</span>
          </div>

          {/* File Tree + Terminal */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">

            {/* File Tree */}
            <div className="lg:col-span-1 bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
              <div className="flex items-center px-3 py-2 bg-gray-900 border-b border-gray-800">
                <span className="text-xs text-gray-400 font-medium">파일 탐색기</span>
                <span className="ml-auto text-[10px] text-gray-600">클릭으로 열기/닫기</span>
              </div>
              <div className="h-80 overflow-y-auto py-1">
                <FileTree
                  fs={fs}
                  cwd={cwd}
                  osType={osType}
                  expandedPaths={expandedPaths}
                  onToggle={toggleExpanded}
                />
              </div>
            </div>

            {/* Terminal */}
            <div
              className="lg:col-span-3 bg-gray-950 rounded-xl border border-gray-800 overflow-hidden"
              onClick={() => termInputRef.current?.focus()}
            >
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500 ml-2">{osType === 'linux' ? 'bash' : 'cmd.exe'}</span>
              </div>

              {/* Output */}
              <div className="h-80 overflow-y-auto px-4 py-3 font-mono text-sm space-y-0.5">
                {termLines.map((l, i) => (
                  <div key={i} className={
                    l.kind === 'input'  ? 'text-green-400' :
                    l.kind === 'error'  ? 'text-red-400' :
                    'text-gray-300'
                  }>
                    {l.text || ' '}
                  </div>
                ))}
                <div ref={termEndRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-800 bg-gray-900">
                <span className="text-green-400 font-mono text-sm whitespace-nowrap shrink-0">{prompt}</span>
                <input
                  ref={termInputRef}
                  value={termInput}
                  onChange={e => setTermInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-gray-100 font-mono text-sm outline-none caret-green-400"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Guide Tab ── */}
      {tab === 'guide' && (
        <div className="space-y-5">

          {/* Guide sub-tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
            {(['sql', 'os'] as const).map(gt => (
              <button
                key={gt}
                onClick={() => setGuideTab(gt)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  guideTab === gt
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {gt === 'sql' ? 'SQL 가이드' : 'OS 명령어 가이드'}
              </button>
            ))}
          </div>

          {/* ── SQL Guide ── */}
          {guideTab === 'sql' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* SQL Examples */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4 lg:col-span-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">SQL 예제</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {[
                    ['SELECT', 'SELECT * FROM prac_employees WHERE salary > 4000000;'],
                    ['JOIN', 'SELECT e.name, d.name dept\nFROM prac_employees e\nJOIN prac_departments d ON e.department_id = d.id;'],
                    ['GROUP BY', 'SELECT department_id, AVG(salary)\nFROM prac_employees\nGROUP BY department_id\nHAVING AVG(salary) > 4000000;'],
                    ['WITH (CTE)', 'WITH dept_avg AS (\n  SELECT department_id, AVG(salary) avg_sal\n  FROM prac_employees GROUP BY department_id\n)\nSELECT d.name, da.avg_sal\nFROM dept_avg da\nJOIN prac_departments d ON d.id = da.department_id;'],
                    ['INSERT', "INSERT INTO prac_departments (name, location, budget)\nVALUES ('데이터팀', '서울', 30000000);"],
                    ['UPDATE', "UPDATE prac_employees SET salary = salary * 1.1\nWHERE department_id = 1;"],
                    ['DELETE', "DELETE FROM prac_orders WHERE order_date < '2026-02-01';"],
                    ['CREATE TABLE', "CREATE TABLE prac_my_test (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100)\n);"],
                  ].map(([label, code]) => (
                    <div key={label} className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                      <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-1">{label}</p>
                      <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">{code}</pre>
                      <button
                        onClick={() => { setSql(code as string); setTab('sql'); }}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                      >
                        SQL 탭에서 열기
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="font-medium">주의사항</p>
                  <p>• SELECT는 실제 DB를 조회합니다 (<code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">prac_</code> 접두사 테이블만 허용)</p>
                  <p>• DML/DDL/DCL은 화면 시뮬레이션 — 실제 DB에 반영되지 않습니다</p>
                  <p>• "데이터 초기화" 버튼으로 SELECT 조회 데이터를 원래 상태로 복원할 수 있습니다</p>
                  <p>• 실행 전 오타가 감지되면 팝업으로 안내합니다</p>
                </div>
              </div>

              {/* Dialect Comparison */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4 lg:col-span-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">방언별 주요 차이점 (MySQL / Oracle → PostgreSQL)</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">이 연습장은 PostgreSQL 엔진으로 실행됩니다. MySQL·Oracle 방언을 선택하면 자동 변환되며, 지원하지 않는 문법은 실행 전 오류로 안내합니다.</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">MySQL → PostgreSQL</p>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">MySQL</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">PostgreSQL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {[
                            ['IFNULL(a, b)', 'COALESCE(a, b)'],
                            ['`backtick` 식별자', '"double_quote" 식별자'],
                            ['AUTO_INCREMENT', 'GENERATED ALWAYS AS IDENTITY'],
                            ['GROUP_CONCAT(col SEP \',\')', 'STRING_AGG(col, \',\')'],
                            ['DATE_FORMAT(d, \'%Y-%m-%d\')', 'TO_CHAR(d, \'YYYY-MM-DD\')'],
                            ['LIMIT n, m', 'LIMIT n OFFSET m'],
                            ['TINYINT(1) (bool)', 'BOOLEAN'],
                            ['DELIMITER // ... END //', 'DELIMITER 제거 후 그대로 실행'],
                          ].map(([mysql, pg]) => (
                            <tr key={mysql} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-3 py-2 font-mono text-orange-700 dark:text-orange-400 whitespace-nowrap">{mysql}</td>
                              <td className="px-3 py-2 font-mono text-indigo-700 dark:text-indigo-400 whitespace-nowrap">{pg}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Oracle → PostgreSQL</p>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">Oracle</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">PostgreSQL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {[
                            ['ROWNUM <= n', 'FETCH FIRST n ROWS ONLY'],
                            ['SYSDATE', 'CURRENT_TIMESTAMP'],
                            ['NVL(a, b)', 'COALESCE(a, b)'],
                            ['VARCHAR2(n)', 'VARCHAR(n)'],
                            ['NUMBER(p, s)', 'NUMERIC(p, s)'],
                            [':NEW.col / :OLD.col', 'NEW.col / OLD.col'],
                            ['IS/AS BEGIN...END 프로시저', 'LANGUAGE plpgsql AS $$...$$'],
                            ['FROM DUAL', 'FROM (SELECT 1) AS dual'],
                          ].map(([oracle, pg]) => (
                            <tr key={oracle} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-3 py-2 font-mono text-red-700 dark:text-red-400 whitespace-nowrap">{oracle}</td>
                              <td className="px-3 py-2 font-mono text-indigo-700 dark:text-indigo-400 whitespace-nowrap">{pg}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">활용 팁</p>
                  <p>• MySQL·Oracle 방언을 선택하면 SQL 탭 상단에 방언 변환 안내가 표시됩니다.</p>
                  <p>• 문법 오류 시 위 표를 참고해 해당 방언 문법으로 수정 후 다시 실행하세요.</p>
                </div>
              </div>

              {/* SQL 방언 탭 선택 */}
              <div className="lg:col-span-2 flex gap-2 flex-wrap items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">방언 선택:</span>
                {([
                  { key: 'postgresql', label: 'PostgreSQL', active: 'bg-blue-600 text-white', inactive: 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' },
                  { key: 'mysql', label: 'MySQL', active: 'bg-orange-500 text-white', inactive: 'hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800' },
                  { key: 'oracle', label: 'Oracle', active: 'bg-rose-600 text-white', inactive: 'hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800' },
                ] as const).map(({ key, label, active, inactive }) => (
                  <button
                    key={key}
                    onClick={() => setSqlDialectTab(key)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${sqlDialectTab === key ? active : `bg-white dark:bg-gray-900 ${inactive}`}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* ── PostgreSQL 탭 ── */}
              {sqlDialectTab === 'postgresql' && (
                <>
                  {/* Testable */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4 lg:col-span-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">테스트 가능 항목</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">PostgreSQL 엔진이 기본 DB이므로 아래 SQL은 모두 연습장에서 실행하거나 시뮬레이션할 수 있습니다.</p>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">조회 (SELECT)</p>
                        <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                          {[
                            '기본 SELECT / WHERE / ORDER BY',
                            'LIMIT / OFFSET',
                            'INNER / LEFT / RIGHT / FULL OUTER / CROSS JOIN',
                            'GROUP BY / HAVING / 집계 함수 (COUNT, SUM, AVG, MAX, MIN)',
                            '스칼라 서브쿼리 / IN / EXISTS 서브쿼리',
                            'WITH (CTE) / WITH RECURSIVE',
                            'CASE WHEN THEN ELSE END',
                            '윈도우 함수 (ROW_NUMBER, RANK, DENSE_RANK, NTILE, LAG, LEAD)',
                            'COALESCE / NULLIF',
                            'CAST / 타입 변환',
                            'information_schema 조회 (테이블·컬럼·권한 정보)',
                            'pg_catalog 조회 (인덱스, 시퀀스, 함수 메타데이터)',
                          ].map(item => (
                            <li key={item} className="flex gap-1.5 items-start">
                              <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">DML 시뮬레이션 (DB 미반영)</p>
                          <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                            {[
                              'INSERT INTO ... VALUES / SELECT',
                              'INSERT ... ON CONFLICT',
                              'UPDATE ... SET ... WHERE / FROM',
                              'DELETE FROM ... WHERE',
                              'TRUNCATE TABLE',
                            ].map(item => (
                              <li key={item} className="flex gap-1.5 items-start">
                                <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mb-2">DCL 시뮬레이션 (DB 미반영)</p>
                          <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                            {[
                              'GRANT (SELECT, INSERT, UPDATE, DELETE, ALL)',
                              'REVOKE',
                            ].map(item => (
                              <li key={item} className="flex gap-1.5 items-start">
                                <span className="text-violet-400 mt-0.5 shrink-0">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">DDL 시뮬레이션 (DB 미반영)</p>
                        <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                          {[
                            'CREATE TABLE (PK/FK/UNIQUE/CHECK/DEFAULT)',
                            'ALTER TABLE ADD / DROP COLUMN',
                            'ALTER TABLE ALTER COLUMN (타입·NOT NULL)',
                            'ALTER TABLE ADD / DROP CONSTRAINT',
                            'DROP TABLE / DROP TABLE IF EXISTS',
                            'CREATE INDEX / UNIQUE INDEX / DROP INDEX',
                            'CREATE VIEW / CREATE OR REPLACE VIEW / DROP VIEW',
                            'CREATE FUNCTION ($$ 미종료 시 자동 완성)',
                            'CREATE PROCEDURE',
                            'CREATE TRIGGER (스텁 자동 생성)',
                            'DROP FUNCTION / PROCEDURE / TRIGGER',
                            'CREATE SEQUENCE',
                          ].map(item => (
                            <li key={item} className="flex gap-1.5 items-start">
                              <span className="text-amber-400 mt-0.5 shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Non-testable */}
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4 lg:col-span-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">테스트 불가 항목</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">보안·무결성·운영 환경 보호를 위해 아래 항목은 차단되거나 시뮬레이션으로만 응답합니다.</p>

                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">분류</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">차단 항목</th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">사유</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {[
                            ['트랜잭션 명시 제어', 'BEGIN / COMMIT / ROLLBACK / SAVEPOINT / SET TRANSACTION', '연습장 자체가 트랜잭션 시뮬레이션 방식으로 동작'],
                            ['시퀀스 함수 직접 실행', 'SELECT setval(...) / SELECT nextval(...)', '비트랜잭션 연산으로 롤백 불가 — 시뮬레이션 메시지만 반환'],
                            ['DO 블록 내 시퀀스 함수', 'DO $$ ... setval/nextval ... $$', '동일 사유 — 시뮬레이션 메시지만 반환'],
                            ['DB 관리 함수', 'pg_terminate_backend() / pg_cancel_backend() / pg_reload_conf()', '세션 종료·서버 설정 변경 등 운영 영향'],
                            ['계정·역할 관리 DDL', 'CREATE/ALTER/DROP USER, CREATE/ALTER/DROP ROLE', '실제 DB 계정 변경 방지'],
                            ['데이터베이스·스키마 관리', 'CREATE/DROP DATABASE, CREATE/DROP SCHEMA', '연습용 스키마 외 영역 변경 방지'],
                            ['확장 관리', 'CREATE EXTENSION / DROP EXTENSION', '서버 수준 설정 변경'],
                            ['prac_ 외 테이블 DML', 'INSERT/UPDATE/DELETE 대상이 prac_* 아닌 경우', '시스템 테이블 보호'],
                            ['DELIMITER', 'PostgreSQL 모드에서 DELIMITER // 사용', 'MySQL 클라이언트 전용 명령'],
                            ['비-DDL 멀티 스테이트먼트', 'SELECT·DML·DCL에서 세미콜론으로 분리된 여러 문장', '실행 범위 제한'],
                          ].map(([category, blocked, reason]) => (
                            <tr key={category} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-3 py-2 font-medium text-rose-700 dark:text-rose-400 whitespace-nowrap align-top">{category}</td>
                              <td className="px-3 py-2 font-mono text-gray-700 dark:text-gray-300 align-top">{blocked}</td>
                              <td className="px-3 py-2 text-gray-500 dark:text-gray-400 align-top">{reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* ── MySQL / Oracle 탭 공통 렌더러 ── */}
              {(sqlDialectTab === 'mysql' || sqlDialectTab === 'oracle') && (() => {
                const isMySQL = sqlDialectTab === 'mysql';
                const convRules = isMySQL
                  ? (rules?.mysqlConversionRules ?? [])
                  : (rules?.oracleConversionRules ?? []);
                const enabledRules = convRules.filter(r => r.enabled);
                const disabledRules = convRules.filter(r => !r.enabled);
                const accentEnabled = isMySQL
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-rose-600 dark:text-rose-400';
                const bulletEnabled = isMySQL ? 'text-orange-400' : 'text-rose-400';
                const dialectLabel = isMySQL ? 'MySQL' : 'Oracle';

                return (
                  <>
                    {/* Testable */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4 lg:col-span-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">테스트 가능 항목</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {dialectLabel} 방언 선택 시 아래 항목을 테스트할 수 있습니다. 백엔드가 자동으로 PostgreSQL로 변환하여 실행합니다.
                      </p>

                      {/* 기본 SQL — 항상 지원 */}
                      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/40 px-4 py-3">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">기본 SQL (항상 지원)</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          표준 SELECT · JOIN · DML · DCL · DDL 기본 구문은 {dialectLabel} 방언 모드에서도 동일하게 실행됩니다.
                          <span className="ml-1 opacity-70">자세한 항목은 PostgreSQL 탭을 참조하세요.</span>
                        </p>
                      </div>

                      {/* 활성화된 변환 규칙 */}
                      <div>
                        <p className={`text-xs font-semibold ${accentEnabled} mb-2`}>
                          {dialectLabel} 방언 전용 구문
                          <span className="ml-1.5 font-normal text-gray-400 dark:text-gray-500">
                            ({enabledRules.length}개 활성화)
                          </span>
                        </p>
                        {enabledRules.length === 0 ? (
                          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                            활성화된 {dialectLabel} 변환 규칙이 없습니다. {dialectLabel} 전용 구문은 지원되지 않습니다.
                          </p>
                        ) : (
                          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-700 dark:text-gray-300">
                            {enabledRules.map(r => (
                              <li key={r.ruleKey} className="flex gap-1.5 items-start">
                                <span className={`${bulletEnabled} mt-0.5 shrink-0`}>•</span>
                                <span>{r.userLabel}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Non-testable */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4 lg:col-span-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">테스트 불가 항목</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        관리자가 비활성화한 변환 규칙은 {dialectLabel} 전용 구문이 지원되지 않습니다. 공통 제한사항은 PostgreSQL 탭을 참조하세요.
                      </p>

                      {disabledRules.length === 0 ? (
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/40 px-4 py-3">
                          <p className="text-xs text-emerald-700 dark:text-emerald-400">
                            모든 {dialectLabel} 변환 규칙이 활성화되어 있습니다. {dialectLabel} 전용 구문 제한이 없습니다.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-gray-800">
                                <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">분류</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">미지원 항목</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">사유</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                              {disabledRules.map(r => (
                                <tr key={r.ruleKey} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                  <td className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap align-top">변환 규칙 비활성화</td>
                                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300 align-top">{r.userLabel}</td>
                                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400 align-top">관리자에 의해 비활성화됨</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

            </div>
          )}

          {/* ── OS Guide ── */}
          {guideTab === 'os' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Linux/Mac */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Linux / Mac 예제</h3>
                <div className="space-y-2">
                  {[
                    ['파일 목록', 'ls -la'],
                    ['디렉토리 이동', 'cd documents\npwd'],
                    ['파일/폴더 생성', 'mkdir my_folder\ntouch my_file.txt'],
                    ['파일 읽기', 'cat readme.txt'],
                    ['텍스트 쓰기', 'echo "안녕하세요" > hello.txt\ncat hello.txt'],
                    ['검색', 'grep "연습" documents/readme.txt'],
                    ['복사/이동', 'cp readme.txt backup.txt\nmv backup.txt downloads/'],
                    ['삭제', 'rm hello.txt\nrm -rf my_folder'],
                    ['파일 찾기', 'find /home/user -name "*.txt"'],
                    ['권한 변경', 'chmod 755 my_file.txt'],
                  ].map(([label, code]) => (
                    <div key={label} className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">{label}</p>
                      <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">{code}</pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* Windows */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Windows 예제</h3>
                <div className="space-y-2">
                  {[
                    ['파일 목록', 'dir\ndir /a'],
                    ['폴더 이동', 'cd Documents\ncd ..'],
                    ['폴더 생성', 'mkdir my_folder'],
                    ['파일 읽기', 'type readme.txt'],
                    ['텍스트 쓰기', 'echo 안녕하세요 > hello.txt\ntype hello.txt'],
                    ['파일 삭제', 'del hello.txt'],
                    ['폴더 삭제', 'rd /s /q my_folder'],
                    ['복사', 'copy readme.txt backup.txt'],
                    ['이동', 'move backup.txt Downloads\\'],
                    ['시스템 정보', 'ver\nwhoami\nhostname'],
                  ].map(([label, code]) => (
                    <div key={label} className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">{label}</p>
                      <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">{code}</pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* OS Tips */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3 lg:col-span-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">터미널 사용 팁</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm text-green-800 dark:text-green-300 space-y-1">
                    <p className="font-medium">키보드 단축키</p>
                    <p>• <kbd className="bg-green-100 dark:bg-green-900/40 px-1.5 rounded text-xs">↑</kbd> <kbd className="bg-green-100 dark:bg-green-900/40 px-1.5 rounded text-xs">↓</kbd> 이전/다음 명령어 탐색</p>
                    <p>• <kbd className="bg-green-100 dark:bg-green-900/40 px-1.5 rounded text-xs">Enter</kbd> 명령어 실행</p>
                    <p>• <kbd className="bg-green-100 dark:bg-green-900/40 px-1.5 rounded text-xs">clear</kbd> / <kbd className="bg-green-100 dark:bg-green-900/40 px-1.5 rounded text-xs">cls</kbd> 화면 초기화</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    <p className="font-medium">가상 환경 안내</p>
                    <p>• 실제 OS 파일시스템에 영향을 주지 않습니다</p>
                    <p>• "파일시스템 초기화"로 가상 환경을 리셋합니다</p>
                    <p>• OS 전환(Linux ↔ Windows) 시 각 가상 파일시스템은 독립 유지됩니다</p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ── Typo Warning Modal ── */}
      {showTypoModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
             onClick={() => setShowTypoModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-100 dark:border-gray-700"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-amber-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">SQL 오타가 감지되었습니다</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">수정 후 실행하거나 그대로 실행할 수 있습니다.</p>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {typoWarnings.map((w, i) => (
                <div key={i} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-500 shrink-0">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">{w.detail}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">→ <strong>{w.suggestion}</strong> 확인 필요</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowTypoModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                수정하기
              </button>
              <button
                onClick={() => { setShowTypoModal(false); runSql(pendingSql); }}
                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
              >
                그대로 실행
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
