interface BookPageRightProps {
  remainingParagraphs: string[]
  image: string
  imageAlt: string
}

export function BookPageRight({ remainingParagraphs, image, imageAlt }: BookPageRightProps) {
  return (
    <div className="flex flex-col">
      <div className="relative">
        {/* Floating image with text wrap - now on the right */}
        <div className="float-right ml-6 mb-4 relative w-[200px] aspect-square rounded-lg overflow-hidden border-2 border-amber-200 shadow-md">
          <img src={image || "/placeholder.svg"} alt={imageAlt} className="w-full h-full object-cover" />
        </div>

        {/* Text that wraps around the image */}
        <div className="text-amber-900 font-serif leading-relaxed text-base book-text">
          {remainingParagraphs.map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Clear the float */}
        <div className="clear-both"></div>
      </div>

      <div className="text-center italic text-amber-800 font-serif mt-6">The End</div>

      {/* Book edge effect */}
      <div className="book-edge book-edge-left"></div>

      {/* Single page number */}
      <div className="absolute bottom-2 left-4 text-amber-800/50 text-sm">2</div>
    </div>
  )
}
