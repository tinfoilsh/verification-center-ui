import { LuCheck, LuX } from 'react-icons/lu'

type StatusIconProps = {
  status: 'pending' | 'success' | 'error'
}

export function StatusIcon({ status }: StatusIconProps) {
  const iconMap = {
    success: {
      bg: 'bg-emerald-500',
      icon: <LuCheck className="h-[8.8px] w-[8.8px] text-white" />,
    },
    error: {
      bg: 'bg-red-500',
      icon: <LuX className="h-[8.8px] w-[8.8px] text-white" />,
    },
    pending: {
      bg: 'bg-gray-500',
      icon: null,
    },
  }

  const { bg, icon } = iconMap[status]

  return (
    <div
      className={`flex h-[17.6px] w-[17.6px] items-center justify-center rounded-full transition-colors duration-300 ${bg}`}
    >
      {icon}
    </div>
  )
}
