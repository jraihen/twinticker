# 트윈티커 (TwinTicker)

두 개의 자산을 나란히 비교하고, 같은 기준으로 추적하는 개인용 시장 모니터링 도구.

## Alpha 0.1

첫 알파는 두 자산을 골라 1일·1주·1개월·1년의 정규화 수익률을 비교하는 Windows 데스크톱 앱입니다.

- 종목/ETF 6개 예시를 즉시 교체해 비교
- 토스증권 Open API의 현재가와 캔들 데이터를 바탕으로 실제 시세 비교
- 기간별 수익률, 연환산 변동성, 기간 최고점, 성과 격차
- 선택한 자산과 기간을 앱의 로컬 저장소에 저장
- 모바일 반응형 레이아웃

토스증권 Open API는 OAuth 2.0 Client Credentials와 허용 IP 등록이 필요합니다. 앱을 열어 오른쪽 위 **설정(⚙)** 에서 토스증권 WTS의 **설정 > Open API**에서 발급한 Client ID와 Client Secret을 입력하세요.

입력값은 Windows DPAPI로 암호화되어 앱별 데이터 폴더에 저장됩니다. 현재 Windows 사용자만 복호화할 수 있고, 앱 화면과 Git 저장소에는 시크릿을 전달하거나 기록하지 않습니다.

시세 자격 증명은 앱의 메인 프로세스만 읽습니다. GitHub Pages는 데스크톱 보안 저장소와 API 서버가 없으므로 실제 시세를 표시하지 못합니다. 투자 조언을 제공하지 않습니다.

### Local verification

Node.js 20 이상에서 아래 명령으로 핵심 계산과 문법을 확인할 수 있습니다.

```bash
npm run check
npm test
npm start
```

Windows 배포용 앱 폴더는 `npm run build:app`으로 만들 수 있습니다.

### Windows 실행 파일

`npm run build:app` 결과의 `TwinTicker.exe`는 브라우저나 콘솔 창을 열지 않고 자체 창으로 실행됩니다. 앱 내부의 로컬 시세 서버는 창과 함께 종료됩니다.

```powershell
npm run build:app
```

알파의 특이사항과 배포 기록은 [운영 기록](docs/OPERATIONS.md), 버전별 변경은 [CHANGELOG.md](CHANGELOG.md)에서 관리합니다.

## 초기 방향

- 두 종목/자산의 가격, 수익률, 변동성을 한 화면에서 비교
- 동일 기간과 기준 통화로 성과를 정규화해 직관적으로 표시
- 사용자가 정한 가격·수익률 조건에 도달하면 알림
- 투자 판단을 대신하지 않고, 비교와 관찰에 집중

자세한 초기 구상은 [`docs/initial-concept.md`](docs/initial-concept.md)를 참고한다.
