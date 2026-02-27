import { Project } from "ts-morph";

export function createProject(files: string[]): Project {
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  for (const file of files) {
    project.addSourceFileAtPath(file);
  }
  return project;
}
