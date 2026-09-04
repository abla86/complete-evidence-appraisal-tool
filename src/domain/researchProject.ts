export interface ResearchProject {
  id: string;
  name: string;
  studyIds: string[];
  createdAt: string;
  updatedAt: string;
}

export function createResearchProject(input: { id: string; name: string; studyIds?: string[] }): ResearchProject {
  const id = input.id.trim();
  const name = input.name.trim();
  if (!id || !name) throw new Error('PROJECT_INVALID: id and name are required.');
  return { id, name, studyIds: [...new Set((input.studyIds ?? []).map(value => value.trim()).filter(Boolean))], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export function assertStudyBelongsToProject(project: ResearchProject, studyId: string): void {
  if (!project.studyIds.includes(studyId)) throw new Error(`PROJECT_SCOPE_DENIED: study ${studyId} does not belong to project ${project.id}.`);
}
