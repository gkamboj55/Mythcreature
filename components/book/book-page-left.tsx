interface BookPageLeftProps {
  title: string
  image: string
  imageAlt: string
  firstParagraph: string
}

export function BookPageLeft({ title, image, imageAlt, firstParagraph }: BookPageLeftProps) {
  return (
    <div className="flex flex-col">
      <h2 className="text-center text-xl md:text-2xl font-bold text-amber-800 mb-4 font-serif book-title">{title}</h2>

      <div className="flex justify-center mb-6">
        <div className="relative w-full max-w-[240px] aspect-square rounded-lg overflow-hidden border-2 border-amber-200 shadow-md">
          <img src={image || "/placeholder.svg"} alt={imageAlt} className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="text-amber-900 font-serif leading-relaxed text-base book-text">
        <p className="first-letter:text-3xl first-letter:font-bold first-letter:text-amber-700 first-letter:mr-1 first-letter:float-left">
          {firstParagraph}
        </p>
      </div>

      {/* Book edge effect */}
      <div className="book-edge book-edge-right"></div>
      <div className="page-number right-4">1</div>
    </div>
  )
}
