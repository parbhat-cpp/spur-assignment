import { cn } from '#/lib/utils'
import React, { useEffect } from 'react'
import { Button } from './ui/button'
import { useAtom } from '@tanstack/react-store'
import { queryLoadingStore, queryStore } from '#/store/query'
import { useNavigate, useParams } from '@tanstack/react-router'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

interface ChatInputProps extends React.HTMLAttributes<HTMLTextAreaElement> {}

const ChatInput = (props: ChatInputProps) => {
  const { className, ...rest } = props

  const navigate = useNavigate()

  const params = useParams({ strict: false })
  const conversationId = params.conversationId

  const queryClient = useQueryClient();

  const [userQuery, setUserQuery] = useAtom(queryStore)
  const [queryLoading, setQueryLoading] = useAtom(queryLoadingStore)

  const [disableSubmit, setDisableSubmit] = React.useState(false)

  async function handleAskLLM() {
    try {
      setQueryLoading(true)
      const query = userQuery.trim()

      if (query === '') {
        toast.error('Please enter a message')
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/conversation/chat/${conversationId || ''}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ message: query }),
        },
      )
      const data = await response.json()
      return data.data
    } catch (error) {
      toast.error('Failed to get response from LLM')
    } finally {
      setQueryLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLTextAreaElement>) {
    e.preventDefault()
    if (!conversationId) {
      const resp = await handleAskLLM()
      navigate({
        to: '/chat/$conversationId',
        params: { conversationId: resp.conversationId },
      })
    } else {
      await handleAskLLM()
      queryClient.invalidateQueries({ queryKey: ['chat', conversationId] })
    }
    setUserQuery('')
  }

  const handleEnterPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  useEffect(() => {
    if (userQuery.trim() === '') {
      setDisableSubmit(true)
    } else {
      setDisableSubmit(false)
    }
  }, [userQuery])

  return (
    <form
      onSubmit={handleSubmit}
      className="relative h-full border-accent-200 rounded-md border bg-popover p-4 shadow-sm ring-1 ring-accent-300 focus-within:ring-accent-300"
    >
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-center bg-transparent">
        {queryLoading && <p className="text-sm p-2 rounded-md">Agent is typing...</p>}
      </div>
      <textarea
        value={userQuery}
        onChange={(e) => setUserQuery(e.target.value)}
        onKeyDown={handleEnterPress}
        className={cn(
          'w-full border-0 bg-transparent placeholder:text-muted-foreground focus-visible:outline-none',
          className,
        )}
        placeholder="Type a message..."
        {...rest}
      />
      <Button
        type="submit"
        className="absolute right-2 bottom-2 rounded-md bg-primary px-3 py-1 text-sm font-medium text-white hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        disabled={disableSubmit}
      >
        Send
      </Button>
    </form>
  )
}

export default ChatInput
