package com.tpmp.testprep.service.parser;

import com.tpmp.testprep.entity.Question;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * PDF 추출 rawText → ParsedQuestion 목록 변환기.
 * Spring 빈 아님 — new PdfQuestionParser()로 직접 사용.
 */
public class PdfQuestionParser {

    private static final Logger log = LoggerFactory.getLogger(PdfQuestionParser.class);

    // ─── 문항 경계 정규식 (줄 시작, 공백 0~2 허용) ───────────────────────────────
    // 패턴 A: 1.  2.  ...
    private static final Pattern BOUNDARY_NUMERIC =
            Pattern.compile("^\\s{0,2}(\\d+)\\.\\s");
    // 패턴 B: 문 1.  문1.  ...
    private static final Pattern BOUNDARY_MUN =
            Pattern.compile("^\\s{0,2}문\\s*(\\d+)\\.\\s");
    // 패턴 C: 제1문  제 1 문  ...
    private static final Pattern BOUNDARY_JE =
            Pattern.compile("^\\s{0,2}제\\s*(\\d+)\\s*문");

    // ─── 보기 마커 패턴 ──────────────────────────────────────────────────────────
    private static final Pattern OPTION_CIRCLE =
            Pattern.compile("^([①②③④⑤⑥⑦⑧⑨⑩])(.*)");       // 유형 A
    private static final Pattern OPTION_PAREN_NUM =
            Pattern.compile("^(\\(\\d+\\))(.*)");               // 유형 B: (1) (2) …
    private static final Pattern OPTION_CLOSED_PAREN =
            Pattern.compile("^(\\d+\\))(.*)");                  // 유형 C: 1) 2) …

    // ─── 정답/해설 라벨 패턴 ─────────────────────────────────────────────────────
    private static final Pattern ANSWER_LABEL =
            Pattern.compile("^정답\\s*[:：]\\s*(.*)");
    private static final Pattern EXPLANATION_LABEL =
            Pattern.compile("^해설\\s*[:：]\\s*(.*)");

    /**
     * rawText를 받아 ParsedQuestion 목록을 반환한다.
     * 개별 블록 파싱 실패는 해당 블록 skip + log.warn 처리하며,
     * 이 메서드 자체는 RuntimeException을 던지지 않는다.
     */
    public List<ParsedQuestion> parse(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return List.of();
        }

        // 전처리: 줄바꿈 통일
        String normalized = rawText.replace("\r\n", "\n").replace("\r", "\n");
        String[] lines = normalized.split("\n");

