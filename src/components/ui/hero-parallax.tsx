"use client";
import React from "react";
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    MotionValue,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export const HeroParallax = ({
    products,
}: {
    products: {
        title: string;
        link: string;
        thumbnail: string;
    }[];
}) => {
    const firstRow = products.slice(0, 5);
    const secondRow = products.slice(5, 10);
    const thirdRow = products.slice(10, 15);
    const ref = React.useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

    const translateX = useSpring(
        useTransform(scrollYProgress, [0, 1], [0, 1000]),
        springConfig
    );
    const translateXReverse = useSpring(
        useTransform(scrollYProgress, [0, 1], [0, -1000]),
        springConfig
    );
    const rotateX = useSpring(
        useTransform(scrollYProgress, [0, 0.2], [15, 0]),
        springConfig
    );
    const opacity = useSpring(
        useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
        springConfig
    );
    const rotateZ = useSpring(
        useTransform(scrollYProgress, [0, 0.2], [20, 0]),
        springConfig
    );
    const translateY = useSpring(
        useTransform(scrollYProgress, [0, 1], [-300, 300]),
        springConfig
    );
    return (
        <div className="overflow-hidden w-full h-[120vh] md:h-[220vh] bg-black">
            <div
                ref={ref}
                className="h-full pt-0 pb-0 antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
            >
                <Header />
                <motion.div
                    style={{
                        rotateX,
                        rotateZ,
                        translateY,
                        opacity,
                    }}
                    className=""
                >
                    <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 mb-10">
                        {firstRow.map((product) => (
                            <ProductCard
                                product={product}
                                translate={translateX}
                                key={product.title}
                            />
                        ))}
                    </motion.div>
                    <motion.div className="flex flex-row  mb-20 space-x-20 ">
                        {secondRow.map((product) => (
                            <ProductCard
                                product={product}
                                translate={translateXReverse}
                                key={product.title}
                            />
                        ))}
                    </motion.div>
                    <motion.div className="flex flex-row-reverse space-x-reverse space-x-20">
                        {thirdRow.map((product) => (
                            <ProductCard
                                product={product}
                                translate={translateX}
                                key={product.title}
                            />
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export const Header = () => {
    return (
        <div className="max-w-7xl absolute top-20 md:top-32 left-0 right-0 mx-auto px-4 md:px-8 w-full z-20 pointer-events-none">
            <h1 className="text-2xl md:text-7xl font-bold text-white pointer-events-auto">
                Curated journeys <br /> that <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">inspire.</span>
            </h1>
            <p className="max-w-2xl text-base md:text-xl mt-4 text-zinc-400">
                We craft breathtaking itineraries with the most exquisite destinations and tailored experiences.
                We are a team of passionate travel experts and local curators that love to build amazing adventures.
            </p>
        </div>
    );
};

export const ProductCard = ({
    product,
    translate,
}: {
    product: {
        title: string;
        link: string;
        thumbnail: string;
    };
    translate: MotionValue<number>;
}) => {
    return (
        <motion.div
            style={{
                x: translate,
            }}
            whileHover={{
                y: -20,
            }}
            key={product.title}
            className="group/product h-96 w-[30rem] relative flex-shrink-0"
        >
            <Link
                href={product.link}
                className="block group-hover/product:shadow-2xl "
            >
                <Image
                    src={product.thumbnail}
                    height="600"
                    width="600"
                    className="object-cover object-center absolute h-full w-full inset-0"
                    alt={product.title}
                />
            </Link>
            <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-black pointer-events-none"></div>
            <h2 className="absolute bottom-4 left-4 opacity-0 group-hover/product:opacity-100 text-white shadow-md">
                {product.title}
            </h2>
        </motion.div>
    );
};

