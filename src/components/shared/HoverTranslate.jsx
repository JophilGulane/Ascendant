// components/shared/HoverTranslate.jsx
// Wraps any target language text with a hover/tap tooltip showing translation
// Required: wrap ALL target language text in this component

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * @param {React.ReactNode} children - the target language text to display
 * @param {string} translation - the native language translation
 * @param {string} [className] - additional classes on the wrapper span
 */
export function HoverTranslate({ children, translation, className = '' }) {
  const [show, setShow] = useState(false)

  if (!translation) return <span className={className}>{children}</span>

  return (
    <span
      className={`relative cursor-help border-b border-dotted border-current ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={(e) => { e.preventDefault(); setShow(s => !s) }}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5
                       bg-gray-900/95 border border-gray-600/50 text-white text-xs
                       rounded-lg whitespace-nowrap z-50 pointer-events-none
                       shadow-xl shadow-black/50"
          >
            {translation}
            {/* Small arrow */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px
                             border-4 border-transparent border-t-gray-900/95" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
