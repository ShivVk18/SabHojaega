
export interface Framework {
  id: string;
  name: string;
  language: string;
  category: "backend" | "frontend";
  templatePath: string;
}

export const frameworks: Framework[] = [
  {
    id: "fastapi",
    name: "Python FastAPI",
    language: "python",
    category: "backend",
    templatePath: "python/fastapi"
  }
];

export function getFramework(id: string) {
  return frameworks.find(
    (framework) => framework.id === id
  );
}
