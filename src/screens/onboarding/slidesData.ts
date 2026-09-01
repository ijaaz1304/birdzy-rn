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
    title: "Discover birds like never before",
    description:
      "Identify by photo or sound, explore a global species catalogue, and connect with birders worldwide.",
    image: Images.diagnoseAi,
    buttonText: "Next",
  },
  {
    id: "2",
    title: "Browse thousands of bird species",
    description:
      "Explore photos, calls, range maps, and field-guide details for birds around the world.",
    image: Images.diagnoseAi,
    buttonText: "Next",
  },
  {
    id: "3",
    title: "Build your own bird collections",
    description:
      "Save sightings, grow your life list, and organize trip lists your way.",
    image: Images.diagnoseAi,
    buttonText: "Get Started",
  },
];
