'use client'

import { FC, ButtonHTMLAttributes } from 'react'
import { ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  variant?: 'primary' | 'secondary'
  classes?: string
  animate?: boolean
  delay?: number
}

const MotionButton: FC<Props> = ({ label, classes, ...props }) => {
  return (
    <button
      {...props}
      className={cn(
        'group relative flex h-14 w-auto min-w-[14rem] items-center cursor-pointer rounded-full bg-[#020205] outline-none overflow-hidden transition-all duration-300',
        classes
      )}
    >
      {/* Orange fill: starts as a circle (w-14 = 56px = h-14), expands to full width on hover */}
      <span
        className='bg-primary absolute inset-y-0 left-0 block h-full w-14 rounded-full transition-all duration-500 ease-out group-hover:w-full'
        aria-hidden='true'
      />

      {/* Icon — exactly w-14 wide so its right edge aligns with circle's right edge */}
      <span className='relative z-10 flex h-14 w-14 flex-shrink-0 items-center justify-center transition-transform duration-500 group-hover:translate-x-[3px]'>
        <ArrowRight className='text-[#020205] size-5' />
      </span>

      {/* Hard-coded 7px gap between circle edge and label */}
      <span className='relative z-10 flex-shrink-0' style={{ width: '7px' }} />

      {/* Label text — takes remaining space, right-padded to visually balance */}
      <span
        className='relative z-10 flex-1 pr-5 text-center text-white group-hover:text-[#020205] font-manrope text-base sm:text-lg font-semibold tracking-tight whitespace-nowrap transition-colors duration-500'
      >
        {label}
      </span>
    </button>
  )
}

export default MotionButton
