import { motion } from "framer-motion";
import AnimatedDescription from "../effects/animated-description";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const Projects = () => {
    const headline = ["See what others have", "Built with Arlink"];
    const description = [
        "Explore inspiring projects hosted on the decentralized web",
    ];

    const projectData = [
        {
            headline: "Sentio",
            image: "sentioo.png",
            description:
                "Sentio helps you monitor, audit, and secure your AO processes with intelligent analysis, real-time alerts, and comprehensive reporting—so you always stay protected.",
            link: "https://sentio_arlink.ar.io/",
        },
        {
            headline: "Anon",
            image: "anonn.png",
            description:
                "Anon lets you create dApps for AO effortlessly. Just describe your desired application in a prompt, and Anon will generate both the frontend and Lua code.",
            link: "https://anon-labs_arlink.ar.io/",
        },
        {
            headline: "ao-learn",
            image: "ao-learn.png",
            description:
                "AO Learn is an on-chain machine learning framework built on AO. It enables developers to create, train, and deploy AI models directly on the AO network.",
            link: "https://aolearn_arlink.ar.io/",
        },
        {
            headline: "Velocity",
            image: "velocity.png",
            description:
                "Velocity is a decentralized social hub on AO, Connect, share, and thrive in the decentralized social space with Velocity",
            link: "https://velocity_arlink.arweave.net/",
        },
    ];

    return (
        <section id="projects">
            <header className="flex items-center relative z-50 mt-[100px] justify-center flex-col space-y-6">
                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="px-4 border border-neutral-700 py-1 bg-neutral-800 rounded-full"
                >
                    Projects Powered by Arlink
                </motion.div>

                <h2 className="md:text-5xl text-3xl leading-[0.9] lg:leading-[0.9] lg:text-6xl text-center font-bold capitalize flex flex-col space-y-2">
                    <AnimatedDescription descriptionString={headline} />
                </h2>

                <div className="text-center text-md text-neutral-400">
                    <AnimatedDescription descriptionString={description} />
                </div>
            </header>
            <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 mt-[40px] mb-[100px] max-w-6xl mx-auto gap-4">
                {projectData.map((project, index) => {
                    return (
                        <motion.div
                            initial={{
                                opacity: 0,
                                y: 20,
                                filter: "blur(10px)",
                            }}
                            whileInView={{
                                opacity: 1,
                                y: 0,
                                filter: "blur(0px)",
                            }}
                            viewport={{ once: true }}
                            transition={{
                                duration: 0.8,
                                delay: index * 0.2,
                                ease: [0.25, 0.1, 0, 0.9],
                            }}
                        >
                            <div className="p-4 h-full flex justify-between gap-4 flex-col border border-neutral-800 hover:border-neutral-700 transition-all group rounded-2xl">
                                <div>
                                    <img
                                        src={project.image}
                                        alt={project.headline}
                                        className="border-neutral-800 h-[180px] w-full object-cover group-hover:border-neutral-700 border rounded-xl"
                                    />
                                    <div className="space-y-1 mt-2 p-2">
                                        <h3 className="text-xl font-bold capitalize ">
                                            {project.headline}
                                        </h3>
                                        <p className="text-sm text-neutral-500">
                                            {project.description}
                                        </p>
                                    </div>
                                </div>

                                <Link
                                    to={project.link}
                                    className="px-2 flex items-center gap-2 py-2 m-2 border border-neutral-800 text-sm text-white font-semibold text-center w-fit rounded-md"
                                    target="_blank"
                                >
                                    View live <ArrowUpRight size={15} />
                                </Link>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
};

export default Projects;
