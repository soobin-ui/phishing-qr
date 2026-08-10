import { useState } from 'react'
import FormScreen from './screens/FormScreen'
import CompleteScreen from './screens/CompleteScreen'
import RevealScreen from './screens/RevealScreen'
import BoothScreen from './screens/BoothScreen'
import type { Answers } from './types'

type Step = 'form' | 'complete' | 'reveal' | 'booth'

/**
 * 화면 흐름 (총 80초)
 *   [1] 응모 폼    55초  ← Phase 1
 *   [2] 접수 완료   3초  ← Phase 1
 *   [3] 빨간 화면  20초  ← Phase 2
 *   [4] 부스 유도   대기  ← Phase 3 (지금은 임시 화면)
 *
 * ★ answers 는 이 컴포넌트의 메모리에만 존재합니다.
 *   서버 전송·localStorage·쿠키·콘솔 출력 어느 것도 하지 않으며,
 *   페이지를 닫으면 그대로 사라집니다.
 */
export default function App() {
  const [step, setStep] = useState<Step>('form')
  const [answers, setAnswers] = useState<Answers>({})

  if (step === 'complete') {
    return <CompleteScreen onDone={() => setStep('reveal')} />
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
        setStep('complete')
      }}
    />
  )
}
