import ChatInput from '#/components/ChatInput'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useParams } from '@tanstack/react-router'
import React, { useEffect } from 'react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

export const Route = createFileRoute('/chat/$conversationId')({
  component: RouteComponent,
})

function RouteComponent() {
  const params = useParams({ strict: false })
  const conversationId = params.conversationId

  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const chat = useQuery({
    queryKey: ['chat', conversationId],
    queryFn: getChat,
  })

  async function getChat() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/conversation/${conversationId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        },
      )
      const data = await response.json()
      return data.data
    } catch (error) {
      toast.error('Failed to get response from LLM')
      throw error
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chat.data])

  return chat.status === 'pending' ? (
    <p>Loading...</p>
  ) : chat.status === 'error' ? (
    <p>Error: {chat.error.message}</p>
  ) : (
    <div className="grid h-full w-full grid-rows-5">
      <div className="row-span-4 overflow-auto">
        {chat.data.map((message) => (
          <div id={message.messages.id} className="flex w-full my-2">
            {message.messages.sender === 'user' ? (
              <p className="text-right ml-auto md:max-w-[55vw] max-w-[75vw] bg-blue-200 rounded-md px-3 py-2">
                {message.messages.content}
              </p>
            ) : (
              <div className="text-left md:max-w-[55vw] max-w-[75vw] mr-auto bg-gray-200 rounded-md px-3 py-2">
                <ReactMarkdown>{message.messages.content}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput />
    </div>
  )
}
