import React from "react";

const NewHero = () => {
    return (
        <section id="hero">
            <div className="absolute max-h-[800px] pointer-events-none inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black"></div>
            <GridPattern />
        </section>
    );
};

function GridPattern() {
    // Create an array of 100 items (10x10 grid)
    const gridItems = Array.from({ length: 100 }, (_, i) => i);

    return (
        <div className="w-full aspect-square bg-random p-4">
            <Navbar />
            <div className="grid grid-cols-10 gap-[1px] h-[800px]">
                {gridItems.map((item) => (
                    <div
                        key={item}
                        className="border border-neutral-800/30 hover:bg-neutral-800 transition-colors duration-200"
                    />
                ))}
            </div>
        </div>
    );
}
export default NewHero;

const links = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/" },
    { name: "How it Works", href: "/" },
    { name: "Testimonials", href: "/" },
    { name: "Docs", href: "/" },
];

export function Navbar() {
    return (
        <nav className="flex left-1/2 -translate-x-1/2  items-center justify-center space-x-4 w-full max-w-screen-md fixed top-4">
            <div className="flex items-center justify-center">
                <img
                    src={"/joose.svg"}
                    alt="logo"
                    width={60}
                    height={60}
                    className="size-12"
                />
                <span className="text-lg font-bold">Arlink</span>
            </div>
            <ul className="flex items-center justify-center gap-4 h-10 py-2 px-4 border border-white/10 bg-neutral-900/50 backdrop-blur-md rounded-md">
                {links.map((link) => (
                    <li
                        className="text-neutral-400 hover:text-white transition-all text-sm"
                        key={link.name}
                    >
                        <a href={link.href}>{link.name}</a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
