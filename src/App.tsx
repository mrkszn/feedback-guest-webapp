import { Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { lazyWithRetry } from '@/lib/lazyWithRetry'
import { RequireAuth } from '@/components/RequireAuth'
import { Loading } from '@/components/Loading'

// Entry is eager (it is the landing route); the rest are lazy + retry-on-deploy.
import Entry from '@/screens/Entry'
const Welcome = lazyWithRetry(() => import('@/screens/Welcome'))
const Feed = lazyWithRetry(() => import('@/screens/Feed'))
const Recap = lazyWithRetry(() => import('@/screens/Recap'))
const Dig = lazyWithRetry(() => import('@/screens/Dig'))
const Identify = lazyWithRetry(() => import('@/screens/Identify'))
const Prize = lazyWithRetry(() => import('@/screens/Prize'))
const Final = lazyWithRetry(() => import('@/screens/Final'))

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Entry />} />
          <Route
            path="/welcome"
            element={
              <RequireAuth>
                <Welcome />
              </RequireAuth>
            }
          />
          <Route
            path="/feed"
            element={
              <RequireAuth>
                <Feed />
              </RequireAuth>
            }
          />
          <Route
            path="/recap"
            element={
              <RequireAuth>
                <Recap />
              </RequireAuth>
            }
          />
          <Route
            path="/dig"
            element={
              <RequireAuth>
                <Dig />
              </RequireAuth>
            }
          />
          <Route
            path="/identify"
            element={
              <RequireAuth>
                <Identify />
              </RequireAuth>
            }
          />
          <Route
            path="/prize"
            element={
              <RequireAuth>
                <Prize />
              </RequireAuth>
            }
          />
          <Route
            path="/final"
            element={
              <RequireAuth>
                <Final />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
