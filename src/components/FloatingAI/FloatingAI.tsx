import { useState, useEffect } from 'react'
import { RiRobot2Fill } from 'react-icons/ri'
import { MdClose } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import styles from './FloatingAI.module.css'

export default function FloatingAI() {
  const navigate                      = useNavigate()
  const [showTooltip, setShowTooltip] = useState(false)
  const [hasOpened, setHasOpened]     = useState(false)

  // Show tooltip after 3 seconds on first visit
  useEffect(() => {
    const seen = localStorage.getItem('agf_ai_tooltip_seen')
    if (!seen) {
      const timer = setTimeout(() => setShowTooltip(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Hide tooltip after 6 seconds
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => setShowTooltip(false), 6000)
      return () => clearTimeout(timer)
    }
  }, [showTooltip])

  function handleClick() {
    setShowTooltip(false)
    setHasOpened(true)
    localStorage.setItem('agf_ai_tooltip_seen', 'true')
    navigate('/farmer/dashboard')
  }

  return (
    <>
      {/* Tooltip */}
      {showTooltip && (
        <div className={styles.tooltip}>
          <p>👋 Need assistance?</p>
          <p>I'm Agro, your personal farming buddy!</p>
          <button
            className={styles.tooltipClose}
            onClick={() => setShowTooltip(false)}
          >
            <MdClose size={12} />
          </button>
        </div>
      )}

      {/* Floating button */}
      <button
        className={styles.floatBtn}
        onClick={handleClick}
        aria-label="Open AI assistant"
      >
        <RiRobot2Fill size={24} />
        {!hasOpened && <span className={styles.floatPulse} />}
      </button>
    </>
  )
}