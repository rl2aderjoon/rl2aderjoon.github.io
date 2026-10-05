# 개발 기록 블로그

[공개 사이트](https://rl2aderjoon.github.io/)

Pretendard를 사용하는 개인 매거진 페이지입니다. 가볼래와 삐용 두 프로젝트 이름을 소개하고, 글 목록은 작성할 공간을 비워 두었습니다. 메인에는 읽은 책 세 권을 보여주고 Book 탭에는 다섯 권을 세 단으로 정리합니다. 독서 감상은 아직 비어 있습니다.

## 파일

- `index.html`: 홈, 프로젝트 카드와 빈 글 목록, 화면 전환
- `project-gabolle.jpg`, `project-bbiyong.png`: 두 프로젝트 이미지
- `book-*.jpg`: 사용자가 제공한 교보문고 페이지에서 확인한 다섯 권의 표지
- `.nojekyll`: 완성된 HTML을 그대로 배포하도록 지정하는 파일
- `_design/`: 로컬 시안과 결정 기록. Git에는 포함하지 않습니다.

## 배포와 글 추가

GitHub Pages는 `main` 브랜치의 루트 폴더에서 배포합니다. `index.html`과 프로젝트 이미지를 함께 수정하고 올립니다.

지금은 공개한 글이 없습니다. 실제 글을 작성한 뒤 홈의 빈 `.writing-columns`에 제목, 요약과 글 링크를 추가합니다. 현재 배포는 HTML을 그대로 제공하므로 Markdown 글을 자동으로 변환하지 않습니다. 기존 Jekyll 설정 파일과 소개 Markdown은 이전 버전의 기록으로 남아 있습니다.

독서 기록은 `index.html`의 `.book-column` 안에 있는 `.book-record-space`를 실제 글로 채웁니다. 책 표지와 제목의 도서 정보 링크는 유지합니다.
