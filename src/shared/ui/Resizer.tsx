import React, { useCallback, useRef, useState } from 'react'
import { ResizeHandlerProps } from '../types'

interface ResizerProps extends ResizeHandlerProps {
  className?: string
}

const Resizer: React.FC<ResizerProps> = ({ direction, onResize }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [_, setIsHovering] = useState(false)
  const startPosRef = useRef(0)
  const lastPosRef = useRef(0)
  const resizerRef = useRef<HTMLDivElement>(null)

  const updateParentClass = useCallback((action: 'add' | 'remove', className: string) => {
    const parent = resizerRef.current?.parentElement
    if (parent) {
      if (action === 'add') {
        parent.classList.add(className)
      } else {
        parent.classList.remove(className)
      }
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const startPos = direction === 'horizontal' ? e.clientX : e.clientY
    startPosRef.current = startPos
    lastPosRef.current = startPos
    setIsDragging(true)
    updateParentClass('add', 'resizing')
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY
      const delta = currentPos - lastPosRef.current
      
      if (Math.abs(delta) > 0) {
        onResize(delta)
        lastPosRef.current = currentPos
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault()
      setIsDragging(false)
      updateParentClass('remove', 'resizing')
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('mouseup', handleMouseUp, { passive: false })
  }, [direction, onResize, updateParentClass])

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
    updateParentClass('add', 'resizing')
  }, [updateParentClass])

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      setIsHovering(false)
      updateParentClass('remove', 'resizing')
    }
  }, [isDragging, updateParentClass])

  return (
    <div
      ref={resizerRef}
      className="resizer"
      style={{
        position: 'absolute',
        top: 0,
        right: direction === 'horizontal' ? -2 : 'auto',
        bottom: direction === 'horizontal' ? 0 : -2,
        left: direction === 'vertical' ? 0 : 'auto',
        width: direction === 'horizontal' ? 4 : '100%',
        height: direction === 'vertical' ? 4 : '100%',
        cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
        zIndex: 10,
        backgroundColor: 'transparent'
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  )
}

export default Resizer
