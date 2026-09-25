# Whale Watch 운영 안내

Trading Helpers의 `/whale-watch` 화면에서 Supabase에 저장된 SEC 13F 공시를 조회합니다.

## 실행과 검증

- Node 24, pnpm 사용: `pnpm install --frozen-lockfile`, `pnpm dev`
- `pnpm test`: XML 파싱, 보유 수량 비교, 기존 브라우저 설정 정리와 관심 목록 복원
- `pnpm build`, `pnpm lint`
- `pnpm dlx deno check supabase/functions/whale-watch-sync/index.ts`
- 기존 Cloudflare 배포: `pnpm deploy` (Cloudflare 로그인 필요)

## 연결된 서비스

프로젝트: `vcyzxlrhdirpllmcltrn`. 브라우저에는 프로젝트 URL과 공개 publishable key만 포함됩니다. `ww_managers`와 `ww_events`만 익명 읽기가 가능합니다. 서버 설정, 공시 스냅샷, 작업 잠금은 서비스 역할만 접근합니다. 모든 공개 스키마 테이블에 RLS가 적용되어 있습니다.

`supabase/functions/whale-watch-sync`는 배포된 수집기입니다. JWT 대신 Vault에 보관된 임의 토큰을 검증합니다. 토큰 원문은 프론트엔드나 저장소에 없으며 DB 설정에는 SHA-256 해시만 있습니다. SEC 연락처는 서버 설정에서만 사용합니다. 서비스 역할 키는 Edge Function의 기본 환경변수로만 읽습니다.

`whale-watch-daily` 예약 작업은 매일 한국시간 오전 7시부터 7시 14분까지(UTC 전날 22:00–22:14) 기관별 슬롯에 따라 순차 실행합니다. 현재 10개 기관은 7시부터 7시 9분까지 각 1회 검사하며 나머지 5분은 네트워크 호출 없이 종료합니다. 정상 운용 기준 Edge 호출은 하루 10회입니다. 이전 `whale-watch-15m` 예약은 제거했습니다. Supabase 무료 플랜의 사용량·휴면 정책은 별도로 확인해야 합니다.

실제 수집 성공 여부는 `ww_managers.last_success`, `status`, `error_code`로 확인합니다. cron의 succeeded는 HTTP 요청을 예약했다는 뜻이며 SEC 수집 성공을 보장하지 않습니다. 화면은 하루 수집 주기에 2시간의 여유를 두어 26시간 이상 갱신되지 않으면 지연을 표시합니다.

## 데이터 해석

- 운용사 10곳의 최근 13F-HR을 비교합니다. 제출 목록의 `filings.recent` 범위이며 전체 과거 아카이브 탐색은 지원하지 않습니다.
- 최초 두 보고 기간은 초기 이력입니다. 첫 비교 결과에는 초기 이력 표시가 붙습니다.
- CUSIP, 주식 종류, PUT/CALL, 수량 단위를 구분해 합산합니다. 동일 보고서에서 분리된 행은 합산하고 금액 변화로 매매를 추정하지 않습니다.
- 원본 접수번호와 종목 키의 고유 제약, 기관별 임대 잠금으로 중복을 막습니다. 공시와 변동은 한 트랜잭션에 저장합니다.
- 정정 보고(13F-HR/A)가 관련된 기간은 자동 비교를 보류하고 이미 저장된 관련 변동에 검토 표시를 합니다. 정정 보고의 재작성·추가 유형을 자동 병합하지 않습니다.
- 수집기의 기본 매핑은 12개 CUSIP이며, 미매핑 종목은 별도 검증 후 `ww_events.ticker`를 보완합니다. 2026-09-24에는 OpenFIGI의 정확한 CUSIP/CINS 조회와 NASDAQ 공식 종목 목록을 대조해 1,496개 식별자에 해당하는 1,940개 피드 행을 보완했습니다. 주식 종류·우선주 시리즈·상장 이력을 구분했으며 원본 `ww_filings.holdings`와 CUSIP은 수정하지 않았습니다. 채권 2종과 확인되지 않은 구 ADR 1종은 CUSIP을 유지합니다. 새 공시에서 생성되는 미매핑 행은 후속 검증 대상입니다.
- 분기 보유 변화이며 실제 거래일, 체결가, 옵션 프리미엄·만기·행사가는 알 수 없습니다. 풋 보유를 공매도로 단정하지 않습니다.

