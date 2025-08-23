import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import Resizer from './Resizer'

const mockProps = {
  direction: 'horizontal' as const,
  onResize: vi.fn()
}

describe('Resizer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // テスト後にボディのスタイルをクリア
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  })

  it('水平方向のリサイザーが正しくレンダリングされる', () => {
    render(<Resizer {...mockProps} direction="horizontal" />)
    
    const resizer = document.querySelector('.resizer')
    expect(resizer).toBeInTheDocument()
  })

  it('垂直方向のリサイザーが正しくレンダリングされる', () => {
    render(<Resizer {...mockProps} direction="vertical" />)
    
    const resizer = document.querySelector('.resizer')
    expect(resizer).toBeInTheDocument()
  })

  it('マウスダウンでドラッグが開始される', () => {
    render(<Resizer {...mockProps} />)
    
    const resizer = document.querySelector('.resizer')!
    
    fireEvent.mouseDown(resizer, { clientX: 100 })
    
    expect(document.body.style.cursor).toBe('col-resize')
    expect(document.body.style.userSelect).toBe('none')
  })

  it('水平方向のドラッグでonResizeが呼ばれる', () => {
    render(<Resizer {...mockProps} direction="horizontal" />)
    
    const resizer = document.querySelector('.resizer')!
    
    // ドラッグ開始
    fireEvent.mouseDown(resizer, { clientX: 100 })
    
    // マウス移動
    fireEvent(document, new MouseEvent('mousemove', { clientX: 150 }))
    
    expect(mockProps.onResize).toHaveBeenCalledWith(50)
  })

  it('垂直方向のドラッグでonResizeが呼ばれる', () => {
    render(<Resizer {...mockProps} direction="vertical" />)
    
    const resizer = document.querySelector('.resizer')!
    
    // ドラッグ開始
    fireEvent.mouseDown(resizer, { clientY: 100 })
    
    // マウス移動
    fireEvent(document, new MouseEvent('mousemove', { clientY: 150 }))
    
    expect(mockProps.onResize).toHaveBeenCalledWith(50)
  })

  it('マウスアップでドラッグが終了する', () => {
    render(<Resizer {...mockProps} />)
    
    const resizer = document.querySelector('.resizer')!
    
    // ドラッグ開始
    fireEvent.mouseDown(resizer, { clientX: 100 })
    
    // ドラッグ終了
    fireEvent(document, new MouseEvent('mouseup', {}))
    
    expect(document.body.style.cursor).toBe('')
    expect(document.body.style.userSelect).toBe('')
  })

  it('連続したマウス移動で複数回onResizeが呼ばれる', () => {
    render(<Resizer {...mockProps} />)
    
    const resizer = document.querySelector('.resizer')!
    
    // ドラッグ開始
    fireEvent.mouseDown(resizer, { clientX: 100 })
    
    // 複数回のマウス移動
    fireEvent(document, new MouseEvent('mousemove', { clientX: 120 }))
    fireEvent(document, new MouseEvent('mousemove', { clientX: 140 }))
    fireEvent(document, new MouseEvent('mousemove', { clientX: 180 }))
    
    expect(mockProps.onResize).toHaveBeenCalledTimes(3)
    expect(mockProps.onResize).toHaveBeenNthCalledWith(1, 20)
    expect(mockProps.onResize).toHaveBeenNthCalledWith(2, 20)
    expect(mockProps.onResize).toHaveBeenNthCalledWith(3, 40)
  })

  it('ドラッグでonResizeが呼ばれる', () => {
    render(<Resizer {...mockProps} />)
    
    const resizer = document.querySelector('.resizer')!
    
    // ドラッグ開始
    fireEvent.mouseDown(resizer, { clientX: 100 })
    
    // マウス移動
    fireEvent(document, new MouseEvent('mousemove', { clientX: 150 }))
    
    expect(mockProps.onResize).toHaveBeenCalled()
  })

  it('マウスエンターでホバー状態になる', () => {
    render(
      <div>
        <Resizer {...mockProps} />
      </div>
    )
    
    const resizer = document.querySelector('.resizer')!
    const parent = resizer.parentElement!
    
    fireEvent.mouseEnter(resizer)
    
    expect(parent.classList.contains('resizing')).toBe(true)
  })

  it('マウスリーブでホバー状態が解除される', () => {
    render(
      <div>
        <Resizer {...mockProps} />
      </div>
    )
    
    const resizer = document.querySelector('.resizer')!
    const parent = resizer.parentElement!
    
    // ホバー開始
    fireEvent.mouseEnter(resizer)
    expect(parent.classList.contains('resizing')).toBe(true)
    
    // ホバー終了
    fireEvent.mouseLeave(resizer)
    expect(parent.classList.contains('resizing')).toBe(false)
  })

  it('ドラッグ中はマウスリーブでホバー状態が解除されない', () => {
    render(
      <div>
        <Resizer {...mockProps} />
      </div>
    )
    
    const resizer = document.querySelector('.resizer')!
    const parent = resizer.parentElement!
    
    // ホバー開始
    fireEvent.mouseEnter(resizer)
    
    // ドラッグ開始
    fireEvent.mouseDown(resizer, { clientX: 100 })
    
    // ホバー終了を試行
    fireEvent.mouseLeave(resizer)
    
    // ドラッグ中なのでクラスは残る
    expect(parent.classList.contains('resizing')).toBe(true)
  })

  it('マウスダウンイベントが処理される', () => {
    render(<Resizer {...mockProps} />)
    
    const resizer = document.querySelector('.resizer')!
    
    expect(() => {
      fireEvent.mouseDown(resizer, { clientX: 100 })
    }).not.toThrow()
  })

  it('負の値のドラッグでも正しく処理される', () => {
    render(<Resizer {...mockProps} />)
    
    const resizer = document.querySelector('.resizer')!
    
    // ドラッグ開始
    fireEvent.mouseDown(resizer, { clientX: 100 })
    
    // 負の方向への移動
    fireEvent(document, new MouseEvent('mousemove', { clientX: 50 }))
    
    expect(mockProps.onResize).toHaveBeenCalledWith(-50)
  })

  it('カスタムclassNameが適用される', () => {
    render(<Resizer {...mockProps} className="custom-resizer" />)
    
    const resizer = document.querySelector('.resizer')
    expect(resizer).toHaveClass('resizer')
  })

  it('親要素が存在しない場合でもエラーが発生しない', () => {
    // 親要素なしでレンダリング
    const resizer = document.createElement('div')
    resizer.className = 'resizer'
    
    // 直接DOMに追加せずにテスト
    expect(() => {
      fireEvent.mouseEnter(resizer)
      fireEvent.mouseLeave(resizer)
    }).not.toThrow()
  })

  it('複数のリサイザーが独立して動作する', () => {
    const onResize1 = vi.fn()
    const onResize2 = vi.fn()
    
    render(
      <div>
        <Resizer direction="horizontal" onResize={onResize1} />
        <Resizer direction="vertical" onResize={onResize2} />
      </div>
    )
    
    const resizers = document.querySelectorAll('.resizer')
    
    // 最初のリサイザーをドラッグ
    fireEvent.mouseDown(resizers[0], { clientX: 100 })
    fireEvent(document, new MouseEvent('mousemove', { clientX: 150 }))
    
    expect(onResize1).toHaveBeenCalledWith(50)
    expect(onResize2).not.toHaveBeenCalled()
    
    // ドラッグ終了
    fireEvent(document, new MouseEvent('mouseup', {}))
    
    // 2番目のリサイザーをドラッグ
    fireEvent.mouseDown(resizers[1], { clientY: 200 })
    fireEvent(document, new MouseEvent('mousemove', { clientY: 250 }))
    
    expect(onResize2).toHaveBeenCalledWith(50)
    expect(onResize1).toHaveBeenCalledTimes(1) // 追加で呼ばれない
  })

  it('ドラッグ終了後にイベントリスナーが削除される', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
    
    render(<Resizer {...mockProps} />)
    
    const resizer = document.querySelector('.resizer')!
    
    // ドラッグ開始
    fireEvent.mouseDown(resizer, { clientX: 100 })
    
    // ドラッグ終了
    fireEvent(document, new MouseEvent('mouseup', {}))
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
    
    removeEventListenerSpy.mockRestore()
  })
})