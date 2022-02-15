import { NodeProjectProps } from "../npm/NpmProject";
import { ManifestEntry } from "@pdkit/core/src";
import { Project, Workspace, WorkspaceProps } from "@pdkit/core/src";
import { YarnProject } from "./YarnProject";

export interface IYarnMonoRepo {
  synth(): void;
}

export interface YarnWorkspaceProps
  extends Omit<NodeProjectProps, "packageManagerType" | "packageName" | "projectPath">,
    WorkspaceProps {}

export class YarnWorkspace extends Workspace implements IYarnMonoRepo {
  constructor(id: string, props?: YarnWorkspaceProps) {
    super(id);

    new YarnProject(this, "Default", { ...props, packageName: "workspace", projectPath: "./" });
  }

  _beforeSynth() {
    const defaultProject = Project.of(this);
    const projects = this.binds.filter((b) => Project.is(b) && b !== defaultProject);
    const projectPaths = projects.map((p) => (p as Project).projectPath.substring(1));

    // Collapse all of the install commands into the parent
    projects.forEach((p) => p.node.tryRemoveChild("InstallCommand"));

    new ManifestEntry(this, "WorkspaceFields", {
      workspaces: projectPaths,
      private: true,
    });

    super._beforeSynth();
  }
}
