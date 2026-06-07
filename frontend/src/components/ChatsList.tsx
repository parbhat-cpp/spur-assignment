import React from 'react'
import { Button } from './ui/button'
import { Link } from '@tanstack/react-router'
import { toast } from 'react-hot-toast'
import { useInfiniteQuery } from '@tanstack/react-query'
import { formatDate } from '#/lib/utils'

const ChatsList = () => {
  const chats = useInfiniteQuery({
    queryKey: ['chats'],
    queryFn: getChats,
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
  })

  async function getChats({ pageParam }: { pageParam: string }) {
    try {
      const chatsUrl = `${import.meta.env.VITE_BACKEND_URL}/conversation?cursor=${pageParam || ''}`
      const response = await fetch(chatsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch conversations')
      }

      const data = await response.json()

      return {
        data: data.conversations,
        nextCursor: data.nextCursor,
      }
    } catch (error) {
      toast.error('Failed to fetch conversations')
    }
  }

  return (
    <aside className="flex flex-col h-full md:w-72 w-full shrink-0 border-r border-slate-200/70 bg-white/75 p-4 backdrop-blur">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700/80">
          Chats
        </p>
      </div>

      <Link
        to="/chat/"
        className="mt-4 rounded-md px-3 py-2 text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
      >
        New Chat
      </Link>

      <nav className="mt-8 flex flex-col gap-2">
        {chats.status === 'pending' ? (
          <p>Loading...</p>
        ) : chats.status === 'error' ? (
          <p>Error: {chats.error.message}</p>
        ) : (
          <>
            {chats.data.pages.map((group, i) => (
              <React.Fragment key={i}>
                {group &&
                  group.data.map((chat) => (
                    <>
                      {formatDate(chat.createdAt)}
                      {chat.records.map((record) => (
                        <Link
                          key={record.id}
                          to={`/chat/${record.id}`}
                          className="block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          {record.title}
                        </Link>
                      ))}
                    </>
                  ))}
              </React.Fragment>
            ))}
            <div className="flex">
              <Button
                onClick={() => chats.fetchNextPage()}
                disabled={!chats.hasNextPage || chats.isFetchingNextPage}
                className="mx-auto"
              >
                {chats.isFetchingNextPage
                  ? 'Loading more...'
                  : chats.hasNextPage
                    ? 'Load More'
                    : chats.data.pages[0]?.data.length === 0
                      ? 'No Conversations'
                      : 'No more conversations'}
              </Button>
            </div>
            <div>
              {chats.isFetching && !chats.isFetchingNextPage
                ? 'Fetching...'
                : null}
            </div>
          </>
        )}
      </nav>
    </aside>
  )
}

export default ChatsList
