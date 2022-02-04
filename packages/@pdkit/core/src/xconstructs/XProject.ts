import { Construct } from "constructs";
import { IXConstruct, XConstruct } from "./XConstruct";
import path from "path";
import { ConstructError } from "../util/ConstructError";

export interface IXProject extends IXConstruct {
  readonly sourcePath: string;
  readonly projectPath: string;
}

export interface XProjectProps {
  readonly projectPath?: string;
  readonly sourcePath?: string;
  readonly authorName?: string;
  readonly authorEmail?: string;
  readonly authorOrganization?: boolean;
  readonly authorUrl?: string;
  readonly gitignore?: string[];
}

export abstract class XProject extends XConstruct implements IXProject {
  readonly _projectPath?: string;
  readonly _sourcePath: string;

  constructor(scope: XProject, id: string, props?: XProjectProps) {
    super(scope, id);

    this._projectPath = props?.projectPath;
    this._sourcePath = props?.sourcePath ?? "src";

    this.node.addValidation({
      validate: () => {
        const errors: string[] = [];
        const hasParentProject = !!this.node.scopes.reverse().find((s) => s instanceof XProject);

        if (hasParentProject && !this._projectPath) {
          errors.push("Nested projected must explicitly define a sourcePath");
        }

        return errors;
      },
    });
  }

  get projectPath(): string {
    const parent = this.node.scopes.reverse().find((scope) => scope !== this && XProject.is(scope)) as
      | XProject
      | undefined;

    return path.join(parent ? parent.projectPath : "/", this._projectPath ?? "");
  }

  get sourcePath(): string {
    return path.join(this.projectPath, this._sourcePath);
  }

  public static is(construct: any) {
    return construct instanceof this;
  }

  public static of(construct: any): XProject {
    if (!(construct instanceof Construct)) {
      throw new Error(`${construct} is not a construct`);
    }

    const project = (construct as Construct).node.scopes
      .reverse()
      .find((scope) => scope !== construct && scope instanceof XProject);

    if (!project) {
      throw new ConstructError(construct, `Construct must be a child of a project`);
    }

    return project as XProject;
  }

  get subprojects(): XProject[] {
    return this.node.children.filter((c) => XProject.is(c)).map((c) => c as XProject);
  }

  _onSynth() {
    // Allow each construct one more chance to do something before synthesis
    this.node.children
      .filter((c) => XConstruct.is(c))
      .map((c) => c as XConstruct)
      .forEach((c) => c._onSynth());
  }
}
