import { type ComponentType, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { Header } from './components/layout/Header'
import { TabNav } from './components/layout/TabNav'
import { SettingsModal } from './components/settings/SettingsModal'
import { AvgCalcPage } from './features/avgCalc/AvgCalcPage'
import { DcaPage } from './features/dca/DcaPage'
import { ExpectancyPage } from './features/expectancy/ExpectancyPage'
import { SimulatorPage } from './features/simulator/SimulatorPage'
import { SizingPage } from './features/sizing/SizingPage'
import type { RouteMeta } from './types'

interface AppRoute extends RouteMeta {
  component: ComponentType
}

const FEATURE_ROUTES: readonly AppRoute[] = [
  {
    id: 'avgCalc',
    path: '/avg-price',
    label: '평균단가',
    title: '평균단가 계산기 | 트레이딩 헬퍼',
    description: '분할매수 평균단가, 손절가, 익절가, 현재 손익을 한 번에 계산하는 평균단가 계산기입니다.',
    canonicalPath: '/avg-price',
    introTitle: '평균단가 계산기',
    introDescription: '분할 진입 데이터를 넣으면 평균단가, 손절/익절 가격, 현재 손익까지 한 번에 확인합니다.',
    component: AvgCalcPage,
  },
  {
    id: 'dca',
    path: '/dca',
    label: 'DCA 물타기',
    title: 'DCA 물타기 계산기 | 트레이딩 헬퍼',
    description: 'DCA 물타기 시 새 평균단가, 본전가, 본전까지 필요 이동률을 계산하는 DCA 계산기입니다.',
    canonicalPath: '/dca',
    introTitle: 'DCA 물타기 계산기',
    introDescription: '기존 포지션에 추가 진입했을 때 새 평균단가와 본전가 변화를 빠르게 계산합니다.',
    component: DcaPage,
  },
  {
    id: 'sizing',
    path: '/position-sizing',
    label: '포지션 사이징',
    title: '포지션 사이징 계산기 | 트레이딩 헬퍼',
    description: '허용 손실 기준으로 권장 수량과 증거금을 계산하는 포지션 사이징 계산기입니다.',
    canonicalPath: '/position-sizing',
    introTitle: '포지션 사이징 계산기',
    introDescription: '계좌 자산과 리스크 기준을 기반으로 적정 포지션 수량과 손절 손익을 계산합니다.',
    component: SizingPage,
  },
  {
    id: 'simulator',
    path: '/simulator',
    label: '시뮬레이터',
    title: '포지션 시뮬레이터 | 트레이딩 헬퍼',
    description: '가격 구간별 손익 곡선을 확인하는 포지션 시뮬레이터입니다. 손절가, 익절가, 현재가를 함께 비교합니다.',
    canonicalPath: '/simulator',
    introTitle: '포지션 시뮬레이터',
    introDescription: '평균단가와 수량 기준으로 가격 구간별 손익 곡선을 시각화해 진입 전략을 점검합니다.',
    component: SimulatorPage,
  },
  {
    id: 'expectancy',
    path: '/expectancy',
    label: '기대값 분석',
    title: '기대값 분석 계산기 | 트레이딩 헬퍼',
    description: '승률과 손익비를 바탕으로 전략 기대값과 손익분기 승률을 계산하는 기대값 분석 도구입니다.',
    canonicalPath: '/expectancy',
    introTitle: '기대값 분석 계산기',
    introDescription: '승률, 손익비, 평균 손익으로 전략의 장기 기대값과 손익분기 승률을 확인합니다.',
    component: ExpectancyPage,
  },
]

function ensureMetaTag(name: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  return tag
}

function ensureCanonicalLink() {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  return link
}

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const location = useLocation()

  const currentRoute = useMemo(() => {
    return FEATURE_ROUTES.find((route) => route.path === location.pathname) ?? FEATURE_ROUTES[0]
  }, [location.pathname])

  useEffect(() => {
    document.title = currentRoute.title

    const descriptionTag = ensureMetaTag('description')
    descriptionTag.setAttribute('content', currentRoute.description)

    const canonicalLink = ensureCanonicalLink()
    canonicalLink.setAttribute('href', `${window.location.origin}${currentRoute.canonicalPath}`)
  }, [currentRoute])

  return (
    <div className="min-h-screen bg-transparent text-[color:var(--color-text-primary)]">
      <Header onSettingsClick={() => setSettingsOpen(true)} />
      <TabNav tabs={FEATURE_ROUTES.map((route) => ({ id: route.id, label: route.label, to: route.path }))} />
      <main className="mx-auto w-full max-w-[var(--container-wide)] px-4 py-6 sm:px-6 sm:py-8">
        <section className="mb-6 rounded-[var(--radius-card)] border border-white/8 bg-[color:var(--surface-base)] px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">Search Intent</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[color:var(--color-text-primary)]">{currentRoute.introTitle}</h2>
          <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">{currentRoute.introDescription}</p>
        </section>
        <Routes>
          <Route element={<Navigate replace to="/avg-price" />} path="/" />
          {FEATURE_ROUTES.map((route) => (
            <Route element={<route.component />} key={route.id} path={route.path} />
          ))}
          <Route element={<Navigate replace to="/avg-price" />} path="*" />
        </Routes>
      </main>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
