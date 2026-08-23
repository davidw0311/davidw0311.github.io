export type ProjectLink = {
  label: string;
  href: string;
};

export type ProjectMedia = {
  src: string;
  alt: string;
  caption?: string;
  kind?: "image" | "video";
};

export type Project = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  featured?: boolean;
  image: string;
  imageAlt: string;
  tags: string[];
  paragraphs: string[];
  media?: ProjectMedia[];
  links?: ProjectLink[];
};

export type Experience = {
  period: string;
  role: string;
  organization: string;
  summary?: string;
  highlights: string[];
  tags: string[];
  image?: string;
  imageAlt?: string;
  href?: string;
};

export type CourseGroup = {
  term: string;
  courses: string[];
};

export type Education = {
  school: string;
  period: string;
  degree: string;
  focus: string;
  logo: string;
  logoAlt: string;
  courses: CourseGroup[];
};

export type Photo = {
  title: string;
  src: string;
  alt: string;
};
