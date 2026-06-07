import ChatInput from '#/components/ChatInput'
import { FREQUENTLY_ASKED_QUESTIONS } from '#/constants'
import { queryStore } from '#/store/query'
import { createFileRoute } from '@tanstack/react-router'
import { useAtom } from '@tanstack/react-store'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/chat/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [, setUserQuery] = useAtom(queryStore)
  const [faqs, setFaqs] = useState<string[]>([])

  useEffect(() => {
    const uniqueFaqs = new Set<string>();
    while (uniqueFaqs.size !== 6) {
      const randomIndex = Math.floor(
        Math.random() * FREQUENTLY_ASKED_QUESTIONS.length,
      )
      const question = FREQUENTLY_ASKED_QUESTIONS[randomIndex]
      uniqueFaqs.add(question)
    }
    setFaqs(Array.from(uniqueFaqs))
  }, [])

  return (
    <div className="grid h-full w-full grid-rows-[1fr_auto] gap-6 p-4 sm:p-6">
      <div className="overflow-y-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Frequently asked questions
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a question to get started quickly.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {faqs.map((question) => (
              <button
                key={question}
                type="button"
                className="rounded-xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                onClick={() => setUserQuery(question)}
              >
                <p className="text-sm font-medium leading-6 text-card-foreground">
                  {question}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
      <ChatInput />
    </div>
  )
}
