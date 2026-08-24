import { Images } from "../../assets";

export type OnboardingSlide = {
  id: string;
  title: string;
  description: string;
  image: any; // later we'll replace with require(...)
  buttonText: string;
};

export const slides: OnboardingSlide[] = [
  {
    id: "1",
    title: "Discover mushrooms like never before",
    description:
      "Scan with AI, explore an exclusive mushroom database, and connect with a nature-loving community.",
    image: Images.diagnoseAi,
    buttonText: "Next",
  },
  {
    id: "2",
    title: "Browse thousands of mushrooms",
    description:
      "Explore a global collection of mushrooms and fungi with detailed images and origins.",
    image: Images.diagnoseAi,
    buttonText: "Next",
  },
  {
    id: "3",
    title: "Build your own mushroom collections",
    description:
      "Create personal collections and organize mushrooms your way.",
    image: Images.diagnoseAi,
    buttonText: "Get Started",
  },
];
