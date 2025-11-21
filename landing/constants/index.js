import {
  benefitIcon1,
  benefitIcon2,
  benefitIcon3,
  benefitIcon4,
  benefitImage2,
  benefitCard1,
  benefitCard2,
  benefitCard3,
  benefitCard4,
  benefitCard5,
  benefitCard6,
  chromecast,
  disc02,
  discord,
  discordBlack,
  facebook,
  figma,
  file02,
  framer,
  homeSmile,
  instagram,
  notification2,
  notification3,
  notification4,
  notion,
  photoshop,
  plusSquare,
  protopie,
  raindrop,
  recording01,
  recording03,
  roadmap1,
  roadmap2,
  roadmap3,
  roadmap4,
  searchMd,
  slack,
  sliders04,
  telegram,
  twitter,
} from "../assets";

export const navigation = [
  {
    id: "0",
    title: "Features",
    url: "#features",
  },
  {
    id: "1",
    title: "Pricing",
    url: "#pricing",
  },
  {
    id: "2",
    title: "How to use",
    url: "#how-to-use",
  },
  {
    id: "3",
    title: "Roadmap",
    url: "#roadmap",
  },
  {
    id: "4",
    title: "Doctor Portal",
    url: "/auth/doctor",
    onlyMobile: true,
  },
  {
    id: "5",
    title: "New account",
    url: "/auth",
    onlyMobile: true,
  },
  {
    id: "6",
    title: "Sign in",
    url: "/auth",
    onlyMobile: true,
  },
];

export const heroIcons = [homeSmile, file02, searchMd, plusSquare];

export const notificationImages = [notification4, notification3, notification2];

export const companyLogos = [];

export const brainwaveServices = [
  "AI-Powered Health Scheme Eligibility Check",
  "Intelligent Symptom Analysis & Triage",
  "Seamless Appointment Booking & Management",
  "Smart Follow-up Care Coordination",
];

export const brainwaveServicesIcons = [
  recording03,
  recording01,
  disc02,
  chromecast,
  sliders04,
];

export const roadmap = [
  {
    id: "0",
    title: "AI Voice Agent Calling to Book your Appointment",
    text: "Revolutionary agentic AI platform with specialized agents for calling clinics for you to call clinics for you to book the appointment!",
    date: "Q4 2024",
    status: "done",
    imageUrl: roadmap1,
    colorful: true,
  },
  {
    id: "1",
    title: "Clinical Intelligence for Doctors",
    text: "AI-powered session recording with real-time suggestions and automated clinical documentation for healthcare providers.",
    date: "Q1 2025",
    status: "progress",
    imageUrl: roadmap2,
  },
  {
    id: "2",
    title: "Predictive Health Analytics",
    text: "Advanced ML models to predict health risks and provide proactive recommendations based on patient history and trends.",
    date: "Q2 2025",
    status: "progress",
    imageUrl: roadmap3,
  },
  {
    id: "3",
    title: "Integrated Health Ecosystem",
    text: "Connect with pharmacies, labs, and insurance providers for a complete end-to-end healthcare management experience.",
    date: "Q3 2025",
    status: "progress",
    imageUrl: roadmap4,
  },
];

export const collabText =
  "With intelligent AI agents and medical-grade security, Sehat Link is the perfect solution for modern healthcare delivery.";

export const collabContent = [
  {
    id: "0",
    title: "Multi-Agent Orchestration",
    text: collabText,
  },
  {
    id: "1",
    title: "Intelligent Healthcare Automation",
  },
  {
    id: "2",
    title: "HIPAA-Compliant Security",
  },
];

