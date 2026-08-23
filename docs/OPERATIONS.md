# 알파 운영 기록 및 특이사항

마지막 갱신: 2026-08-23 · 대상 버전: `0.1.0-alpha.2`

## 배포 기록

| 시각 (KST) | 버전 | 채널 | 상태 | 비고 |
| --- | --- | --- | --- | --- |
| 2026-08-23 | 0.1.0-alpha.1 | GitHub Pages / GitHub Release | 완료 | 첫 공개 알파 |
| 2026-08-23 | 0.1.0-alpha.2 | GitHub Release | 완료 | Node SEA 기반 Windows 휴대용 실행 파일 추가 |

## 알려진 특이사항

- 현재 모든 가격·시계열은 제품 흐름 검증용 목업 데이터다. 실제·지연 시세로 해석하거나 투자 판단에 사용하면 안 된다.
- 휴대용 실행 파일은 Node SEA(single executable application) 방식으로 빌드한다. 설치 과정 없이 기본 브라우저에서 앱을 열지만, 코드 서명이 없어 Windows SmartScreen 경고가 표시될 수 있다.
- `.exe`는 정적 앱과 로컬 서버를 하나로 포함한다. 기능은 웹 배포본과 같고 인터넷 연결 없이도 기본 화면을 열 수 있다. 실행 중인 콘솔 창을 닫으면 로컬 서버도 종료된다. 웹 폰트는 연결 가능한 경우에만 내려받는다.
- 배포 파일: `TwinTicker-Alpha-0.1.0-alpha.2.exe` (92,972,032 bytes), SHA-256 `2B94023F62ACAFC8DB2AB8F5FF23EA8F8553208954AD8E5B2C72ECE42BD24A64`.
- GitHub Pages는 `main` 푸시 때 자동으로 업데이트된다. 배포 실패 시 Actions의 **Deploy alpha to GitHub Pages** 워크플로부터 확인한다.

## 다음 업데이트 전 확인 목록

1. 시세 API 공급자·호출 제한·상업 이용 조건 확정
2. 시장 휴장, 지연 시세, API 오류 상태 UI 추가
3. 실제 데이터 어댑터와 계산 결과의 단위 테스트 추가
4. Windows 실행 파일 코드 서명 및 SmartScreen 평판 확보 검토
