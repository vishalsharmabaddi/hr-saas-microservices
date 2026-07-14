import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useQueryClient } from '@tanstack/react-query'

// Real-time notifications: notification-service (:8084) se STOMP over WebSocket connect.
// Message aane pe hum sirf notifications query ko invalidate karte hain → refetch →
// Layout ka pehle se bana prevUnread effect toast + sound bajaa deta hai.
export default function useNotificationSocket(companyId) {
  const queryClient = useQueryClient()
  const clientRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('wt_token')
    if (!token) return   // logged out — koi socket nahi

    const client = new Client({
      // SockJS ke through (vite proxy '/ws' → localhost:8084). SockJS = ws + auto-fallback.
      webSocketFactory: () => new SockJS('/ws'),
      // JWT CONNECT frame me — backend isse verify karke session ko email se baandhta hai
      connectHeaders: { Authorization: 'Bearer ' + token },
      reconnectDelay: 5000,   // socket toote to 5s baad khud reconnect

      onConnect: () => {
        const refetch = () =>
          queryClient.invalidateQueries({ queryKey: ['notifications'] })

        // Sirf meri private notifications
        client.subscribe('/user/queue/notifications', refetch)
        // Company-wide broadcasts
        if (companyId != null) {
          client.subscribe('/topic/company.' + companyId, refetch)
        }
      },
    })

    client.activate()
    clientRef.current = client

    return () => { client.deactivate() }   // logout / unmount pe connection band
  }, [companyId, queryClient])
}
