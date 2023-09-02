import { useState } from "react"

interface Props {
  opened?: boolean;
  title: string;
  children: string;
}

const Accordion: React.FC<Props> = ({ opened = false, children, title }) => {
  const [isOpen, setIsOpen] = useState(opened);

  return (
    <div className="border-b-2 border-brand-light/20">
      <button className="px-6 py-5 flex items-center justify-between w-full text-xl font-medium" onClick={() => setIsOpen(v => !v)}>
        {title}
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14"/>
          {!isOpen ? <path d="M12 5v14"/> : null}
        </svg>
      </button>
      {isOpen && (
        <p className="px-6 pb-6 font-light">
          {children}
        </p>
      )}
    </div>
  )
}

export default Accordion;
