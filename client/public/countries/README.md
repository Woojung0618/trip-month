# 국가별 지도 PNG 에셋

Figma **Map** 컴포넌트에서 국가 단위로 PNG로 내보낸 뒤, 이 폴더에 저장하세요.

## 파일 이름 규칙

- **소문자 2글자 ISO 3166-1 alpha-2 코드** + `.png`
- 예: `kr.png`, `jp.png`, `us.png`, `br.png`, `au.png`

## Figma에서 내보내기

1. Figma에서 [SVG World Map](https://www.figma.com/design/83V4lURbAg1Dqyly4JS5PJ/) 파일 열기
2. **Main map** → **Map** (인스턴스) → **Shadow** 그룹 펼치기
3. 각 국가 그룹(이름이 `kr`, `jp` 등 2글자 코드) 선택
4. 우측 패널 **Export** → **PNG** (1x 또는 2x) → Export
5. 파일명을 해당 코드로 저장 (예: `kr.png`) 후 이 폴더에 넣기

일부 국가만 넣어도 되며, 없는 코드는 맵에서 비워 둔 채로 표시됩니다.
