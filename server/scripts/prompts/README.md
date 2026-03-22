# Claude 채팅 배치 작업 가이드

## 순서
1. batch_1.txt ~ batch_5.txt 파일을 순서대로 Claude 채팅에 붙여넣기
2. Claude 응답(JSON 코드블록)을 복사해서 result_1.json, result_2.json 등으로 저장
   - 파일명은 배치 번호와 맞춰야 합니다 (batch_1 → result_1.json)
   - JSON 코드블록만 저장 ([ 로 시작해서 ] 로 끝나는 부분만)
3. 모든 result 파일 저장 후 import 실행:
   cd /Users/woojung/Projects/trip-map-global/.claude/worktrees/epic-almeida
   node server/scripts/importDescriptions.js

## 파일 위치
- 프롬프트: server/scripts/prompts/batch_*.txt
- 결과 저장: server/scripts/prompts/result_*.json
