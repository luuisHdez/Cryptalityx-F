// src/Components/SpringCards.jsx
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const cards = [
  {
    title: "Dynamic",
    color: "bg-emerald-300",
    description: "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Exercitationem doloremque vitae minima.",
    href: "/task",
  },
  {
    title: "Data Driven",
    color: "bg-indigo-300",
    description: "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Exercitationem doloremque vitae minima.",
    lift: true,
    href: "/trading",
  },
  {
    title: "Dutiful",
    color: "bg-red-300",
    description: "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Exercitationem doloremque vitae minima.",
  },
  {
    title: "Demure",
    color: "bg-yellow-300",
    description: "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Exercitationem doloremque vitae minima.",
    lift: true,
  },
];

const SpringCards = () => {
  return (
    <section className="px-4 py-10 md:py-16">
      <div className="mx-auto max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-6">
        {cards.map((card, i) => {
          const CardContent = (
            <div
              className={`group border-2 opacity-80 border-black ${card.color} w-full relative overflow-hidden ${
                card.lift ? "sm:-translate-y-6" : ""
              }`}
            >
              <div className="-m-0.5 border-2 border-black p-8 h-72 flex flex-col justify-between relative text-black">
                <p className="text-2xl font-medium uppercase flex items-center">
                  <ArrowRight className="-ml-8 mr-2 opacity-0 transition-all group-hover:ml-0 group-hover:opacity-100 duration-300" />
                  {card.title}
                </p>
                <div>
                  <p className="transition-all group-hover:mb-10 duration-300">
                    {card.description}
                  </p>
                  <button className="absolute bottom-2 left-2 right-2 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 border-2 border-black bg-white px-4 py-2 text-black">
                    LET'S GO
                  </button>
                </div>
                <svg
                  width="200"
                  height="200"
                  className="pointer-events-none absolute z-10 rounded-full top-0 right-0 transform translate-x-1/2 -translate-y-1/2 scale-[0.75] rotate-[348deg]"
                >
                  <path
                    id={`circlePath${i}`}
                    d="M100,100 m-100,0 a100,100 0 1,0 200,0 a100,100 0 1,0 -200,0"
                    fill="none"
                  />
                  <text>
                    <textPath
                      href={`#circlePath${i}`}
                      fill="black"
                      className="text-2xl font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      LEARN MORE • LEARN MORE • LEARN MORE •
                    </textPath>
                  </text>
                </svg>
              </div>
            </div>
          );

          // Si tiene href, envolvemos en <Link>
          return card.href ? (
            <Link to={card.href} key={i}>
              {CardContent}
            </Link>
          ) : (
            <div key={i}>
              {CardContent}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default SpringCards;
