# Pixel Editer

브라우저에서 픽셀 아트를 그릴 수 있는 React + TypeScript + Vite 기반 에디터입니다.

## 핵심 기능

- 픽셀 그리드 캔버스 (중앙 배치)
- 펜슬/지우개 + 브러시 크기 조절
- 팔레트 색상 선택 + 사용자 지정 색상
- 캔버스 설정 (가로/세로/픽셀 크기)
- 레이어 추가/삭제/표시/선택/순서 변경 + 레이어 미리보기
- Undo / Redo (버튼 + 단축키)
- 줌/팬 뷰포트
- PNG 다운로드
- 프로젝트 JSON 저장/불러오기
- 자동 저장(localStorage) 및 복구 배너

## 기술 스택

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Zustand
- Immer
- dnd-kit
- Vitest + Testing Library
- Playwright

## 실행 방법

```bash
npm install
npm run dev
```

## Vercel 배포

1. Vercel에서 이 저장소를 Import합니다.
2. Framework Preset은 `Vite`를 사용합니다.
3. Build Command는 `npm run build`, Output Directory는 `dist`로 설정됩니다.
4. 루트의 `vercel.json`이 자동으로 위 설정을 고정합니다.

## 스크립트

```bash
npm run build
npm run preview
npm run lint
npm run test
npm run test:coverage
npm run e2e
```

## 단축키

- `Cmd/Ctrl + Z`: 실행 취소
- `Cmd/Ctrl + Shift + Z`: 다시 실행
- `Cmd/Ctrl + Y`: 다시 실행

## 자동 저장

- 키: `pixel-editor/autosave-v1`
- 디바운스: 750ms

## 참고

- v1은 데스크톱 우선이며 모바일 제스처는 범위 밖입니다.
- 최대 캔버스 크기: 256x256
- 최대 레이어: 16
- 히스토리 깊이: 100
