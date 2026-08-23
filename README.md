# 트윈티커 (TwinTicker)

두 개의 자산을 나란히 비교하고, 같은 기준으로 추적하는 개인용 시장 모니터링 도구.

## Alpha 0.1

첫 알파는 두 자산을 골라 1일·1주·1개월·1년의 정규화 수익률을 비교하는 정적 웹 앱입니다.

- 종목/ETF 6개 예시를 즉시 교체해 비교
- 기간별 수익률, 연환산 변동성, 기간 최고점, 성과 격차
- 선택한 자산과 기간을 브라우저에 저장
- 모바일 반응형 레이아웃

알파의 시세는 체험용으로 생성한 목업 데이터입니다. 투자 조언이나 실시간 가격 제공을 목적으로 하지 않습니다.

### Local verification

Node.js 20 이상에서 아래 명령으로 핵심 계산과 문법을 확인할 수 있습니다.

```bash
npm run check
npm test
```

`index.html`은 별도의 번들 과정 없이 정적 서버에서 바로 실행됩니다. `main` 브랜치 푸시 시 GitHub Actions가 GitHub Pages로 배포합니다(리포지토리 설정에서 Pages source를 **GitHub Actions**로 한 번 선택해야 합니다).

### Windows 실행 파일

릴리즈의 `TwinTicker-Alpha-*.exe`는 설치 없이 실행하는 휴대용 패키지입니다. 앱과 로컬 서버를 포함하므로 Node.js를 별도로 설치할 필요는 없지만, 실행 중에는 콘솔 창을 닫지 않아야 합니다. Windows에서 아래 명령으로 같은 실행 파일을 다시 만들 수 있습니다.

```powershell
npm run build:exe
```

알파의 특이사항과 배포 기록은 [운영 기록](docs/OPERATIONS.md), 버전별 변경은 [CHANGELOG.md](CHANGELOG.md)에서 관리합니다.

## 초기 방향

- 두 종목/자산의 가격, 수익률, 변동성을 한 화면에서 비교
- 동일 기간과 기준 통화로 성과를 정규화해 직관적으로 표시
- 사용자가 정한 가격·수익률 조건에 도달하면 알림
- 투자 판단을 대신하지 않고, 비교와 관찰에 집중

자세한 초기 구상은 [`docs/initial-concept.md`](docs/initial-concept.md)를 참고한다.
