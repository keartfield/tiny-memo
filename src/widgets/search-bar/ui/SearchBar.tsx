import React, { useState, useEffect } from 'react'
import './SearchBar.css'

interface SearchBarProps {
  onSearch: (query: string) => void
  value: string
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, value }) => {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(localValue)
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [localValue, onSearch])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(localValue)
    }
    if (e.key === 'Escape') {
      setLocalValue('')
      onSearch('')
    }
  }

  return (
    <input
      type="text"
      className="search-bar"
      placeholder="Search..."
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  )
}

export default SearchBar
