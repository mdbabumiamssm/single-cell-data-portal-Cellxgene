declare module "census-projects.json" {
  export interface StaticProject
    extends Partial<import("src/common/queries/censusDirectory").Project> {
    notebook_links?: [string, string][];
    tier: "community" | "maintained";
    obsm_layer: string;
    project_page: string;
  }
  const content: StaticProject[];
  export default content;
}
