# 알파 운영 기록 및 특이사항

마지막 갱신: 2026-08-23 · 대상 버전: `0.1.0-alpha.2`

## 배포 기록

| 시각 (KST) | 버전 | 채널 | 상태 | 비고 |
| --- | --- | --- | --- | --- |
| 2026-08-23 | 0.1.0-alpha.1 | GitHub Pages / GitHub Release | 완료 | 첫 공개 알파 |
| 2026-08-23 | 0.1.0-alpha.2 | GitHub Release | 완료 | Node SEA 기반 Windows 휴대용 실행 파일 추가 |

## 알려진 특이사항

- 데스크톱 앱은 토스증권 Open API의 OAuth 2.0 Client Credentials로 현재가와 캔들을 조회한다. 토스증권 WTS에 호출 IP를 등록해야 한다.
- Client ID와 Client Secret은 Electron `safeStorage`를 통해 Windows DPAPI로 암호화하여 앱별 데이터 폴더에 보관한다. 렌더러에는 설정 여부만 전달하며 시크릿은 전달하지 않는다.
- GitHub Pages는 Windows 보안 저장소와 API 서버가 없으므로 실제 시세 API를 제공하지 않는다.
- Windows 배포본은 Electron 패키지이며, `TwinTicker.exe`가 독립 창을 띄운다. 실행 중인 콘솔 창은 없다. 코드 서명이 없으면 Windows SmartScreen 경고가 표시될 수 있다.
- 앱 창은 로컬 시세 서버를 내부적으로 사용하며, 창을 닫으면 함께 종료된다. 시세 조회에는 인터넷 연결이 필요하다.
- GitHub Pages는 `main` 푸시 때 자동으로 업데이트된다. 배포 실패 시 Actions의 **Deploy alpha to GitHub Pages** 워크플로부터 확인한다.

## 다음 업데이트 전 확인 목록

1. 시장 휴장, 지연 시세, API 오류 상태 UI 고도화
2. 토스증권 API 응답을 이용한 통합 테스트 추가
3. Windows 실행 파일 코드 서명 및 SmartScreen 평판 확보 검토