## 브라우저 기능

공시 피드와 투자자 목록을 제공합니다. 관심 투자자를 선택하면 공시 피드에서 해당 기관만 필터링할 수 있습니다. 관심 목록만 `trading-whale-watch-v1`에 저장하며, 이전 버전의 알림 규칙·알림함·커서는 방문 시 정리합니다.

사이트를 열거나 다시 활성화할 때와 활성 상태에서 5분마다 공시와 수집 상태를 갱신합니다. 알림 생성·수신·발송 기능은 없습니다. 서버 공시 수집은 브라우저와 독립적으로 작동합니다.

## 마이그레이션과 배포

`supabase/migrations`는 연결된 프로젝트에 적용된 버전과 구조를 보관합니다. 개인 연락처는 저장소에 공개하지 않도록 서버 설정값 `whale_watch.sec_contact`로 대체했습니다. 기존 프로젝트에는 연락처가 이미 설정되어 있습니다. 새 프로젝트는 이 값을 관리자 DB 설정에 넣은 뒤 마이그레이션을 적용해야 합니다. 수집기 수정 시 `index.ts`, `core.mjs`, `deno.json`을 함께 배포합니다. 새 프로젝트로 옮길 때는 SQL 내 프로젝트 URL과 SEC 연락처, 프론트엔드 공개 설정을 먼저 변경하고 수집기를 배포한 뒤 스케줄을 활성화하세요. 임의 토큰은 DB에서 생성되므로 하드코딩하지 않습니다.

2026-09-24 보안 점검에서 테이블 권한·RLS 문제는 없었습니다. `pg_net`의 확장 등록 위치가 public인 경고 한 건은 남아 있습니다. 현재 버전은 확장 위치를 직접 옮길 수 없으며 삭제·재생성은 가동 중 수집을 중단시킬 수 있어 수행하지 않았습니다. [Supabase 경고 설명](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public).

## 수집 대상 (10곳)

| 기관 | SEC CIK |
|---|---|
| 마이클 버리 / Scion | 1649339 |
| 버크셔 해서웨이 | 1067983 |
| 빌 애크먼 / Pershing Square | 1336528 |
| 브리지워터 | 1350694 |
| 캐시 우드 / ARK | 1697748 |
| 데이비드 테퍼 / Appaloosa | 1656456 |
| Baron Capital / BAMCO | 1017918 |
| TCI Fund Management | 1647251 |
| Duquesne Family Office | 1536411 |
| Third Point | 1040273 |

추가 기관도 최초 수집 자료는 과거 이력으로 저장합니다. 방문자의 기존 팔로우는 유지되며, 기관 목록에서 새 기관을 선택할 수 있습니다. 수집 목록은 DB의 `ww_managers`를 기준으로 하며 프론트엔드와 수집기는 해당 목록을 읽습니다. 기관의 수익률이나 추천 등급은 이 변경에서 추가하지 않습니다.

## Holdings allocation

The holdings detail chart uses the relative `reported_value` from SEC XML within each filing. It covers equities and ETFs (SH, no put/call), excludes options, debt and unreported cash, and is not a share of total institutional assets. All positions are shown individually without an Other bucket. Incomplete values suppress the chart.

The collector enriches its latest two saved filings only when every security key, issuer and quantity matches the source. Original snapshot fields remain intact. New filings retain values at ingestion. The daily schedule is unchanged. `ww_filings` now has public SELECT access alongside managers and events; worker settings and leases remain private.
