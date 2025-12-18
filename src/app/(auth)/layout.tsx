export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0E14] px-4">
      {children}
    </div>
  )
}

