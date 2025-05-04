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
        <div className="float-right ml-4 mb-2 relative w-[180px] aspect-square rounded-lg overflow-hidden border-2 border-amber-200 shadow-md">
          <img src={image || "/placeholder.svg"} alt={imageAlt} className="w-full h-full object-cover" />
        </div>

        {/* Text that wraps around the image */}
        <div className="text-amber-900 font-serif leading-relaxed text-base">
          {remainingParagraphs.map((paragraph, index) => (
            <p key={index} className="mb-3">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Clear the float */}
        <div className="clear-both"></div>
      </div>

      <div className="text-center italic text-amber-800 font-serif mt-4">The End</div>
    </div>
  )
}
