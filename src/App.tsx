import { useState } from 'react'
import IntroScreen from './screens/IntroScreen'
import FormScreen from './screens/FormScreen'
import SendingScreen from './screens/SendingScreen'
import RevealScreen from './screens/RevealScreen'
import BoothScreen from './screens/BoothScreen'
import type { Answers } from './types'

type Step = 'intro' | 'form' | 'sending' | 'reveal' | 'booth'

/**
 * 화면 흐름
 *   [0] 시작 화면  — 캐릭터 + [응모하기]
 *   [1] 응모 폼
 *   [2] 전송 중    — 흔한 응모 폼처럼 보이는 1.8초
 *   [3] 빨간 화면
 *   [4] 부스 유도
 *
 * ★ [2]에 "접수 완료 / 당첨자 발표" 화면이 있었으나 2026-09-08 삭제했습니다.
 *   안심시키는 말 없이 '전송 중'까지만 두는 것이 지금 형태입니다.
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

  if (step === 'sending') {
    return <SendingScreen onDone={() => setStep('reveal')} />
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
        setStep('sending')
      }}
    />
  )
}