        // ── 1단계: 문항 경계 탐지 → 블록 분리 ─────────────────────────────────
        List<int[]> boundaries = new ArrayList<>(); // [lineIndex, questionNumber]

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            int qNum = matchBoundary(line);
            if (qNum >= 0) {
                boundaries.add(new int[]{i, qNum});
            }
        }

        if (boundaries.isEmpty()) {
            log.warn("PdfQuestionParser: 문항 경계 패턴을 찾지 못했습니다. rawText 길이={}", rawText.length());
            return List.of();
        }

        // 오탐 필터: 연속 번호 아닌 경우 경고만 (여전히 문항으로 인정)
        for (int b = 1; b < boundaries.size(); b++) {
            int prev = boundaries.get(b - 1)[1];
            int curr = boundaries.get(b)[1];
            if (curr != prev + 1) {
                log.warn("PdfQuestionParser: 문항 번호 불연속 — 이전={}, 현재={} (줄 {})",
                        prev, curr, boundaries.get(b)[0] + 1);
            }
        }

        // ── 2단계: 블록 추출 ────────────────────────────────────────────────────
        List<ParsedQuestion> results = new ArrayList<>();

        for (int b = 0; b < boundaries.size(); b++) {
            int startLine = boundaries.get(b)[0];
            int endLine = (b + 1 < boundaries.size())
                    ? boundaries.get(b + 1)[0]
                    : lines.length;

            String[] block = new String[endLine - startLine];
            System.arraycopy(lines, startLine, block, 0, block.length);

            try {
                ParsedQuestion pq = parseBlock(block);
                if (pq != null && !pq.content().isBlank()) {
                    results.add(pq);
                } else {
                    log.warn("PdfQuestionParser: 블록 건너뜀 (content 없음) — 시작 줄 {}", startLine + 1);
                }
            } catch (Exception e) {
                log.warn("PdfQuestionParser: 블록 파싱 실패 (줄 {}) — {}", startLine + 1, e.getMessage());
            }
        }

        return results;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 내부 헬퍼
    // ─────────────────────────────────────────────────────────────────────────────

    /** 줄이 문항 경계이면 문항 번호(≥0) 반환, 아니면 -1 */
    private int matchBoundary(String line) {
        Matcher m;
        m = BOUNDARY_NUMERIC.matcher(line);
        if (m.find()) return Integer.parseInt(m.group(1));
        m = BOUNDARY_MUN.matcher(line);
        if (m.find()) return Integer.parseInt(m.group(1));
        m = BOUNDARY_JE.matcher(line);
        if (m.find()) return Integer.parseInt(m.group(1));
        return -1;
    }

    /**
     * 하나의 블록(문항 번호 줄 ~ 다음 경계 이전)을 분석해 ParsedQuestion 반환.
     * 실패 시 예외 던짐 → 호출부에서 catch 후 skip.
     */
    private ParsedQuestion parseBlock(String[] block) {
        // ── 정답/해설 위치 탐색 ─────────────────────────────────────────────────
        int answerLineIdx = -1;
        int explanationLineIdx = -1;
        String answerValue = null;
        List<String> explanationLines = new ArrayList<>();

        for (int i = 0; i < block.length; i++) {
            String trimmed = block[i].trim();
            if (answerLineIdx < 0) {
                Matcher am = ANSWER_LABEL.matcher(trimmed);
                if (am.matches()) {
                    answerLineIdx = i;
                    answerValue = am.group(1).trim();
                    if (answerValue.isEmpty()) answerValue = null;
                    continue;
                }
            }
            if (explanationLineIdx < 0) {
                Matcher em = EXPLANATION_LABEL.matcher(trimmed);
                if (em.matches()) {
                    explanationLineIdx = i;
                    String firstLine = em.group(1).trim();
                    if (!firstLine.isEmpty()) explanationLines.add(firstLine);
                    continue;
                }
            }
            // 해설 라벨 이후 줄은 해설 본문으로 수집 (정답/해설 라벨 이전 확인 불필요 — 이미 past)
            if (explanationLineIdx >= 0 && i > explanationLineIdx) {
                String t = block[i].trim();
                if (!t.isEmpty()) explanationLines.add(t);
            }
        }

        String explanation = explanationLines.isEmpty()
                ? null
                : String.join("\n", explanationLines);

        // 보기 영역 끝 기준: 정답 라벨 or 해설 라벨 or 블록 끝
        int labelStart = block.length;
        if (answerLineIdx >= 0) labelStart = Math.min(labelStart, answerLineIdx);
        if (explanationLineIdx >= 0) labelStart = Math.min(labelStart, explanationLineIdx);

        // ── 보기 마커 탐지 ───────────────────────────────────────────────────────
        // 블록 내 첫 발견된 마커 유형으로 고정
        Pattern optionPattern = null;
        int firstOptionLine = -1;

        for (int i = 1; i < labelStart; i++) { // 0번 줄(문항번호)은 건너뜀
            String t = block[i].trim();
            if (OPTION_CIRCLE.matcher(t).find()) {
                optionPattern = OPTION_CIRCLE;
                firstOptionLine = i;
                break;
            } else if (OPTION_PAREN_NUM.matcher(t).find()) {
                optionPattern = OPTION_PAREN_NUM;
                firstOptionLine = i;
                break;
            } else if (OPTION_CLOSED_PAREN.matcher(t).find()) {
                optionPattern = OPTION_CLOSED_PAREN;
                firstOptionLine = i;
                break;
            }
        }

        // ── 보기 추출 ────────────────────────────────────────────────────────────
        List<String> options = new ArrayList<>();
        if (optionPattern != null) {
            String currentOption = null;
            for (int i = firstOptionLine; i < labelStart; i++) {
                String t = block[i].trim();
                Matcher om = optionPattern.matcher(t);
                if (om.find()) {
                    if (currentOption != null) options.add(currentOption.trim());
                    currentOption = om.group(2).trim();
                } else if (currentOption != null && !t.isEmpty()) {
                    // 보기 텍스트가 여러 줄에 걸친 경우 이어 붙임
                    currentOption += " " + t;
                }
            }
            if (currentOption != null) options.add(currentOption.trim());
        }

        // ── 본문(content) 추출 ──────────────────────────────────────────────────
        // 0번 줄(문항번호줄)에서 번호 마커 제거 후 시작, 보기 첫 줄(또는 라벨 시작) 이전까지
        int contentEnd = (firstOptionLine >= 0) ? firstOptionLine : labelStart;

        List<String> contentLines = new ArrayList<>();
        for (int i = 0; i < contentEnd; i++) {
            String raw = block[i];
            String t = (i == 0) ? removeBoundaryMarker(raw) : raw.trim();
            if (!t.isEmpty()) contentLines.add(t);
        }
        String content = String.join("\n", contentLines).trim();

        // ── 유형 결정 ────────────────────────────────────────────────────────────
        Question.QuestionType questionType = (options.size() >= 2)
                ? Question.QuestionType.MULTIPLE_CHOICE
                : Question.QuestionType.SHORT_ANSWER;

        return new ParsedQuestion(content, questionType,
                options.isEmpty() ? null : options,
                answerValue, explanation);
    }

    /** 줄에서 문항 번호 마커 부분을 제거하고 나머지 본문을 반환 */
    private String removeBoundaryMarker(String line) {
        // BOUNDARY_NUMERIC: "N. "
        Matcher m = BOUNDARY_NUMERIC.matcher(line);
        if (m.find()) return line.substring(m.end()).trim();
        // BOUNDARY_MUN: "문 N. "
        m = BOUNDARY_MUN.matcher(line);
        if (m.find()) return line.substring(m.end()).trim();
        // BOUNDARY_JE: "제N문" — 뒤에 붙은 내용 그대로
        m = BOUNDARY_JE.matcher(line);
        if (m.find()) return line.substring(m.end()).trim();
        return line.trim();
    }
}
