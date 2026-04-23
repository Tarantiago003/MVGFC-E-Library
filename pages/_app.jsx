
import { SessionProvider } from 'next-auth/react'
import '../styles/globals.css'

export default function App({ Component, pageProps: { session, ...rest } }) {
  return (
    <SessionProvider session={session}>
      <Component {...rest}/>
    </SessionProvider>
  )
}