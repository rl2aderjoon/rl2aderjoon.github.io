# 가볼래 지도 홍보 페이지 운영

최신 릴리스는 `maps-2026-10-v5`입니다. 화면 다운로드 수는 v1·v2·v3·v4·v5를 합산합니다. 작은 섬은 지도 전체 면적의 0.2%와 각 구역의 최대 도형 면적의 1%를 기준으로 생략하되, 각 이름의 대표 도형 하나는 유지합니다. 생략 후 남은 도형의 범위로 크기를 맞춥니다. 지명 보조선은 그리지 않습니다. 헤더의 DM 문의 버튼은 @Rleader_의 DM 작성 화면으로 연결됩니다.

https://rl2aderjoon.github.io/ · 기존 블로그: `/blog.html`

## 다운로드 수: 서버나 GA4 계정이 필요 없습니다

현재 다운로드 파일은 `maps-2026-10-v5` 릴리스입니다. 화면 집계는 이전 릴리스와 현재 릴리스의 파일별 횟수를 합산해 누적 수치를 유지합니다. 새로운 릴리스를 추가할 때 `maps.js`의 `countTags`에도 추가하세요. 지도 상단에는 `#같은지역_트친_찾기`와 지역별 `#서울_트친_찾기`를 두 줄로 표시합니다. 내부 구멍과 가느다란 틈을 채워 단색 면으로 표시합니다.

PNG를 이 저장소의 `maps-2026-10-v5` GitHub Release 첨부파일로 제공합니다. 각 PNG 받기 링크는 릴리스 파일로 연결되며, GitHub가 제공하는 `download_count`를 공개 REST API로 한 번에 조회합니다. 화면에는 지역별 횟수를 표시하고 브라우저에 5분간 캐시합니다. API 오류나 호출 제한이 생기면 횟수만 `—`로 표시하며 다운로드는 그대로 됩니다. 브라우저 코드에 토큰은 넣지 않습니다.

- [다운로드 파일과 릴리스](https://github.com/rl2aderjoon/rl2aderjoon.github.io/releases/tag/maps-2026-10-v5)
- [지역별 통계 JSON](https://api.github.com/repos/rl2aderjoon/rl2aderjoon.github.io/releases/tags/maps-2026-10-v5): `assets[].name`, `assets[].download_count`
- [GitHub 공식 문서](https://docs.github.com/en/rest/releases/assets)

횟수는 반복 다운로드와 테스트 다운로드를 포함합니다. 고유 사용자 수, 저장 완료 수, 선호 장소 투표 수가 아닙니다. GitHub의 집계 반영이 지연될 수 있습니다. 직접 `/assets/maps/*.png`에서 받은 파일이나 다른 곳에서 재배포된 파일은 포함되지 않습니다. 지도 미리보기는 SVG를 사용하므로 PNG 다운로드 횟수를 올리지 않습니다. 지역별 관심의 참고 지표로만 사용하세요. 집계는 공개 데이터입니다.

로컬 CLI에서도 확인할 수 있습니다:

```powershell
gh api repos/rl2aderjoon/rl2aderjoon.github.io/releases/tags/maps-2026-10-v5 --jq '.assets[] | [.name, .download_count] | @tsv'
```

## 지도와 출처

`assets/maps/`에 전국 17개 시도 + 전국 지도, 각각 2400×2400 PNG 및 SVG가 있습니다. 지도에는 지역 트친 찾기 제목, 번호와 지역 이름만 남깁니다. 서울은 참고 이미지의 0~7번 구분, 부산은 8개 묶음을 사용합니다. 도 지도는 시·군 단위로 표시하며, 수원시 영통구처럼 시 아래에 있는 구는 시 하나로 경계를 합칩니다. 그 외 특별·광역시는 기존 구·군 구분을 유지하고, 전국은 시도에 번호를 붙입니다. 묶음과 번호는 공식 생활권이나 선호도 순위가 아닙니다. 출처는 홈페이지와 이 문서에 표시합니다. Pretendard는 SIL Open Font License로 사용하며 `assets/fonts/OFL.txt`에 라이선스를 보관합니다. SVG에는 한글 글꼴을 포함해 다운로드 이미지와 동일한 폰트로 표시합니다.


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

## 지도 크기와 지명 배치

전체 18종의 이미지를 2400×2400으로 키우고, 제목과 지도 사이 여백을 줄여 지도가 차지하는 비율을 높였습니다. 번호와 지명 전체가 해당 지역 경계 안에 들어가는 위치를 검색합니다. 좁은 지역은 줄바꿈과 글자 크기를 조절하며, 경계 밖으로 미는 배치는 사용하지 않습니다. 생성 시 경계 내 포함 여부를 검증하며, 배치할 수 없으면 오류로 중단합니다. 인천 옹진군은 떨어진 섬 묶음별로 별도 축척을 적용하고 위치를 조정한 삽입도에 표시합니다.
