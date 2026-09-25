import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#1a1815] group-[.toaster]:text-[#e3ded7] group-[.toaster]:border-[#2e2a24] group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl font-sans text-xs",
          description: "group-[.toast]:text-[#8a857d]",
          actionButton:
            "group-[.toast]:bg-[#d4af37] group-[.toast]:text-[#0e0906] font-semibold",
          cancelButton:
            "group-[.toast]:bg-[#262421] group-[.toast]:text-[#b5b0a8]",
          success:
            "group-[.toaster]:border-emerald-500/50 group-[.toaster]:text-emerald-300",
          error:
            "group-[.toaster]:border-red-500/50 group-[.toaster]:text-red-300",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
