# 가볼래 지도 홍보 페이지 운영

https://rl2aderjoon.github.io/ · 기존 블로그: `/blog.html`

## 다운로드 수: 서버나 GA4 계정이 필요 없습니다

현재 다운로드 파일은 `maps-2026-10-v2` 릴리스입니다. 화면 집계는 이전 `maps-2026-10`과 현재 릴리스의 파일별 횟수를 합산해 누적 수치를 유지합니다. 새로운 릴리스를 추가할 때 `maps.js`의 `countTags`에도 추가하세요. 지도 제목은 `#서울_지역_트친_찾기` 형식이며 내부 구멍과 가느다란 틈을 채워 단색 면으로 표시합니다.

PNG를 이 저장소의 `maps-2026-10` GitHub Release 첨부파일로 제공합니다. 각 PNG 받기 링크는 릴리스 파일로 연결되며, GitHub가 제공하는 `download_count`를 공개 REST API로 한 번에 조회합니다. 화면에는 지역별 횟수를 표시하고 브라우저에 5분간 캐시합니다. API 오류나 호출 제한이 생기면 횟수만 `—`로 표시하며 다운로드는 그대로 됩니다. 브라우저 코드에 토큰은 넣지 않습니다.

- [다운로드 파일과 릴리스](https://github.com/rl2aderjoon/rl2aderjoon.github.io/releases/tag/maps-2026-10)
- [지역별 통계 JSON](https://api.github.com/repos/rl2aderjoon/rl2aderjoon.github.io/releases/tags/maps-2026-10): `assets[].name`, `assets[].download_count`
- [GitHub 공식 문서](https://docs.github.com/en/rest/releases/assets)

횟수는 반복 다운로드와 테스트 다운로드를 포함합니다. 고유 사용자 수, 저장 완료 수, 선호 장소 투표 수가 아닙니다. GitHub의 집계 반영이 지연될 수 있습니다. 직접 `/assets/maps/*.png`에서 받은 파일이나 다른 곳에서 재배포된 파일은 포함되지 않습니다. 지도 미리보기는 SVG를 사용하므로 PNG 다운로드 횟수를 올리지 않습니다. 지역별 관심의 참고 지표로만 사용하세요. 집계는 공개 데이터입니다.

로컬 CLI에서도 확인할 수 있습니다:

```powershell
gh api repos/rl2aderjoon/rl2aderjoon.github.io/releases/tags/maps-2026-10 --jq '.assets[] | [.name, .download_count] | @tsv'
```

## 지도와 출처

`assets/maps/`에 전국 17개 시도 + 전국 지도, 각각 1600×1600 PNG 및 SVG가 있습니다. 지도에는 지역 트친 찾기 제목, 번호와 지역 이름만 남깁니다. 서울은 참고 이미지의 0~7번 구분, 부산은 8개 묶음을 사용합니다. 나머지는 시·군·구, 전국은 시도에 번호를 붙입니다. 묶음과 번호는 공식 생활권이나 선호도 순위가 아닙니다. 출처는 홈페이지와 이 문서에 표시합니다. Pretendard는 SIL Open Font License로 사용하며 `assets/fonts/OFL.txt`에 라이선스를 보관합니다. SVG에는 한글 글꼴을 포함해 다운로드 이미지와 동일한 폰트로 표시합니다.

경계 원본: 국가공간정보포털 V-World 2023-07-29 배포. 가공: [KnellBalm/kr-admin-geojson](https://github.com/KnellBalm/kr-admin-geojson), 출처 표시 조건. 생성기는 커밋 `3a859f2a45be8acf8237d9eefd9565f99cc603da`를 고정합니다. 이후 행정구역 변경은 반영되지 않을 수 있습니다. 현재 모든 행정구역의 최신성을 주장하지 않습니다.

재생성: Python의 `shapely`, `pillow`, `fonttools`, `brotli`가 있는 환경에서 `python tools/generate_maps.py`. 한글 폰트는 저장소에 포함된 Pretendard입니다. 새 데이터로 갱신할 때 시도 코드와 권역의 구·군 목록도 검토하세요.

## 파일 수정과 배포

- `index.html`, `maps.css`, `maps.js`: 홍보 화면과 동작
- `assets/maps/catalog.json`: 목록·범례
- `blog.html`: 교체 직전 블로그 원본
- `.nojekyll`: 빌드 없이 정적 파일 배포

GitHub Pages는 `main` 루트에서 배포합니다. 지도 파일을 갱신할 때는 기존 릴리스 첨부파일을 삭제·교체하면 해당 파일의 누적 횟수가 사라질 수 있습니다. 새 태그로 릴리스를 만들고 `maps.js`의 `releaseTag` 및 HTML의 대체 링크를 함께 바꾸세요. 기간별 비교를 하려면 이전 릴리스도 보관하세요. PNG와 SVG는 함께 갱신해야 미리보기와 다운로드가 일치합니다.

블로그로 복구하려면 `blog.html`의 내용을 `index.html`에 복사해 커밋·푸시하세요. 교체 전 커밋은 `207dac9`입니다.

## 검증

`node --check maps.js`, `git diff --check`, 18종 SVG/XML와 PNG 크기·범례 검증. 브라우저에서 미리보기, 지역 검색, 테마, 실제 릴리스 다운로드, 모바일 너비를 확인합니다. 별도 패키지 설치나 빌드 과정은 없습니다.
