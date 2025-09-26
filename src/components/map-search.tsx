"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { geocodingService, SearchResult } from "@/lib/geocoding"

interface MapSearchProps {
    onLocationSelect: (coordinates: [number, number], name: string, boundingBox?: [number, number, number, number]) => void
    className?: string
}

export function MapSearch({ onLocationSelect, className }: MapSearchProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const resultsRef = useRef<HTMLDivElement>(null)

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            setShowResults(false)
            return
        }

        const timeoutId = setTimeout(async () => {
            setIsLoading(true)
            try {
                const searchResults = await geocodingService.searchPlaces(query, 8)
                setResults(searchResults)
                setShowResults(true)
                setSelectedIndex(-1)
            } catch (error) {
                setResults([])
            } finally {
                setIsLoading(false)
            }
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [query])

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showResults || results.length === 0) return

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                setSelectedIndex(prev =>
                    prev < results.length - 1 ? prev + 1 : prev
                )
                break
            case "ArrowUp":
                e.preventDefault()
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
                break
            case "Enter":
                e.preventDefault()
                if (selectedIndex >= 0 && selectedIndex < results.length) {
                    handleLocationSelect(results[selectedIndex])
                }
                break
            case "Escape":
                setShowResults(false)
                setSelectedIndex(-1)
                inputRef.current?.blur()
                break
        }
    }

    const handleLocationSelect = (result: SearchResult) => {
        setQuery(result.name)
        setShowResults(false)
        setSelectedIndex(-1)
        onLocationSelect(result.coordinates, result.name, result.boundingBox)
    }

    const clearSearch = () => {
        setQuery("")
        setResults([])
        setShowResults(false)
        setSelectedIndex(-1)
        inputRef.current?.focus()
    }

    // Close results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
                setShowResults(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className={cn("relative w-full max-w-md", className)} ref={resultsRef}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query && setShowResults(true)}
                    placeholder="Search for places in Switzerland..."
                    className="pl-10 pr-10 bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:bg-white/15 transition-all duration-300"
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-white/60" />
                )}
                {query && !isLoading && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSearch}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-white/60 hover:text-white/80 hover:bg-white/10"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            {/* Search Results */}
            {showResults && results.length > 0 && (
                <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
                    <CardContent className="p-0">
                        {results.map((result, index) => (
                            <div
                                key={result.id}
                                className={cn(
                                    "flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/10 last:border-b-0",
                                    index === selectedIndex && "bg-white/15"
                                )}
                                onClick={() => handleLocationSelect(result)}
                            >
                                <MapPin className="h-4 w-4 text-white/60 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate text-white">
                                        {result.name.split(',')[0]}
                                    </div>
                                    <div className="text-xs text-white/60 truncate">
                                        {result.name.split(',').slice(1).join(',').trim()}
                                    </div>
                                </div>
                                <Badge variant="secondary" className="text-xs bg-white/20 text-white/80 border-white/30">
                                    {result.type}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* No Results */}
            {showResults && !isLoading && results.length === 0 && query && (
                <Card className="absolute top-full left-0 right-0 mt-1 z-50 bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
                    <CardContent className="p-4 text-center text-white/60">
                        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No places found for &quot;{query}&quot;</p>
                        <p className="text-xs">Try a different search term</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
