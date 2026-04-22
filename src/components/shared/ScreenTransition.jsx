// components/shared/ScreenTransition.jsx
import { motion } from 'framer-motion'

const variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export function ScreenTransition({ children, className = '' }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className={`w-full h-full ${className}`}
    >
      {children}
    </motion.div>
  )
}