export const collabApps = [
  {
    id: "0",
    title: "Figma",
    icon: figma,
    width: 26,
    height: 36,
  },
  {
    id: "1",
    title: "Notion",
    icon: notion,
    width: 34,
    height: 36,
  },
  {
    id: "2",
    title: "Discord",
    icon: discord,
    width: 36,
    height: 28,
  },
  {
    id: "3",
    title: "Slack",
    icon: slack,
    width: 34,
    height: 35,
  },
  {
    id: "4",
    title: "Photoshop",
    icon: photoshop,
    width: 34,
    height: 34,
  },
  {
    id: "5",
    title: "Protopie",
    icon: protopie,
    width: 34,
    height: 34,
  },
  {
    id: "6",
    title: "Framer",
    icon: framer,
    width: 26,
    height: 34,
  },
  {
    id: "7",
    title: "Raindrop",
    icon: raindrop,
    width: 38,
    height: 32,
  },
];

export const pricing = [
  {
    id: "0",
    title: "Patient Basic",
    description: "Essential AI health assistance for everyone",
    price: "0",
    features: [
      "AI Triage Agent for health guidance",
      "Symptom checker and basic health assessments",
      "Appointment booking and management",
      "Government scheme eligibility verification",
    ],
  },
  {
    id: "1",
    title: "Patient Premium",
    description: "Advanced AI healthcare with priority support",
    price: "9.99",
    features: [
      "All Basic features plus advanced analytics",
      "Priority appointment scheduling",
      "Personalized health insights and trends",
      "Automated follow-up care coordination",
      "24/7 premium support",
    ],
  },
  {
    id: "2",
    title: "Doctor Pro",
    description: "Clinical intelligence suite for healthcare providers",
    price: null,
    features: [
      "AI-powered clinical session recording",
      "Real-time medical suggestions during consultations",
      "Automated session minutes and documentation",
      "Patient management dashboard",
      "Dedicated account manager",
    ],
  },
];

export const benefits = [
  {
    id: "0",
    title: "Intelligent Triage Agent",
    text: "Your AI health companion that understands your needs and orchestrates specialized agents to deliver personalized care instantly.",
    backgroundUrl: benefitCard1,
    iconUrl: benefitIcon1,
    imageUrl: benefitImage2,
  },
  {
    id: "1",
    title: "Government Scheme Eligibility",
    text: "Automatically check your eligibility for government health schemes and benefits with our smart verification agent.",
    backgroundUrl: benefitCard2,
    iconUrl: benefitIcon2,
    imageUrl: benefitImage2,
    light: true,
  },
  {
    id: "2",
    title: "AI Symptom Checker",
    text: "Advanced symptom analysis powered by medical AI that provides accurate assessments and recommendations 24/7.",
    backgroundUrl: benefitCard3,
    iconUrl: benefitIcon3,
    imageUrl: benefitImage2,
  },
  {
    id: "3",
    title: "Smart Appointment Booking",
    text: "Find the right doctor, book appointments instantly, and manage your healthcare schedule with intelligent automation.",
    backgroundUrl: benefitCard4,
    iconUrl: benefitIcon4,
    imageUrl: benefitImage2,
    light: true,
  },
  {
    id: "4",
    title: "Clinical Session Intelligence",
    text: "For doctors: AI-powered session recording with real-time suggestions and automated minutes generation.",
    backgroundUrl: benefitCard5,
    iconUrl: benefitIcon1,
    imageUrl: benefitImage2,
  },
  {
    id: "5",
    title: "Automated Follow-up Care",
    text: "Never miss a follow-up with our intelligent agent that tracks your treatment progress and schedules timely check-ins.",
    backgroundUrl: benefitCard6,
    iconUrl: benefitIcon2,
    imageUrl: benefitImage2,
  },
];

export const socials = [
  {
    id: "0",
    title: "Discord",
    iconUrl: discordBlack,
    url: "#",
  },
  {
    id: "1",
    title: "Twitter",
    iconUrl: twitter,
    url: "#",
  },
  {
    id: "2",
    title: "Instagram",
    iconUrl: instagram,
    url: "#",
  },
  {
    id: "3",
    title: "Telegram",
    iconUrl: telegram,
    url: "#",
  },
  {
    id: "4",
    title: "Facebook",
    iconUrl: facebook,
    url: "#",
  },
];
