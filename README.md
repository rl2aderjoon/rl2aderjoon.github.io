# 개발 기록 블로그

GitHub Pages와 Jekyll의 Minima 테마를 사용하는 블로그입니다.

## 글 추가하기

저장소에서 **Add file → Create new file**을 선택하고 다음 형식으로 파일을 만듭니다.

```text
_posts/YYYY-MM-DD-post-title.md
```

파일 내용의 시작에는 아래 정보를 넣고, 이어서 Markdown으로 글을 작성합니다.

```markdown
---
layout: post
title: "글 제목"
date: YYYY-MM-DD 09:00:00 +0900
categories: [backend]
---

## 문제

사용자가 겪는 문제와 필요한 품질을 적습니다.

## 코드 흐름

입력 → 검증 → 계산 → 저장 → 응답을 정리합니다.

## 선택과 결과

선택지, 선택한 이유, 변경 전후의 결과를 적습니다.

## 남은 질문

확인하지 못한 내용과 다음 실험을 적습니다.
```

커밋하면 GitHub Pages가 사이트를 다시 빌드합니다. 공개 주소 반영까지 시간이 걸릴 수 있습니다.

## 설정

- `_config.yml`: 블로그 제목·소개·테마
- `index.md`: 첫 화면 소개
- `about.md`: 블로그 소개 페이지
- `_posts/`: 발행할 글

Pages의 배포 소스는 `main` 브랜치의 루트 폴더입니다.
