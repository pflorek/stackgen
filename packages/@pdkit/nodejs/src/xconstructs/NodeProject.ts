import { NodePackageJson, NodePackageJsonProps } from "./NodePackageJson";
import { XProject, XProjectProps } from "../../../core/src/xconstructs/XProject";
import { Workspace } from "../../../core/src/Workspace";
import { NodePackageManager } from "./NodePackageManager";
import { YarnSupport } from "./YarnSupport";
import { Author } from "./Author";
import { GitIgnore } from "../../../core/src/GitIgnore";

export type Dependencies = string[] | { [key: string]: string };

export enum PackageManagerType {
  YARN,
  NPM,
}

export interface NodeProjectProps extends XProjectProps, NodePackageJsonProps {
  readonly packageName?: string;
  readonly packageManagerType?: PackageManagerType;
  readonly dependencies?: Dependencies;
  readonly devDependencies?: Dependencies;
  readonly peerDependencies?: Dependencies;
}

export class NodeProject extends XProject {
  readonly gitignore: GitIgnore;
  readonly packageJson: NodePackageJson;
  readonly packageManager: NodePackageManager;

  constructor(scope: Workspace | XProject, id: string, props?: NodeProjectProps) {
    super(scope, id, props);

    if (props?.authorName || props?.authorEmail || props?.authorUrl || props?.authorOrganization) {
      new Author(this, "Author", {
        email: props.authorEmail,
        name: props.authorName,
        url: props.authorUrl,
        organization: props.authorOrganization,
      });
    }

    this.gitignore = new GitIgnore(this, "StandardIgnore", props?.gitignore ?? []);

    this.packageJson = new NodePackageJson(this, "PackageJson", {
      name: props?.packageName ?? id,
      ...props,
    });

    switch (props?.packageManagerType) {
      case PackageManagerType.YARN:
      default:
        this.packageManager = new YarnSupport(this, "Yarn");
    }

    this.node.addValidation({
      validate: () => {
        const errors: string[] = [];
        const hasPackageManager = !!this.node.children.find((c) => c instanceof NodePackageManager);

        if (!hasPackageManager) {
          errors.push("The root project must contain a package manager");
        }

        return errors;
      },
    });
  }
}
