import { useState } from 'react'
import IntroScreen from './screens/IntroScreen'
import FormScreen from './screens/FormScreen'
import RevealScreen from './screens/RevealScreen'
import BoothScreen from './screens/BoothScreen'
import type { Answers } from './types'

type Step = 'intro' | 'form' | 'reveal' | 'booth'

/**
 * 화면 흐름
 *   [0] 시작 화면  — 캐릭터 + [응모하기]
 *   [1] 응모 폼
 *   [2] 빨간 화면   ← [응모하기]를 누르는 순간 바로 여기로 옵니다
 *   [3] 부스 유도
 *
 * ★ 사이에 "접수 완료" 화면이 있었으나 2026-09-08 삭제했습니다.
 *   누르자마자 경광등이 터지는 편이 낫다는 판단.
 *
 * ★ answers 는 이 컴포넌트의 메모리에만 존재합니다.
 *   서버 전송·localStorage·쿠키·콘솔 출력 어느 것도 하지 않으며,
 *   페이지를 닫으면 그대로 사라집니다.
 */
export default function App() {
  const [step, setStep] = useState<Step>('intro')
  const [answers, setAnswers] = useState<Answers>({})

  if (step === 'intro') {
    return <IntroScreen onStart={() => setStep('form')} />
  }

  if (step === 'reveal') {
    return <RevealScreen answers={answers} onNext={() => setStep('booth')} />
  }

  if (step === 'booth') {
    // 마지막 화면입니다. 관람객마다 각자 본인 휴대폰이라 되돌아갈 일이 없습니다.
    return <BoothScreen />
  }

  return (
    <FormScreen
      onSubmit={(a) => {
        setAnswers(a)
        setStep('reveal')
      }}
    />
  )
}
